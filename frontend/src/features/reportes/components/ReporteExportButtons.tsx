import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReporteExportButtonsProps {
  onDownloadPdf: () => void;
  onDownloadXlsx: () => void;
  isPdfPending: boolean;
  isXlsxPending: boolean;
}

export function ReporteExportButtons({
  onDownloadPdf,
  onDownloadXlsx,
  isPdfPending,
  isXlsxPending,
}: ReporteExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDownloadPdf}
        disabled={isPdfPending}
        className="dark:border-border dark:text-foreground"
      >
        {isPdfPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Descargar PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDownloadXlsx}
        disabled={isXlsxPending}
        className="dark:border-border dark:text-foreground"
      >
        {isXlsxPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Descargar XLSX
      </Button>
    </div>
  );
}
