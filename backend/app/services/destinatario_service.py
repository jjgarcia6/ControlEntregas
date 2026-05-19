import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.destinatario import Destinatario
from app.schemas.destinatario import (
    DestinatarioCreate,
    DestinatarioResponse,
    DestinatarioUpdate,
)
from app.utils.audit import auditar, safe_dict, set_audit_payload
from app.utils.exceptions import ConflictoUnicidad, EntidadNoEncontrada
from app.utils.validaciones import validar_identificacion


async def listar(session: AsyncSession) -> list[DestinatarioResponse]:
    result = await session.execute(
        select(Destinatario)
        .where(Destinatario.is_active.is_(True))
        .order_by(Destinatario.nombre)
    )
    return [DestinatarioResponse.model_validate(d) for d in result.scalars().all()]


async def buscar_por_identificacion(
    identificacion: str, session: AsyncSession
) -> DestinatarioResponse:
    result = await session.execute(
        select(Destinatario).where(
            Destinatario.identificacion == identificacion,
            Destinatario.is_active.is_(True),
        )
    )
    destinatario = result.scalar_one_or_none()
    if destinatario is None:
        raise EntidadNoEncontrada(
            f"Destinatario con identificación '{identificacion}' no encontrado"
        )
    return DestinatarioResponse.model_validate(destinatario)


@auditar("CREATE", "destinatarios")
async def crear(
    datos: DestinatarioCreate,
    *,
    usuario_id: uuid.UUID,
    session: AsyncSession,
    entidad_id: uuid.UUID | None = None,
    payload_antes: dict[str, Any] | None = None,
    payload_despues: dict[str, Any] | None = None,
) -> DestinatarioResponse:
    tipo_info = validar_identificacion(datos.identificacion)
    tipo = tipo_info["tipo"]

    existing = await session.execute(
        select(Destinatario).where(Destinatario.identificacion == datos.identificacion)
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictoUnicidad(
            f"Ya existe un destinatario con identificación '{datos.identificacion}'"
        )

    nuevo = Destinatario(
        tipo_identificacion=tipo,
        identificacion=datos.identificacion,
        nombre=datos.nombre,
        direccion=datos.direccion,
        telefono=datos.telefono,
        email=str(datos.email) if datos.email else None,
        created_by=usuario_id,
    )
    session.add(nuevo)
    await session.flush()
    set_audit_payload(
        payload_despues=safe_dict(
            identificacion=nuevo.identificacion,
            nombre=nuevo.nombre,
            direccion=nuevo.direccion,
            telefono=nuevo.telefono,
            email=nuevo.email,
        )
    )
    return DestinatarioResponse.model_validate(nuevo)


@auditar("UPDATE", "destinatarios")
async def actualizar(
    destinatario_id: uuid.UUID,
    datos: DestinatarioUpdate,
    *,
    usuario_id: uuid.UUID,
    session: AsyncSession,
    entidad_id: uuid.UUID | None = None,
    payload_antes: dict[str, Any] | None = None,
    payload_despues: dict[str, Any] | None = None,
) -> DestinatarioResponse:
    result = await session.execute(
        select(Destinatario).where(
            Destinatario.id == destinatario_id, Destinatario.is_active.is_(True)
        )
    )
    destinatario = result.scalar_one_or_none()
    if destinatario is None:
        raise EntidadNoEncontrada("Destinatario no encontrado")

    antes = safe_dict(
        identificacion=destinatario.identificacion,
        nombre=destinatario.nombre,
        direccion=destinatario.direccion,
        telefono=destinatario.telefono,
        email=destinatario.email,
    )

    if datos.nombre is not None:
        destinatario.nombre = datos.nombre
    if datos.direccion is not None:
        destinatario.direccion = datos.direccion
    if datos.telefono is not None:
        destinatario.telefono = datos.telefono
    if datos.email is not None:
        destinatario.email = str(datos.email)
    elif "email" in datos.model_fields_set:
        destinatario.email = None

    destinatario.updated_by = usuario_id
    await session.flush()
    set_audit_payload(
        payload_antes=antes,
        payload_despues=safe_dict(
            identificacion=destinatario.identificacion,
            nombre=destinatario.nombre,
            direccion=destinatario.direccion,
            telefono=destinatario.telefono,
            email=destinatario.email,
        ),
    )
    return DestinatarioResponse.model_validate(destinatario)
