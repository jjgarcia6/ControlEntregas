# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema web para control de entregas de productos a partir de facturas electrónicas SRI (XML).
Flujo principal: **XML SRI → Kardex FIFO → Entregas → Pagos**.
Monorepo con `backend/` (FastAPI + PostgreSQL) y `frontend/` (React + TypeScript).

## Backend Commands

All backend commands run from `backend/` with the virtualenv active (`.venv/`).

```bash
# Activate virtualenv
source backend/.venv/bin/activate

# Run dev server
cd backend && uvicorn app.main:app --reload --port 8000

# Run all tests
cd backend && pytest

# Run a single test file
cd backend && pytest tests/test_fifo.py -v

# Run a single test by name
cd backend && pytest tests/test_fifo.py::test_name -v

# Linting & type checking
cd backend && ruff check app/ tests/
cd backend && mypy app/

# Security scan
cd backend && bandit -r app/

# Alembic migrations
cd backend && alembic upgrade head
cd backend && alembic revision --autogenerate -m "description"
cd backend && alembic downgrade -1   # test reversibility
```

Backend requires a `.env` file in `backend/` — copy from `.env.example`:
- `DATABASE_URL`: `postgresql+asyncpg://...`
- `JWT_SECRET_KEY`: random secret
- `ENVIRONMENT`: `development` | `production`

Tests use `TEST_DATABASE_URL` env var. **IMPORTANT**: `TEST_DATABASE_URL` must point to a
separate database from `DATABASE_URL` to avoid polluting development data.

## Frontend Commands

All frontend commands run from `frontend/`.

```bash
# Dev server (http://localhost:5173)
cd frontend && npm run dev

# Build
cd frontend && npm run build

# Type check
cd frontend && npm run typecheck

# Lint
cd frontend && npm run lint

# Run all tests
cd frontend && npm test

# Run tests in watch mode
cd frontend && npm run test:watch
```

Frontend requires `VITE_API_URL` env var pointing to the backend (e.g., `http://localhost:8000`).

## Architecture

### Backend (`backend/app/`)

- **`main.py`** — FastAPI app, CORS, global exception handlers mapping domain exceptions to HTTP status codes.
- **`config.py`** — Pydantic `Settings` loaded from `.env`.
- **`database.py`** — SQLAlchemy async engine + session factory.
- **`routers/`** — HTTP layer only. Routers receive requests and delegate to services — no business logic here.
- **`services/`** — All business logic lives here. Services are called by routers and decorated with `@auditar`.
- **`models/`** — SQLAlchemy ORM models. All domain models MUST inherit from `AuditMixin` (adds `created_at`, `updated_at`, `deleted_at`, `is_active`, and `soft_delete()` method).
- **`schemas/`** — Pydantic v2 models for request/response contracts. `common.py` has shared types (`PaginatedResponse`, `ApiErrorResponse`).
- **`dependencies/`** — FastAPI `Depends()` providers: `auth.py` (JWT + role check), `db.py` (async session).
- **`utils/fifo.py`** — Pure function FIFO cost calculator. No DB dependency; directly testable. `calcular_consumo_fifo(lotes, cantidad)` raises `SaldoInsuficiente` if stock is insufficient.
- **`utils/audit.py`** — `@auditar(accion, entidad)` decorator. Writes to `audit_log` after the decorated service function. Requires `session`, and optionally `entidad_id`, `usuario_id`, `payload_antes`, `payload_despues` as kwargs.
- **`utils/validaciones.py`** — Ecuadorian cédula/RUC validator (módulo 11 algorithm). Raises `ValidacionNegocio` on failure.
- **`utils/exceptions.py`** — Domain exception classes: `EntidadNoEncontrada` (404), `ConflictoUnicidad` (409), `ValidacionNegocio` (400), `SaldoInsuficiente` (400), `EliminacionBloqueada` (409), `PermisoInsuficiente` (403).
- **`templates/reportes/`** — Jinja2 + WeasyPrint HTML templates for PDF reports.
- **`migrations/`** — Alembic. Every model change requires a migration with both `upgrade` and `downgrade`.

### Frontend (`frontend/src/`)

- **`api/client.ts`** — Axios instance. Reads `VITE_API_URL`. Attaches JWT from `authStore` on every request. Redirects to `/login` on 401.
- **`store/authStore.ts`** — Zustand store (persisted to localStorage) for `token` + `user`. Only session state goes here.
- **`store/uiStore.ts`** — Zustand store for UI-only state (sidebar open, etc.).
- **`routes/index.tsx`** — React Router v7 browser router. `ProtectedRoute` wraps authenticated sections. Pages are lazy-loaded.
- **`features/[feature-name]/`** — Feature-driven architecture. Each feature owns its `components/`, `hooks/`, `types/`, and `index.ts`. All async logic and API calls go in custom hooks inside `features/`.
- **`pages/`** — Dumb pages: no state logic, no direct API calls. They compose feature components.
- **`components/ui/`** — shadcn/ui primitives (never domain logic).
- **`components/custom/`** — Reusable visual components shared across features (not domain-specific).
- **`shared/`** — Logic shared across two or more features: utilities, types, formatters.

### Registered Features (11 domains)

`auth`, `usuarios`, `bancos`, `destinatarios`, `xmls`, `kardex`, `entregas`, `pagos`,
`trazabilidad`, `auditoria`, `reportes`

## Critical Business Rules

- **FIFO Kardex**: Stock NEVER goes negative. Consumption always takes from oldest lots first.
- **Soft delete**: All domain queries filter `is_active=True` by default. Deletion via `AuditMixin.soft_delete(usuario_id)`.
- **Delivery reversal**: Blocked if the delivery has payments. Without payments, FIFO reversal must be exact using `entrega_item_fifo_detalle`.
- **Payment reversal**: Must restore `saldo_pendiente` on each affected delivery.
- **XML**: `clave_acceso` must be unique; only `ambiente=2` (production) is accepted.
- **Payments**: `SUM(monto_aplicado)` must equal `valor_total`; amount per delivery cannot exceed `saldo_pendiente`.
- **Traceability**: The chain XML ↔ Kardex ↔ Entrega ↔ Pago must remain navigable in both directions. Trazabilidad endpoints include soft-deleted entities intentionally to show full history.

## Conventions

- **Language**: Business logic documentation and variable names for domain concepts in Spanish. API routes, code structure, and technical identifiers in English.
- **Transactions**: Services use `async with session.begin_nested()`. The `get_db` dependency commits on success and rolls back on failure. Never use `session.begin()` inside a router or service — `get_db` already starts a transaction via SQLAlchemy autobegin, and calling `begin()` again raises `InvalidRequestError`.
- **Audit**: The `@auditar` decorator is the only place audit writes happen — never inline.
- **Backend is source of truth**: TypeScript/Zod types in the frontend MUST mirror Pydantic schemas. Never the reverse.
- **Task order when implementing a feature**: Contract (Pydantic + Zod) → Migrations → Backend → Frontend → Security → Tests.
- **mypy**: Strict mode (`strict = true`). Every new module must pass `mypy app/`.
- **Monetary values**: Always `NUMERIC(12,2)` or `NUMERIC(12,4)` in PostgreSQL, `Decimal` in Pydantic, `z.number()` in Zod. Never `float`.

## Test Setup (Supabase + PgBouncer)

Tests run against Supabase (PgBouncer in transaction mode). The conftest uses a special pattern
to avoid connection pool conflicts and support prepared-statement-less connections:

```python
# tests/conftest.py pattern
create_async_engine(..., poolclass=NullPool, connect_args={"statement_cache_size": 0})

# Each test gets a fresh session over the same connection, rolled back at the end:
AsyncSession(conn, join_transaction_mode="create_savepoint")
```

This gives cross-request visibility within a test (same connection) with full rollback at test end.

## OpenSpec Workflow

Changes to this codebase follow the OpenSpec `spec-driven` schema defined in `openspec/`.

```
openspec/
├── config.yaml                      # Global context + per-artifact rules
├── schemas/spec-driven/
│   ├── schema.yaml                  # Artifact definitions + dependency chain
│   └── templates/                   # proposal.md, design.md, specs.md, tasks.md
├── specs/{domain}/spec.md           # Consolidated live spec per domain (source of truth)
└── changes/archive/{change}/        # Archived changes (one per feature phase)
    ├── .openspec.yaml               # Schema + change name metadata
    ├── proposal.md
    ├── design.md
    ├── specs/{domain}.md            # Delta spec for this change only
    └── tasks.md
```

**Artifact dependency chain**: `proposal` → `specs` + `design` → `tasks` → `apply`

**Phase order inside `tasks.md`** (non-negotiable):
0. Contracts (Pydantic + Zod)
1. Migrations (Alembic)
2. Backend (services + routers)
3. Frontend (hooks + components + pages)
4. Security (ruff, mypy, bandit, eslint)
5. Tests

Use `/opsx:propose`, `/opsx:explore`, `/opsx:apply`, and `/opsx:archive` slash commands to
work within this workflow.

## Known Pending Items

- **TEST_DATABASE_URL isolation**: Must point to a separate database from `DATABASE_URL`. Direct
  deletes in Supabase (bypassing the API) can leave orphaned `kardex_movimientos` because the
  soft-delete constraint is enforced at the application layer, not the DB layer.
- **DB integrity triggers**: `BEFORE DELETE` triggers on `entregas` and `entrega_items` tables
  to block direct SQL deletes (bypassing soft delete). Planned as a future OpenSpec change
  (`proteccion-integridad-bd`).
