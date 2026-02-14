import { prisma } from "@/lib/prisma";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;

  const [customers, tags, products] = await Promise.all([
    prisma.customer.findMany({
      where: {
        ...(q
          ? {
              name: { contains: q, mode: "insensitive" },
            }
          : {}),
        ...(tag
          ? {
              tags: {
                some: { id: tag },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        favoriteProduct: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <CustomersClient
      customers={customers}
      tags={tags}
      products={products}
      searchQuery={q ?? ""}
      selectedTagId={tag ?? ""}
    />
  );
}
