"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { SortableHeader } from "@/components/ui/data-table";
import { UserRow } from "../types";

export function getUserColumns(callbacks: {
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Nama</SortableHeader>
      ),
      cell: ({ row }) => <span className="font-base">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortableHeader column={column}>Email</SortableHeader>
      ),
      cell: ({ row }) => <span className="font-base">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <SortableHeader column={column}>Role</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge
          className={
            row.original.role === "SUPER_ADMIN"
              ? "bg-main text-main-foreground border-2 border-border"
              : "bg-secondary-background border-2 border-border"
          }
        >
          {row.original.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
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
