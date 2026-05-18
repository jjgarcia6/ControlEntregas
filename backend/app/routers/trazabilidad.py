import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import require_rol
from app.dependencies.db import get_db
from app.models.usuario import Usuario
from app.schemas.trazabilidad import (
    TrazabilidadEntregaResponse,
    TrazabilidadPagoResponse,
    TrazabilidadXmlResponse,
)
from app.services import trazabilidad_service

router = APIRouter(prefix="/trazabilidad", tags=["trazabilidad"])

_lectura_roles = require_rol(["admin", "operador", "lectura"])


@router.get("/xml/{id}", response_model=TrazabilidadXmlResponse)
async def trazabilidad_desde_xml(
    id: uuid.UUID,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> TrazabilidadXmlResponse:
    return await trazabilidad_service.desde_xml(id, session)


@router.get("/entrega/{id}", response_model=TrazabilidadEntregaResponse)
async def trazabilidad_desde_entrega(
    id: uuid.UUID,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> TrazabilidadEntregaResponse:
    return await trazabilidad_service.desde_entrega(id, session)


@router.get("/pago/{id}", response_model=TrazabilidadPagoResponse)
async def trazabilidad_desde_pago(
    id: uuid.UUID,
    _: Usuario = Depends(_lectura_roles),
    session: AsyncSession = Depends(get_db),
) -> TrazabilidadPagoResponse:
    return await trazabilidad_service.desde_pago(id, session)
