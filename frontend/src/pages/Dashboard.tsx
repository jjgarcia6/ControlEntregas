import { EntregasPendientesTable } from "@/features/dashboard/components/EntregasPendientesTable";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
import { UltimasEntregasTable } from "@/features/dashboard/components/UltimasEntregasTable";
import { UltimosPagosTable } from "@/features/dashboard/components/UltimosPagosTable";
import { XmlsAlertaCard } from "@/features/dashboard/components/XmlsAlertaCard";
import { useFetchDashboard } from "@/features/dashboard/hooks/useFetchDashboard";

export function Dashboard() {
  const { data, isLoading, isError } = useFetchDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-48 animate-pulse rounded-lg border bg-muted" />
          <div className="h-48 animate-pulse rounded-lg border bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 animate-pulse rounded-lg border bg-muted" />
          <div className="h-48 animate-pulse rounded-lg border bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la información del dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <KpiCards data={data} />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <EntregasPendientesTable filas={data.entregas_mas_antiguas} />
        </div>
        <XmlsAlertaCard count={data.xmls_pendientes_count} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <UltimasEntregasTable filas={data.ultimas_entregas} />
        <UltimosPagosTable filas={data.ultimos_pagos} />
      </div>
    </div>
  );
}
