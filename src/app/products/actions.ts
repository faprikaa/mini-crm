"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const priceValue = Number(formData.get("price"));

  if (!name) {
    return { error: "Nama produk wajib diisi." };
  }

  if (!Number.isInteger(priceValue) || priceValue < 0) {
    return { error: "Harga produk harus berupa angka bulat 0 atau lebih." };
  }

  await prisma.product.create({
    data: {
      name,
      category,
      description,
      price: priceValue,
    },
  });

  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/customers");
  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const priceValue = Number(formData.get("price"));

  if (!id || !name) {
    return { error: "Nama produk wajib diisi." };
  }

  if (!Number.isInteger(priceValue) || priceValue < 0) {
    return { error: "Harga produk harus berupa angka bulat 0 atau lebih." };
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      category,
      description,
      price: priceValue,
    },
  });

  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteProduct(id: string) {
  if (!id) {
    return { error: "Produk tidak valid." };
  }

  const saleCount = await prisma.sale.count({ where: { productId: id } });
  if (saleCount > 0) {
    return { error: "Produk sudah dipakai di data penjualan." };
  }

  await prisma.customer.updateMany({
    where: { favoriteProductId: id },
    data: { favoriteProductId: null },
  });

  await prisma.product.delete({ where: { id } });

  revalidatePath("/products");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { success: true };
}
