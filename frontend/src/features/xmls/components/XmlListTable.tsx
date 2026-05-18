import { GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";
import type { XmlListItemType } from "../types/xml.types";

interface XmlListTableProps {
  items: XmlListItemType[];
  onVerTrazabilidad?: (id: string) => void;
}

export function XmlListTable({ items, onVerTrazabilidad }: XmlListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Factura</TableHead>
          <TableHead>Emisor</TableHead>
          <TableHead>Comprador</TableHead>
          <TableHead>Fecha emisión</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Registrado</TableHead>
          {onVerTrazabilidad && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((xml) => (
          <TableRow key={xml.id}>
            <TableCell className="font-mono text-xs">{xml.numero_factura}</TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">{xml.ruc_emisor}</div>
              <div>{xml.razon_social_emisor}</div>
            </TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">{xml.ruc_comprador}</div>
              <div>{xml.razon_social_comprador}</div>
            </TableCell>
            <TableCell>{formatDate(xml.fecha_emision)}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(xml.importe_total)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(xml.created_at)}
            </TableCell>
            {onVerTrazabilidad && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ver trazabilidad"
                  title="Ver trazabilidad"
                  onClick={() => onVerTrazabilidad(xml.id)}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
