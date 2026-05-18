import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/shared/utils/formatters";
import { useFetchEntregasPendientes } from "../hooks/useFetchEntregasPendientes";
import type { EntregaPendienteType, PagoItemRequestType } from "../types/pago.types";

interface EntregaDistribucionProps {
  distribuciones: PagoItemRequestType[];
  valorTotal: number;
  onChange: (items: PagoItemRequestType[]) => void;
}

export function EntregaDistribucion({
  distribuciones,
  valorTotal,
  onChange,
}: EntregaDistribucionProps) {
  const [busqueda, setBusqueda] = useState("");

  const { data, isLoading } = useFetchEntregasPendientes({ q: busqueda || undefined });

  const entregasDisponibles = data?.items ?? [];

  const idSeleccionados = new Set(distribuciones.map((d) => d.entrega_id));

  function handleAgregar(entrega: EntregaPendienteType) {
    if (idSeleccionados.has(entrega.id)) return;
    onChange([...distribuciones, { entrega_id: entrega.id, monto_aplicado: 0 }]);
  }

  function handleMonto(entregaId: string, monto: number) {
    onChange(
      distribuciones.map((d) =>
        d.entrega_id === entregaId ? { ...d, monto_aplicado: monto } : d,
      ),
    );
  }

  function handleQuitar(entregaId: string) {
    onChange(distribuciones.filter((d) => d.entrega_id !== entregaId));
  }

  const sumaAplicada = distribuciones.reduce((acc, d) => acc + (d.monto_aplicado || 0), 0);
  const diferencia = Math.round((valorTotal - sumaAplicada) * 100) / 100;
  const cuadra = diferencia === 0 && distribuciones.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Buscar entrega por destinatario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-2"
          aria-label="Buscar entrega"
        />

        <div className="border rounded-md max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : entregasDisponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 text-center">
              Sin entregas pendientes
            </p>
          ) : (
            entregasDisponibles.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 border-b last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    #{e.numero}
                  </span>
                  <span className="text-sm truncate">{e.snap_nombre}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    saldo: {formatCurrency(e.saldo_pendiente)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={idSeleccionados.has(e.id)}
                  onClick={() => handleAgregar(e)}
                >
                  {idSeleccionados.has(e.id) ? "Agregada" : "Agregar"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {distribuciones.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Distribución</p>
          {distribuciones.map((d) => {
            const entrega = entregasDisponibles.find((e) => e.id === d.entrega_id);
            const saldoDisponible = entrega
              ? entrega.saldo_pendiente - (d.monto_aplicado || 0)
              : null;

            return (
              <div
                key={d.entrega_id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entrega ? `#${entrega.numero} – ${entrega.snap_nombre}` : d.entrega_id}
                  </p>
                  {saldoDisponible !== null && (
                    <p className="text-xs text-muted-foreground">
                      saldo disponible: {formatCurrency(saldoDisponible)}
                    </p>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-32 text-right"
                  value={d.monto_aplicado || ""}
                  onChange={(e) => handleMonto(d.entrega_id, parseFloat(e.target.value) || 0)}
                  aria-label={`Monto para entrega ${d.entrega_id}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuitar(d.entrega_id)}
                  aria-label="Quitar entrega"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm font-medium">
        {distribuciones.length > 0 ? (
          cuadra ? (
            <Badge className="bg-green-700 dark:bg-green-700">Cuadre ✓</Badge>
          ) : (
            <Badge variant="destructive">
              Faltan: {formatCurrency(Math.abs(diferencia))}
            </Badge>
          )
        ) : null}
        <span className="text-muted-foreground text-xs">
          Distribuido: {formatCurrency(sumaAplicada)} / {formatCurrency(valorTotal)}
        </span>
      </div>
    </div>
  );
}
