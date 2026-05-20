import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface XmlsAlertaCardProps {
  count: number;
}

export function XmlsAlertaCard({ count }: XmlsAlertaCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">XMLs pendientes de kardex</CardTitle>
      </CardHeader>
      <CardContent>
        {count > 0 ? (
          <div className="space-y-2">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{count}</p>
            <p className="text-sm text-muted-foreground">
              facturas con ítems pendientes de kardex
            </p>
            <Link
              to="/xmls"
              className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              Ver XMLs →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin pendientes</p>
        )}
      </CardContent>
    </Card>
  );
}
