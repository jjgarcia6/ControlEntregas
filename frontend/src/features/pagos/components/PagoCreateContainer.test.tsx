import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PagoCreateContainer } from "./PagoCreateContainer";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../hooks/useCreatePago");
vi.mock("@/features/bancos");
vi.mock("../hooks/useFetchEntregasPendientes");

import { useFetchBancos } from "@/features/bancos";
import { useCreatePago } from "../hooks/useCreatePago";
import { useFetchEntregasPendientes } from "../hooks/useFetchEntregasPendientes";

const mockUseCreatePago = vi.mocked(useCreatePago);
const mockUseFetchBancos = vi.mocked(useFetchBancos);
const mockUseFetchEntregasPendientes = vi.mocked(useFetchEntregasPendientes);

// ── Fixture data ──────────────────────────────────────────────────────────────

const BANCO = { id: "banco-uuid-0001-0000-000000000001", nombre: "Banco Pichincha" };

const ENTREGA_PENDIENTE = {
  id: "ent-uuid-0001-0000-000000000001",
  numero: 42,
  snap_nombre: "Distribuidora ABC",
  total_entrega: 500,
  saldo_pendiente: 300,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const muteMutate = vi.fn();

function setupMocks() {
  mockUseCreatePago.mockReturnValue({
    mutate: muteMutate,
    isPending: false,
    errorMessage: null,
  } as unknown as ReturnType<typeof useCreatePago>);

  mockUseFetchBancos.mockReturnValue({
    data: [BANCO],
  } as unknown as ReturnType<typeof useFetchBancos>);

  mockUseFetchEntregasPendientes.mockReturnValue({
    data: {
      items: [ENTREGA_PENDIENTE],
      total: 1,
      page: 1,
      page_size: 10,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useFetchEntregasPendientes>);
}

function renderContainer() {
  return render(
    <MemoryRouter>
      <PagoCreateContainer />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PagoCreateContainer", () => {
  beforeEach(() => {
    muteMutate.mockReset();
    mockNavigate.mockReset();
    setupMocks();
  });

  // ── Cuadre: flujo principal ────────────────────────────────────────────────

  it("deshabilita el botón confirmar cuando no hay distribuciones", () => {
    renderContainer();
    expect(screen.getByRole("button", { name: /confirmar pago/i })).toBeDisabled();
  });

  it("deshabilita el botón confirmar cuando distribución no cuadra con el total", async () => {
    renderContainer();

    await userEvent.clear(screen.getByLabelText(/valor total/i));
    await userEvent.type(screen.getByLabelText(/valor total/i), "300");

    await userEvent.click(screen.getByRole("button", { name: /^agregar$/i }));

    const montoInput = screen.getByLabelText(/monto para entrega/i);
    await userEvent.clear(montoInput);
    await userEvent.type(montoInput, "100");

    expect(screen.getByRole("button", { name: /confirmar pago/i })).toBeDisabled();
  });

  it("habilita el botón confirmar cuando distribución cuadra exactamente con el total", async () => {
    renderContainer();

    await userEvent.clear(screen.getByLabelText(/valor total/i));
    await userEvent.type(screen.getByLabelText(/valor total/i), "300");

    await userEvent.click(screen.getByRole("button", { name: /^agregar$/i }));

    const montoInput = screen.getByLabelText(/monto para entrega/i);
    await userEvent.clear(montoInput);
    await userEvent.type(montoInput, "300");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /confirmar pago/i })).not.toBeDisabled();
    });
  });

  // ── Feedback de cuadre ─────────────────────────────────────────────────────

  it("muestra badge de cuadre correcto cuando los montos coinciden", async () => {
    renderContainer();

    await userEvent.clear(screen.getByLabelText(/valor total/i));
    await userEvent.type(screen.getByLabelText(/valor total/i), "300");

    await userEvent.click(screen.getByRole("button", { name: /^agregar$/i }));

    const montoInput = screen.getByLabelText(/monto para entrega/i);
    await userEvent.clear(montoInput);
    await userEvent.type(montoInput, "300");

    await waitFor(() => {
      expect(screen.getByText(/cuadre/i)).toBeInTheDocument();
    });
  });

  it("muestra monto faltante cuando hay diferencia de cuadre", async () => {
    renderContainer();

    await userEvent.clear(screen.getByLabelText(/valor total/i));
    await userEvent.type(screen.getByLabelText(/valor total/i), "300");

    await userEvent.click(screen.getByRole("button", { name: /^agregar$/i }));

    const montoInput = screen.getByLabelText(/monto para entrega/i);
    await userEvent.clear(montoInput);
    await userEvent.type(montoInput, "150");

    await waitFor(() => {
      expect(screen.getByText(/faltan/i)).toBeInTheDocument();
    });
  });

  it("muestra error del servidor cuando la mutación falla", () => {
    mockUseCreatePago.mockReturnValue({
      mutate: muteMutate,
      isPending: false,
      errorMessage: "El comprobante ya existe",
    } as unknown as ReturnType<typeof useCreatePago>);

    renderContainer();

    expect(screen.getByText("El comprobante ya existe")).toBeInTheDocument();
  });

  // ── Accesibilidad ──────────────────────────────────────────────────────────

  it("el formulario expone los campos con labels asociados", () => {
    renderContainer();

    expect(screen.getByLabelText(/n° comprobante/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de pago/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/titular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor total/i)).toBeInTheDocument();
  });

  it("el campo de búsqueda de entregas tiene aria-label para navegación por teclado", () => {
    renderContainer();

    expect(screen.getByLabelText(/buscar entrega/i)).toBeInTheDocument();
  });

  it("el botón quitar entrega tiene aria-label descriptivo", async () => {
    renderContainer();

    await userEvent.click(screen.getByRole("button", { name: /^agregar$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /quitar entrega/i })).toBeInTheDocument();
    });
  });

  it("el monto de entrega en distribución tiene aria-label descriptivo", async () => {
    renderContainer();

    await userEvent.click(screen.getByRole("button", { name: /^agregar$/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/monto para entrega/i)).toBeInTheDocument();
    });
  });
});
