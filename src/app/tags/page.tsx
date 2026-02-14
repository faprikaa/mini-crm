import { prisma } from "@/lib/prisma";
import { TagsClient } from "./tags-client";

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const tags = await prisma.tag.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  return <TagsClient tags={tags} searchQuery={q ?? ""} />;
}
