"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser, deleteUser } from "./actions";
import { PageHeader } from "@/components/page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { UserForm } from "./_components/user-form";
import { getUserColumns } from "./_components/user-table";
import { UserRow } from "./types";

export function UsersClient({
  users,
  searchQuery,
}: {
  users: UserRow[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(search ? `/users?q=${encodeURIComponent(search)}` : "/users");
  }

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User berhasil ditambahkan!");
        setAddOpen(false);
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateUser(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User berhasil diupdate!");
        setEditOpen(false);
        setSelectedUser(null);
      }
    });
  }

  async function handleDelete() {
    if (!selectedUser) return;
    startTransition(async () => {
      await deleteUser(selectedUser.id);
      toast.success("User berhasil dihapus!");
      setDeleteOpen(false);
      setSelectedUser(null);
    });
  }

  const columns = useMemo(
    () =>
      getUserColumns({
        onEdit: (user) => {
          setSelectedUser(user);
          setEditOpen(true);
        },
        onDelete: (user) => {
          setSelectedUser(user);
          setDeleteOpen(true);
        },
      }),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Kelola akun admin">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-border shadow-shadow">
            <DialogHeader>
              <DialogTitle className="font-heading">Tambah User Baru</DialogTitle>
            </DialogHeader>
            <UserForm
              onSubmit={handleCreate}
              isPending={isPending}
              submitLabel="Simpan"
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="neutral">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      <DataTable
        columns={columns}
        data={users}
        emptyMessage={searchQuery ? "Tidak ada user ditemukan." : "Belum ada user."}
      />

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setSelectedUser(null); }}>
        <DialogContent className="border-2 border-border shadow-shadow">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onSubmit={handleUpdate}
              isPending={isPending}
              submitLabel="Update"
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedUser(null);
        }}
        title="Hapus User"
        itemName={selectedUser?.name}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
