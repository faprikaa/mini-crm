"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const favoriteDrink =
    (formData.get("favoriteDrink") as string)?.trim() || null;
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
      favoriteDrink,
      tags: {
        connect: tagIds.map((id) => ({ id })),
      },
    },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCustomer(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const favoriteDrink =
    (formData.get("favoriteDrink") as string)?.trim() || null;
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
      favoriteDrink,
      tags: {
        set: tagIds.map((tagId) => ({ id: tagId })),
      },
    },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/dashboard/customers");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { success: true };
}
