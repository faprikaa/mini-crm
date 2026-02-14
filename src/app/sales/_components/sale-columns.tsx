"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/ui/data-table";
import { ProductAccentLabel } from "@/components/product-accent-label";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export type SaleRow = {
  id: string;
  productId: string;
  productName: string;
  customerId: string | null;
  customerName: string | null;
  quantity: number;
  totalPrice: number;
  soldAt: Date;
};

export function getSaleColumns(callbacks: {
  onEdit: (sale: SaleRow) => void;
  onDelete: (sale: SaleRow) => void;
}): ColumnDef<SaleRow>[] {
  return [
    {
      accessorKey: "productName",
      header: ({ column }) => <SortableHeader column={column}>Produk</SortableHeader>,
      cell: ({ row }) => <ProductAccentLabel name={row.original.productName} />,
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => <SortableHeader column={column}>Customer</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-base text-foreground/80">{row.original.customerName ?? "Walk-in"}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <SortableHeader column={column}>Qty</SortableHeader>,
      cell: ({ row }) => <span className="font-base">{row.original.quantity}</span>,
    },
    {
      accessorKey: "totalPrice",
      header: ({ column }) => <SortableHeader column={column}>Total</SortableHeader>,
      cell: ({ row }) => <span className="font-base">{rupiah.format(row.original.totalPrice)}</span>,
    },
    {
      accessorKey: "soldAt",
      header: ({ column }) => <SortableHeader column={column}>Waktu</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-base text-foreground/80">
          {new Date(row.original.soldAt).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="neutral" size="icon" onClick={() => callbacks.onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="neutral" size="icon" onClick={() => callbacks.onDelete(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
