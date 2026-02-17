"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { revalidatePath } from "next/cache";

export async function createTag(formData: FormData) {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { error: "Nama tag wajib diisi." };
  }

  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) {
    return { error: "Tag sudah ada." };
  }

  await prisma.tag.create({ data: { name } });

  revalidatePath("/tags");
  return { success: true };
}

export async function updateTag(formData: FormData) {
  await requireAuth();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id || !name) {
    return { error: "Nama tag wajib diisi." };
  }

  const existing = await prisma.tag.findFirst({
    where: { name, NOT: { id } },
  });
  if (existing) {
    return { error: "Tag dengan nama tersebut sudah ada." };
  }

  await prisma.tag.update({ where: { id }, data: { name } });

  revalidatePath("/tags");
  return { success: true };
}

export async function deleteTag(id: string) {
  await requireAuth();

  await prisma.tag.delete({ where: { id } });
  revalidatePath("/tags");
  return { success: true };
}
