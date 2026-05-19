import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { paginatedResponseSchema } from "@/shared/types/api.types";
import { pagoResponseSchema } from "../types/pago.types";

interface PagosFiltros {
  fecha_desde?: string;
  fecha_hasta?: string;
  banco_id?: string;
  entrega_id?: string;
  incluir_eliminados?: boolean;
}

export function useFetchPagos(
  filtros: PagosFiltros = {},
  page: number = 1,
  pageSize: number = 20,
) {
  return useQuery({
    queryKey: ["pagos", filtros, page, pageSize],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = { page, page_size: pageSize };
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
      if (filtros.banco_id) params.banco_id = filtros.banco_id;
      if (filtros.entrega_id) params.entrega_id = filtros.entrega_id;
      if (filtros.incluir_eliminados) params.incluir_eliminados = true;

      const { data } = await apiClient.get("/pagos", { params });
      return paginatedResponseSchema(pagoResponseSchema).parse(data);
    },
  });
}
