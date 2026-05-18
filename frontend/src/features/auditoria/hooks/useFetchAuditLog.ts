import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { paginatedResponseSchema } from "@/shared/types/api.types";
import { type AuditLogFiltros, auditLogItemResponseSchema } from "../types/auditoria.types";

export function useFetchAuditLog(filtros: AuditLogFiltros) {
  return useQuery({
    queryKey: ["audit", filtros],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filtros.page,
        page_size: filtros.page_size,
      };
      if (filtros.entidad) params.entidad = filtros.entidad;
      if (filtros.usuario_id) params.usuario_id = filtros.usuario_id;
      if (filtros.accion) params.accion = filtros.accion;
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;

      const { data } = await apiClient.get("/audit", { params });
      return paginatedResponseSchema(auditLogItemResponseSchema).parse(data);
    },
  });
}
