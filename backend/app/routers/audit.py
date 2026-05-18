from datetime import date
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import require_rol
from app.dependencies.db import get_db
from app.models.usuario import Usuario
from app.schemas.auditoria import AuditLogItemResponse
from app.schemas.common import PaginatedResponse
from app.services import audit_service

router = APIRouter(prefix="/audit", tags=["audit"])

_solo_admin = require_rol(["admin"])


@router.get("", response_model=PaginatedResponse[AuditLogItemResponse])
async def consultar_audit_log(
    entidad: str | None = None,
    usuario_id: UUID | None = None,
    accion: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: Usuario = Depends(_solo_admin),
    session: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AuditLogItemResponse]:
    return await audit_service.consultar(
        session=session,
        entidad=entidad,
        usuario_id=usuario_id,
        accion=accion,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        page=page,
        page_size=page_size,
    )


@router.get("/export")
async def exportar_audit_log(
    formato: Literal["csv", "json"] = Query(..., description="Formato de exportación: csv o json"),
    entidad: str | None = None,
    usuario_id: UUID | None = None,
    accion: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    _: Usuario = Depends(_solo_admin),
    session: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    content = await audit_service.exportar(
        session=session,
        formato=formato,
        entidad=entidad,
        usuario_id=usuario_id,
        accion=accion,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )

    if formato == "csv":
        media_type = "text/csv; charset=utf-8"
        filename = "audit_log.csv"
    else:
        media_type = "application/json"
        filename = "audit_log.json"

    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
