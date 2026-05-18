import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/client";
import { trazabilidadXmlResponseSchema } from "../types/trazabilidad.types";

export function useTrazabilidadXml(id: string | null) {
  return useQuery({
    queryKey: ["trazabilidad", "xml", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/trazabilidad/xml/${id}`);
      return trazabilidadXmlResponseSchema.parse(data);
    },
  });
}
