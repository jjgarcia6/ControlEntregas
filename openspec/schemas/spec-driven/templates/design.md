# Diseño Técnico: {{change-name}}
<!-- DIP: Las capas se diseñan de abajo hacia arriba: Datos → API → UI. -->
<!-- Completar cada sección en orden. No pasar a la siguiente sin terminar la anterior. -->

## 1. Capa de Datos (PostgreSQL + SQLAlchemy)
<!-- Esta sección DEBE completarse primero. Las capas superiores dependen de ella (DIP). -->

### Tablas e Índices
<!-- Nombrar tablas en plural, en snake_case (ej: `kardex_movimientos`). -->
<!-- Definir índices para todos los campos usados en filtros, joins o constraints de unicidad. -->
<!-- Incluir foreign keys con ON DELETE explícito. -->

| Tabla | Índice / Constraint | Tipo | Justificación |
| :--- | :--- | :--- | :--- |
| `{{table_name}}` | `{{column(s)}}` | `{{unique / btree / compound / fk}}` | {{Por qué este índice es necesario}} |

### Modelo SQLAlchemy
<!-- KISS: Solo incluir los campos necesarios para este cambio. Sin campos "por si acaso" (YAGNI). -->
<!-- Todos los modelos DEBEN heredar de AuditMixin para campos de auditoría y soft delete. -->
<!-- Usar NUMERIC(precision, scale) para valores monetarios y cantidades. Nunca FLOAT. -->
```python
# Modelo SQLAlchemy — Tabla: {{table_name}}
# Hereda de: AuditMixin (created_at, created_by, updated_at, updated_by,
#             deleted_at, deleted_by, is_active)

class {{ModelName}}(AuditMixin, Base):
    __tablename__ = "{{table_name}}"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # {{field_name}}: Mapped[{{python_type}}] = mapped_column({{SQLAlchemy_type}})
```

### Migración Alembic
<!-- Toda migración DEBE ser reversible (upgrade + downgrade). -->
<!-- Describir brevemente qué hace el upgrade y qué hace el downgrade. -->
```
# Archivo: migrations/versions/{{revision_id}}_{{descripcion_breve}}.py
# upgrade(): {{descripción de cambios — CREATE TABLE, ADD COLUMN, etc.}}
# downgrade(): {{descripción de reversión — DROP TABLE, DROP COLUMN, etc.}}
```

### Impacto en Invariantes del Sistema
<!-- Verificar explícitamente que el cambio no viola ninguna invariante. -->
<!-- Si no aplica, indicar "No se alteran invariantes." -->
- **Kardex FIFO:** {{¿Se afecta el saldo, los lotes o el algoritmo FIFO? ¿Cómo?}}
- **Cadena de trazabilidad:** {{¿Se altera el grafo XML → Kardex → Entrega → Pago?}}
- **Soft delete:** {{¿Se necesita reversión de efectos al eliminar? ¿Cuál?}}
- **Saldos:** {{¿Se afecta saldo_pendiente de entregas o saldo_cantidad/saldo_valor de productos?}}

---

## 2. Capa de API y Contratos (Fuente de Verdad)
<!-- SRP: Esta sección define ÚNICAMENTE el contrato de datos. Sin lógica de UI aquí. -->

### Diccionario de Datos Vivo
<!-- Este cuadro es el contrato único que sincroniza Backend y Frontend. -->
<!-- DRY: Todo campo definido aquí NO se redefine en ningún otro lugar del proyecto. -->
<!-- Cada campo DEBE tener 'description'; es obligatorio en Pydantic y en los tipos de TS. -->

| Entidad | Campo | Tipo (Py / TS) | Descripción (Uso y Propósito) | Restricciones |
| :--- | :--- | :--- | :--- | :--- |
| `{{Entidad}}` | `{{campo}}` | `Decimal / number` | {{Explicación clara para el diccionario}} | {{Min/Max, Unique, Nullable, etc.}} |

### Backend: Esquemas Pydantic v2
<!-- OCP: Los schemas DEBEN diseñarse para ser extendidos sin modificar el schema base. -->
<!-- Separar schemas de entrada (Request) y salida (Response). Nunca usar el mismo para ambos. -->
<!-- Usar Decimal para valores monetarios. Nunca float. -->
```python
# {{NombreEntidad}}Request — Schema de entrada (validación de escritura)
# {{NombreEntidad}}Response — Schema de salida (contrato de lectura)
# Nota: Cada Field DEBE incluir description=... para el Diccionario Vivo.

from decimal import Decimal
from pydantic import BaseModel, Field

class {{NombreEntidad}}Request(BaseModel):
    model_config = ConfigDict(strict=True)
    # {{campo}}: {{tipo}} = Field(..., description="{{desc}}", ge={{min}}, le={{max}})

class {{NombreEntidad}}Response(BaseModel):
    # {{campo}}: {{tipo}} = Field(..., description="{{desc}}")
```

### Frontend: Esquemas Zod + TypeScript
<!-- ISP: Definir tipos granulares. Prohibido crear un único tipo "God Object". -->
<!-- DRY: Derivar los tipos TS de los schemas Zod con z.infer<>. Sin duplicar tipos. -->
```typescript
// {{nombreEntidad}}Schema — Espejo exacto del schema Pydantic correspondiente.
// {{NombreEntidad}}Type — Derivado con z.infer<typeof {{nombreEntidad}}Schema>.
// Regla: NO definir interfaces de TS manualmente si ya existe un schema Zod.

import { z } from "zod";

export const {{nombreEntidad}}Schema = z.object({
  // {{campo}}: z.{{tipo}}().describe("{{desc}}"),
});

export type {{NombreEntidad}}Type = z.infer<typeof {{nombreEntidad}}Schema>;
```

### Endpoints de FastAPI
<!-- Clean Code: Rutas en inglés, en kebab-case, con sustantivos en plural. -->
<!-- Referencia: estructura de endpoints definida en PROYECTO_ESPECIFICACION.md §7 -->

| Verbo | Ruta | Request Schema | Response Schema | Códigos HTTP | Roles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `{{GET/POST/PATCH/DELETE}}` | `/{{recurso}}` | `{{NombreRequest}}` | `{{NombreResponse}}` | `{{200/201/400/401/403/404/409/422}}` | `{{admin,operador,lectura}}` |

### Servicio de Negocio
<!-- SRP: Un servicio = una responsabilidad de negocio. -->
<!-- Los servicios DEBEN usar `async with session.begin()` para transacciones multi-tabla. -->
<!-- Los servicios DEBEN usar el decorator `@auditar(accion, entidad)` para audit_log. -->

| Servicio | Método | Responsabilidad única | Transaccional |
| :--- | :--- | :--- | :--- |
| `{{nombre}}_service.py` | `{{metodo}}()` | {{Descripción de una sola línea}} | {{Sí/No}} |

---

## 3. Capa de Presentación (UI — React)
<!-- SRP: Esta sección solo define estructura de UI. Sin lógica de datos aquí. -->
<!-- DIP: Los componentes dependen de los hooks; los hooks dependen de los contratos de API. -->

### Árbol de Directorios de la Feature
<!-- ISP: Cada módulo expone solo lo que otros necesitan. Todo lo demás es privado. -->
<!-- Mostrar únicamente los archivos que este cambio crea o modifica. -->
```
src/features/{{feature-name}}/
├── components/
│   ├── {{NombreContenedor}}.tsx     # Componente contenedor: orquesta hooks y sub-componentes
│   └── {{NombrePresentacional}}.tsx # Componente presentacional: solo recibe props, sin lógica
├── hooks/
│   └── use{{NombreHook}}.ts         # Toda la lógica asíncrona y llamadas a la API viven aquí
├── types/
│   └── {{nombre}}.types.ts          # Re-exporta tipos derivados de los schemas Zod
└── index.ts                         # Contrato público: lista explícita de exports de la feature
```
<!-- Regla DRY: Si dos features comparten lógica, extraerla a src/shared/ en lugar de duplicarla. -->

### Contrato Público (`index.ts`)
<!-- ISP: Solo exportar lo que otras partes de la app necesitan consumir. -->
```typescript
// Exportaciones explícitas de la feature (prohibido exportar todo con *)
export { {{NombreContenedor}} } from './components/{{NombreContenedor}}';
export { use{{NombreHook}} } from './hooks/use{{NombreHook}}';
export type { {{NombreEntidad}}Type } from './types/{{nombre}}.types';
```

### Custom Hooks (`hooks/`)
<!-- SRP: Un hook = una responsabilidad. Prohibido hooks "God Hook" que hagan todo. -->
<!-- Clean Code: Nombrar hooks como use + verbo + sustantivo (ej: useCreateEntrega, useFetchKardex). -->
<!-- Los hooks DEBEN usar React Query (TanStack Query) para estado de servidor. -->

| Hook | Responsabilidad única | Endpoint que consume | React Query key |
| :--- | :--- | :--- | :--- |
| `use{{NombreHook}}` | {{Descripción de una sola línea}} | `{{VERBO /ruta}}` | `["{{recurso}}", {{params}}]` |

### Páginas y Enrutamiento (`src/pages/`)
<!-- SRP: Las páginas son Dumb Pages. Solo importan el componente contenedor y lo renderizan. -->
<!-- Prohibido: useState, useEffect, fetch/axios directamente en una página. -->

| Ruta | Tipo | Página (`src/pages/`) | Componente Contenedor | Roles permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `/{{ruta}}` | `{{Protegida}}` | `{{NombrePagina}}.tsx` | `{{NombreContenedor}}` | `{{admin,operador,lectura}}` |

---

## 4. Configuración y DevSecOps

### Gestión de Secretos
<!-- DRY: Centralizar la validación de variables de entorno. Sin variables dispersas. -->
- **Backend:** Listar las variables nuevas que DEBEN agregarse a `.env.example` del Backend.
  Validadas al inicio del servidor usando Pydantic Settings.
  Producción: gestionadas en GCP Secret Manager.
- **Frontend:** Listar las variables `VITE_*` nuevas que DEBEN agregarse a `.env.example` del Frontend.

### Seguridad Proactiva
- **Análisis Estático Backend:** Resultado esperado limpio de `ruff`, `mypy` y `bandit` en los módulos afectados.
- **Análisis Estático Frontend:** Resultado esperado limpio de `eslint` en los componentes afectados.
- **SCA (Dependencias):** Revisión con `snyk` o `trivy` de las nuevas dependencias (si las hay).

---

## 5. Cambios Estructurales
<!-- YAGNI: Solo completar esta sección si el cambio altera dependencias, estructura de carpetas -->
<!-- o requiere migraciones de base de datos no triviales. Si no aplica, eliminar esta sección. -->

### Nuevas Dependencias
<!-- Justificar cada dependencia nueva. Si se puede resolver con código propio en <20 líneas, -->
<!-- evaluar si realmente es necesaria (KISS + YAGNI). -->

| Paquete | Versión | Entorno | Justificación |
| :--- | :--- | :--- | :--- |
| `{{nombre-paquete}}` | `{{^x.y.z}}` | `{{Backend / Frontend / Ambos}}` | {{Por qué no puede resolverse sin esta dependencia}} |

### Migraciones de Base de Datos
<!-- Documentar si se añaden, renombran o eliminan columnas en tablas existentes. -->
<!-- Describir la estrategia de migración para datos existentes (si aplica). -->
<!-- Toda migración DEBE incluir upgrade() y downgrade() funcionales. -->
