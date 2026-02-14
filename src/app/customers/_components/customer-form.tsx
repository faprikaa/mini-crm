"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserRound } from "lucide-react";
import { type CustomerRow, type CustomerTag } from "./customer-columns";

const NONE_OPTION = "__none__";
const CREATE_OPTION = "__create__";

export function CustomerForm({
  customer,
  tags,
  products,
  onSubmit,
  submitLabel,
  isPending,
}: {
  customer?: CustomerRow;
  tags: CustomerTag[];
  products: Array<{ id: string; name: string }>;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
  isPending: boolean;
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    customer?.tags.map((tag) => tag.id) ?? []
  );
  const [favoriteMode, setFavoriteMode] = useState<string>(
    customer?.favoriteProductId ?? NONE_OPTION
  );
  const [newFavoriteProductName, setNewFavoriteProductName] = useState("");

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
      <input
        type="hidden"
        name="favoriteProductId"
        value={
          favoriteMode === NONE_OPTION || favoriteMode === CREATE_OPTION
            ? ""
            : favoriteMode
        }
      />
      <input
        type="hidden"
        name="favoriteProductName"
        value={favoriteMode === CREATE_OPTION ? newFavoriteProductName : ""}
      />
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
          <Select
            value={favoriteMode}
            onValueChange={(value) => {
              setFavoriteMode(value);
              if (value !== CREATE_OPTION) {
                setNewFavoriteProductName("");
              }
            }}
          >
            <SelectTrigger id="customer-favorite">
              <SelectValue placeholder="Pilih favorit produk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_OPTION}>Belum ada favorit</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
              <SelectItem value={CREATE_OPTION}>+ Buat produk baru</SelectItem>
            </SelectContent>
          </Select>
          {favoriteMode === CREATE_OPTION ? (
            <Input
              value={newFavoriteProductName}
              onChange={(e) => setNewFavoriteProductName(e.target.value)}
              placeholder="Nama produk baru"
              required
            />
          ) : null}
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
