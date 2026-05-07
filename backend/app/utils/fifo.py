import uuid
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from app.utils.exceptions import SaldoInsuficiente


@dataclass
class LoteFIFO:
    fecha: datetime
    cantidad: Decimal
    costo_unitario: Decimal
    movimiento_id: uuid.UUID


@dataclass
class ConsumoLote:
    movimiento_id: uuid.UUID
    cantidad: Decimal
    costo_unitario: Decimal


def calcular_consumo_fifo(
    lotes: list[LoteFIFO],
    cantidad_requerida: Decimal,
) -> list[ConsumoLote]:
    """
    Función pura FIFO. Consume lotes en orden cronológico hasta satisfacer
    cantidad_requerida. Lanza SaldoInsuficiente si el stock total es insuficiente.
    """
    stock_total = sum(lote.cantidad for lote in lotes)
    if stock_total < cantidad_requerida:
        raise SaldoInsuficiente(
            f"Stock insuficiente: disponible {stock_total}, requerido {cantidad_requerida}"
        )

    lotes_ordenados = sorted(lotes, key=lambda lote: lote.fecha)
    consumos: list[ConsumoLote] = []
    pendiente = cantidad_requerida

    for lote in lotes_ordenados:
        if pendiente <= Decimal("0"):
            break
        cantidad_tomada = min(lote.cantidad, pendiente)
        consumos.append(
            ConsumoLote(
                movimiento_id=lote.movimiento_id,
                cantidad=cantidad_tomada,
                costo_unitario=lote.costo_unitario,
            )
        )
        pendiente -= cantidad_tomada

    return consumos
