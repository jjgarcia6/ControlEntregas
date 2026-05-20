from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

DEFAULT_PAGE_SIZE = 20


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Estado del servicio; siempre 'ok' si levantó")
    version: str = Field(..., description="Versión semántica del backend")


class ApiErrorResponse(BaseModel):
    detail: str = Field(..., description="Mensaje de error legible por el usuario")
    code: Optional[str] = Field(
        None, description="Código de error interno en snake_case"
    )


class PaginatedResponse(BaseModel, Generic[T]):
    total: int = Field(..., description="Total de registros que cumplen el filtro")
    page: int = Field(..., description="Número de página actual (base 1)")
    page_size: int = Field(..., description="Cantidad de registros por página")
    items: List[T] = Field(..., description="Lista de registros de la página actual")
