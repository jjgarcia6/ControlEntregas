import functools
import uuid
from collections.abc import Callable
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


def auditar(accion: str, entidad: str) -> Callable[..., Any]:
    """
    Decorator asíncrono que escribe un registro en audit_log al final
    de la función decorada. La función decorada debe recibir `session`
    como kwarg y opcionalmente `entidad_id`, `payload_antes`, `payload_despues`.
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            result = await func(*args, **kwargs)

            session: AsyncSession | None = kwargs.get("session")
            if session is None:
                return result

            entidad_id: uuid.UUID | None = kwargs.get("entidad_id")
            payload_antes: dict[str, Any] | None = kwargs.get("payload_antes")
            payload_despues: dict[str, Any] | None = kwargs.get("payload_despues")
            usuario_id: uuid.UUID | None = kwargs.get("usuario_id")

            log = AuditLog(
                accion=accion,
                entidad=entidad,
                entidad_id=entidad_id,
                payload_antes=payload_antes,
                payload_despues=payload_despues,
                usuario_id=usuario_id,
            )
            session.add(log)

            return result

        return wrapper

    return decorator
