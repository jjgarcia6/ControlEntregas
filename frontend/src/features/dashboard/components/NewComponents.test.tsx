import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";

import { XmlsAlertaCard } from "./XmlsAlertaCard";
import { UltimasEntregasTable } from "./UltimasEntregasTable";
import { UltimosPagosTable } from "./UltimosPagosTable";
import type { UltimaEntregaRow, UltimoPagoRow } from "../types/dashboard.types";

describe("XmlsAlertaCard", () => {
  it("muestra el conteo y enlace a /xmls cuando count > 0", () => {
    render(
      <MemoryRouter>
        <XmlsAlertaCard count={3} />
      </MemoryRouter>
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("facturas con ítems pendientes de kardex")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /ver xmls/i });
    expect(link).toHaveAttribute("href", "/xmls");
  });

  it("muestra Sin pendientes cuando count === 0", () => {
    render(
      <MemoryRouter>
        <XmlsAlertaCard count={0} />
      </MemoryRouter>
    );
    expect(screen.getByText("Sin pendientes")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("UltimasEntregasTable", () => {
  it("muestra mensaje vacío cuando no hay filas", () => {
    render(<UltimasEntregasTable filas={[]} />);
    expect(screen.getByText("No hay entregas recientes.")).toBeInTheDocument();
  });

  it("renderiza filas correctamente", () => {
    const fila: UltimaEntregaRow = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      numero: 42,
      snap_nombre: "Empresa ABC",
      total_entrega: 1500.5,
      estado: "activa",
      created_at: "2024-03-15T10:00:00Z",
    };
    render(<UltimasEntregasTable filas={[fila]} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Empresa ABC")).toBeInTheDocument();
    expect(screen.getByText("$1500.50")).toBeInTheDocument();
    expect(screen.getByText("activa")).toBeInTheDocument();
  });
});

describe("UltimosPagosTable", () => {
  it("muestra mensaje vacío cuando no hay filas", () => {
    render(<UltimosPagosTable filas={[]} />);
    expect(screen.getByText("No hay pagos recientes.")).toBeInTheDocument();
  });

  it("renderiza filas correctamente", () => {
    const fila: UltimoPagoRow = {
      id: "223e4567-e89b-12d3-a456-426614174001",
      numero_comprobante: "COMP-001",
      nombre_banco: "Banco Pichincha",
      valor_total: 750.0,
      fecha_pago: "2024-03-20T14:00:00Z",
    };
    render(<UltimosPagosTable filas={[fila]} />);
    expect(screen.getByText("COMP-001")).toBeInTheDocument();
    expect(screen.getByText("Banco Pichincha")).toBeInTheDocument();
    expect(screen.getByText("$750.00")).toBeInTheDocument();
  });
});
