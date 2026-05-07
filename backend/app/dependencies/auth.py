from collections.abc import Callable
from typing import Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> Any:
    raise NotImplementedError("Implementar en Fase 1")


def require_rol(roles: list[str]) -> Callable[..., Any]:
    async def dependency(
        current_user: Any = Depends(get_current_user),
    ) -> Any:
        raise NotImplementedError("Implementar en Fase 1")

    return dependency
