import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import {
  type ReporteEntregasResponseType,
  type ReporteKardexResponseType,
  type ReportePagosResponseType,
  type ReporteXmlsResponseType,
  type TipoReporte,
  reporteEntregasResponseSchema,
  reporteKardexResponseSchema,
  reportePagosResponseSchema,
  reporteXmlsResponseSchema,
} from "../types/reporte.types";

type ReporteResponseMap = {
  xmls: ReporteXmlsResponseType;
  kardex: ReporteKardexResponseType;
  entregas: ReporteEntregasResponseType;
  pagos: ReportePagosResponseType;
};

const SCHEMA_MAP = {
  xmls: reporteXmlsResponseSchema,
  kardex: reporteKardexResponseSchema,
  entregas: reporteEntregasResponseSchema,
  pagos: reportePagosResponseSchema,
};

export function useFetchReporte<T extends TipoReporte>(
  tipo: T,
  filtros: Record<string, unknown>,
  enabled: boolean,
) {
  return useQuery<ReporteResponseMap[T]>({
    queryKey: ["reporte", tipo, filtros],
    enabled,
    queryFn: async () => {
      const params: Record<string, unknown> = { formato: "json", ...filtros };
      const { data } = await apiClient.get(`/reportes/${tipo}`, { params });
      const parsed = SCHEMA_MAP[tipo].safeParse(data);
      if (!parsed.success) {
        throw new Error(`Respuesta inválida del servidor para reporte ${tipo}: ${parsed.error.message}`);
      }
      return parsed.data as ReporteResponseMap[T];
    },
  });
}
