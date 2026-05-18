import { Skeleton } from "@/components/ui/skeleton";
import { useFetchPagoDetail } from "../hooks/useFetchPagoDetail";
import { PagoDetail } from "./PagoDetail";

interface PagoDetailContainerProps {
  id: string;
}

export function PagoDetailContainer({ id }: PagoDetailContainerProps) {
  const { data, isLoading, isError } = useFetchPagoDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
        Pago no encontrado o error al cargar.
      </p>
    );
  }

  return <PagoDetail pago={data} />;
}
