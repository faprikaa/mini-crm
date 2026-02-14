"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { SortableHeader } from "@/components/ui/data-table";
import { getTagColor } from "@/lib/tag-colors";
import { ProductAccentLabel } from "@/components/product-accent-label";

export type CustomerTag = {
  id: string;
  name: string;
};

export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  favoriteProductId: string | null;
  favoriteProduct: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  tags: CustomerTag[];
};

export function getCustomerColumns(callbacks: {
  onEdit: (customer: CustomerRow) => void;
  onDelete: (customer: CustomerRow) => void;
}): ColumnDef<CustomerRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Nama</SortableHeader>
      ),
      cell: ({ row }) => <div className="font-base">{row.original.name}</div>,
    },
    {
      id: "contact",
      header: "Kontak",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="space-y-1 text-sm">
          <p className="font-base">{row.original.email ?? "-"}</p>
          <p className="font-base text-foreground/70">{row.original.phone ?? "-"}</p>
        </div>
      ),
    },
    {
      accessorKey: "favoriteProduct.name",
      header: ({ column }) => (
        <SortableHeader column={column}>Favorite Drink</SortableHeader>
      ),
      cell: ({ row }) => {
        const favoriteName = row.original.favoriteProduct?.name;
        if (!favoriteName) {
          return <div className="font-base text-foreground/60">-</div>;
        }

        return <ProductAccentLabel name={favoriteName} />;
      },
    },
    {
      id: "tags",
      header: "Interest Tags",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.length === 0 ? (
            <Badge className="border-2 border-border bg-secondary-background">
              Belum ada tag
            </Badge>
          ) : (
            row.original.tags.map((tag) => (
              <Badge
                key={tag.id}
                className="border-2 border-border"
                style={{ backgroundColor: getTagColor(tag.name) }}
              >
                {tag.name}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="icon"
            variant="neutral"
            onClick={() => callbacks.onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="neutral"
            onClick={() => callbacks.onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
