import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useCreateDestinatario } from "../hooks/useCreateDestinatario";
import { DestinatarioForm } from "./DestinatarioForm";

export function DestinatarioCreateContainer() {
  const navigate = useNavigate();
  const createMutation = useCreateDestinatario();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Nuevo destinatario</h1>
      <div className="max-w-lg">
        <DestinatarioForm
          mode="create"
          isPending={createMutation.isPending}
          onSubmit={(values) =>
            createMutation.mutate(
              { ...values, email: values.email || null },
              {
                onSuccess: () => {
                  toast.success("Destinatario creado");
                  navigate("/destinatarios");
                },
                onError: (e) =>
                  toast.error(e instanceof Error ? e.message : "Error al crear"),
              }
            )
          }
        />
      </div>
    </div>
  );
}
