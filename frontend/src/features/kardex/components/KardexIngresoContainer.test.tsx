import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KardexIngresoContainer } from "./KardexIngresoContainer";

// ── Mock hooks ───────────────────────────────────────────────────────────────

vi.mock("@/features/xmls");
vi.mock("../hooks/useFetchXmlPendientes");
vi.mock("../hooks/useIngresarItems");

// ── Mock toast ───────────────────────────────────────────────────────────────

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

// ── Hook imports (after mocks) ────────────────────────────────────────────────

import { toast } from "sonner";
import { useFetchXmls } from "@/features/xmls";
import { useFetchXmlPendientes } from "../hooks/useFetchXmlPendientes";
import { useIngresarItems } from "../hooks/useIngresarItems";

const mockUseFetchXmls = vi.mocked(useFetchXmls);
const mockUseFetchXmlPendientes = vi.mocked(useFetchXmlPendientes);
const mockUseIngresarItems = vi.mocked(useIngresarItems);
const mockToastSuccess = vi.mocked(toast.success);

// ── Fixture data ──────────────────────────────────────────────────────────────

const MOCK_XML_ID = "550e8400-e29b-41d4-a716-446655440000";

const mockXmlList = {
  items: [
    {
      id: MOCK_XML_ID,
      clave_acceso: "1234567890123456789012345678901234567890123456789",
      numero_factura: "001-001-000000001",
      fecha_emision: "2024-01-15",
      razon_social_emisor: "EMPRESA TEST SA",
      ruc_emisor: "1790012345001",
      ruc_comprador: "0912345678001",
      razon_social_comprador: "CLIENTE TEST SA",
      importe_total: 115,
      created_at: "2024-01-15T10:00:00Z",
    },
  ],
  total: 1,
  page: 1,
  page_size: 100,
};

const mockPendientes = [
  {
    id: "item-uuid-0001-0000-000000000001",
    codigo_principal: "PROD001",
    descripcion: "Producto A",
    cantidad_documento: 4,
    cantidad_ingresada: 0,
    cantidad_pendiente: 4,
    precio_unitario: 25,
    precio_total_sin_imp: 100,
    peso_unitario: 2.5,
  },
  {
    id: "item-uuid-0001-0000-000000000002",
    codigo_principal: "PROD002",
    descripcion: "Producto B",
    cantidad_documento: 6,
    cantidad_ingresada: 2,
    cantidad_pendiente: 4,
    precio_unitario: 10,
    precio_total_sin_imp: 40,
    peso_unitario: 1.0,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderContainer() {
  return render(<KardexIngresoContainer />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("KardexIngresoContainer", () => {
  beforeEach(() => {
    mockToastSuccess.mockReset();

    mockUseFetchXmls.mockReturnValue({
      data: mockXmlList,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFetchXmls>);

    mockUseFetchXmlPendientes.mockImplementation(
      (xmlId) =>
        ({
          data: xmlId ? mockPendientes : undefined,
          isLoading: false,
          error: null,
        }) as unknown as ReturnType<typeof useFetchXmlPendientes>,
    );

    mockUseIngresarItems.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      errorMessage: null,
    } as unknown as ReturnType<typeof useIngresarItems>);
  });

  it("muestra el selector de XML en estado inicial", () => {
    renderContainer();
    expect(
      screen.getByText(/xml pendientes de ingreso al kardex/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /seleccione un xml/i }),
    ).toBeInTheDocument();
  });

  it("flujo principal: selecciona XML, marca ítems, confirma y muestra éxito", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn(
      (_vars: unknown, callbacks?: { onSuccess?: () => void }) => {
        callbacks?.onSuccess?.();
      },
    );

    mockUseIngresarItems.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      errorMessage: null,
    } as unknown as ReturnType<typeof useIngresarItems>);

    renderContainer();
    await user.selectOptions(screen.getByRole("combobox"), MOCK_XML_ID);

    await waitFor(() => {
      expect(screen.getByText("Producto A")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("checkbox", { name: /seleccionar producto a/i }),
    );

    const quantityInput = screen.getAllByRole("spinbutton")[0];
    await user.clear(quantityInput);
    await user.type(quantityInput, "2");

    const confirmBtn = screen.getByRole("button", {
      name: /confirmar ingreso/i,
    });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledOnce();
      expect(mockMutate).toHaveBeenCalledWith(
        {
          xmlId: MOCK_XML_ID,
          body: {
            items: [{ xml_item_id: mockPendientes[0].id, cantidad: 2 }],
          },
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/kardex/i),
      );
    });
  });

  it("muestra mensaje de error cuando la mutación retorna error", async () => {
    mockUseIngresarItems.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      errorMessage: "La cantidad ingresada supera la cantidad pendiente",
    } as unknown as ReturnType<typeof useIngresarItems>);

    renderContainer();
    await userEvent
      .setup()
      .selectOptions(screen.getByRole("combobox"), MOCK_XML_ID);

    await waitFor(() => {
      expect(
        screen.getByText(/la cantidad ingresada supera la cantidad pendiente/i),
      ).toBeInTheDocument();
    });
  });

  it("muestra estado de carga mientras se cargan los ítems", async () => {
    mockUseFetchXmlPendientes.mockImplementation(
      (xmlId) =>
        ({
          data: undefined,
          isLoading: Boolean(xmlId),
          error: null,
        }) as unknown as ReturnType<typeof useFetchXmlPendientes>,
    );

    renderContainer();
    await userEvent
      .setup()
      .selectOptions(screen.getByRole("combobox"), MOCK_XML_ID);

    await waitFor(() => {
      expect(screen.getByText(/cargando ítems/i)).toBeInTheDocument();
    });
  });

  it("accesibilidad: checkboxes tienen aria-label descriptivo", async () => {
    renderContainer();
    await userEvent
      .setup()
      .selectOptions(screen.getByRole("combobox"), MOCK_XML_ID);

    await waitFor(() => {
      expect(screen.getByText("Producto A")).toBeInTheDocument();
    });

    const checkboxA = screen.getByRole("checkbox", {
      name: /seleccionar producto a/i,
    });
    expect(checkboxA).toBeInTheDocument();
  });

  it("accesibilidad: campo de cantidad muestra aria-describedby cuando hay error", async () => {
    renderContainer();
    await userEvent
      .setup()
      .selectOptions(screen.getByRole("combobox"), MOCK_XML_ID);

    await waitFor(() => {
      expect(screen.getByText("Producto A")).toBeInTheDocument();
    });

    await userEvent
      .setup()
      .click(screen.getByRole("checkbox", { name: /seleccionar producto a/i }));

    const numInputs = screen.getAllByRole("spinbutton");
    const user = userEvent.setup();
    await user.clear(numInputs[0]);
    await user.type(numInputs[0], "0");

    await waitFor(() => {
      expect(screen.getByText(/mín\. 1/i)).toBeInTheDocument();
    });

    const errorMsg = screen.getByText(/mín\. 1/i);
    const errorId = errorMsg.getAttribute("id");
    expect(errorId).toBeTruthy();
    expect(numInputs[0]).toHaveAttribute("aria-describedby", errorId);
  });
});
