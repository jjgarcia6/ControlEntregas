import { z } from "zod";

// ─── Nodos reutilizados ───────────────────────────────────────────────────────

const xmlResumenSchema = z.object({
  id: z.string().uuid().describe("ID del XML"),
  numero_factura: z.string().describe("Número de factura (estab-pto-secuencial)"),
  fecha_emision: z.string().describe("Fecha de emisión (YYYY-MM-DD)"),
  ruc_emisor: z.string().describe("RUC del emisor"),
  razon_social_emisor: z.string().describe("Razón social del emisor"),
  is_active: z.boolean().describe("false si el XML fue eliminado (soft delete)"),
});

const xmlItemResumenSchema = z.object({
  id: z.string().uuid(),
  codigo_principal: z.string(),
  descripcion: z.string(),
  cantidad_ingresada: z.coerce.number().nonnegative(),
});

const kardexMovimientoResumenSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(["ingreso", "egreso", "reversa_entrega"]),
  fecha_movimiento: z.string().describe("ISO 8601"),
  cantidad: z.coerce.number().positive(),
  costo_unitario: z.coerce.number().nonnegative(),
  costo_total: z.coerce.number().nonnegative(),
});

const productoResumenSchema = z.object({
  id: z.string().uuid(),
  codigo_principal: z.string(),
  descripcion: z.string(),
});

export const entregaResumenSchema = z.object({
  id: z.string().uuid(),
  numero: z.number().int().positive(),
  snap_nombre: z.string(),
  total_entrega: z.coerce.number().positive(),
  saldo_pendiente: z.coerce.number().nonnegative(),
  estado: z.enum(["activa", "eliminada"]),
});

export const pagoResumenSchema = z.object({
  id: z.string().uuid(),
  numero_comprobante: z.string(),
  fecha_pago: z.string(),
  banco_nombre: z.string(),
  valor_total: z.coerce.number().positive(),
  estado: z.enum(["activo", "eliminado"]),
});

const pagoAplicadoSchema = pagoResumenSchema.extend({
  monto_aplicado: z.coerce.number().positive().describe("Monto aplicado a la entrega en contexto"),
});

// ─── Árbol desde XML ─────────────────────────────────────────────────────────

const ingresoKardexTrazaSchema = z.object({
  xml_item: xmlItemResumenSchema,
  kardex_movimiento: kardexMovimientoResumenSchema,
  producto: productoResumenSchema,
});

const entregaConsumoTrazaSchema = z.object({
  entrega: entregaResumenSchema,
  cantidad_consumida: z.coerce.number().positive(),
  costo_total_consumido: z.coerce.number().nonnegative(),
});

export const trazabilidadXmlResponseSchema = z.object({
  xml: xmlResumenSchema,
  ingresos_kardex: z.array(ingresoKardexTrazaSchema),
  entregas: z.array(entregaConsumoTrazaSchema),
  pagos: z.array(pagoResumenSchema),
});

// ─── Árbol desde Entrega ─────────────────────────────────────────────────────

export const xmlOrigenTrazaSchema = z.object({
  xml: xmlResumenSchema,
  xml_item: xmlItemResumenSchema,
  cantidad_consumida: z.coerce.number().positive(),
  costo_unitario: z.coerce.number().nonnegative(),
});

export const trazabilidadEntregaResponseSchema = z.object({
  entrega: entregaResumenSchema,
  xmls_origen: z.array(xmlOrigenTrazaSchema),
  pagos: z.array(pagoAplicadoSchema),
});

// ─── Árbol desde Pago ────────────────────────────────────────────────────────

const entregaEnPagoTrazaSchema = z.object({
  entrega: entregaResumenSchema,
  monto_aplicado: z.coerce.number().positive(),
  xmls_origen: z.array(xmlOrigenTrazaSchema),
});

export const trazabilidadPagoResponseSchema = z.object({
  pago: pagoResumenSchema,
  distribuciones: z.array(entregaEnPagoTrazaSchema),
});

// ─── Tipos derivados ─────────────────────────────────────────────────────────

export type TrazabilidadXmlResponseType = z.infer<typeof trazabilidadXmlResponseSchema>;
export type TrazabilidadEntregaResponseType = z.infer<typeof trazabilidadEntregaResponseSchema>;
export type TrazabilidadPagoResponseType = z.infer<typeof trazabilidadPagoResponseSchema>;
export type EntregaResumenType = z.infer<typeof entregaResumenSchema>;
export type PagoResumenType = z.infer<typeof pagoResumenSchema>;
export type XmlOrigenTrazaType = z.infer<typeof xmlOrigenTrazaSchema>;

export type TipoBusqueda = "xml" | "entrega" | "pago";
