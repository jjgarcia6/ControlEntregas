import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PagosFiltros {
  fecha_desde?: string;
  fecha_hasta?: string;
  banco_id?: string;
}

interface PagoFiltersProps {
  onFilter: (filtros: PagosFiltros) => void;
}

export function PagoFilters({ onFilter }: PagoFiltersProps) {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onFilter({
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
    });
  }

  function handleReset() {
    setFechaDesde("");
    setFechaHasta("");
    onFilter({});
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="fecha_desde">Desde</Label>
        <Input
          id="fecha_desde"
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="fecha_hasta">Hasta</Label>
        <Input
          id="fecha_hasta"
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
      <Button type="button" variant="ghost" onClick={handleReset}>
        Limpiar
      </Button>
    </form>
  );
}
