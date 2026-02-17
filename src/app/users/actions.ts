"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Semua field wajib diisi." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email sudah terdaftar." };
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  revalidatePath("/users");
  return { success: true };
}

export async function updateUser(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!id || !name || !email) {
    return { error: "Nama dan email wajib diisi." };
  }

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  });
  if (existing) {
    return { error: "Email sudah digunakan user lain." };
  }

  const data: { name: string; email: string; password?: string } = {
    name,
    email,
  };

  if (password) {
    data.password = await hash(password, 12);
  }

  await prisma.user.update({ where: { id }, data });

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  return { success: true };
}
