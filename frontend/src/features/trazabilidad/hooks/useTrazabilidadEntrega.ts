import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { trazabilidadEntregaResponseSchema } from "../types/trazabilidad.types";

export function useTrazabilidadEntrega(id: string | null) {
  return useQuery({
    queryKey: ["trazabilidad", "entrega", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/trazabilidad/entrega/${id}`);
      return trazabilidadEntregaResponseSchema.parse(data);
    },
  });
}
