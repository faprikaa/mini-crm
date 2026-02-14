"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRow } from "../types";

interface UserFormProps {
  user?: UserRow;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  submitLabel: string;
}

export function UserForm({
  user,
  onSubmit,
  isPending,
  submitLabel,
}: UserFormProps) {
  const isEdit = !!user;
  const idPrefix = isEdit ? "edit" : "add";
  const passwordLabel = isEdit
    ? "Password (kosongkan jika tidak diubah)"
    : "Password";
  const passwordRequired = !isEdit;

  return (
    <form action={onSubmit} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={user.id} />}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Nama</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={user?.name}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          defaultValue={user?.email}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`}>{passwordLabel}</Label>
        <Input
          id={`${idPrefix}-password`}
          name="password"
          type="password"
          minLength={6}
          required={passwordRequired}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-role`}>Role</Label>
        <Select name="role" defaultValue={user?.role || "ADMIN"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="neutral">
            Batal
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
