"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { CustomerForm } from "./_components/customer-form";
import { CustomerFilterSheet } from "./_components/customer-filter-sheet";
import { getCustomerColumns, type CustomerRow, type CustomerTag } from "./_components/customer-columns";
import { createCustomer, deleteCustomer, updateCustomer } from "./actions";

export function CustomersClient({
  customers,
  tags,
  searchQuery,
  selectedTagId,
}: {
  customers: CustomerRow[];
  tags: CustomerTag[];
  searchQuery: string;
  selectedTagId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [tagFilter, setTagFilter] = useState(selectedTagId);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRow | null>(null);
  const [isPending, startTransition] = useTransition();



  function applyFilters(nextSearch: string, nextTag: string) {
    const params = new URLSearchParams();

    if (nextSearch.trim()) {
      params.set("q", nextSearch.trim());
    }

    if (nextTag) {
      params.set("tag", nextTag);
    }

    const queryString = params.toString();
    router.push(
      queryString ? `/customers?${queryString}` : "/customers"
    );
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters(search, tagFilter);
  }

  function handleTagFilter(nextValue: string) {
    const value = nextValue === "all" ? "" : nextValue;
    setTagFilter(value);
    applyFilters(search, value);
  }

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createCustomer(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pelanggan berhasil ditambahkan!");
        setAddOpen(false);
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateCustomer(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pelanggan berhasil diupdate!");
        setEditOpen(false);
        setSelectedCustomer(null);
      }
    });
  }

  async function handleDelete() {
    if (!selectedCustomer) return;

    startTransition(async () => {
      await deleteCustomer(selectedCustomer.id);
      toast.success("Pelanggan berhasil dihapus!");
      setDeleteOpen(false);
      setSelectedCustomer(null);
    });
  }

  const columns = useMemo(
    () =>
      getCustomerColumns({
        onEdit: (customer) => {
          setSelectedCustomer(customer);
          setEditOpen(true);
        },
        onDelete: (customer) => {
          setSelectedCustomer(customer);
          setDeleteOpen(true);
        },
      }),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer List"
        description="Kelola pelanggan, minat, dan preferensi produk."
      >
        <div className="flex items-center gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Tambah Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-border shadow-shadow sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-heading">Tambah Customer Baru</DialogTitle>
              </DialogHeader>
              <CustomerForm
                tags={tags}
                onSubmit={handleCreate}
                submitLabel={isPending ? "Menyimpan..." : "Simpan"}
                isPending={isPending}
              />
            </DialogContent>
          </Dialog>

          <CustomerFilterSheet
            searchQuery={searchQuery}
            selectedTagId={selectedTagId}
            tags={tags}
            customersCount={customers.length}
          />
        </div>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Cari nama customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="neutral">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Select value={tagFilter || "all"} onValueChange={handleTagFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter minat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua minat</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={customers} />

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedCustomer(null);
        }}
      >
        <DialogContent className="border-2 border-border shadow-shadow sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Customer</DialogTitle>
          </DialogHeader>
          {selectedCustomer ? (
            <CustomerForm
              key={selectedCustomer.id}
              customer={selectedCustomer}
              tags={tags}
              onSubmit={handleUpdate}
              submitLabel={isPending ? "Menyimpan..." : "Update"}
              isPending={isPending}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedCustomer(null);
        }}
        title="Hapus Customer"
        itemName={selectedCustomer?.name}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
