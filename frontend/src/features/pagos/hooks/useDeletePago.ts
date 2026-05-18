import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import apiClient from "@/api/client";

export function useDeletePago() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/pagos/${id}`);
      return data;
    },
    onSuccess: (_data, id) => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["pagos", id] });
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
    },
    onError: (error: unknown) => {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrorMessage(detail ?? "Error al eliminar el pago");
    },
  });

  return { ...mutation, errorMessage };
}
