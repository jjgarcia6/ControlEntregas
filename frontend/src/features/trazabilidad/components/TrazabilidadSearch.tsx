import { useState } from "react";
import { Search } from "lucide-react";

import { type TipoBusqueda } from "../types/trazabilidad.types";

interface Props {
  onSearch: (tipo: TipoBusqueda, id: string) => void;
  isLoading: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OPCIONES: { value: TipoBusqueda; label: string }[] = [
  { value: "xml", label: "XML (Factura)" },
  { value: "entrega", label: "Entrega" },
  { value: "pago", label: "Pago" },
];

export function TrazabilidadSearch({ onSearch, isLoading }: Props) {
  const [tipo, setTipo] = useState<TipoBusqueda>("xml");
  const [id, setId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = id.trim();
    if (!UUID_REGEX.test(trimmed)) {
      setError("Ingrese un UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)");
      return;
    }
    setError(null);
    onSearch(tipo, trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium text-foreground">
          Buscar desde
        </label>
        <select
          id="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoBusqueda)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="search-id" className="text-sm font-medium text-foreground">
          ID del documento (UUID)
        </label>
        <input
          id="search-id"
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading || !id.trim()}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <Search className="h-4 w-4" />
        {isLoading ? "Buscando..." : "Buscar"}
      </button>
    </form>
  );
}
