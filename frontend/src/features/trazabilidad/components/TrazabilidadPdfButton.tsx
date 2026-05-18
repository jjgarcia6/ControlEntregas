import { Printer } from "lucide-react";

export function TrazabilidadPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent print:hidden"
    >
      <Printer className="h-4 w-4" />
      Imprimir
    </button>
  );
}
