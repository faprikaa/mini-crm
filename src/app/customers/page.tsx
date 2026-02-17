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
            customerTags: {
              some: { tagId: tag },
            },
          }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        favoriteProduct: {
          select: {
            id: true,
            name: true,
          },
        },
        customerTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { tag: { name: "asc" } },
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

  const mappedCustomers = customers.map((customer) => ({
    ...customer,
    tags: customer.customerTags.map((ct) => ct.tag),
  }));

  return (
    <CustomersClient
      customers={mappedCustomers}
      tags={tags}
      products={products}
      searchQuery={q ?? ""}
      selectedTagId={tag ?? ""}
    />
  );
}
