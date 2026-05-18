import { type AuditLogFiltros } from "../types/auditoria.types";

interface Props {
  filtros: Omit<AuditLogFiltros, "page" | "page_size">;
  onChange: (filtros: Omit<AuditLogFiltros, "page" | "page_size">) => void;
}

const ACCIONES = ["", "CREATE", "UPDATE", "SOFT_DELETE", "LOGIN"];

export function AuditoriaFilters({ filtros, onChange }: Props) {
  function set(key: keyof typeof filtros, value: string) {
    onChange({ ...filtros, [key]: value || undefined });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="f-entidad" className="text-xs font-medium text-muted-foreground">
          Entidad
        </label>
        <input
          id="f-entidad"
          type="text"
          value={filtros.entidad ?? ""}
          onChange={(e) => set("entidad", e.target.value)}
          placeholder="xmls, entregas…"
          className="rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="f-accion" className="text-xs font-medium text-muted-foreground">
          Acción
        </label>
        <select
          id="f-accion"
          value={filtros.accion ?? ""}
          onChange={(e) => set("accion", e.target.value)}
          className="rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ACCIONES.map((a) => (
            <option key={a} value={a}>
              {a || "Todas"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="f-desde" className="text-xs font-medium text-muted-foreground">
          Desde
        </label>
        <input
          id="f-desde"
          type="date"
          value={filtros.fecha_desde ?? ""}
          onChange={(e) => set("fecha_desde", e.target.value)}
          className="rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="f-hasta" className="text-xs font-medium text-muted-foreground">
          Hasta
        </label>
        <input
          id="f-hasta"
          type="date"
          value={filtros.fecha_hasta ?? ""}
          onChange={(e) => set("fecha_hasta", e.target.value)}
          className="rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
