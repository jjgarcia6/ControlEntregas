import { z } from "zod";

export const entregaPendienteRowSchema = z.object({
  id: z.string().uuid(),
  numero: z.number().int(),
  snap_nombre: z.string(),
  snap_identificacion: z.string(),
  total_entrega: z.coerce.number(),
  saldo_pendiente: z.coerce.number(),
  created_at: z.string(),
});

export const ultimaEntregaRowSchema = z.object({
  id: z.string().uuid(),
  numero: z.number().int().positive(),
  snap_nombre: z.string().min(1),
  total_entrega: z.coerce.number(),
  estado: z.string(),
  created_at: z.string(),
});

export const ultimoPagoRowSchema = z.object({
  id: z.string().uuid(),
  numero_comprobante: z.string().min(1),
  nombre_banco: z.string().min(1),
  valor_total: z.coerce.number(),
  fecha_pago: z.string(),
});

export const dashboardResponseSchema = z.object({
  entregas_activas: z.number().int(),
  saldo_pendiente_total: z.coerce.number(),
  total_facturado: z.coerce.number(),
  total_cobrado: z.coerce.number(),
  pagos_mes_actual: z.coerce.number(),
  entregas_mas_antiguas: z.array(entregaPendienteRowSchema),
  xmls_pendientes_count: z.number().int().min(0),
  ultimas_entregas: z.array(ultimaEntregaRowSchema),
  ultimos_pagos: z.array(ultimoPagoRowSchema),
});

export type EntregaPendienteRow = z.infer<typeof entregaPendienteRowSchema>;
export type UltimaEntregaRow = z.infer<typeof ultimaEntregaRowSchema>;
export type UltimoPagoRow = z.infer<typeof ultimoPagoRowSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
