import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useDeletePago } from "../hooks/useDeletePago";
import { useFetchPagos } from "../hooks/useFetchPagos";
import type { PagoResponseType } from "../types/pago.types";
import { PagoDeleteDialog } from "./PagoDeleteDialog";
import { PagoFilters } from "./PagoFilters";
import { PagosList } from "./PagosList";

interface PagosFiltros {
  fecha_desde?: string;
  fecha_hasta?: string;
  banco_id?: string;
}

export function PagosContainer() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filtros, setFiltros] = useState<PagosFiltros>({});
  const [page] = useState(1);
  const [pagoAEliminar, setPagoAEliminar] = useState<PagoResponseType | null>(null);

  const { data, isLoading } = useFetchPagos(filtros, page);
  const { mutate: eliminar, errorMessage } = useDeletePago();

  const canCreate = user?.rol === "admin" || user?.rol === "operador";
  const canDelete = user?.rol === "admin" || user?.rol === "operador";

  function handleConfirmarEliminar() {
    if (!pagoAEliminar) return;
    eliminar(pagoAEliminar.id, { onSuccess: () => setPagoAEliminar(null) });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pagos</h2>
        {canCreate && (
          <Button onClick={() => navigate("/pagos/nuevo")}>Nuevo Pago</Button>
        )}
      </div>

      <PagoFilters onFilter={setFiltros} />

      {errorMessage && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
          {errorMessage}
        </p>
      )}

      <PagosList
        pagos={data?.items ?? []}
        isLoading={isLoading}
        canDelete={canDelete}
        onVerDetalle={(id) => navigate(`/pagos/${id}`)}
        onEliminar={setPagoAEliminar}
        onVerTrazabilidad={(id) => navigate(`/trazabilidad?tipo=pago&id=${id}`)}
      />

      <PagoDeleteDialog
        pago={pagoAEliminar}
        open={!!pagoAEliminar}
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setPagoAEliminar(null)}
      />
    </div>
  );
}
