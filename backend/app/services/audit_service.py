"""Consulta y exportación del audit_log. Solo lectura; el log es inmutable."""

import csv
import io
import json
from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy import Select, func, outerjoin, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.usuario import Usuario
from app.schemas.auditoria import AuditLogItemResponse
from app.schemas.common import PaginatedResponse

_MAX_EXPORT_ROWS = 50_000


async def consultar(
    *,
    session: AsyncSession,
    entidad: str | None = None,
    usuario_id: UUID | None = None,
    accion: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedResponse[AuditLogItemResponse]:
    query = (
        select(AuditLog, Usuario.email.label("usuario_email"))
        .select_from(outerjoin(AuditLog, Usuario, AuditLog.usuario_id == Usuario.id))
        .order_by(AuditLog.created_at.desc())
    )
    query = _aplicar_filtros(query, entidad, usuario_id, accion, fecha_desde, fecha_hasta)

    count_q = select(func.count()).select_from(query.subquery())
    total: int = (await session.execute(count_q)).scalar_one()

    rows = (
        await session.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).all()

    items = [_to_response(row.AuditLog, row.usuario_email) for row in rows]
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=items)


async def exportar(
    *,
    session: AsyncSession,
    formato: str,
    entidad: str | None = None,
    usuario_id: UUID | None = None,
    accion: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
) -> bytes:
    query = (
        select(AuditLog, Usuario.email.label("usuario_email"))
        .select_from(outerjoin(AuditLog, Usuario, AuditLog.usuario_id == Usuario.id))
        .order_by(AuditLog.created_at.desc())
        .limit(_MAX_EXPORT_ROWS)
    )
    query = _aplicar_filtros(query, entidad, usuario_id, accion, fecha_desde, fecha_hasta)

    rows = (await session.execute(query)).all()
    items = [_to_response(row.AuditLog, row.usuario_email) for row in rows]

    if formato == "csv":
        return _to_csv(items)
    return _to_json(items)


def _aplicar_filtros(
    query: Select[Any],
    entidad: str | None,
    usuario_id: UUID | None,
    accion: str | None,
    fecha_desde: date | None,
    fecha_hasta: date | None,
) -> Select[Any]:
    from sqlalchemy import and_

    conditions = []
    if entidad:
        conditions.append(AuditLog.entidad == entidad)
    if usuario_id:
        conditions.append(AuditLog.usuario_id == usuario_id)
    if accion:
        conditions.append(AuditLog.accion == accion)
    if fecha_desde:
        conditions.append(func.date(AuditLog.created_at) >= fecha_desde)
    if fecha_hasta:
        conditions.append(func.date(AuditLog.created_at) <= fecha_hasta)
    if conditions:
        return query.where(and_(*conditions))
    return query


def _to_response(log: AuditLog, usuario_email: str | None) -> AuditLogItemResponse:
    return AuditLogItemResponse(
        id=log.id,
        usuario_id=log.usuario_id,
        usuario_email=usuario_email,
        accion=log.accion,
        entidad=log.entidad,
        entidad_id=log.entidad_id,
        payload_antes=log.payload_antes,
        payload_despues=log.payload_despues,
        ip=log.ip,
        created_at=log.created_at,
    )


_CSV_FIELDS = [
    "id",
    "usuario_id",
    "usuario_email",
    "accion",
    "entidad",
    "entidad_id",
    "payload_antes",
    "payload_despues",
    "ip",
    "created_at",
]


def _to_csv(items: list[AuditLogItemResponse]) -> bytes:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=_CSV_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for item in items:
        row = item.model_dump()
        row["id"] = str(row["id"]) if row["id"] else ""
        row["usuario_id"] = str(row["usuario_id"]) if row["usuario_id"] else ""
        row["entidad_id"] = str(row["entidad_id"]) if row["entidad_id"] else ""
        row["created_at"] = row["created_at"].isoformat() if row["created_at"] else ""
        row["payload_antes"] = (
            json.dumps(row["payload_antes"], ensure_ascii=False) if row["payload_antes"] else ""
        )
        row["payload_despues"] = (
            json.dumps(row["payload_despues"], ensure_ascii=False)
            if row["payload_despues"]
            else ""
        )
        writer.writerow(row)
    return buf.getvalue().encode("utf-8")


def _to_json(items: list[AuditLogItemResponse]) -> bytes:
    data = []
    for item in items:
        row = item.model_dump()
        row["id"] = str(row["id"]) if row["id"] else None
        row["usuario_id"] = str(row["usuario_id"]) if row["usuario_id"] else None
        row["entidad_id"] = str(row["entidad_id"]) if row["entidad_id"] else None
        row["created_at"] = row["created_at"].isoformat() if row["created_at"] else None
        data.append(row)
    return json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
