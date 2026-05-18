import { useParams } from "react-router-dom";

import { PagoDetailContainer } from "@/features/pagos";

export function PagoDetalle() {
  const { id } = useParams<{ id: string }>();
  return <PagoDetailContainer id={id ?? ""} />;
}
