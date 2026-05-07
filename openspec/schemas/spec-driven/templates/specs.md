# Delta para {{domain}}
<!-- DRY: Antes de añadir un requisito, verificar que no exista ya en los specs base del dominio. -->
<!-- SRP: Cada escenario valida exactamente UNA condición. Sin escenarios combinados. -->
<!-- Dominios válidos: auth, usuarios, xmls, kardex, entregas, pagos, trazabilidad, reportes -->

## REQUISITOS AÑADIDOS

### Requisito: {{nombre descriptivo del requisito — qué hace el sistema, no cómo}}
<!-- Clean Code: El nombre del requisito DEBE ser autoexplicativo. -->
<!-- Usa RFC 2119: DEBE, NO DEBE, DEBERÍA, PUEDE. -->
El sistema DEBE...

#### Escenario: {{Actor}} {{realiza acción}} con {{condición de éxito}}
<!-- SRP: Este escenario cubre ÚNICAMENTE el flujo exitoso (Happy Path). -->
- **DADO** que el usuario con rol `{{admin|operador|lectura}}` se encuentra en {{nombre de la vista}}
- **Y** que los datos ingresados cumplen con el esquema Zod definido en el Diccionario de Datos
- **CUANDO** el usuario ejecuta {{acción concreta, ej: "hace clic en 'Guardar'"}}
- **ENTONCES** el Frontend DEBE enviar la solicitud al endpoint `{{VERBO /ruta}}`
- **Y** el Backend DEBE procesar la solicitud dentro de `async with session.begin()` y persistir en PostgreSQL
- **Y** el Backend DEBE registrar la operación en `audit_log` con acción `{{CREATE|UPDATE|SOFT_DELETE}}`
- **Y** el Frontend DEBE mostrar una notificación de éxito usando tokens de Tailwind

#### Escenario: {{Actor}} {{realiza acción}} con {{condición de error de validación}}
<!-- SRP: Este escenario cubre ÚNICAMENTE el error de validación de entrada (422). -->
- **DADO** que el payload NO cumple con las restricciones del Diccionario de Datos
- **CUANDO** el Frontend intenta enviar la solicitud al endpoint `{{VERBO /ruta}}`
- **ENTONCES** el Backend NO DEBE procesar la solicitud
- **Y** el Backend DEBE retornar HTTP `422 Unprocessable Entity` con el detalle del campo inválido
- **Y** el Frontend DEBE mostrar el mensaje de error específico al usuario sin exponer detalles internos

#### Escenario: {{Actor}} {{realiza acción}} sin {{autorización requerida}}
<!-- SRP: Este escenario cubre ÚNICAMENTE el error de autenticación/autorización (401/403). -->
<!-- Incluir este escenario SOLO si el endpoint es protegido. Eliminar si es público. -->
- **DADO** que el usuario no tiene una sesión activa o su rol es `{{rol insuficiente}}`
- **CUANDO** intenta acceder al endpoint `{{VERBO /ruta}}`
- **ENTONCES** el Backend DEBE retornar HTTP `401 Unauthorized` o `403 Forbidden`
- **Y** el Frontend DEBE redirigir al usuario a la vista de login

#### Escenario: {{Actor}} {{realiza acción}} que causa conflicto de unicidad
<!-- SRP: Este escenario cubre ÚNICAMENTE el error de duplicado (409). -->
<!-- Incluir SOLO si aplica: clave_acceso duplicada, identificación duplicada, etc. -->
- **DADO** que ya existe un registro con {{campo único}} = {{valor}}
- **CUANDO** el usuario intenta crear un nuevo registro con el mismo {{campo único}}
- **ENTONCES** el Backend DEBE retornar HTTP `409 Conflict` con mensaje descriptivo
- **Y** el Frontend DEBE mostrar el mensaje al usuario indicando el duplicado

---

### Escenarios específicos del dominio (usar cuando aplique)

#### Escenario: Operación modifica saldo de Kardex
<!-- Obligatorio cuando el cambio genera ingresos o egresos en el Kardex. -->
- **DADO** que el producto `{{codigo_principal}}` tiene saldo_cantidad = {{N}} en el Kardex
- **CUANDO** se ejecuta la operación de {{ingreso|egreso}} por cantidad = {{M}}
- **ENTONCES** el saldo_cantidad DEBE actualizarse a {{N ± M}}
- **Y** el saldo NUNCA DEBE ser negativo — si lo fuera, la operación DEBE bloquearse con HTTP `400`
- **Y** se DEBE registrar un nuevo `kardex_movimiento` con tipo = `{{ingreso|egreso}}`

#### Escenario: Operación de egreso consume lotes FIFO
<!-- Obligatorio cuando el egreso consume stock de múltiples lotes. -->
- **DADO** que el producto tiene lotes [Lote A: qty={{X}}, Lote B: qty={{Y}}]
- **CUANDO** se solicita un egreso por cantidad = {{Z}} donde Z > X
- **ENTONCES** el sistema DEBE consumir primero el Lote A completo ({{X}} unidades)
- **Y** DEBE consumir {{Z - X}} unidades del Lote B
- **Y** se DEBE registrar cada consumo en `entrega_item_fifo_detalle`

#### Escenario: Soft delete con reversión de efectos
<!-- Obligatorio para eliminación de entregas o pagos. -->
- **DADO** que la entidad `{{entrega|pago}}` con id={{ID}} está activa
- **Y** {{condición de bloqueo o no bloqueo}}
- **CUANDO** el usuario confirma la eliminación
- **ENTONCES** el estado DEBE cambiar a `eliminada|eliminado`
- **Y** se DEBEN revertir los efectos: {{descripción específica de la reversión}}
- **Y** se DEBE registrar `deleted_at`, `deleted_by` y la acción `SOFT_DELETE` en `audit_log`

#### Escenario: Soft delete bloqueado por dependencias
<!-- Obligatorio cuando la eliminación tiene precondiciones. -->
- **DADO** que la entrega tiene pagos asociados activos
- **CUANDO** el usuario intenta eliminar la entrega
- **ENTONCES** el Backend DEBE retornar HTTP `409 Conflict`
- **Y** el mensaje DEBE indicar los números de pago que deben eliminarse primero
- **Y** el Frontend DEBE mostrar la lista de pagos bloqueantes

---

## REQUISITOS MODIFICADOS
<!-- DRY: Solo listar el delta. No reproducir el requisito completo si solo cambia una parte. -->
<!-- Indicar explícitamente el valor anterior y el nuevo valor para facilitar la revisión. -->

### Requisito: {{nombre exacto del requisito existente a modificar}}
{{Descripción del nuevo comportamiento usando RFC 2119.}}
*(Anteriormente: {{descripción breve del comportamiento previo que se reemplaza}})*

#### Escenario: {{nombre del escenario modificado}}
<!-- Solo documentar los escenarios que cambian. Los escenarios sin cambios no se repiten (DRY). -->
- **DADO** ...
- **CUANDO** ...
- **ENTONCES** ...

---

## REQUISITOS ELIMINADOS
<!-- Documentar brevemente qué se elimina y POR QUÉ. Sin dejar eliminaciones sin justificación. -->

### Requisito: {{nombre exacto del requisito a eliminar}}
*(Eliminado porque: {{razón concisa, ej: "reemplazado por el Requisito X", "fuera del alcance definido"}})*
