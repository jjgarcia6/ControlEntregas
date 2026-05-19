import { useState } from "react";
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

const ACCION_CON_PAYLOAD = new Set(["CREATE", "UPDATE", "SOFT_DELETE"]);

function PayloadPanel({ item }: { item: AuditLogItemResponseType }) {
  const { accion, payload_antes, payload_despues } = item;

  if (accion === "UPDATE" && payload_antes && payload_despues) {
    const keys = Array.from(
      new Set([...Object.keys(payload_antes), ...Object.keys(payload_despues)])
    );
    const changed = keys.filter(
      (k) => JSON.stringify(payload_antes[k]) !== JSON.stringify(payload_despues[k])
    );
    const unchanged = keys.filter((k) => !changed.includes(k));

    return (
      <div className="space-y-2">
        {changed.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Campos modificados
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="w-1/4 py-1 pr-3 text-left font-medium">Campo</th>
                  <th className="w-[37.5%] py-1 pr-3 text-left font-medium">Antes</th>
                  <th className="w-[37.5%] py-1 text-left font-medium">Después</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {changed.map((k) => (
                  <tr key={k}>
                    <td className="py-1 pr-3 font-mono text-muted-foreground">{k}</td>
                    <td className="py-1 pr-3 font-mono text-destructive line-through">
                      {JSON.stringify(payload_antes[k])}
                    </td>
                    <td className="py-1 font-mono text-green-700 dark:text-green-400">
                      {JSON.stringify(payload_despues[k])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {unchanged.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
              {unchanged.length} campo{unchanged.length !== 1 ? "s" : ""} sin cambios
            </summary>
            <table className="mt-1 w-full text-xs">
              <tbody className="divide-y divide-border opacity-50">
                {unchanged.map((k) => (
                  <tr key={k}>
                    <td className="w-1/4 py-1 pr-3 font-mono text-muted-foreground">{k}</td>
                    <td className="py-1 font-mono">{JSON.stringify(payload_despues[k])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    );
  }

  const payload = payload_despues ?? payload_antes;
  if (!payload) return null;

  const label =
    accion === "CREATE"
      ? "Datos creados"
      : accion === "SOFT_DELETE"
        ? "Datos al momento de eliminar"
        : "Payload";

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <table className="w-full text-xs">
        <tbody className="divide-y divide-border">
          {Object.entries(payload).map(([k, v]) => (
            <tr key={k}>
              <td className="w-1/4 py-1 pr-3 font-mono text-muted-foreground">{k}</td>
              <td className="py-1 font-mono">{JSON.stringify(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditoriaTable({ items }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Referencia</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">IP</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const hasPayload = ACCION_CON_PAYLOAD.has(item.accion);

            return (
              <>
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {item.usuario_email ?? <span className="text-muted-foreground">—</span>}
                  </td>
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
                  <td className="px-3 py-2 font-medium">
                    {item.referencia ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.ip ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {hasPayload && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                        title={isExpanded ? "Ocultar detalle" : "Ver detalle"}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${item.id}-detail`} className="bg-muted/20">
                    <td colSpan={7} className="px-6 py-3">
                      <PayloadPanel item={item} />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
