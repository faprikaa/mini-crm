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

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  description: string | null;
  createdAt: Date;
};

export function getProductColumns(callbacks: {
  onEdit: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
}): ColumnDef<ProductRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Produk</SortableHeader>,
      cell: ({ row }) => <ProductAccentLabel name={row.original.name} />,
    },
    {
      accessorKey: "price",
      header: ({ column }) => <SortableHeader column={column}>Harga</SortableHeader>,
      cell: ({ row }) => <span className="font-base">{rupiah.format(row.original.price)}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <SortableHeader column={column}>Kategori</SortableHeader>,
      cell: ({ row }) => <span className="font-base text-foreground/80">{row.original.category ?? "-"}</span>,
    },
    {
      id: "description",
      header: "Deskripsi",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-base text-foreground/80">{row.original.description ?? "-"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>Dibuat</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-base text-foreground/80">
          {new Date(row.original.createdAt).toLocaleDateString("id-ID")}
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
