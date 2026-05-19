import { z } from "zod";

export const auditLogItemResponseSchema = z.object({
  id: z.string().uuid().describe("ID único del registro de auditoría"),
  usuario_id: z.string().uuid().nullable().describe("ID del usuario; null para acciones del sistema"),
  usuario_email: z.string().nullable().describe("Email del usuario; null si fue eliminado"),
  accion: z
    .enum(["CREATE", "UPDATE", "SOFT_DELETE", "LOGIN"])
    .describe("Tipo de operación"),
  entidad: z.string().describe("Entidad afectada (ej: xmls, entregas)"),
  entidad_id: z.string().uuid().nullable().describe("ID de la entidad; null para LOGIN"),
  payload_antes: z.record(z.unknown()).nullable().describe("Estado antes del cambio"),
  payload_despues: z.record(z.unknown()).nullable().describe("Estado después del cambio"),
  referencia: z.string().nullable().describe("Identificador legible del documento afectado"),
  ip: z.string().nullable().describe("IP del cliente"),
  created_at: z.string().describe("Fecha y hora del evento (ISO 8601)"),
});

export type AuditLogItemResponseType = z.infer<typeof auditLogItemResponseSchema>;

export interface AuditLogFiltros {
  entidad?: string;
  usuario_id?: string;
  accion?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page: number;
  page_size: number;
}
