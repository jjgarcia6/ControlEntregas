import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import apiClient from "@/api/client";
import { pagoDetailResponseSchema, type PagoRequestType } from "../types/pago.types";

export function useCreatePago() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: PagoRequestType) => {
      const { data } = await apiClient.post("/pagos", payload);
      return pagoDetailResponseSchema.parse(data);
    },
    onSuccess: () => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
    },
    onError: (error: unknown) => {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrorMessage(detail ?? "Error al registrar el pago");
    },
  });

  return { ...mutation, errorMessage };
}
