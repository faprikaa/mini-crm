import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { normalizeDatabaseUrl } from "../src/lib/database-url";

const adapter = new PrismaPg({
  connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const schema = z.object({
  tags: z.array(z.object({ name: z.string().min(2).max(40) })).max(20),
  products: z
    .array(
      z.object({
        name: z.string().min(2).max(60),
        price: z.number().int().min(10000).max(120000),
        category: z.string().min(2).max(40),
        description: z.string().min(8).max(180),
      })
    )
    .max(20),
  customers: z
    .array(
      z.object({
        name: z.string().min(2).max(60),
        email: z.string().email(),
        phone: z.string().min(8).max(20),
        favoriteProductName: z.string().min(2).max(60),
        tags: z.array(z.string().min(2).max(40)).min(1).max(4),
      })
    )
    .max(40),
  sales: z
    .array(
      z.object({
        productName: z.string().min(2).max(60),
        customerEmail: z.string().email().nullable(),
        quantity: z.number().int().min(1).max(5),
      })
    )
    .max(200),
});

type GenerationMode = "new" | "existing" | "mixed";

function getArg(name: string) {
  const prefixed = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefixed))?.slice(prefixed.length);
}

function getMode(): GenerationMode {
  const mode = getArg("mode");
  if (mode === "new" || mode === "existing" || mode === "mixed") {
    return mode;
  }
  return "mixed";
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomSoldAtWithinLast30Days() {
  const now = new Date();
  const earliest = new Date(now);
  earliest.setDate(now.getDate() - 30);
  const time = randomInt(earliest.getTime(), now.getTime());
  return new Date(time);
}

function normalizeTagName(tagName: string) {
  return tagName.trim().replace(/\s+/g, " ");
}

function makeGeneratedEmailLocalPart(name: string, index: number) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, ".")
    .slice(0, 20);
  return `${base || "customer"}.${index + 1}`;
}

async function main() {
  const aiApiKey = process.env.AI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL;
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  if (!aiApiKey) {
    throw new Error("AI_API_KEY is required for AI dummy generation.");
  }

  const mode = getMode();
  const existingTags = await prisma.tag.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const existingProducts = await prisma.product.findMany({
    select: { id: true, name: true, price: true, category: true, description: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const existingCustomers = await prisma.customer.findMany({
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const model = new ChatOpenAI({
    apiKey: aiApiKey,
    configuration: {
      baseURL: aiBaseUrl,
    },
    model: aiModel,
    temperature: 0.8
  });

  const modelWithSchema = model.withStructuredOutput(schema);

  const prompt = [
    "Generate realistic Indonesian coffee-shop CRM dummy data.",
    "Output must match the required schema exactly.",
    "Mode controls behavior:",
    "- new: prioritize brand-new entities",
    "- existing: prioritize current entities and references",
    "- mixed: combine both",
    `Mode: ${mode}`,
    "Use Bahasa Indonesia naming style and plausible values.",
    "Sales soldAt is NOT needed; the script will randomize dates in the last 30 days.",
    "",
    "Existing tags:",
    JSON.stringify(existingTags.map((t) => t.name), null, 2),
    "",
    "Existing products:",
    JSON.stringify(existingProducts.map((p) => ({ name: p.name, category: p.category })), null, 2),
    "",
    "Existing customers:",
    JSON.stringify(
      existingCustomers.map((c) => ({ name: c.name, email: c.email, phone: c.phone })),
      null,
      2
    ),
    "",
    "Target sizes: 8 tags, 10 products, 16 customers, 80 sales.",
  ].join("\n");

  const generated = schema.parse(await modelWithSchema.invoke(prompt));

  const tagNamesNew = generated.tags.map((tag) => normalizeTagName(tag.name));
  const tagNamesExisting = existingTags.map((tag) => tag.name);

  const selectedTagNames =
    mode === "new"
      ? tagNamesNew
      : mode === "existing"
        ? tagNamesExisting.length > 0
          ? tagNamesExisting
          : tagNamesNew
        : Array.from(new Set([...tagNamesExisting, ...tagNamesNew]));

  for (const tagName of selectedTagNames) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }

  const allTags = await prisma.tag.findMany({ select: { id: true, name: true } });
  const tagByName = new Map(allTags.map((tag) => [tag.name, tag.id]));

  const productCandidates =
    mode === "existing"
      ? existingProducts.length > 0
        ? existingProducts.map((p) => ({
          name: p.name,
          price: p.price,
          category: p.category ?? "Coffee",
          description: p.description ?? "Menu favorit pelanggan.",
        }))
        : generated.products
      : mode === "mixed"
        ? [...generated.products, ...existingProducts.map((p) => ({
          name: p.name,
          price: p.price,
          category: p.category ?? "Coffee",
          description: p.description ?? "Menu favorit pelanggan.",
        }))]
        : generated.products;

  for (const product of productCandidates) {
    const existing = await prisma.product.findFirst({
      where: { name: { equals: product.name, mode: "insensitive" } },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          price: product.price,
          category: product.category,
          description: product.description,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: product.name,
          price: product.price,
          category: product.category,
          description: product.description,
        },
      });
    }
  }

  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, price: true },
  });
  const productByName = new Map(allProducts.map((product) => [product.name, product]));

  const customerCandidates =
    mode === "existing"
      ? existingCustomers.length > 0
        ? existingCustomers.map((customer, index) => ({
          name: customer.name,
          email:
            customer.email ?? `${makeGeneratedEmailLocalPart(customer.name, index)}@contoh.id`,
          phone: customer.phone ?? `08${randomInt(1000000000, 9999999999)}`,
          favoriteProductName: randomItem(allProducts).name,
          tags: selectedTagNames.slice(0, Math.min(3, selectedTagNames.length)),
        }))
        : generated.customers
      : mode === "mixed"
        ? [...generated.customers]
        : generated.customers;

  const createdCustomers: { id: string; email: string }[] = [];
  for (const customer of customerCandidates) {
    const favorite = productByName.get(customer.favoriteProductName) ?? randomItem(allProducts);
    const tagConnect = customer.tags
      .map((tagName) => tagByName.get(normalizeTagName(tagName)))
      .filter((id): id is string => Boolean(id))
      .slice(0, 4)
      .map((id) => ({ id }));

    const created = await prisma.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        favoriteProductId: favorite.id,
        tags: { connect: tagConnect },
      },
      select: { id: true, email: true },
    });

    if (created.email) {
      createdCustomers.push({ id: created.id, email: created.email });
    }
  }

  const existingCustomerPool = existingCustomers
    .filter((customer): customer is { id: string; email: string; name: string; phone: string | null } =>
      Boolean(customer.email)
    )
    .map((customer) => ({ id: customer.id, email: customer.email }));

  const customerPool =
    mode === "new"
      ? createdCustomers
      : mode === "existing"
        ? existingCustomerPool.length > 0
          ? existingCustomerPool
          : createdCustomers
        : [...existingCustomerPool, ...createdCustomers];

  const salesPlan = generated.sales.length > 0 ? generated.sales : [];
  const salesToCreate = salesPlan.length > 0 ? salesPlan : Array.from({ length: 80 }, () => ({
    productName: randomItem(allProducts).name,
    customerEmail: customerPool.length > 0 && Math.random() > 0.3 ? randomItem(customerPool).email : null,
    quantity: randomInt(1, 4),
  }));

  const customerByEmail = new Map(customerPool.map((customer) => [customer.email, customer.id]));

  for (const sale of salesToCreate) {
    const product = productByName.get(sale.productName) ?? randomItem(allProducts);
    const customerId = sale.customerEmail ? customerByEmail.get(sale.customerEmail) ?? null : null;
    const quantity = Math.max(1, Math.min(5, sale.quantity));

    await prisma.sale.create({
      data: {
        productId: product.id,
        customerId,
        quantity,
        totalPrice: product.price * quantity,
        soldAt: randomSoldAtWithinLast30Days(),
      },
    });
  }

  console.log(`✓ AI dummy generation completed (mode=${mode})`);
  console.log(`  - tags processed: ${selectedTagNames.length}`);
  console.log(`  - products processed: ${productCandidates.length}`);
  console.log(`  - customers created: ${customerCandidates.length}`);
  console.log(`  - sales created: ${salesToCreate.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
