import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { paginatedResponseSchema } from "@/shared/types/api.types";
import { entregaPendienteResponseSchema } from "../types/pago.types";

interface EntregasPendientesFiltros {
  q?: string;
}

export function useFetchEntregasPendientes(
  filtros: EntregasPendientesFiltros = {},
  page: number = 1,
  pageSize: number = 10,
) {
  return useQuery({
    queryKey: ["entregas", "pendientes", filtros, page, pageSize],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (filtros.q) params.q = filtros.q;

      const { data } = await apiClient.get("/entregas/pendientes", { params });
      return paginatedResponseSchema(entregaPendienteResponseSchema).parse(data);
    },
  });
}
