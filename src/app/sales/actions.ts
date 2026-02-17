"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { revalidatePath } from "next/cache";

export async function createSale(formData: FormData) {
  await requireAuth();

  const productId = (formData.get("productId") as string)?.trim();
  const customerId = (formData.get("customerId") as string)?.trim() || null;
  const quantity = Number(formData.get("quantity"));
  const soldAtRaw = (formData.get("soldAt") as string)?.trim();

  if (!productId) {
    return { error: "Produk wajib dipilih." };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Quantity harus angka bulat lebih dari 0." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true },
  });

  if (!product) {
    return { error: "Produk tidak ditemukan." };
  }

  const soldAt = soldAtRaw ? new Date(soldAtRaw) : new Date();

  await prisma.sale.create({
    data: {
      productId,
      customerId,
      quantity,
      totalPrice: product.price * quantity,
      soldAt,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSale(formData: FormData) {
  await requireAuth();

  const id = (formData.get("id") as string)?.trim();
  const productId = (formData.get("productId") as string)?.trim();
  const customerId = (formData.get("customerId") as string)?.trim() || null;
  const quantity = Number(formData.get("quantity"));
  const soldAtRaw = (formData.get("soldAt") as string)?.trim();

  if (!id || !productId) {
    return { error: "Data sales tidak valid." };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Quantity harus angka bulat lebih dari 0." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true },
  });

  if (!product) {
    return { error: "Produk tidak ditemukan." };
  }

  const soldAt = soldAtRaw ? new Date(soldAtRaw) : new Date();

  await prisma.sale.update({
    where: { id },
    data: {
      productId,
      customerId,
      quantity,
      totalPrice: product.price * quantity,
      soldAt,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSale(id: string) {
  await requireAuth();

  if (!id) {
    return { error: "Data sales tidak valid." };
  }

  await prisma.sale.delete({ where: { id } });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: true };
}
