import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  dateFormat = "dd/MM/yyyy"
): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, dateFormat, { locale: es });
}
