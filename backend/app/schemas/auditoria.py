from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AuditLogItemResponse(BaseModel):
    id: UUID = Field(..., description="ID único del registro de auditoría")
    usuario_id: UUID | None = Field(
        ...,
        description="ID del usuario que realizó la acción; None para acciones del sistema",
    )
    usuario_email: str | None = Field(
        ...,
        description="Email del usuario (join con tabla usuarios; None si el usuario fue eliminado)",
    )
    accion: str = Field(
        ..., description="Tipo de operación: CREATE | UPDATE | SOFT_DELETE | LOGIN"
    )
    entidad: str = Field(
        ..., description="Nombre de la entidad afectada (ej: xmls, entregas)"
    )
    entidad_id: UUID | None = Field(
        ..., description="ID de la entidad afectada; None para LOGIN"
    )
    payload_antes: dict[str, Any] | None = Field(
        ...,
        description="Estado de la entidad antes del cambio (JSONB); None para CREATE y LOGIN",
    )
    payload_despues: dict[str, Any] | None = Field(
        ...,
        description="Estado de la entidad después del cambio (JSONB); None para SOFT_DELETE",
    )
    ip: str | None = Field(
        ..., description="Dirección IP del cliente que originó la acción"
    )
    created_at: datetime = Field(
        ..., description="Fecha y hora exacta del evento de auditoría (ISO 8601)"
    )
