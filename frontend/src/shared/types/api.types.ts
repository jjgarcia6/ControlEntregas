import { z } from "zod";

export const healthCheckSchema = z.object({
  status: z.string().describe("Estado del servicio"),
  version: z.string().describe("Versión semántica del backend"),
});

export const apiErrorSchema = z.object({
  detail: z.string().describe("Mensaje de error legible por el usuario"),
  code: z.string().nullable().optional().describe("Código de error interno"),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    items: z.array(itemSchema),
  });

export type HealthCheckType = z.infer<typeof healthCheckSchema>;
export type ApiErrorType = z.infer<typeof apiErrorSchema>;
export type PaginatedResponseType<T> = {
  total: number;
  page: number;
  page_size: number;
  items: T[];
};
