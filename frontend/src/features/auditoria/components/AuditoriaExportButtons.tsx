import { Download } from "lucide-react";

interface Props {
  onExport: (formato: "csv" | "json") => void;
  isLoading?: boolean;
}

export function AuditoriaExportButtons({ onExport, isLoading }: Props) {
  return (
    <div className="flex gap-2 print:hidden">
      <button
        type="button"
        onClick={() => onExport("csv")}
        disabled={isLoading}
        className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        CSV
      </button>
      <button
        type="button"
        onClick={() => onExport("json")}
        disabled={isLoading}
        className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        JSON
      </button>
    </div>
  );
}
