import uuid
from datetime import date
from typing import Literal, cast

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import require_rol
from app.dependencies.db import get_db
from app.models.usuario import Usuario
from app.schemas.reporte import (
    FiltrosEntregas,
    FiltrosKardex,
    FiltrosPagos,
    FiltrosXmls,
    ReporteEntregasResponse,
    ReporteKardexResponse,
    ReportePagosResponse,
    ReporteXmlsResponse,
)
from app.services import reporte_service

router = APIRouter(prefix="/reportes", tags=["reportes"])

_lectura_roles = require_rol(["admin", "operador", "lectura"])


def _streaming_response(data: bytes, tipo: str, formato: str) -> StreamingResponse:
    fecha = date.today().isoformat()
    filename = f"reporte_{tipo}_{fecha}.{formato}"
    if formato == "pdf":
        media_type = "application/pdf"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return StreamingResponse(
        content=iter([data]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/xmls", response_model=ReporteXmlsResponse)
async def reporte_xmls(
    formato: Literal["json", "pdf", "xlsx"] = "json",
    xml_id: uuid.UUID | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    codigo_principal: str | None = None,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> ReporteXmlsResponse | StreamingResponse:
    filtros = FiltrosXmls(
        xml_id=xml_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        codigo_principal=codigo_principal,
    )
    result = await reporte_service.reporte_xmls(filtros, formato, session)
    if formato == "json":
        return cast(ReporteXmlsResponse, result)
    return _streaming_response(cast(bytes, result), "xmls", formato)


@router.get("/kardex", response_model=ReporteKardexResponse)
async def reporte_kardex(
    producto_id: uuid.UUID,
    formato: Literal["json", "pdf", "xlsx"] = "json",
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> ReporteKardexResponse | StreamingResponse:
    filtros = FiltrosKardex(
        producto_id=producto_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    result = await reporte_service.reporte_kardex(filtros, formato, session)
    if formato == "json":
        return cast(ReporteKardexResponse, result)
    return _streaming_response(cast(bytes, result), "kardex", formato)


@router.get("/entregas", response_model=ReporteEntregasResponse)
async def reporte_entregas(
    formato: Literal["json", "pdf", "xlsx"] = "json",
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    destinatario_id: uuid.UUID | None = None,
    estado: Literal["activa", "eliminada"] | None = None,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> ReporteEntregasResponse | StreamingResponse:
    filtros = FiltrosEntregas(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        destinatario_id=destinatario_id,
        estado=estado,
    )
    result = await reporte_service.reporte_entregas(filtros, formato, session)
    if formato == "json":
        return cast(ReporteEntregasResponse, result)
    return _streaming_response(cast(bytes, result), "entregas", formato)


@router.get("/pagos", response_model=ReportePagosResponse)
async def reporte_pagos(
    formato: Literal["json", "pdf", "xlsx"] = "json",
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    banco_id: uuid.UUID | None = None,
    entrega_id: uuid.UUID | None = None,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> ReportePagosResponse | StreamingResponse:
    filtros = FiltrosPagos(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        banco_id=banco_id,
        entrega_id=entrega_id,
    )
    result = await reporte_service.reporte_pagos(filtros, formato, session)
    if formato == "json":
        return cast(ReportePagosResponse, result)
    return _streaming_response(cast(bytes, result), "pagos", formato)
