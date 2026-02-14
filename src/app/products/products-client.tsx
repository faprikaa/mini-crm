"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProduct, deleteProduct, updateProduct } from "./actions";
import { getProductColumns, type ProductRow } from "./_components/product-columns";

function ProductForm({
  product,
  onSubmit,
  submitLabel,
  isPending,
}: {
  product?: ProductRow;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
  isPending: boolean;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-name">Nama produk</Label>
          <Input id="product-name" name="name" defaultValue={product?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-price">Harga</Label>
          <Input
            id="product-price"
            name="price"
            type="number"
            min={1}
            step={1}
            defaultValue={product?.price}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-category">Kategori (opsional)</Label>
        <Input id="product-category" name="category" defaultValue={product?.category ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-description">Deskripsi (opsional)</Label>
        <Textarea
          id="product-description"
          name="description"
          defaultValue={product?.description ?? ""}
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProductsClient({
  products,
  searchQuery,
}: {
  products: ProductRow[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo(
    () =>
      getProductColumns({
        onEdit: (product) => {
          setSelectedProduct(product);
          setEditOpen(true);
        },
        onDelete: (product) => {
          setSelectedProduct(product);
          setDeleteOpen(true);
        },
      }),
    []
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(search ? `/products?q=${encodeURIComponent(search)}` : "/products");
  }

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createProduct(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Produk berhasil ditambahkan!");
      setAddOpen(false);
    });
  }

  async function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateProduct(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Produk berhasil diupdate!");
      setEditOpen(false);
      setSelectedProduct(null);
    });
  }

  async function handleDelete() {
    if (!selectedProduct) return;

    startTransition(async () => {
      const result = await deleteProduct(selectedProduct.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Produk berhasil dihapus!");
      setDeleteOpen(false);
      setSelectedProduct(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Kelola menu produk Kopi Kita.">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-border shadow-shadow sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Tambah Produk</DialogTitle>
            </DialogHeader>
            <ProductForm
              onSubmit={handleCreate}
              submitLabel="Simpan"
              isPending={isPending}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder="Cari nama / kategori produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="neutral">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <DataTable
        columns={columns}
        data={products}
        emptyMessage={searchQuery ? "Tidak ada produk ditemukan." : "Belum ada produk."}
      />

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedProduct(null);
        }}
      >
        <DialogContent className="border-2 border-border shadow-shadow sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Produk</DialogTitle>
          </DialogHeader>
          {selectedProduct ? (
            <ProductForm
              product={selectedProduct}
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
          if (!open) setSelectedProduct(null);
        }}
        title="Hapus Produk"
        itemName={selectedProduct?.name}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
