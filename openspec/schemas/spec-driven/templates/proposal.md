# Propuesta: {{change-name}}

## 1. El Problema o Necesidad de Negocio
<!-- SRP: Esta sección responde ÚNICAMENTE "¿por qué?". -->
<!-- Describe qué está fallando hoy o qué capacidad nueva se necesita, y por qué -->
<!-- es prioritario para el usuario final. Sé directo; evita justificaciones vagas. -->

## 2. Alcance Crítico
<!-- YAGNI: Solo incluir lo estrictamente necesario para resolver el problema descrito. -->
<!-- Prohibido agregar "mejoras de paso" ajenas al dominio de este cambio. -->

### In-Scope (Lo que se va a construir)
<!-- Describe los flujos de usuario en el Frontend y los dominios afectados en el Backend. -->
<!-- Menciona los nuevos contratos de datos (Pydantic/Zod) que se establecerán. -->

### Out-of-Scope (Prohibiciones Estrictas)
- **Backend:** Toda persistencia DEBE ser PostgreSQL vía SQLAlchemy async. Sin queries raw salvo justificación explícita.
- **Backend:** Las transacciones multi-tabla DEBEN usar `async with session.begin()` con rollback total.
- **Backend:** Los modelos DEBEN heredar de `AuditMixin` para soft delete y campos de auditoría.
- **Frontend:** Prohibido hardcodear colores; todo estilo DEBE usar tokens de Tailwind con soporte `dark:`.
- **Seguridad:** Prohibido almacenar credenciales en el código; DEBEN gestionarse vía `.env` / GCP Secret Manager.
- **Calidad:** Prohibido introducir refactorizaciones paralelas ajenas al dominio de este cambio (YAGNI).
<!-- Añade aquí cualquier restricción adicional específica de este cambio. -->

## 3. Evaluación de Impacto
<!-- DIP: Describir el impacto en capas de más bajo nivel a más alto nivel. -->
<!-- Primero datos, luego lógica de negocio, luego UI. Nunca al revés. -->

### Modelo de Datos (PostgreSQL)
<!-- ¿Qué tablas se crean, modifican o eliminan? -->
<!-- ¿Qué columnas nuevas se agregan? ¿Se necesita migración Alembic? -->
<!-- ¿Se afectan índices, constraints o foreign keys existentes? -->
<!-- ¿Se impactan las invariantes del Kardex FIFO o la cadena de trazabilidad? -->

### Lógica de Negocio y API
<!-- ¿Qué endpoints de FastAPI se añaden o modifican? -->
<!-- ¿Qué servicios se ven afectados? -->
<!-- ¿Se modifica la lógica FIFO, el flujo de soft delete, o la distribución de pagos? -->

### Flujo del Usuario (UI)
<!-- ¿Qué cambia en la experiencia visual o interacción en el Frontend? -->
<!-- ¿Hay rutas nuevas (públicas o protegidas)? -->
<!-- ¿Qué roles (admin, operador, lectura) se ven afectados? -->

### Cadena de Trazabilidad
<!-- ¿Este cambio afecta la trazabilidad XML ↔ Entrega ↔ Pago? -->
<!-- Si no aplica, indicar explícitamente: "No se altera la cadena de trazabilidad." -->

## 4. Riesgos y Rollback
<!-- KISS: Un riesgo principal, un criterio de aborto claro. Sin sobrecomplicar. -->

### Riesgo Principal
<!-- Describe el riesgo técnico más probable. -->
<!-- Considerar: integridad FIFO, consistencia de saldos, reversión de soft delete, -->
<!-- compatibilidad de migraciones Alembic. -->

### Criterio de Aborto
<!-- Define una condición técnica verificable y objetiva para revertir los cambios. -->
<!-- Ejemplo: "Si las pruebas de integración de los endpoints fallan después de 2 intentos -->
<!-- de corrección, o si la migración Alembic no es reversible (downgrade falla)." -->

### Plan de Rollback
<!-- ¿La migración Alembic tiene downgrade funcional? -->
<!-- ¿Se necesita script de limpieza de datos? -->
