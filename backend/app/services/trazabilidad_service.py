"""Consultas de trazabilidad bidireccional. Solo lectura; no escribe ni modifica datos."""

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entrega import Entrega, EntregaItem, EntregaItemFifoDetalle
from app.models.kardex import KardexMovimiento, XmlItemIngreso
from app.models.pago import Pago, PagoEntrega
from app.models.xml import Xml
from app.models.xml_item import XmlItem
from app.schemas.trazabilidad import (
    EntregaConsumoTraza,
    EntregaEnPagoTraza,
    EntregaResumen,
    IngresoKardexTraza,
    KardexMovimientoResumen,
    PagoAplicado,
    PagoResumen,
    ProductoResumen,
    TrazabilidadEntregaResponse,
    TrazabilidadPagoResponse,
    TrazabilidadXmlResponse,
    XmlItemResumen,
    XmlOrigenTraza,
    XmlResumen,
)
from app.utils.exceptions import EntidadNoEncontrada


def _xml_resumen(xml: Xml) -> XmlResumen:
    return XmlResumen(
        id=xml.id,
        numero_factura=xml.numero_factura,
        fecha_emision=xml.fecha_emision,
        ruc_emisor=xml.ruc_emisor,
        razon_social_emisor=xml.razon_social_emisor,
        is_active=xml.is_active,
    )


def _entrega_resumen(entrega: Entrega) -> EntregaResumen:
    return EntregaResumen(
        id=entrega.id,
        numero=entrega.numero,
        snap_nombre=entrega.snap_nombre,
        total_entrega=entrega.total_entrega,
        saldo_pendiente=entrega.saldo_pendiente,
        estado=entrega.estado.value,
    )


def _pago_resumen(pago: Pago) -> PagoResumen:
    return PagoResumen(
        id=pago.id,
        numero_comprobante=pago.numero_comprobante,
        fecha_pago=pago.fecha_pago,
        banco_nombre=pago.banco.nombre if pago.banco else "",
        valor_total=pago.valor_total,
        estado=pago.estado.value,
    )


def _kardex_mov_resumen(mov: KardexMovimiento) -> KardexMovimientoResumen:
    return KardexMovimientoResumen(
        id=mov.id,
        tipo=mov.tipo.value,
        fecha_movimiento=mov.fecha_movimiento,
        cantidad=mov.cantidad,
        costo_unitario=mov.costo_unitario,
        costo_total=mov.costo_total,
    )


async def desde_xml(
    xml_id: uuid.UUID, session: AsyncSession
) -> TrazabilidadXmlResponse:
    """Árbol de trazabilidad partiendo de un XML hacia Kardex, Entregas y Pagos."""
    result = await session.execute(
        select(Xml)
        .where(Xml.id == xml_id)
        .options(selectinload(Xml.items).selectinload(XmlItem.ingresos))
    )
    xml = result.scalar_one_or_none()
    if xml is None:
        raise EntidadNoEncontrada("XML no encontrado")

    # Cargar ingresos con sus kardex_movimientos y productos
    ingresos_traza: list[IngresoKardexTraza] = []
    kardex_ingreso_ids: list[uuid.UUID] = []

    for item in xml.items:
        item_ingresos_result = await session.execute(
            select(XmlItemIngreso)
            .where(XmlItemIngreso.xml_item_id == item.id)
            .options(
                selectinload(XmlItemIngreso.kardex_movimiento).selectinload(
                    KardexMovimiento.producto
                )
            )
        )
        for ingreso in item_ingresos_result.scalars().all():
            mov = ingreso.kardex_movimiento
            kardex_ingreso_ids.append(mov.id)
            ingresos_traza.append(
                IngresoKardexTraza(
                    xml_item=XmlItemResumen(
                        id=item.id,
                        codigo_principal=item.codigo_principal,
                        descripcion=item.descripcion,
                        cantidad_ingresada=ingreso.cantidad_ingresada,
                    ),
                    kardex_movimiento=_kardex_mov_resumen(mov),
                    producto=ProductoResumen(
                        id=mov.producto.id,
                        codigo_principal=mov.producto.codigo_principal,
                        descripcion=mov.producto.descripcion,
                    ),
                )
            )

    # Entregas que consumieron de estos lotes (vía EntregaItemFifoDetalle)
    entregas_traza: list[EntregaConsumoTraza] = []
    entrega_ids_vistos: set[uuid.UUID] = set()

    if kardex_ingreso_ids:
        fifo_result = await session.execute(
            select(EntregaItemFifoDetalle)
            .where(EntregaItemFifoDetalle.kardex_ingreso_id.in_(kardex_ingreso_ids))
            .options(
                selectinload(EntregaItemFifoDetalle.entrega_item).selectinload(
                    EntregaItem.entrega
                )
            )
        )
        # Agrupar consumo por entrega
        consumo_por_entrega: dict[uuid.UUID, tuple[Entrega, Decimal, Decimal]] = {}
        for detalle in fifo_result.scalars().all():
            entrega = detalle.entrega_item.entrega
            eid = entrega.id
            if eid not in consumo_por_entrega:
                consumo_por_entrega[eid] = (entrega, Decimal("0"), Decimal("0"))
            _, qty, cost = consumo_por_entrega[eid]
            costo = detalle.cantidad_consumida * detalle.costo_unitario
            consumo_por_entrega[eid] = (
                entrega,
                qty + detalle.cantidad_consumida,
                cost + costo,
            )

        for eid, (entrega, qty, cost) in consumo_por_entrega.items():
            entrega_ids_vistos.add(eid)
            entregas_traza.append(
                EntregaConsumoTraza(
                    entrega=_entrega_resumen(entrega),
                    cantidad_consumida=qty,
                    costo_total_consumido=cost,
                )
            )

    # Pagos asociados a esas entregas
    pagos_traza: list[PagoResumen] = []
    pagos_vistos: set[uuid.UUID] = set()

    if entrega_ids_vistos:
        pe_result = await session.execute(
            select(PagoEntrega)
            .where(PagoEntrega.entrega_id.in_(entrega_ids_vistos))
            .options(selectinload(PagoEntrega.pago).selectinload(Pago.banco))
        )
        for pe in pe_result.scalars().all():
            if pe.pago_id not in pagos_vistos:
                pagos_vistos.add(pe.pago_id)
                pagos_traza.append(_pago_resumen(pe.pago))

    return TrazabilidadXmlResponse(
        xml=_xml_resumen(xml),
        ingresos_kardex=ingresos_traza,
        entregas=entregas_traza,
        pagos=pagos_traza,
    )


async def _xmls_origen_de_entrega(
    entrega: Entrega, session: AsyncSession
) -> list[XmlOrigenTraza]:
    """Construye la lista de XMLs de origen para una entrega a partir de EntregaItemFifoDetalle."""
    items_result = await session.execute(
        select(EntregaItem)
        .where(EntregaItem.entrega_id == entrega.id)
        .options(
            selectinload(EntregaItem.fifo_detalle).selectinload(
                EntregaItemFifoDetalle.kardex_ingreso
            )
        )
    )
    entrega_items = items_result.scalars().all()

    # Recopilar IDs de movimientos de ingreso
    kardex_ingreso_ids = [
        det.kardex_ingreso_id for item in entrega_items for det in item.fifo_detalle
    ]

    if not kardex_ingreso_ids:
        return []

    # Cargar xml_item_ingresos → xml_item → xml
    xi_result = await session.execute(
        select(XmlItemIngreso)
        .where(XmlItemIngreso.kardex_movimiento_id.in_(kardex_ingreso_ids))
        .options(selectinload(XmlItemIngreso.xml_item).selectinload(XmlItem.xml))
    )
    ingreso_map: dict[uuid.UUID, XmlItemIngreso] = {
        xi.kardex_movimiento_id: xi for xi in xi_result.scalars().all()
    }

    # Construir xmls_origen agrupados por xml_item
    xmls_origen: list[XmlOrigenTraza] = []
    for item in entrega_items:
        for det in item.fifo_detalle:
            xi = ingreso_map.get(det.kardex_ingreso_id)
            if xi is None:
                continue
            xml_item = xi.xml_item
            xml = xml_item.xml
            xmls_origen.append(
                XmlOrigenTraza(
                    xml=_xml_resumen(xml),
                    xml_item=XmlItemResumen(
                        id=xml_item.id,
                        codigo_principal=xml_item.codigo_principal,
                        descripcion=xml_item.descripcion,
                        cantidad_ingresada=xi.cantidad_ingresada,
                    ),
                    cantidad_consumida=det.cantidad_consumida,
                    costo_unitario=det.costo_unitario,
                )
            )

    return xmls_origen


async def desde_entrega(
    entrega_id: uuid.UUID, session: AsyncSession
) -> TrazabilidadEntregaResponse:
    """Árbol de trazabilidad partiendo de una Entrega hacia XMLs de origen y Pagos."""
    result = await session.execute(select(Entrega).where(Entrega.id == entrega_id))
    entrega = result.scalar_one_or_none()
    if entrega is None:
        raise EntidadNoEncontrada("Entrega no encontrada")

    xmls_origen = await _xmls_origen_de_entrega(entrega, session)

    # Pagos aplicados a esta entrega
    pe_result = await session.execute(
        select(PagoEntrega)
        .where(PagoEntrega.entrega_id == entrega_id)
        .options(selectinload(PagoEntrega.pago).selectinload(Pago.banco))
    )
    pagos: list[PagoAplicado] = [
        PagoAplicado(
            **_pago_resumen(pe.pago).model_dump(),
            monto_aplicado=pe.monto_aplicado,
        )
        for pe in pe_result.scalars().all()
    ]

    return TrazabilidadEntregaResponse(
        entrega=_entrega_resumen(entrega),
        xmls_origen=xmls_origen,
        pagos=pagos,
    )


async def desde_pago(
    pago_id: uuid.UUID, session: AsyncSession
) -> TrazabilidadPagoResponse:
    """Árbol de trazabilidad partiendo de un Pago hacia Entregas y XMLs de origen."""
    result = await session.execute(
        select(Pago).where(Pago.id == pago_id).options(selectinload(Pago.banco))
    )
    pago = result.scalar_one_or_none()
    if pago is None:
        raise EntidadNoEncontrada("Pago no encontrado")

    pe_result = await session.execute(
        select(PagoEntrega)
        .where(PagoEntrega.pago_id == pago_id)
        .options(selectinload(PagoEntrega.entrega))
    )
    pago_entregas = pe_result.scalars().all()

    distribuciones: list[EntregaEnPagoTraza] = []
    for pe in pago_entregas:
        entrega = pe.entrega
        xmls_origen = await _xmls_origen_de_entrega(entrega, session)
        distribuciones.append(
            EntregaEnPagoTraza(
                entrega=_entrega_resumen(entrega),
                monto_aplicado=pe.monto_aplicado,
                xmls_origen=xmls_origen,
            )
        )

    return TrazabilidadPagoResponse(
        pago=_pago_resumen(pago),
        distribuciones=distribuciones,
    )
