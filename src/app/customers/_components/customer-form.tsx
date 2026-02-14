"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserRound } from "lucide-react";
import { type CustomerRow, type CustomerTag } from "./customer-columns";

export function CustomerForm({
  customer,
  tags,
  onSubmit,
  submitLabel,
  isPending,
}: {
  customer?: CustomerRow;
  tags: CustomerTag[];
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
  isPending: boolean;
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    customer?.tags.map((tag) => tag.id) ?? []
  );

  const selectedSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  function toggleTag(tagId: string, nextChecked: boolean) {
    setSelectedTagIds((prev) => {
      if (nextChecked) {
        if (prev.includes(tagId)) return prev;
        return [...prev, tagId];
      }
      return prev.filter((id) => id !== tagId);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      {selectedTagIds.map((tagId) => (
        <input key={tagId} type="hidden" name="tagIds" value={tagId} />
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Nama</Label>
          <Input
            id="customer-name"
            name="name"
            defaultValue={customer?.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-favorite">Favorite drink / produk</Label>
          <Input
            id="customer-favorite"
            name="favoriteDrink"
            defaultValue={customer?.favoriteDrink ?? ""}
            placeholder="Contoh: Iced Latte"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email (opsional)</Label>
          <Input
            id="customer-email"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
            placeholder="nama@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Phone (opsional)</Label>
          <Input
            id="customer-phone"
            name="phone"
            defaultValue={customer?.phone ?? ""}
            placeholder="08xxxxxxxxxx"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Interest tags</Label>
        <ScrollArea className="h-40 rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow">
          <div className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-sm text-foreground/60">Belum ada tag tersedia.</p>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 rounded-base border-2 border-transparent px-2 py-1 hover:border-border hover:bg-background"
                >
                  <Checkbox
                    checked={selectedSet.has(tag.id)}
                    onCheckedChange={(value) => toggleTag(tag.id, Boolean(value))}
                  />
                  <span className="font-base">{tag.name}</span>
                </label>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="neutral">
            Batal
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          <UserRound className="h-4 w-4" />
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
