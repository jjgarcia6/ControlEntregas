import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PagoResponseType } from "../types/pago.types";

interface PagoDeleteDialogProps {
  pago: PagoResponseType | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PagoDeleteDialog({ pago, open, onConfirm, onCancel }: PagoDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el pago con comprobante{" "}
            <span className="font-semibold">{pago?.numero_comprobante}</span>. Esta acción
            restaurará el saldo pendiente de las entregas afectadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
