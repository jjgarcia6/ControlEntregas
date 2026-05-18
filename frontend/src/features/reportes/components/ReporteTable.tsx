import { Skeleton } from "@/components/ui/skeleton";

interface ReporteTableProps {
  columnas: string[];
  filas: Record<string, unknown>[];
  isLoading: boolean;
}

export function ReporteTable({ columnas, filas, isLoading }: ReporteTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (filas.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 py-12 text-center text-sm text-muted-foreground">
        Sin resultados para los filtros aplicados
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columnas.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-t border-border odd:bg-background even:bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              {columnas.map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-2 text-foreground">
                  {String(fila[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
