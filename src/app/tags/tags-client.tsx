"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { createTag, updateTag, deleteTag } from "./actions";
import { PageHeader } from "@/components/page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { TagQuickAdd } from "./_components/tag-quick-add";
import { getTagColumns, type TagRow } from "./_components/tag-table";
import { TagEditDialog } from "./_components/tag-edit-dialog";

export function TagsClient({
  tags,
  searchQuery,
}: {
  tags: TagRow[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      search
        ? `/tags?q=${encodeURIComponent(search)}`
        : "/tags"
    );
  }

  async function handleQuickAdd(formData: FormData) {
    startTransition(async () => {
      const result = await createTag(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tag berhasil ditambahkan!");
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateTag(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tag berhasil diupdate!");
        setEditOpen(false);
        setSelectedTag(null);
      }
    });
  }

  async function handleDelete() {
    if (!selectedTag) return;
    startTransition(async () => {
      await deleteTag(selectedTag.id);
      toast.success("Tag berhasil dihapus!");
      setDeleteOpen(false);
      setSelectedTag(null);
    });
  }

  const columns = useMemo(
    () =>
      getTagColumns({
        onEdit: (tag) => {
          setSelectedTag(tag);
          setEditOpen(true);
        },
        onDelete: (tag) => {
          setSelectedTag(tag);
          setDeleteOpen(true);
        },
      }),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="Kelola interest tags pelanggan"
      />

      <TagQuickAdd onSubmit={handleQuickAdd} isPending={isPending} />

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder="Cari tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="neutral">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      <DataTable
        columns={columns}
        data={tags}
        emptyMessage={searchQuery ? "Tidak ada tag ditemukan." : "Belum ada tag. Tambahkan di atas!"}
      />

      <TagEditDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedTag(null);
        }}
        tag={selectedTag}
        onSubmit={handleUpdate}
        isPending={isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedTag(null);
        }}
        title="Hapus Tag"
        itemName={selectedTag?.name}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
