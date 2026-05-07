# Diseño Técnico: fase-0-infraestructura-base

## 1. Capa de Datos (PostgreSQL + SQLAlchemy)

### Tablas e Índices

| Tabla | Índice / Constraint | Tipo | Justificación |
| :--- | :--- | :--- | :--- |
| `audit_log` | `id` | `pk / uuid` | Clave primaria generada con `gen_random_uuid()` |
| `audit_log` | `usuario_id` | `btree` | Filtrado de logs por usuario en consultas de auditoría |
| `audit_log` | `(entidad, entidad_id)` | `btree compuesto` | Lookup de todos los eventos de una entidad específica |
| `audit_log` | `created_at` | `btree` | Filtrado por rango de fechas en Fase 6 |

### Modelo SQLAlchemy

```python
# models/base.py — AuditMixin y Base declarativa
# AuditMixin NO genera tabla; se mezcla en cada modelo de dominio.

import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import TIMESTAMP, Boolean, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func

class Base(DeclarativeBase):
    pass

class AuditMixin:
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuarios.id", use_alter=True), nullable=True
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("usuarios.id", use_alter=True), nullable=True
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    deleted_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("usuarios.id", use_alter=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def soft_delete(self, usuario_id: uuid.UUID) -> None:
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by = usuario_id
```

```python
# models/audit_log.py — Tabla inmutable; sin AuditMixin ni soft delete.
# Hereda de: Base (solo)

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import TIMESTAMP, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.models.base import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    usuario_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    accion: Mapped[str] = mapped_column(String(50), nullable=False)
    entidad: Mapped[str] = mapped_column(String(100), nullable=False)
    entidad_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    payload_antes: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    payload_despues: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
```

### Migración Alembic

```
# Archivo: migrations/versions/v001_create_audit_log.py
# upgrade():
#   - CREATE TABLE audit_log con todas las columnas definidas arriba.
#   - CREATE INDEX ix_audit_log_usuario_id ON audit_log(usuario_id)
#   - CREATE INDEX ix_audit_log_entidad ON audit_log(entidad, entidad_id)
#   - CREATE INDEX ix_audit_log_created_at ON audit_log(created_at)
# downgrade():
#   - DROP TABLE audit_log CASCADE
#
# NOTA: usuario_id es nullable en esta migración.
# La FK a usuarios.id se agrega en la migración de Fase 1 (v002).
# migrations/env.py DEBE usar run_async_migrations() con asyncio.run().
```

### Impacto en Invariantes del Sistema

- **Kardex FIFO:** No se alteran. Esta fase no crea movimientos de Kardex.
- **Cadena de trazabilidad:** No se altera. No hay entidades de dominio en Fase 0.
- **Soft delete:** `AuditMixin.soft_delete()` queda disponible; se activa en Fase 1.
- **Saldos:** No aplica. No existen productos, entregas ni pagos en Fase 0.

---

## 2. Capa de API y Contratos (Fuente de Verdad)

### Diccionario de Datos Vivo

| Entidad | Campo | Tipo (Py / TS) | Descripción | Restricciones |
| :--- | :--- | :--- | :--- | :--- |
| `HealthCheck` | `status` | `str / string` | Estado del servicio | Siempre `"ok"` |
| `HealthCheck` | `version` | `str / string` | Versión semántica del backend | Formato `x.y.z` |
| `ApiError` | `detail` | `str / string` | Mensaje de error legible por el usuario | Non-nullable |
| `ApiError` | `code` | `str / string` | Código de error interno (snake_case) | Nullable |

### Backend: Esquemas Pydantic v2

```python
# schemas/common.py — Schemas transversales reutilizados en todas las fases.

from pydantic import BaseModel, Field, ConfigDict
from typing import Generic, TypeVar, Optional, List

T = TypeVar("T")

class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Estado del servicio; siempre 'ok' si levantó")
    version: str = Field(..., description="Versión semántica del backend")

class ApiErrorResponse(BaseModel):
    detail: str = Field(..., description="Mensaje de error legible por el usuario")
    code: Optional[str] = Field(None, description="Código de error interno en snake_case")

class PaginatedResponse(BaseModel, Generic[T]):
    total: int = Field(..., description="Total de registros que cumplen el filtro")
    page: int = Field(..., description="Número de página actual (base 1)")
    page_size: int = Field(..., description="Cantidad de registros por página")
    items: List[T] = Field(..., description="Lista de registros de la página actual")
```

### Frontend: Esquemas Zod + TypeScript

```typescript
// shared/types/api.types.ts — Tipos genéricos de respuesta API.
// Todos los schemas de dominio derivan su shape de estos genéricos.

import { z } from "zod";

export const healthCheckSchema = z.object({
  status: z.string().describe("Estado del servicio"),
  version: z.string().describe("Versión semántica del backend"),
});

export const apiErrorSchema = z.object({
  detail: z.string().describe("Mensaje de error legible por el usuario"),
  code: z.string().nullable().optional().describe("Código de error interno"),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    items: z.array(itemSchema),
  });

export type HealthCheckType = z.infer<typeof healthCheckSchema>;
export type ApiErrorType = z.infer<typeof apiErrorSchema>;
export type PaginatedResponseType<T> = {
  total: number;
  page: number;
  page_size: number;
  items: T[];
};
```

### Endpoints de FastAPI

| Verbo | Ruta | Request Schema | Response Schema | Códigos HTTP | Roles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | — | `HealthCheckResponse` | `200` | Público |

### Servicio de Negocio

No hay servicios de negocio en Fase 0. El health check se resuelve directamente en el router.

| Servicio | Método | Responsabilidad única | Transaccional |
| :--- | :--- | :--- | :--- |
| `utils/audit.py` | `@auditar(accion, entidad)` | Escribir un registro en `audit_log` dentro del contexto de un servicio | Sí (usa la sesión del request) |
| `utils/validaciones.py` | `validar_identificacion(valor)` | Aplicar módulo 11 y retornar tipo (`cedula` / `ruc`) o lanzar `ValidacionNegocio` | No |
| `utils/fifo.py` | `calcular_consumo_fifo(lotes, cantidad)` | Función pura FIFO — stub tipado sin lógica de BD | No |

---

## 3. Capa de Presentación (UI — React)

### Árbol de Directorios de la Feature

Esta fase no crea una `feature/` de dominio. Crea la infraestructura compartida de UI.

```
frontend/src/
├── api/
│   └── client.ts                  # axios instance + interceptores JWT y 401
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Contenedor: Sidebar + Header + <Outlet>
│   │   ├── Sidebar.tsx            # Navegación condicional por rol
│   │   └── ProtectedRoute.tsx     # Guard de autenticación y rol
│   ├── ui/                        # Componentes shadcn/ui (generados por CLI)
│   └── custom/                    # Vacío en Fase 0; se llena en fases siguientes
├── store/
│   ├── authStore.ts               # Zustand: token, user, login, logout, isAuthenticated
│   └── uiStore.ts                 # Zustand: sidebar open/close, tema dark/light
├── pages/
│   └── Login.tsx                  # Dumb Page: renderiza LoginCard (shadcn/ui Card)
├── routes/
│   └── index.tsx                  # React Router v7: rutas públicas y protegidas con lazy()
└── shared/
    ├── types/
    │   └── api.types.ts           # Zod schemas genéricos + TypeScript types derivados
    └── utils/
        └── formatters.ts          # formatCurrency(amount), formatDate(date)
```

### Componentes shadcn/ui utilizados en Fase 0

**Login page** — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
`CardFooter`, `Button`, `Input`, `Label`, `Form` (react-hook-form integration).

**AppLayout / Sidebar** — `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`,
`SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarProvider`,
`Sheet` (mobile drawer), `Separator`, `ScrollArea`.

**Global** — `Toaster` (Sonner), `Avatar`, `AvatarImage`, `AvatarFallback`,
`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`,
`Badge`, `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`.

### Diseño del componente Login.tsx (shadcn/ui Card)

```
┌─────────────────────────────────────────┐
│          Sistema de Entregas            │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        Card (shadcn/ui)           │  │
│  │  Título: Iniciar Sesión           │  │
│  │  Descripción: Ingresa tus datos   │  │
│  │  ─────────────────────────────    │  │
│  │  Label: Correo electrónico        │  │
│  │  [    Input (email)            ]  │  │
│  │                                   │  │
│  │  Label: Contraseña                │  │
│  │  [    Input (password)         ]  │  │
│  │                                   │  │
│  │  [ Button: Iniciar sesión      ]  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Diseño del AppLayout con Sidebar

```
┌──────────────────────────────────────────────────────────┐
│  Header: [Logo]          [Avatar + Nombre + Dropdown]    │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   Sidebar    │          <Outlet />                       │
│   (shadcn/   │   (Contenido de cada feature/página)      │
│   ui Sidebar)│                                           │
│              │                                           │
│  • Dashboard │                                           │
│  • Usuarios  │                                           │
│  • Bancos    │                                           │
│  • ...       │                                           │
│              │                                           │
│   [Logout]   │                                           │
└──────────────┴───────────────────────────────────────────┘
```

### Contrato Público

No aplica en Fase 0: no hay feature con `index.ts` público. Los módulos de
infraestructura (`store/`, `api/`, `components/layout/`) se importan directamente.

### Custom Hooks

No hay Custom Hooks de dominio en Fase 0. Los únicos hooks globales son:

| Hook | Responsabilidad única | Endpoint que consume | React Query key |
| :--- | :--- | :--- | :--- |
| *(ninguno en Fase 0)* | — | — | — |

### Páginas y Enrutamiento

| Ruta | Tipo | Página (`src/pages/`) | Componente Contenedor | Roles permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | Pública | `Login.tsx` | *(inline en página)* | Todos (redirige si ya autenticado) |
| `/dashboard` | Protegida | `Dashboard.tsx` (placeholder) | *(inline en página)* | admin, operador, lectura |
| `*` | Protegida | — | redirige a `/login` | — |

---

## 4. Configuración y DevSecOps

### Gestión de Secretos

**Backend — variables nuevas en `backend/.env.example`:**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
JWT_SECRET_KEY=cambiar-en-produccion
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=480
CORS_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
```
Producción: gestionadas en GCP Secret Manager. `config.py` las lee vía Pydantic Settings.

**Frontend — variables nuevas en `frontend/.env.example`:**
```env
VITE_API_URL=http://localhost:8000
```

### Seguridad Proactiva

- **Backend:** `ruff check backend/` y `mypy backend/` DEBEN pasar con 0 errores.
- **Backend:** `bandit -r backend/app/` NO DEBE emitir alertas de severidad MEDIUM o superior.
- **Frontend:** `eslint frontend/src/` DEBE pasar con 0 errores.
- **SCA:** `snyk test` o `trivy fs .` DEBEN ejecutarse tras instalar dependencias.

---

## 5. Cambios Estructurales

### Nuevas Dependencias

**Backend (`requirements.txt`):**

| Paquete | Versión | Entorno | Justificación |
| :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.115.0` | Backend | Framework HTTP principal |
| `uvicorn[standard]` | `>=0.30.0` | Backend | ASGI server con hot-reload |
| `sqlalchemy[asyncio]` | `>=2.0.30` | Backend | ORM async con asyncpg |
| `asyncpg` | `>=0.29.0` | Backend | Driver PostgreSQL async nativo |
| `alembic` | `>=1.13.0` | Backend | Migraciones con autogenerate |
| `pydantic` | `>=2.7.0` | Backend | Validación de datos en strict mode |
| `pydantic-settings` | `>=2.3.0` | Backend | Lectura de .env con tipos |
| `python-jose[cryptography]` | `>=3.3.0` | Backend | JWT — se usa en Fase 1 |
| `bcrypt` | `>=4.1.0` | Backend | Hash de passwords — se usa en Fase 1 |
| `python-multipart` | `>=0.0.9` | Backend | Soporte form data para file uploads |
| `weasyprint` | `>=62.0` | Backend | Generación PDF — se usa en Fase 7 |
| `openpyxl` | `>=3.1.0` | Backend | Generación XLSX — se usa en Fase 7 |
| `httpx` | `>=0.27.0` | Backend | Cliente HTTP async para pruebas |
| `pytest` | `>=8.2.0` | Backend/Test | Framework de pruebas |
| `pytest-asyncio` | `>=0.23.0` | Backend/Test | Soporte async en pytest |

**Frontend (`package.json`):**

| Paquete | Versión | Entorno | Justificación |
| :--- | :--- | :--- | :--- |
| `react` | `^18.3.0` | Frontend | Framework UI |
| `react-dom` | `^18.3.0` | Frontend | Renderizado al DOM |
| `react-router-dom` | `^7.0.0` | Frontend | Routing declarativo v7 |
| `@tanstack/react-query` | `^5.50.0` | Frontend | Estado servidor — se usa desde Fase 1 |
| `react-hook-form` | `^7.52.0` | Frontend | Formularios con validación Zod |
| `@hookform/resolvers` | `^3.6.0` | Frontend | Integración Zod ↔ react-hook-form |
| `zod` | `^3.23.0` | Frontend | Validación de schemas en runtime |
| `zustand` | `^4.5.0` | Frontend | Estado global ligero (auth, UI) |
| `axios` | `^1.7.0` | Frontend | Cliente HTTP con interceptores |
| `lucide-react` | `^0.400.0` | Frontend | Íconos SVG para sidebar y acciones |
| `date-fns` | `^3.6.0` | Frontend | Formateo de fechas sin moment.js |
| `typescript` | `^5.5.0` | Dev | Tipos en strict mode |
| `vite` | `^5.3.0` | Dev | Bundler + HMR |
| `tailwindcss` | `^4.0.0` | Dev | Utility-first CSS |
| `vitest` | `^1.6.0` | Dev/Test | Framework de pruebas unitarias |
| `@testing-library/react` | `^16.0.0` | Dev/Test | Pruebas de componentes |

### Migraciones de Base de Datos

- **v001_create_audit_log:** Crea la tabla `audit_log` con todos sus índices.
  No hay datos previos que migrar. Downgrade la elimina limpiamente.
- `migrations/env.py` DEBE configurarse en modo async usando `asyncio.run(run_async_migrations())`.
  La sesión de migración DEBE usar la misma `DATABASE_URL` de `config.py`.
