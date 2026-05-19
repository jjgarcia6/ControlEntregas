import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.banco import Banco
from app.schemas.banco import BancoCreate, BancoResponse, BancoUpdate
from app.utils.audit import auditar, safe_dict, set_audit_payload
from app.utils.exceptions import ConflictoUnicidad, EntidadNoEncontrada


async def listar(session: AsyncSession) -> list[BancoResponse]:
    result = await session.execute(
        select(Banco).where(Banco.is_active.is_(True)).order_by(Banco.nombre)
    )
    return [BancoResponse.model_validate(b) for b in result.scalars().all()]


@auditar("CREATE", "bancos")
async def crear(
    datos: BancoCreate,
    *,
    usuario_id: uuid.UUID,
    session: AsyncSession,
    entidad_id: uuid.UUID | None = None,
    payload_antes: dict[str, Any] | None = None,
    payload_despues: dict[str, Any] | None = None,
) -> BancoResponse:
    existing = await session.execute(select(Banco).where(Banco.nombre == datos.nombre))
    if existing.scalar_one_or_none() is not None:
        raise ConflictoUnicidad(f"Ya existe un banco con nombre '{datos.nombre}'")

    nuevo = Banco(nombre=datos.nombre, created_by=usuario_id)
    session.add(nuevo)
    await session.flush()
    set_audit_payload(payload_despues=safe_dict(nombre=nuevo.nombre))
    return BancoResponse.model_validate(nuevo)


@auditar("UPDATE", "bancos")
async def actualizar(
    banco_id: uuid.UUID,
    datos: BancoUpdate,
    *,
    usuario_id: uuid.UUID,
    session: AsyncSession,
    entidad_id: uuid.UUID | None = None,
    payload_antes: dict[str, Any] | None = None,
    payload_despues: dict[str, Any] | None = None,
) -> BancoResponse:
    result = await session.execute(
        select(Banco).where(Banco.id == banco_id, Banco.is_active.is_(True))
    )
    banco = result.scalar_one_or_none()
    if banco is None:
        raise EntidadNoEncontrada("Banco no encontrado")

    nombre_antes = banco.nombre

    if datos.nombre != banco.nombre:
        existing = await session.execute(
            select(Banco).where(Banco.nombre == datos.nombre)
        )
        if existing.scalar_one_or_none() is not None:
            raise ConflictoUnicidad(f"Ya existe un banco con nombre '{datos.nombre}'")

    banco.nombre = datos.nombre
    banco.updated_by = usuario_id
    await session.flush()
    set_audit_payload(
        payload_antes=safe_dict(nombre=nombre_antes),
        payload_despues=safe_dict(nombre=banco.nombre),
    )
    return BancoResponse.model_validate(banco)
