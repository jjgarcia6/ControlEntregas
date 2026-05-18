import { type TipoReporte } from "../types/reporte.types";

const TABS: { tipo: TipoReporte; label: string }[] = [
  { tipo: "xmls", label: "XMLs" },
  { tipo: "kardex", label: "Kardex" },
  { tipo: "entregas", label: "Entregas" },
  { tipo: "pagos", label: "Pagos" },
];

interface ReporteSelectorProps {
  tipoActivo: TipoReporte;
  onChange: (tipo: TipoReporte) => void;
}

export function ReporteSelector({ tipoActivo, onChange }: ReporteSelectorProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {TABS.map(({ tipo, label }) => (
        <button
          key={tipo}
          type="button"
          onClick={() => onChange(tipo)}
          className={
            "px-4 py-2 text-sm font-medium transition-colors " +
            (tipoActivo === tipo
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
