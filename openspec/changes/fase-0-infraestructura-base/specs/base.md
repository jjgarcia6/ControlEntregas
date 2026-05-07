# Delta para base

## REQUISITOS AÑADIDOS

### Requisito: El backend arranca y responde un health check

El sistema DEBE exponer `GET /` sin autenticación y retornar JSON con los campos
`status` y `version` con código HTTP 200.

#### Escenario: Sistema responde health check correctamente

- **DADO** que el servidor está levantado con `uvicorn app.main:app`
- **CUANDO** se realiza `GET /` sin cabeceras de autenticación
- **ENTONCES** el Backend DEBE retornar HTTP `200 OK`
- **Y** el cuerpo DEBE ser `{"status": "ok", "version": "0.1.0"}`
- **Y** el tipo de contenido DEBE ser `application/json`

#### Escenario: El servidor rechaza un método no permitido en el health check

- **DADO** que el servidor está levantado
- **CUANDO** se realiza `POST /` (método no definido)
- **ENTONCES** el Backend DEBE retornar HTTP `405 Method Not Allowed`

---

### Requisito: La migración Alembic crea y destruye `audit_log` reversiblemente

El sistema DEBE tener una migración Alembic para la tabla `audit_log` con `upgrade()` y
`downgrade()` completamente funcionales.

#### Escenario: `alembic upgrade head` crea la tabla `audit_log`

- **DADO** que la base de datos está vacía (sin tablas de dominio)
- **CUANDO** se ejecuta `alembic upgrade head`
- **ENTONCES** la tabla `audit_log` DEBE existir en la base de datos
- **Y** DEBE tener las columnas: `id`, `usuario_id`, `accion`, `entidad`, `entidad_id`,
  `payload_antes`, `payload_despues`, `ip`, `user_agent`, `created_at`
- **Y** `id` DEBE ser `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Y** `created_at` DEBE ser `TIMESTAMPTZ NOT NULL DEFAULT now()`
- **Y** `usuario_id` DEBE ser nullable en esta fase

#### Escenario: `alembic downgrade base` elimina la tabla `audit_log`

- **DADO** que `alembic upgrade head` se ejecutó con éxito
- **CUANDO** se ejecuta `alembic downgrade base`
- **ENTONCES** la tabla `audit_log` NO DEBE existir en la base de datos
- **Y** la base de datos DEBE quedar en el mismo estado que antes del upgrade
- **Y** el comando DEBE completarse sin errores

#### Escenario: Re-aplicar migración después de downgrade no genera conflictos

- **DADO** que `alembic downgrade base` se ejecutó con éxito
- **CUANDO** se vuelve a ejecutar `alembic upgrade head`
- **ENTONCES** la tabla `audit_log` DEBE crearse nuevamente sin errores
- **Y** NO DEBE haber conflictos de nombres ni de tipos

---

### Requisito: El AuditMixin provee campos de auditoría a los modelos de dominio

El sistema DEBE definir un `AuditMixin` reutilizable que cualquier modelo de dominio
hereda para obtener campos de auditoría y la capacidad de soft delete.

#### Escenario: Un modelo que hereda AuditMixin tiene todos los campos de auditoría

- **DADO** que existe un modelo SQLAlchemy que hereda de `AuditMixin`
- **CUANDO** se inspecciona la tabla generada en PostgreSQL
- **ENTONCES** la tabla DEBE contener las columnas: `created_at`, `created_by`,
  `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `is_active`
- **Y** `is_active` DEBE tener valor por defecto `True`
- **Y** `created_at` DEBE ser `TIMESTAMPTZ NOT NULL DEFAULT now()`

#### Escenario: soft_delete() marca la entidad como eliminada

- **DADO** que existe una instancia de un modelo que hereda `AuditMixin` con `is_active=True`
- **CUANDO** se llama a `instancia.soft_delete(usuario_id=<uuid>)`
- **ENTONCES** `is_active` DEBE ser `False`
- **Y** `deleted_at` DEBE ser un `datetime` en timezone UTC
- **Y** `deleted_by` DEBE ser el `usuario_id` recibido

---

### Requisito: La validación de cédula/RUC ecuatoriana rechaza identificaciones inválidas

El sistema DEBE implementar el algoritmo módulo 11 del Ecuador en `utils/validaciones.py`
y retornar el tipo de identificación (`cedula` | `ruc`) o lanzar excepción si es inválida.

#### Escenario: Validar una cédula ecuatoriana válida de 10 dígitos

- **DADO** que se recibe una cadena de 10 dígitos con dígito verificador correcto
- **CUANDO** se llama a `validar_identificacion("1713175071")`
- **ENTONCES** la función DEBE retornar `{"tipo": "cedula", "identificacion": "1713175071"}`

#### Escenario: Validar un RUC válido de 13 dígitos

- **DADO** que se recibe una cadena de 13 dígitos con dígito verificador correcto
- **CUANDO** se llama a `validar_identificacion("1713175071001")`
- **ENTONCES** la función DEBE retornar `{"tipo": "ruc", "identificacion": "1713175071001"}`

#### Escenario: Validar una identificación con dígito verificador incorrecto

- **DADO** que el payload contiene una identificación con dígito verificador incorrecto
- **CUANDO** se llama a `validar_identificacion("1713175079")`
- **ENTONCES** la función DEBE lanzar `ValidacionNegocio` con mensaje descriptivo
- **Y** el llamador DEBE traducirla a HTTP `422 Unprocessable Entity`

#### Escenario: Validar una identificación con longitud incorrecta

- **DADO** que el payload contiene una cadena que no es ni de 10 ni de 13 dígitos
- **CUANDO** se llama a `validar_identificacion("123")`
- **ENTONCES** la función DEBE lanzar `ValidacionNegocio`

---

### Requisito: Las excepciones tipadas de negocio se traducen a respuestas HTTP correctas

El sistema DEBE tener exception handlers globales en FastAPI que traduzcan cada excepción
tipada de `utils/exceptions.py` a la respuesta HTTP correspondiente.

#### Escenario: EntidadNoEncontrada se traduce a HTTP 404

- **DADO** que un servicio lanza `EntidadNoEncontrada`
- **CUANDO** el exception handler lo intercepta
- **ENTONCES** el Backend DEBE retornar HTTP `404 Not Found`
- **Y** el cuerpo DEBE incluir `{"detail": <mensaje descriptivo>}`

#### Escenario: ConflictoUnicidad se traduce a HTTP 409

- **DADO** que un servicio lanza `ConflictoUnicidad`
- **CUANDO** el exception handler lo intercepta
- **ENTONCES** el Backend DEBE retornar HTTP `409 Conflict`

#### Escenario: ValidacionNegocio se traduce a HTTP 400

- **DADO** que un servicio lanza `ValidacionNegocio`
- **CUANDO** el exception handler lo intercepta
- **ENTONCES** el Backend DEBE retornar HTTP `400 Bad Request`

#### Escenario: PermisoInsuficiente se traduce a HTTP 403

- **DADO** que un servicio lanza `PermisoInsuficiente`
- **CUANDO** el exception handler lo intercepta
- **ENTONCES** el Backend DEBE retornar HTTP `403 Forbidden`

---

### Requisito: El frontend carga sin errores de TypeScript

El sistema DEBE compilar sin errores con `tsc --noEmit` en modo strict.

#### Escenario: `tsc --noEmit` termina con código de salida 0

- **DADO** que el frontend está instalado con `npm install`
- **CUANDO** se ejecuta `tsc --noEmit` en el directorio `frontend/`
- **ENTONCES** el comando DEBE completarse con código de salida `0`
- **Y** NO DEBE emitir ningún error de tipo

---

### Requisito: La página de Login se renderiza con componentes shadcn/ui

El sistema DEBE mostrar la pantalla `/login` usando `Card`, `Input`, `Label`,
`Button` y `Form` de shadcn/ui. Sin funcionalidad de submit real en Fase 0.

#### Escenario: Usuario no autenticado accede a una ruta protegida

- **DADO** que el usuario no tiene token en localStorage
- **CUANDO** navega a `/dashboard` (o cualquier ruta protegida)
- **ENTONCES** el Frontend DEBE redirigir a `/login`
- **Y** DEBE renderizar el componente `Login.tsx` con el Card de shadcn/ui visible

#### Escenario: La página de Login renderiza el formulario visual correctamente

- **DADO** que el usuario está en `/login`
- **CUANDO** la página carga
- **ENTONCES** DEBE ser visible un elemento `<form>` con:
  - Un campo `Input` con label "Correo electrónico"
  - Un campo `Input` con label "Contraseña" de tipo `password`
  - Un `Button` con texto "Iniciar sesión"
- **Y** NO DEBE haber errores en la consola del navegador

#### Escenario: El formulario de Login tiene atributos de accesibilidad ARIA correctos

- **DADO** que la página de Login está montada
- **CUANDO** se audita la accesibilidad
- **ENTONCES** cada `Input` DEBE estar asociado a su `Label` mediante `htmlFor`/`id`
- **Y** el `Button` de submit DEBE tener `type="submit"` para activarse con Enter

---

### Requisito: El cliente axios inyecta el token JWT en cada request

El sistema DEBE configurar un interceptor en `api/client.ts` que añada la cabecera
`Authorization: Bearer <token>` si existe token en el store de Zustand.

#### Escenario: Request con token activo incluye cabecera Authorization

- **DADO** que `authStore` tiene un token válido en memoria
- **CUANDO** se realiza cualquier request HTTP mediante el cliente axios
- **ENTONCES** la cabecera `Authorization: Bearer <token>` DEBE estar presente en la solicitud

#### Escenario: Response 401 del backend provoca logout y redirect

- **DADO** que el backend retorna HTTP `401` para cualquier endpoint
- **CUANDO** el interceptor de response procesa la respuesta
- **ENTONCES** el store `authStore` DEBE limpiar token y user (`logout()`)
- **Y** el usuario DEBE ser redirigido a `/login`

---

## REQUISITOS MODIFICADOS

*(No aplica — esta es la fase inicial sin cambios sobre requisitos existentes.)*

---

## REQUISITOS ELIMINADOS

*(No aplica — esta es la fase inicial sin requisitos previos que eliminar.)*
