# Propuesta: fase-0-infraestructura-base

## 1. El Problema o Necesidad de Negocio

El sistema de control de entregas no tiene código base alguno. Las Fases 1–7 del plan
requieren, sin excepción, una plataforma operativa que incluya: servidor FastAPI levantado,
conexión async a PostgreSQL, sistema de migraciones reversible, infraestructura de auditoría
inmutable y un frontend React que cargue sin errores de TypeScript. Sin esta fase ningún otro
módulo puede construirse ni integrarse. Esta fase NO produce pantallas funcionales para el
usuario final, pero es el prerequisito bloqueante de todo el proyecto.

## 2. Alcance Crítico

### In-Scope (Lo que se va a construir)

**Backend:**
- Estructura completa de carpetas (`app/`, `models/`, `schemas/`, `routers/`, `services/`,
  `dependencies/`, `utils/`, `migrations/`, `tests/`).
- `config.py`: Pydantic Settings (DATABASE_URL, JWT_SECRET_KEY, JWT_ALGORITHM,
  JWT_EXPIRATION_MINUTES, CORS_ORIGINS, ENVIRONMENT).
- `database.py`: async engine con asyncpg driver + async_sessionmaker (`expire_on_commit=False`).
- `models/base.py`: `Base` declarativa y `AuditMixin` (created_at/by, updated_at/by,
  deleted_at/by, is_active, soft_delete()).
- `models/audit_log.py`: Modelo `AuditLog` — tabla inmutable, sin AuditMixin ni soft delete.
- `utils/exceptions.py`: Seis excepciones tipadas de negocio con su código HTTP asociado.
- `utils/validaciones.py`: Algoritmo módulo 11 Ecuador (cédula 10 dígitos, RUC 13 dígitos).
- `utils/fifo.py`: Función pura `calcular_consumo_fifo` — stub tipado, sin lógica de BD.
- `utils/audit.py`: Decorator `@auditar(accion, entidad)` que escribe en `audit_log`.
- `dependencies/auth.py`: Stubs tipados de `get_current_user` y `require_rol` (Fase 1 los implementa).
- `dependencies/db.py`: Dependency `get_db` que provee sesión async por request.
- `main.py`: FastAPI app con CORS, global exception handlers y `GET /` (health check).
- `alembic.ini` + `migrations/env.py` en modo async: primera migración crea `audit_log`.
- `requirements.txt`, `Dockerfile` (Python slim, multi-stage), `tests/conftest.py`.

**Frontend:**
- Estructura feature-driven (`features/`, `components/layout/`, `components/ui/`,
  `components/custom/`, `store/`, `shared/`, `routes/`, `pages/`).
- `api/client.ts`: instancia axios con interceptor de request (inyecta JWT) e interceptor
  de response (redirige a login si 401).
- `store/authStore.ts`: Zustand — token, user, login(), logout(), isAuthenticated().
  Persistencia en localStorage.
- `store/uiStore.ts`: Zustand — sidebar open/close y tema dark/light.
- `components/layout/AppLayout.tsx`: Sidebar + Header + área de contenido. Soporte `dark:`.
- `components/layout/Sidebar.tsx`: Navegación condicional por rol (usa shadcn/ui Sidebar).
- `components/layout/ProtectedRoute.tsx`: Guard por autenticación y por rol; redirige a `/login`.
- `pages/Login.tsx`: Pantalla de login usando shadcn/ui Card + Form. Sin lógica de auth real
  (eso es Fase 1). El formulario existe pero el submit no llama a la API todavía.
- `routes/index.tsx`: React Router v7 con lazy loading y ProtectedRoute.
- `shared/types/api.types.ts`: Tipos genéricos de respuesta API (PaginatedResponse, ApiError).
- `shared/utils/formatters.ts`: Formateo de fechas y monedas (Intl.NumberFormat, date-fns).
- `tailwind.config.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`.
- Componentes shadcn/ui inicializados: `button`, `input`, `label`, `card`, `form`,
  `separator`, `sheet`, `sidebar`, `sonner`, `badge`, `dropdown-menu`, `avatar`, `tooltip`,
  `scroll-area`.

### Out-of-Scope (Prohibiciones Estrictas)
- **Backend:** Toda persistencia DEBE ser PostgreSQL vía SQLAlchemy async. Sin queries raw salvo justificación explícita.
- **Backend:** Las transacciones multi-tabla DEBEN usar `async with session.begin()` con rollback total.
- **Backend:** Los modelos DEBEN heredar de `AuditMixin` para soft delete y campos de auditoría.
- **Frontend:** Prohibido hardcodear colores; todo estilo DEBE usar tokens de Tailwind con soporte `dark:`.
- **Seguridad:** Prohibido almacenar credenciales en el código; DEBEN gestionarse vía `.env` / GCP Secret Manager.
- **Calidad:** Prohibido introducir refactorizaciones paralelas ajenas al dominio de este cambio (YAGNI).
- **Funcionalidad de dominio:** La lógica JWT real (login, validación de token), tablas de usuarios,
  bancos, destinatarios y cualquier CRUD de negocio pertenecen a Fases 1 en adelante.
- **Supabase Auth / RLS / Realtime:** Solo se usa PostgreSQL puro como base de datos hosteada.

## 3. Evaluación de Impacto

### Modelo de Datos (PostgreSQL)

**Tabla nueva: `audit_log`**
- Creada en la primera migración Alembic (v001).
- Inmutable por diseño: sin soft delete, sin is_active, sin updated_at.
- `usuario_id` es nullable en esta fase para evitar dependencia circular con `usuarios`
  (que no existe aún). La FK no-nullable se agrega en la migración de Fase 1.
- Sin índices de unicidad; solo `btree` sobre `(entidad, entidad_id)` y `(usuario_id)`.

**Clase no persistente: `AuditMixin`**
- Mixin Python puro; no genera tabla propia.
- Cada modelo de dominio (Fases 1–5) hereda sus columnas: `created_at`, `created_by`,
  `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `is_active`.

**Migración:**
- `v001_create_audit_log.py`: `upgrade()` crea la tabla; `downgrade()` la elimina limpiamente.

### Lógica de Negocio y API

- Un único endpoint activo: `GET /` → health check `{"status": "ok", "version": "0.1.0"}`.
- Seis exception handlers globales traducen excepciones tipadas a respuestas HTTP.
- El decorator `@auditar` queda disponible pero sin uso activo hasta Fase 1.
- La función `calcular_consumo_fifo` queda tipada y documentada; se activa en Fase 4.

### Flujo del Usuario (UI)

- El usuario ve `/login` con un formulario visual (Card de shadcn/ui) pero no puede
  autenticarse todavía.
- Todas las rutas protegidas redirigen a `/login` vía `ProtectedRoute`.
- No se muestran datos de negocio; el sidebar aparece vacío o con ítems desactivados.

### Cadena de Trazabilidad

No se altera la cadena de trazabilidad XML → Kardex → Entrega → Pago. Esta fase no crea
entidades de dominio. `audit_log` es el sustrato sobre el que se construirá la trazabilidad.

## 4. Riesgos y Rollback

### Riesgo Principal

Configuración incorrecta de Alembic en modo async (`run_async_migrations` en `env.py`).
Si el engine async no está correctamente aislado del loop de eventos, todas las migraciones
futuras fallarán. Riesgo secundario: FK prematura de `audit_log.usuario_id` a `usuarios.id`
creada antes de que exista esa tabla, bloqueando `alembic upgrade head`.

### Criterio de Aborto

Abortar si:
(a) `alembic upgrade head` falla después de 2 intentos de corrección, O
(b) `alembic downgrade base` falla (migración no reversible), O
(c) `tsc --noEmit` reporta errores que no se resuelven en la misma sesión de trabajo, O
(d) `uvicorn app.main:app` no levanta en modo desarrollo.

### Plan de Rollback

- `alembic downgrade base` elimina `audit_log` limpiamente. No hay ENUMs en esta migración.
- No hay datos de usuario en Fase 0; el rollback no requiere script de limpieza de datos.
- El frontend no tiene estado persistido más allá de localStorage; se limpia con
  `localStorage.clear()` si fuera necesario.
