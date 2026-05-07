# Tareas: fase-0-infraestructura-base

## Fase 0: Contratos y Sincronización Inicial

- [x] **0.1** Backend — Crear `backend/app/schemas/common.py`:
  definir `HealthCheckResponse`, `ApiErrorResponse` y `PaginatedResponse[T]` con
  `Field(description=...)` en cada campo. Usar `Generic[T]` para `PaginatedResponse`.
  Sin tipos `float` — solo `Decimal` para valores monetarios futuros.

- [x] **0.2** Frontend — Crear `frontend/src/shared/types/api.types.ts`:
  definir `healthCheckSchema`, `apiErrorSchema` y `paginatedResponseSchema` con Zod.
  Derivar todos los tipos con `z.infer<>`. Prohibido tipos de interfaz manuales que dupliquen el schema Zod.

- [x] **0.3** Global — Crear `backend/.env.example` con las variables:
  `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRATION_MINUTES`,
  `CORS_ORIGINS`, `ENVIRONMENT`.
  Crear `frontend/.env.example` con `VITE_API_URL`.
  Verificar que ningún archivo `.env` real se rastrea en git (`.gitignore`).

## Fase 1: Modelo de Datos y Migraciones

- [x] **1.1** Crear `backend/app/models/base.py`:
  definir `Base` (DeclarativeBase de SQLAlchemy 2.x) y `AuditMixin` con los campos
  exactos del diseño: `created_at`, `created_by`, `updated_at`, `updated_by`,
  `deleted_at`, `deleted_by`, `is_active`, `soft_delete(usuario_id)`.
  Las FKs a `usuarios.id` DEBEN usar `use_alter=True` (FK diferida) para evitar
  dependencia circular con la tabla `usuarios` que aún no existe.

- [x] **1.2** Crear `backend/app/models/audit_log.py`:
  definir `AuditLog(Base)` SIN heredar `AuditMixin`. Columnas exactas del diseño.
  `usuario_id` nullable. `payload_antes` y `payload_despues` de tipo `JSONB`.

- [x] **1.3** Crear `backend/app/models/__init__.py`:
  importar `AuditLog` y `Base` para que Alembic los detecte con `autogenerate`.

- [x] **1.4** Configurar `backend/alembic.ini` y `backend/migrations/env.py` en modo async:
  - `env.py` DEBE usar `asyncio.run(run_async_migrations())`.
  - `target_metadata` DEBE apuntar a `Base.metadata`.
  - `DATABASE_URL` se lee de `settings.DATABASE_URL` (Pydantic Settings).
  - Verificar que `script.py.mako` esté presente con el template de revisión.

- [x] **1.5** Generar primera migración:
  Migración escrita manualmente en `migrations/versions/v001_create_audit_log.py`.
  `upgrade()` crea `audit_log` con sus índices; `downgrade()` hace `DROP TABLE audit_log CASCADE`.
  `alembic history` confirma: `<base> -> v001 (head), create_audit_log`.

- [ ] **1.6** Ejecutar `alembic upgrade head` en desarrollo.
  ⚠️ Pendiente: requiere conexión de red a Supabase (no disponible en devcontainer).
  Verificar con `\d audit_log` en psql que la tabla y los índices existen correctamente.

- [ ] **1.7** Ejecutar downgrade de prueba: `alembic downgrade -1`.
  ⚠️ Pendiente: requiere conexión de red a Supabase (no disponible en devcontainer).
  Verificar que la tabla desaparece. Re-aplicar: `alembic upgrade head`.

## Fase 2: Lógica de Negocio y API (Backend)

- [x] **2.1** Crear `backend/app/config.py`:
  `class Settings(BaseSettings)` con las variables del `.env.example`.
  `model_config = SettingsConfigDict(env_file=".env")`.
  Instancia singleton `settings = Settings()` al final del archivo.

- [x] **2.2** Crear `backend/app/database.py`:
  - `engine = create_async_engine(settings.DATABASE_URL, echo=settings.ENVIRONMENT == "development")`
  - `AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)`

- [x] **2.3** Crear `backend/app/dependencies/db.py`:
  Dependency `get_db` que provee `AsyncSession` por request con `async with AsyncSessionLocal() as session: yield session`.

- [x] **2.4** Crear `backend/app/dependencies/auth.py`:
  Stubs tipados con firmas correctas:
  - `async def get_current_user(...)` → lanza `NotImplementedError` con mensaje "Implementar en Fase 1".
  - `def require_rol(roles: list[str])` → retorna Dependency que lanza `NotImplementedError`.
  Las firmas DEBEN ser las definitivas para que Fase 1 solo reemplace el cuerpo.

- [x] **2.5** Crear `backend/app/utils/exceptions.py`:
  Definir las seis clases: `EntidadNoEncontrada`, `ConflictoUnicidad`, `ValidacionNegocio`,
  `SaldoInsuficiente`, `EliminacionBloqueada`, `PermisoInsuficiente`.
  Cada una hereda de `Exception` y acepta `message: str` en `__init__`.

- [x] **2.6** Crear `backend/app/utils/validaciones.py`:
  Implementar `validar_identificacion(valor: str) -> dict`.
  Algoritmo módulo 10 Ecuador: 10 dígitos → cédula, 13 dígitos → RUC.
  Lanza `ValidacionNegocio` si el dígito verificador es incorrecto o la longitud no coincide.
  Retorna `{"tipo": "cedula"|"ruc", "identificacion": valor}`.

- [x] **2.7** Crear `backend/app/utils/fifo.py`:
  Definir los dataclasses `LoteFIFO(fecha, cantidad, costo_unitario, movimiento_id)` y
  `ConsumoLote(movimiento_id, cantidad, costo_unitario)`.
  Implementar `calcular_consumo_fifo(lotes: list[LoteFIFO], cantidad_requerida: Decimal) -> list[ConsumoLote]`.
  La función DEBE ser pura (sin acceso a BD). Lanza `SaldoInsuficiente` si no hay stock suficiente.

- [x] **2.8** Crear `backend/app/utils/audit.py`:
  Implementar `@auditar(accion: str, entidad: str)` como decorator asíncrono.
  El decorator recibe la sesión de la función decorada y escribe un `AuditLog` al final.
  Captura `entidad_id`, `payload_antes` y `payload_despues` de los kwargs del servicio.

- [x] **2.9** Crear `backend/app/main.py`:
  - Instanciar `FastAPI(title="Control de Entregas", version="0.1.0")`.
  - Configurar `CORSMiddleware` con `settings.CORS_ORIGINS`.
  - Registrar un exception handler por cada excepción de `utils/exceptions.py`:
    `EntidadNoEncontrada` → 404, `ConflictoUnicidad` → 409, `ValidacionNegocio` → 400,
    `SaldoInsuficiente` → 400, `EliminacionBloqueada` → 409, `PermisoInsuficiente` → 403.
  - Definir `GET /` que retorna `HealthCheckResponse(status="ok", version="0.1.0")`.

- [x] **2.10** Crear `backend/requirements.txt` con las dependencias exactas del diseño.

- [x] **2.11** Crear `backend/Dockerfile` (Python slim, multi-stage):
  Stage 1: instalar dependencias. Stage 2: copiar código y ejecutar con uvicorn.
  Exponer puerto 8000. Sin credenciales hardcodeadas.

- [x] **2.12** Crear `backend/tests/conftest.py`:
  Fixture `test_client` que provee `AsyncClient(app=app)` con base de datos de prueba in-memory
  o con `DATABASE_URL` de prueba desde variables de entorno.

## Fase 3: Integración de Datos (Frontend — Hooks)

No hay Custom Hooks de dominio en Fase 0. Esta fase crea la infraestructura de hooks.

- [x] **3.1** Crear `frontend/src/api/client.ts`:
  - Instancia `axios.create({ baseURL: import.meta.env.VITE_API_URL })`.
  - Interceptor de request: lee `authStore.getState().token` e inyecta
    `Authorization: Bearer <token>` si existe.
  - Interceptor de response: captura error con `status === 401`, llama
    `authStore.getState().logout()` y redirige a `/login`.

- [x] **3.2** Crear `frontend/src/store/authStore.ts`:
  Zustand store con la interface definida en el diseño.
  Persistir `token` en `localStorage` con `persist` middleware de Zustand.
  `logout()` limpia `localStorage` y resetea el state.

- [x] **3.3** Crear `frontend/src/store/uiStore.ts`:
  Zustand store con `sidebarOpen: boolean`, `toggleSidebar()`,
  `theme: "light" | "dark"`, `setTheme(t)`.
  NO persistir en localStorage (estado volátil de sesión).

- [x] **3.4** Crear `frontend/src/shared/utils/formatters.ts`:
  - `formatCurrency(amount: number, decimals = 2): string` — usa `Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })`.
  - `formatDate(date: string | Date, format?: string): string` — usa `date-fns` con locale `es`.

## Fase 4: Componentes y Páginas (Frontend — UI)

- [x] **4.1** Inicializar shadcn/ui en el proyecto frontend:
  `npx shadcn@latest init` con Tailwind CSS v4, paleta neutral, soporte dark mode via class.
  Instalar los componentes del diseño:
  `npx shadcn@latest add button input label card form separator sheet sidebar sonner badge dropdown-menu avatar tooltip scroll-area`.

- [x] **4.2** Crear `frontend/src/components/layout/ProtectedRoute.tsx`:
  Lee `authStore.isAuthenticated()`. Si no autenticado → `<Navigate to="/login" replace />`.
  Acepta prop `roles?: string[]`; si el rol del usuario no está en la lista → renderiza
  mensaje "Acceso denegado" con `Badge` de shadcn/ui (no redirige, muestra feedback).

- [x] **4.3** Crear `frontend/src/components/layout/Sidebar.tsx`:
  Usa `Sidebar`, `SidebarContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`
  de shadcn/ui. Recibe `rol: string` por prop.
  Muestra ítems de navegación filtrados por rol (la lista completa se define aquí
  aunque las rutas solo existan en fases siguientes; los ítems sin ruta aparecen desactivados).
  Ítem activo detectado con `useLocation()` de React Router.

- [x] **4.4** Crear `frontend/src/components/layout/AppLayout.tsx`:
  Envuelve `SidebarProvider` (shadcn/ui). Incluye `Sidebar` y un área principal con `<Outlet />`.
  Header: logo del sistema + `Avatar` con nombre del usuario + `DropdownMenu` (logout).
  Soporte dark mode: clase `dark` controlada por `uiStore.theme`.

- [x] **4.5** Crear `frontend/src/pages/Login.tsx` (Dumb Page):
  Renderiza un `Card` centrado en pantalla con:
  - `CardHeader`: título "Iniciar Sesión", descripción "Ingresa tus credenciales".
  - `CardContent`: `Form` (shadcn/ui + react-hook-form) con campos `email` y `password`.
    Schema Zod local: `email` con `z.string().email()`, `password` con `z.string().min(1)`.
  - `CardFooter`: `Button type="submit"` con texto "Iniciar sesión".
  El `onSubmit` en Fase 0 hace `console.log(values)`. En Fase 1 se reemplaza por `useLogin()`.

- [x] **4.6** Crear `frontend/src/pages/Dashboard.tsx` (Dumb Page, placeholder):
  Solo renderiza `<h1>Dashboard</h1>`. Se llena en Fase 1.

- [x] **4.7** Crear `frontend/src/routes/index.tsx`:
  Definir el árbol de rutas con React Router v7:
  - `/login` → `<Login />` (pública). Si ya autenticado → redirige a `/dashboard`.
  - `/<todo lo demás>` → `<AppLayout />` como layout principal con `<ProtectedRoute />`.
    - `/dashboard` → lazy import de `Dashboard`.
    - `*` → redirige a `/dashboard`.
  Usar `React.lazy()` + `<Suspense>` para code splitting.

- [x] **4.8** Crear `frontend/src/App.tsx`:
  Solo renderiza `<RouterProvider router={router} />` + `<Toaster />` (Sonner).

- [x] **4.9** Crear `frontend/src/main.tsx`:
  `ReactDOM.createRoot(document.getElementById("root")!).render(<App />)`.
  Envolver en `<QueryClientProvider>` con `new QueryClient()`.

- [x] **4.10** Configurar `frontend/tailwind.config.ts` y `frontend/vite.config.ts`:
  - Tailwind v3 con soporte `darkMode: "class"`.
  - Vite con alias `@` → `./src`.
  - `tsconfig.json` en strict mode con path alias `@/*`.

- [x] **4.11** Crear `frontend/package.json` con las dependencias exactas del diseño.

## Fase 5: Seguridad y DevSecOps

- [x] **5.1** Backend — `ruff check backend/app/` — corregir todos los errores antes de continuar.
  ✅ `All checks passed!`

- [x] **5.2** Backend — `mypy backend/app/` con `strict = true` en `mypy.ini`.
  ✅ `Success: no issues found in 19 source files`

- [x] **5.3** Backend — `bandit -r backend/app/` — documentar o corregir toda alerta MEDIUM o superior.
  ✅ `No issues identified.`

- [x] **5.4** Frontend — `eslint frontend/src/` — corregir todos los errores.
  Verificar que `tsc --noEmit` termina con código 0.
  ✅ `tsc --noEmit` → código 0 (sin errores). `eslint src/` → 0 errores (1 warning esperado en routes/index.tsx por exportar `router` junto a componentes — comportamiento normal para router config files). Creado `eslint.config.js` (flat config ESLint v9) ignorando `src/components/ui/**` (código generado por shadcn). Corregido `use-mobile.tsx`: estado inicializado con lazy initializer en lugar de `setState` síncrono dentro del efecto.

- [x] **5.5** Global — Verificar que `backend/.env` y `frontend/.env` están en `.gitignore`.
  ✅ Ambos archivos incluidos en sus respectivos `.gitignore`.

- [x] **5.6** Dependencias — Ejecutar `snyk test` (o `trivy fs .`) sobre las dependencias instaladas.
  Herramienta usada: `npm audit` (frontend) + `pip-audit` (backend) como alternativas integradas.
  **Backend** (`pip-audit -r requirements.txt`): ✅ `No known vulnerabilities found`.
  **Frontend** (`npm audit`): ⚠️ 4 vulnerabilidades MODERATE en dependencias de desarrollo únicamente:
  - `esbuild ≤0.24.2` → `vite ≤6.4.1` → `vitest ≤2.x` (GHSA-67mh-4wv8-2f99: dev server puede recibir requests de origen externo).
  - Impacto: SOLO entorno de desarrollo local; no afecta el build de producción ni el runtime.
  - Fix disponible vía `npm audit fix --force` pero requiere upgrade a Vite 8 (breaking change).
  - Decisión: diferido a cuando se evalúe upgrade de Vite; riesgo aceptable en dev.

- [ ] **5.7** UI — Verificar contraste WCAG AA en la página de Login con modo dark activo.
  ⚠️ Pendiente: requiere ejecución del frontend en navegador.

## Fase 6: Pruebas y Validación Final

- [x] **6.1** Backend — Crear `backend/tests/test_health.py`:
  ✅ `pytest tests/test_health.py -v` → 2 passed.

- [x] **6.2** Backend — Crear `backend/tests/test_validaciones.py`:
  ✅ `pytest tests/test_validaciones.py -v` → 5 passed.
  Nota: cédula de prueba `1712345678` era inválida; reemplazada por `1713175071`.

- [x] **6.3** Backend — Crear `backend/tests/test_fifo.py`:
  ✅ `pytest tests/test_fifo.py -v` → 3 passed.

- [ ] **6.4** Backend — Verificar migración reversible:
  ⚠️ Pendiente: requiere conexión de red a Supabase (no disponible en devcontainer).

- [x] **6.5** Frontend — Crear `frontend/src/components/layout/ProtectedRoute.test.tsx`:
  ✅ `vitest run` → 2 passed.

- [x] **6.6** Frontend — Crear `frontend/src/pages/Login.test.tsx`:
  ✅ `vitest run` → 3 passed.

- [ ] **6.7** Integración manual — Verificar:
  ⚠️ Pendiente: requiere entorno con puertos disponibles y red.
