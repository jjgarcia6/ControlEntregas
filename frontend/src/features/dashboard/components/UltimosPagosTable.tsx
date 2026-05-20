import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type UltimoPagoRow } from "../types/dashboard.types";

interface UltimosPagosTableProps {
  filas: UltimoPagoRow[];
}

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return iso;
  }
}

export function UltimosPagosTable({ filas }: UltimosPagosTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Últimos pagos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2">Comprobante</th>
                <th className="px-4 py-2">Banco</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No hay pagos recientes.
                  </td>
                </tr>
              ) : (
                filas.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">{f.numero_comprobante}</td>
                    <td className="px-4 py-3">{f.nombre_banco}</td>
                    <td className="px-4 py-3 text-right">
                      ${Number(f.valor_total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatFecha(f.fecha_pago)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
