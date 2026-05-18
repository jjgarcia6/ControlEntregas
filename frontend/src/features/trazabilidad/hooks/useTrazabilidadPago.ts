import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { trazabilidadPagoResponseSchema } from "../types/trazabilidad.types";

export function useTrazabilidadPago(id: string | null) {
  return useQuery({
    queryKey: ["trazabilidad", "pago", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/trazabilidad/pago/${id}`);
      return trazabilidadPagoResponseSchema.parse(data);
    },
  });
}
