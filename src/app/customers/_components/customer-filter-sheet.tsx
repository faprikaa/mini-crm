"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { type CustomerTag } from "./customer-columns";

export function CustomerFilterSheet({
  searchQuery,
  selectedTagId,
  tags,
  customersCount,
}: {
  searchQuery: string;
  selectedTagId: string;
  tags: CustomerTag[];
  customersCount: number;
}) {
  const tagLabel = useMemo(() => {
    if (!selectedTagId) return "Semua minat";
    return tags.find((tag) => tag.id === selectedTagId)?.name ?? "Semua minat";
  }, [selectedTagId, tags]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="neutral">
          <Filter className="h-4 w-4" />
          Ringkasan Filter
        </Button>
      </SheetTrigger>
      <SheetContent className="border-l-2 border-border bg-secondary-background">
        <SheetHeader>
          <SheetTitle>Filter Aktif</SheetTitle>
          <SheetDescription>
            Nama: {searchQuery ? `"${searchQuery}"` : "Semua"}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-4">
          <div className="rounded-base border-2 border-border bg-background p-3 shadow-shadow">
            <p className="text-sm font-heading">Minat Dipilih</p>
            <p className="text-sm font-base text-foreground/70">{tagLabel}</p>
          </div>
          <div className="rounded-base border-2 border-border bg-background p-3 shadow-shadow">
            <p className="text-sm font-heading">Total Tampil</p>
            <p className="text-2xl font-heading">{customersCount}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
