"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { revalidatePath } from "next/cache";

async function resolveFavoriteProductId(formData: FormData) {
  const favoriteProductIdRaw =
    (formData.get("favoriteProductId") as string)?.trim() || "";
  const favoriteProductName =
    (formData.get("favoriteProductName") as string)?.trim() || "";

  if (favoriteProductIdRaw) {
    return favoriteProductIdRaw;
  }

  if (!favoriteProductName) {
    return null;
  }

  const existingProduct = await prisma.product.findFirst({
    where: {
      name: {
        equals: favoriteProductName,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existingProduct) {
    return existingProduct.id;
  }

  const createdProduct = await prisma.product.create({
    data: {
      name: favoriteProductName,
      price: 0,
      category: "Custom Favorite",
    },
    select: { id: true },
  });

  return createdProduct.id;
}

export async function createCustomer(formData: FormData) {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const favoriteProductId = await resolveFavoriteProductId(formData);
  const tagIds = formData
    .getAll("tagIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!name) {
    return { error: "Nama pelanggan wajib diisi." };
  }

  await prisma.customer.create({
    data: {
      name,
      email,
      phone,
      favoriteProductId,
      customerTags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return { success: true };
}

export async function updateCustomer(formData: FormData) {
  await requireAuth();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const favoriteProductId = await resolveFavoriteProductId(formData);
  const tagIds = formData
    .getAll("tagIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!id || !name) {
    return { error: "Nama pelanggan wajib diisi." };
  }

  await prisma.customer.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      favoriteProductId,
      customerTags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await requireAuth();

  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { success: true };
}
