import { useMutation } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { type TipoReporte } from "../types/reporte.types";

export function useDownloadReporteXlsx(tipo: TipoReporte, filtros: Record<string, unknown>) {
  return useMutation({
    mutationFn: async () => {
      const params: Record<string, unknown> = { formato: "xlsx", ...filtros };
      const response = await apiClient.get(`/reportes/${tipo}`, {
        params,
        responseType: "blob",
      });
      const blob = new Blob([response.data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const fecha = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_${tipo}_${fecha}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
