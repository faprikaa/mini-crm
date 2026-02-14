"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export type TagRow = {
  id: string;
  name: string;
  createdAt: Date;
};

interface TagEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: TagRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  isPending: boolean;
}

export function TagEditDialog({
  open,
  onOpenChange,
  tag,
  onSubmit,
  isPending,
}: TagEditDialogProps) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="border-2 border-border shadow-shadow">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Tag</DialogTitle>
        </DialogHeader>
        {tag && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={tag.id} />
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Nama Tag</Label>
              <Input
                id="edit-tag-name"
                name="name"
                defaultValue={tag.name}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="neutral">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
