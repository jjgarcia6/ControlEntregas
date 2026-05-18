# Control de Entregas

Sistema web para el control de entregas de productos a partir de facturas electrónicas SRI (XML).

## Flujo principal

```
Factura XML SRI → Kardex FIFO → Entregas → Pagos
       ↑                                      |
       └──────── Trazabilidad bidireccional ──┘
```

El sistema ingresa facturas electrónicas del SRI, las registra en un Kardex FIFO, permite crear
entregas de productos contra ese stock y registrar los pagos asociados. Toda la cadena es
rastreable en ambas direcciones y cuenta con auditoría inmutable de cada operación.

## Stack tecnológico

| Capa | Tecnología |
|:---|:---|
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2.x async · Alembic · Pydantic v2 |
| Base de datos | PostgreSQL en Supabase (solo como PostgreSQL hosteado) |
| Autenticación | JWT (python-jose) · bcrypt · roles (admin / operador / lectura) |
| Reportes | WeasyPrint (PDF) · openpyxl (XLSX) · Jinja2 |
| Frontend | React · TypeScript · Vite · React Router v7 · TanStack Query |
| UI | Tailwind CSS v4 · shadcn/ui · Lucide React |
| Estado | Zustand (sesión + UI) · React Hook Form + Zod (formularios) |
| Testing | Pytest + HTTPX async (backend) · Vitest + React Testing Library (frontend) |
| Hosting | Google Cloud Run (backend) · Firebase Hosting (frontend) |

## Estructura del repositorio

```
controlEntregas/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py          # App entry point, CORS, exception handlers
│   │   ├── models/          # SQLAlchemy ORM models (todos heredan AuditMixin)
│   │   ├── schemas/         # Pydantic v2 schemas (Request / Response separados)
│   │   ├── services/        # Toda la lógica de negocio
│   │   ├── routers/         # Capa HTTP — solo reciben y delegan a services
│   │   ├── dependencies/    # FastAPI Depends: auth (JWT + rol) + db (sesión async)
│   │   ├── utils/
│   │   │   ├── fifo.py      # Función pura FIFO — sin dependencia de BD
│   │   │   ├── audit.py     # Decorator @auditar(accion, entidad)
│   │   │   ├── validaciones.py  # Validador cédula/RUC ecuatoriano
│   │   │   └── exceptions.py   # Excepciones tipadas de dominio → HTTP
│   │   └── templates/reportes/ # Plantillas Jinja2 para PDF (WeasyPrint)
│   ├── migrations/          # Alembic — toda migración tiene upgrade + downgrade
│   └── tests/               # 17 archivos: un test por dominio + fifo + validaciones
├── frontend/                # React application
│   └── src/
│       ├── api/client.ts    # Axios con interceptor JWT → 401 redirige a /login
│       ├── store/           # Zustand: authStore (sesión) · uiStore (UI)
│       ├── routes/          # React Router v7 con ProtectedRoute + lazy loading
│       ├── features/        # Arquitectura feature-driven (11 dominios)
│       │   └── [feature]/
│       │       ├── components/  # Contenedores + presentacionales
│       │       ├── hooks/       # Toda la lógica async y llamadas a API
│       │       ├── types/       # Schemas Zod + tipos derivados con z.infer<>
│       │       └── index.ts     # Contrato público de la feature
│       ├── pages/           # Dumb pages — solo componen el contenedor de feature
│       ├── components/
│       │   ├── ui/          # shadcn/ui primitivos (sin lógica de dominio)
│       │   └── custom/      # Componentes visuales reutilizables entre features
│       └── shared/          # Lógica compartida entre dos o más features
└── openspec/                # Especificaciones y workflow de cambios (ver más abajo)
```

## Dominios del sistema

| Dominio | Descripción |
|:---|:---|
| `auth` | Login JWT, refresh, logout |
| `usuarios` | Gestión de cuentas y roles |
| `bancos` | Catálogo de bancos para registrar pagos |
| `destinatarios` | Personas o entidades que reciben entregas |
| `xmls` | Ingreso y validación de facturas electrónicas SRI |
| `kardex` | Libro mayor de inventario FIFO con ingreso selectivo desde XMLs |
| `entregas` | Despachos de productos contra stock del Kardex |
| `pagos` | Comprobantes de pago distribuidos entre entregas |
| `trazabilidad` | Navegación bidireccional XML ↔ Kardex ↔ Entrega ↔ Pago |
| `auditoria` | Consulta y exportación del audit_log inmutable |
| `reportes` | Reportes operativos en JSON, PDF y XLSX |

## Setup del entorno de desarrollo

### Backend

```bash
# 1. Crear y activar virtualenv
python -m venv backend/.venv
source backend/.venv/bin/activate

# 2. Instalar dependencias
cd backend && pip install -r requirements.txt

# 3. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con DATABASE_URL, JWT_SECRET_KEY y TEST_DATABASE_URL

# 4. Aplicar migraciones
cd backend && alembic upgrade head

# 5. Levantar servidor
cd backend && uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
# 1. Instalar dependencias
cd frontend && npm install

# 2. Configurar variables de entorno
cp frontend/.env.example frontend/.env
# Editar frontend/.env: VITE_API_URL=http://localhost:8000

# 3. Levantar servidor de desarrollo
cd frontend && npm run dev
# → http://localhost:5173
```

### Variables de entorno requeridas

**Backend (`backend/.env`)**

| Variable | Descripción |
|:---|:---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:port/db` |
| `JWT_SECRET_KEY` | Secret aleatorio para firmar tokens JWT |
| `ENVIRONMENT` | `development` \| `production` |
| `TEST_DATABASE_URL` | BD separada para tests — nunca la misma que `DATABASE_URL` |

**Frontend (`frontend/.env`)**

| Variable | Descripción |
|:---|:---|
| `VITE_API_URL` | URL base del backend (ej: `http://localhost:8000`) |

## Reglas de negocio críticas

- **FIFO**: El saldo del Kardex NUNCA es negativo. Los egresos consumen siempre los lotes más antiguos primero.
- **Soft delete**: Toda eliminación es lógica (`is_active=False`). Los queries filtran `is_active=True` por defecto.
- **Reversión de entrega**: Bloqueada si la entrega tiene pagos activos. Sin pagos, la reversión FIFO debe ser exacta usando `entrega_item_fifo_detalle`.
- **Reversión de pago**: Restaura `saldo_pendiente` en cada entrega afectada.
- **XML**: `clave_acceso` única; solo `ambiente=2` (producción) es aceptado.
- **Pagos**: `SUM(monto_aplicado) == valor_total`; el monto por entrega no puede superar `saldo_pendiente`.

## OpenSpec — Workflow de cambios

Los cambios al sistema siguen el schema `spec-driven` definido en `openspec/`. Cada cambio genera
cuatro artefactos en orden de dependencia:

```
proposal.md  →  specs/{domain}.md  →  design.md  →  tasks.md
                                                         ↓
                                                   implementación
```

Los cambios completados se archivan en `openspec/changes/archive/`. Las specs globales
consolidadas por dominio viven en `openspec/specs/{domain}/spec.md`.

### Fases implementadas

| Fase | Cambio | Descripción |
|:---|:---|:---|
| 0 | `fase-0-infraestructura-base` | FastAPI base, AuditMixin, CORS, login skeleton |
| 1 | `fase-1-auth-usuarios-bancos-destinatarios` | JWT auth, usuarios, bancos, destinatarios |
| 2 | `fase-2-ingreso-xml` | Parser XML SRI, validación de facturas electrónicas |
| 3 | `fase-3-kardex` | Kardex FIFO, ingreso selectivo desde XMLs, historial |
| 4 | `fase-4-entregas` | Entregas con consumo FIFO, reversión exacta |
| 5 | `fase-5-pagos` | Pagos con distribución entre entregas, reversión |
| 6 | `fase-6-trazabilidad` | Trazabilidad bidireccional + auditoría paginada |
| 7 | `fase-7-reportes` | Reportes operativos en JSON, PDF y XLSX |

Para explorar, proponer o implementar cambios usar los comandos `/opsx:explore`, `/opsx:propose`,
`/opsx:apply` y `/opsx:archive` dentro de Claude Code.
