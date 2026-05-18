import { Link, useSearchParams } from "react-router-dom";
import { FileText, Truck, CreditCard, GitBranch } from "lucide-react";

import { type TipoBusqueda } from "../types/trazabilidad.types";
import { useTrazabilidadXml } from "../hooks/useTrazabilidadXml";
import { useTrazabilidadEntrega } from "../hooks/useTrazabilidadEntrega";
import { useTrazabilidadPago } from "../hooks/useTrazabilidadPago";
import { TrazabilidadTree } from "./TrazabilidadTree";
import { TrazabilidadPdfButton } from "./TrazabilidadPdfButton";

const TIPO_LABEL: Record<TipoBusqueda, string> = {
  xml: "XML (Factura)",
  entrega: "Entrega",
  pago: "Pago",
};

export function TrazabilidadContainer() {
  const [params] = useSearchParams();
  const tipo = (params.get("tipo") ?? null) as TipoBusqueda | null;
  const id = params.get("id");

  const validTipo = tipo && ["xml", "entrega", "pago"].includes(tipo) ? tipo : null;

  const xmlQuery = useTrazabilidadXml(validTipo === "xml" ? id : null);
  const entregaQuery = useTrazabilidadEntrega(validTipo === "entrega" ? id : null);
  const pagoQuery = useTrazabilidadPago(validTipo === "pago" ? id : null);

  const query =
    validTipo === "xml" ? xmlQuery : validTipo === "entrega" ? entregaQuery : pagoQuery;

  const hasParams = validTipo !== null && id !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trazabilidad</h1>
          {hasParams && (
            <p className="text-sm text-muted-foreground mt-1">
              {TIPO_LABEL[validTipo!]} — {id}
            </p>
          )}
        </div>
        {query?.data && <TrazabilidadPdfButton />}
      </div>

      {!hasParams && (
        <div className="rounded-lg border border-border bg-muted/30 px-6 py-10 space-y-6">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              1
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">
              Abre la lista del tipo de documento que quieres rastrear:
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pl-9">
            <Link
              to="/xml/lista"
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <FileText className="h-4 w-4" />
              Lista XML
            </Link>
            <Link
              to="/entregas"
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Truck className="h-4 w-4" />
              Entregas
            </Link>
            <Link
              to="/pagos"
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Pagos
            </Link>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">
              En la fila del documento, haz clic en{" "}
              <span className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs font-medium">
                <GitBranch className="h-3 w-3" />
                Ver trazabilidad
              </span>{" "}
              para ver su árbol completo aquí.
            </p>
          </div>
        </div>
      )}

      {hasParams && query?.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {query.error instanceof Error && query.error.message.includes("404")
            ? "Documento no encontrado."
            : "Error al consultar la trazabilidad. Intente nuevamente."}
        </div>
      )}

      {hasParams && query?.isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">Consultando trazabilidad…</p>
      )}

      {hasParams && query?.data && (
        <div className="print:pt-4">
          <TrazabilidadTree tipo={validTipo!} data={query.data} />
        </div>
      )}
    </div>
  );
}
