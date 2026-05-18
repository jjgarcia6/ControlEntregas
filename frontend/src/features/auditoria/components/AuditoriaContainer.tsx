import { useState } from "react";

import { type AuditLogFiltros } from "../types/auditoria.types";
import { useFetchAuditLog } from "../hooks/useFetchAuditLog";
import { useExportAuditLog } from "../hooks/useExportAuditLog";
import { AuditoriaFilters } from "./AuditoriaFilters";
import { AuditoriaTable } from "./AuditoriaTable";
import { AuditoriaExportButtons } from "./AuditoriaExportButtons";

const PAGE_SIZE = 20;

export function AuditoriaContainer() {
  const [filtros, setFiltros] = useState<Omit<AuditLogFiltros, "page" | "page_size">>({});
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const query = useFetchAuditLog({ ...filtros, page, page_size: PAGE_SIZE });
  const { exportar } = useExportAuditLog(filtros);

  async function handleExport(formato: "csv" | "json") {
    setIsExporting(true);
    try {
      await exportar(formato);
    } finally {
      setIsExporting(false);
    }
  }

  function handleFiltrosChange(nuevos: Omit<AuditLogFiltros, "page" | "page_size">) {
    setFiltros(nuevos);
    setPage(1);
  }

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Auditoría</h1>
        <AuditoriaExportButtons onExport={handleExport} isLoading={isExporting} />
      </div>

      <AuditoriaFilters filtros={filtros} onChange={handleFiltrosChange} />

      {query.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el log de auditoría. Intente nuevamente.
        </div>
      )}

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Cargando registros…</p>
      ) : (
        <AuditoriaTable items={query.data?.items ?? []} />
      )}

      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} registros | Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-input px-3 py-1 hover:bg-accent disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-input px-3 py-1 hover:bg-accent disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
