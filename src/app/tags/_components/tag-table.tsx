"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Tag } from "lucide-react";
import { SortableHeader } from "@/components/ui/data-table";

export type TagRow = {
  id: string;
  name: string;
  createdAt: Date;
};

export function getTagColumns(callbacks: {
  onEdit: (tag: TagRow) => void;
  onDelete: (tag: TagRow) => void;
}): ColumnDef<TagRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Tag</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge className="bg-secondary-background border-2 border-border">
          <Tag className="w-3 h-3 mr-1" />
          {row.original.name}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Dibuat</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-base text-foreground/70">
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
          <Button
            variant="neutral"
            size="icon"
            onClick={() => callbacks.onEdit(row.original)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="neutral"
            size="icon"
            onClick={() => callbacks.onDelete(row.original)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];
}
