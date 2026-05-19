import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import require_rol
from app.dependencies.db import get_db
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.pago import PagoDetailResponse, PagoRequest, PagoResponse
from app.services import pago_service

router = APIRouter(prefix="/pagos", tags=["pagos"])

_lectura_roles = require_rol(["admin", "operador", "lectura"])
_operador_roles = require_rol(["admin", "operador"])


@router.post("", response_model=PagoDetailResponse, status_code=201)
async def crear_pago(
    body: PagoRequest,
    current_user: Usuario = Depends(_operador_roles),
    session: AsyncSession = Depends(get_db),
) -> PagoDetailResponse:
    async with session.begin_nested():
        pago = await pago_service.crear_pago(
            body,
            session=session,
            usuario_id=current_user.id,
        )
    pago = await pago_service.obtener_detalle(pago.id, session)
    return pago_service._to_pago_detail_response(pago)


@router.get("", response_model=PaginatedResponse[PagoResponse])
async def listar_pagos(
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    banco_id: uuid.UUID | None = None,
    entrega_id: uuid.UUID | None = None,
    incluir_eliminados: bool = False,
    page: int = 1,
    page_size: int = 20,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> PaginatedResponse[PagoResponse]:
    return await pago_service.listar_pagos(
        session=session,
        page=page,
        page_size=page_size,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        banco_id=banco_id,
        entrega_id=entrega_id,
        incluir_eliminados=incluir_eliminados,
    )


@router.get("/{id}", response_model=PagoDetailResponse)
async def obtener_pago(
    id: uuid.UUID,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> PagoDetailResponse:
    pago = await pago_service.obtener_detalle(pago_id=id, session=session)
    return pago_service._to_pago_detail_response(pago)


@router.delete("/{id}", response_model=PagoResponse)
async def eliminar_pago(
    id: uuid.UUID,
    current_user: Usuario = Depends(_operador_roles),
    session: AsyncSession = Depends(get_db),
) -> PagoResponse:
    async with session.begin_nested():
        pago = await pago_service.eliminar_pago(
            id,
            session=session,
            usuario_id=current_user.id,
        )
    return pago_service._to_pago_response(pago)
