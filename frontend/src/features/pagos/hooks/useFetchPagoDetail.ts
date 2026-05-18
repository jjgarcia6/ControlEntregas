import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { pagoDetailResponseSchema } from "../types/pago.types";

export function useFetchPagoDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["pagos", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/pagos/${id}`);
      return pagoDetailResponseSchema.parse(data);
    },
    enabled: !!id,
  });
}
