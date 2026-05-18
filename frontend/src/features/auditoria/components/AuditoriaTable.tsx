import { type AuditLogItemResponseType } from "../types/auditoria.types";

interface Props {
  items: AuditLogItemResponseType[];
}

const ACCION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SOFT_DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-muted text-muted-foreground",
};

export function AuditoriaTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay registros de auditoría para los filtros aplicados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fecha</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Usuario</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Acción</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Entidad</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </td>
              <td className="px-3 py-2">{item.usuario_email ?? <span className="text-muted-foreground">—</span>}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ACCION_COLORS[item.accion] ?? "bg-muted"}`}
                >
                  {item.accion}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="font-medium">{item.entidad}</span>
                {item.entidad_id && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({item.entidad_id.slice(0, 8)}…)
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{item.ip ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
