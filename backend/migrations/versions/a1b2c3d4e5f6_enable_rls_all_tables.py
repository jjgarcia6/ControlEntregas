"""Enable RLS on all public tables.

Backend connects as postgres/service_role which bypasses RLS.
This blocks direct PostgREST access from anon/authenticated roles.

Revision ID: a1b2c3d4e5f6
Revises: 9f2a1b4c3d55
Create Date: 2026-05-20
"""

from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "9f2a1b4c3d55"
branch_labels = None
depends_on = None

_TABLES = [
    "alembic_version",
    "audit_log",
    "bancos",
    "destinatarios",
    "entrega_item_fifo_detalle",
    "entrega_items",
    "entregas",
    "kardex_movimientos",
    "pago_entregas",
    "pagos",
    "productos",
    "usuarios",
    "xml_item_ingresos",
    "xml_items",
    "xmls",
]


def upgrade() -> None:
    for table in _TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")


def downgrade() -> None:
    for table in _TABLES:
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY;")
