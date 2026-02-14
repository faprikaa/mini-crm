"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { createSale, deleteSale, updateSale } from "./actions";
import { getSaleColumns, type SaleRow } from "./_components/sale-columns";

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type CustomerOption = {
  id: string;
  name: string;
};

function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function SaleForm({
  sale,
  products,
  customers,
  onSubmit,
  submitLabel,
  isPending,
}: {
  sale?: SaleRow;
  products: ProductOption[];
  customers: CustomerOption[];
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
  isPending: boolean;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      {sale ? <input type="hidden" name="id" value={sale.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sale-product">Produk</Label>
          <select
            id="sale-product"
            name="productId"
            defaultValue={sale?.productId ?? ""}
            required
            className="w-full rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-base"
          >
            <option value="" disabled>
              Pilih produk
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sale-customer">Customer (opsional)</Label>
          <select
            id="sale-customer"
            name="customerId"
            defaultValue={sale?.customerId ?? ""}
            className="w-full rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-base"
          >
            <option value="">Walk-in / tanpa customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sale-quantity">Quantity</Label>
          <Input
            id="sale-quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            defaultValue={sale?.quantity ?? 1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sale-sold-at">Waktu sales</Label>
          <Input
            id="sale-sold-at"
            name="soldAt"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(sale?.soldAt ?? new Date())}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SalesClient({
  sales,
  products,
  customers,
  searchQuery,
}: {
  sales: SaleRow[];
  products: ProductOption[];
  customers: CustomerOption[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo(
    () =>
      getSaleColumns({
        onEdit: (sale) => {
          setSelectedSale(sale);
          setEditOpen(true);
        },
        onDelete: (sale) => {
          setSelectedSale(sale);
          setDeleteOpen(true);
        },
      }),
    []
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(search ? `/sales?q=${encodeURIComponent(search)}` : "/sales");
  }

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createSale(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Data sales berhasil ditambahkan!");
      setAddOpen(false);
    });
  }

  async function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateSale(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Data sales berhasil diupdate!");
      setEditOpen(false);
      setSelectedSale(null);
    });
  }

  async function handleDelete() {
    if (!selectedSale) return;

    startTransition(async () => {
      const result = await deleteSale(selectedSale.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Data sales berhasil dihapus!");
      setDeleteOpen(false);
      setSelectedSale(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description="Kelola transaksi sales Kopi Kita.">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Tambah Sales
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-border shadow-shadow sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Tambah Sales</DialogTitle>
            </DialogHeader>
            <SaleForm
              products={products}
              customers={customers}
              onSubmit={handleCreate}
              submitLabel="Simpan"
              isPending={isPending}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder="Cari produk / customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="neutral">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <DataTable
        columns={columns}
        data={sales}
        emptyMessage={searchQuery ? "Tidak ada data sales ditemukan." : "Belum ada data sales."}
      />

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedSale(null);
        }}
      >
        <DialogContent className="border-2 border-border shadow-shadow sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Sales</DialogTitle>
          </DialogHeader>
          {selectedSale ? (
            <SaleForm
              sale={selectedSale}
              products={products}
              customers={customers}
              onSubmit={handleUpdate}
              submitLabel="Update"
              isPending={isPending}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedSale(null);
        }}
        title="Hapus Sales"
        itemName={selectedSale?.productName}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
