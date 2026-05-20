"""Add triggers to make audit_log immutable (no DELETE or UPDATE allowed).

Even the postgres superuser will get an exception unless the trigger is
explicitly disabled first — providing a tamper-evident audit trail.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-20
"""

from alembic import op

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION audit_log_immutable()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'audit_log es inmutable: DELETE y UPDATE no están permitidos';
        END;
        $$;
    """)

    op.execute("""
        CREATE TRIGGER trg_audit_log_no_delete
        BEFORE DELETE ON public.audit_log
        FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
    """)

    op.execute("""
        CREATE TRIGGER trg_audit_log_no_update
        BEFORE UPDATE ON public.audit_log
        FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON public.audit_log;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_log_no_update ON public.audit_log;")
    op.execute("DROP FUNCTION IF EXISTS audit_log_immutable();")
