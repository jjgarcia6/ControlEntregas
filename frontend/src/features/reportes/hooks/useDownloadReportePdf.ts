import { useMutation } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { type TipoReporte } from "../types/reporte.types";

export function useDownloadReportePdf(tipo: TipoReporte, filtros: Record<string, unknown>) {
  return useMutation({
    mutationFn: async () => {
      const params: Record<string, unknown> = { formato: "pdf", ...filtros };
      const response = await apiClient.get(`/reportes/${tipo}`, {
        params,
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data as Blob);
      const fecha = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_${tipo}_${fecha}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
