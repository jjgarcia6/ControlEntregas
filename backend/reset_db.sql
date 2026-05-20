-- =============================================================================
-- RESET PRE-PRODUCCIÓN — IRREVERSIBLE
-- =============================================================================
-- Elimina todos los datos operacionales de prueba.
-- Conserva únicamente el usuario administrador.
-- Reinicia la secuencia de número de entrega a 1.
--
-- Requisitos:
--   - Ejecutar ANTES de salir a producción
--   - Ejecutar con un usuario PostgreSQL que tenga permisos sobre todas las tablas
--   - Después de ejecutar, correr: cd backend && python seed.py
--
-- Uso:
--   psql $DATABASE_URL < backend/reset_db.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- FASE 1: Limpiar tablas operacionales
-- Orden respeta dependencias FK (hijos antes que padres).
-- CASCADE cubre cualquier dependencia no listada explícitamente.
-- -----------------------------------------------------------------------------
TRUNCATE TABLE
    pago_entregas,
    pagos,
    entrega_item_fifo_detalle,
    entrega_items,
    entregas,
    xml_item_ingresos,
    kardex_movimientos,
    xml_items,
    xmls,
    productos,
    destinatarios,
    bancos,
    audit_log
CASCADE;

-- -----------------------------------------------------------------------------
-- FASE 2: Eliminar usuarios que no sean administrador
-- El usuario admin queda intacto con su password_hash y configuración.
-- -----------------------------------------------------------------------------
DELETE FROM usuarios
WHERE rol != 'admin';

-- -----------------------------------------------------------------------------
-- FASE 3: Reiniciar secuencia de número de entrega
-- -----------------------------------------------------------------------------
ALTER SEQUENCE entregas_numero_seq RESTART WITH 1;

COMMIT;
