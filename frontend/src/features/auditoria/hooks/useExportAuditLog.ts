import apiClient from "@/api/client";
import { type AuditLogFiltros } from "../types/auditoria.types";

export function useExportAuditLog(filtros: Omit<AuditLogFiltros, "page" | "page_size">) {
  async function exportar(formato: "csv" | "json"): Promise<void> {
    const params: Record<string, string> = { formato };
    if (filtros.entidad) params.entidad = filtros.entidad;
    if (filtros.usuario_id) params.usuario_id = filtros.usuario_id;
    if (filtros.accion) params.accion = filtros.accion;
    if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
    if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;

    const response = await apiClient.get("/audit/export", {
      params,
      responseType: "blob",
    });

    const blob = new Blob([response.data as BlobPart], {
      type: response.headers["content-type"] as string,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = formato === "csv" ? "audit_log.csv" : "audit_log.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return { exportar };
}
