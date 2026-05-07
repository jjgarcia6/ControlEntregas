# Tareas: {{change-name}}
<!-- Orden de fases obligatorio: Contratos → Migraciones → Backend → Frontend → Seguridad → Pruebas. -->
<!-- SRP: No avanzar a la siguiente fase si hay ítems sin completar en la anterior. -->
<!-- Clean Code: Cada tarea nombra el archivo o módulo exacto a crear o modificar. -->

## Fase 0: Contratos y Sincronización Inicial
<!-- DRY: Esta fase es la fuente de verdad compartida. Backend y Frontend dependen de ella. -->
<!-- DIP: Definir abstracciones antes de implementar. -->

- [ ] **0.1** Backend — Crear/actualizar schemas Pydantic en `backend/app/schemas/{{modulo}}.py`:
  definir `{{NombreRequest}}` y `{{NombreResponse}}` con `Field(description=...)` para cada campo.
  Usar `Decimal` para valores monetarios y cantidades. Nunca `float`.
- [ ] **0.2** Frontend — Crear/actualizar schemas Zod en `frontend/src/features/{{feature}}/types/{{nombre}}.types.ts`:
  espejar exactamente los schemas de 0.1; derivar tipos con `z.infer<>` (prohibido tipos manuales redundantes).
- [ ] **0.3** Global — Actualizar `backend/.env.example` y `frontend/.env.example`
  con las nuevas variables requeridas (si las hay).

## Fase 1: Modelo de Datos y Migraciones
<!-- Esta fase NO existía en el template original. Es obligatoria para PostgreSQL + Alembic. -->
<!-- SRP: Primero el modelo, luego la migración. No combinar con lógica de negocio. -->

- [ ] **1.1** Crear/actualizar modelo SQLAlchemy en `backend/app/models/{{modulo}}.py`:
  heredar de `AuditMixin`; definir columnas, tipos, foreign keys y relaciones.
  Usar `NUMERIC(precision, scale)` para valores monetarios. Nunca `Float`.
- [ ] **1.2** Generar migración Alembic: `alembic revision --autogenerate -m "{{descripcion_breve}}"`.
  Verificar que el archivo generado tiene `upgrade()` y `downgrade()` correctos.
- [ ] **1.3** Ejecutar migración en entorno de desarrollo: `alembic upgrade head`.
  Verificar que las tablas/columnas se crearon correctamente.
- [ ] **1.4** Ejecutar downgrade de prueba: `alembic downgrade -1`.
  Verificar que la reversión funciona sin errores. Luego re-aplicar: `alembic upgrade head`.

## Fase 2: Lógica de Negocio y API (Backend)
<!-- OCP: Implementar como extensión; no modificar servicios existentes salvo que sea estrictamente necesario. -->
<!-- SRP: Un servicio = una responsabilidad de negocio. -->

- [ ] **2.1** Crear/modificar el servicio en `backend/app/services/{{nombre}}_service.py`:
  implementar la lógica de negocio con manejo de excepciones tipado (sin capturar `Exception` genérico).
  Usar `async with session.begin()` para operaciones multi-tabla.
  Aplicar decorator `@auditar(accion, entidad)` para registrar en `audit_log`.
- [ ] **2.2** Crear/modificar el router en `backend/app/routers/{{nombre}}_router.py`:
  integrar el servicio de 2.1; cada endpoint usa los schemas de Fase 0.
  Aplicar `require_rol(["{{roles_permitidos}}"])` en cada endpoint.
- [ ] **2.3** Registrar el nuevo router en `backend/app/main.py` con el prefijo `/{{api-prefix}}`.

## Fase 3: Integración de Datos (Frontend — Hooks)
<!-- DIP: Los hooks dependen del contrato de API, no de detalles de implementación del Backend. -->
<!-- SRP: Un hook = un caso de uso. Prohibido hooks que mezclen fetch, estado global y UI. -->

- [ ] **3.1** Crear el hook `use{{NombreHook}}` en `frontend/src/features/{{feature}}/hooks/use{{NombreHook}}.ts`:
  encapsular la llamada al endpoint `{{VERBO /ruta}}` con React Query (TanStack Query).
  Definir query key descriptiva: `["{{recurso}}", {{params}}]`.
- [ ] **3.2** Validar en el hook que la respuesta del Backend coincide con el schema Zod de Fase 0
  antes de actualizar el estado. Lanzar error descriptivo si no coincide.

## Fase 4: Componentes y Páginas (Frontend — UI)
<!-- ISP: Componentes de dominio en `features/`; componentes visuales reutilizables en `@/components/custom/`. -->
<!-- Clean Code: Cada componente hace UNA cosa. Máximo 100 líneas por componente. -->

- [ ] **4.1** Crear el componente contenedor `{{NombreContenedor}}.tsx` en `features/{{feature}}/components/`:
  consume el hook de Fase 3; orquesta los sub-componentes; sin lógica de presentación directa.
- [ ] **4.2** Crear el/los componente(s) presentacional(es) `{{NombrePresentacional}}.tsx` en `features/{{feature}}/components/`:
  reciben solo `props`; sin `useState` propio ni llamadas a la API.
- [ ] **4.3** Actualizar el contrato público `frontend/src/features/{{feature}}/index.ts`
  con las exportaciones explícitas de los nuevos componentes, hooks y tipos.
- [ ] **4.4** Crear/actualizar la página `{{NombrePagina}}.tsx` en `frontend/src/pages/`:
  importar y renderizar `{{NombreContenedor}}`; sin lógica de estado ni fetch directos (Dumb Page).
- [ ] **4.5** Registrar la nueva ruta en `frontend/src/routes/index.tsx`:
  - Definir si es protegida (con `ProtectedRoute` y roles: `{{admin|operador|lectura}}`).
  - Aplicar `lazy(() => import(...))` para code splitting.

## Fase 5: Seguridad y DevSecOps
<!-- No negociable. Esta fase no puede eliminarse ni reordenarse. -->

- [ ] **5.1** Backend — Ejecutar análisis estático en los módulos modificados:
  `ruff check backend/app/{{modulo}}/` y `mypy backend/app/{{modulo}}/`. Corregir todos los errores.
- [ ] **5.2** Backend — Ejecutar escaneo de vulnerabilidades:
  `bandit -r backend/app/{{modulo}}/`. Corregir o documentar toda alerta de severidad MEDIUM o superior.
- [ ] **5.3** Frontend — Ejecutar linter: `eslint frontend/src/features/{{feature}}/`. Corregir todos los errores.
- [ ] **5.4** Global — Verificar que no hay secretos en código (credenciales, tokens, connection strings).
- [ ] **5.5** Dependencias — Ejecutar `snyk test` o `trivy fs .` si se añadieron nuevas dependencias en Fase 0.
- [ ] **5.6** UI — Validar contraste de color (WCAG AA mínimo) en los nuevos componentes con modo `dark:`.

## Fase 6: Pruebas y Validación Final
<!-- SRP: Cada prueba valida un único comportamiento. Nombrar pruebas como "should [hacer algo] when [condición]". -->
<!-- DRY: Extraer datos de prueba repetidos a fixtures o factories compartidas. -->

- [ ] **6.1** Backend — Escribir/actualizar pruebas en `backend/tests/test_{{nombre}}.py`:
  - Prueba del contrato JSON para cada endpoint (éxito y error).
  - Prueba de validación Pydantic para inputs inválidos (debe retornar 422).
  - Prueba de invariantes de negocio (saldo no negativo, FIFO correcto, soft delete con reversión).
  - Ejecutar con `pytest backend/tests/test_{{nombre}}.py -v`.
- [ ] **6.2** Frontend — Escribir/actualizar pruebas en `frontend/src/features/{{feature}}/components/{{NombreContenedor}}.test.tsx`:
  - Prueba de comportamiento del flujo principal (éxito).
  - Prueba de feedback de error al usuario.
  - Prueba de accesibilidad básica (roles ARIA, navegación por teclado).
  - Ejecutar con `vitest run`.
- [ ] **6.3** Integración — Verificar manualmente:
  - No hay operaciones síncronas bloqueantes.
  - No hay errores en la consola del navegador ni warnings de React.
  - La migración Alembic es reversible (`downgrade` + `upgrade` sin pérdida de datos).
  - La cadena de trazabilidad se mantiene íntegra después del cambio.
