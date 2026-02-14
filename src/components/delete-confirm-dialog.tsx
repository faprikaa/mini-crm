"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string | undefined;
  onConfirm: () => void;
  isPending: boolean;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  itemName,
  onConfirm,
  isPending,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-border shadow-shadow">
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>
        <p className="font-base">
          Yakin ingin menghapus <strong>{itemName}</strong>? Aksi ini tidak bisa
          dibatalkan.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="neutral">Batal</Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="border-2 border-border bg-destructive text-destructive-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
          >
            {isPending ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
