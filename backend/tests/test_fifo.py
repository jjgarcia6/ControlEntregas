import uuid
from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.utils.exceptions import SaldoInsuficiente
from app.utils.fifo import LoteFIFO, calcular_consumo_fifo


def make_lote(fecha_str: str, cantidad: str, costo: str) -> LoteFIFO:
    return LoteFIFO(
        fecha=datetime.fromisoformat(fecha_str).replace(tzinfo=timezone.utc),
        cantidad=Decimal(cantidad),
        costo_unitario=Decimal(costo),
        movimiento_id=uuid.uuid4(),
    )


def test_should_consume_single_lot_when_enough_stock() -> None:
    lote = make_lote("2026-01-01", "10", "5.00")
    consumos = calcular_consumo_fifo([lote], Decimal("5"))
    assert len(consumos) == 1
    assert consumos[0].cantidad == Decimal("5")
    assert consumos[0].costo_unitario == Decimal("5.00")
    assert consumos[0].movimiento_id == lote.movimiento_id


def test_should_consume_multiple_lots_fifo_order() -> None:
    lote_a = make_lote("2026-01-01", "5", "3.00")
    lote_b = make_lote("2026-01-15", "10", "4.00")
    consumos = calcular_consumo_fifo([lote_a, lote_b], Decimal("8"))
    assert len(consumos) == 2
    assert consumos[0].movimiento_id == lote_a.movimiento_id
    assert consumos[0].cantidad == Decimal("5")
    assert consumos[1].movimiento_id == lote_b.movimiento_id
    assert consumos[1].cantidad == Decimal("3")


def test_should_raise_saldo_insuficiente_when_stock_not_enough() -> None:
    lote_a = make_lote("2026-01-01", "3", "2.00")
    lote_b = make_lote("2026-01-10", "2", "2.50")
    with pytest.raises(SaldoInsuficiente, match="insuficiente"):
        calcular_consumo_fifo([lote_a, lote_b], Decimal("10"))
