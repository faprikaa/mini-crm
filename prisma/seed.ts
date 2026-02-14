import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { normalizeDatabaseUrl } from "../src/lib/database-url";

const adapter = new PrismaPg({
  connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kopikita.com" },
    update: {},
    create: {
      name: "Admin Kopi Kita",
      email: "admin@kopikita.com",
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`✓ Admin user: ${admin.email}`);

  const tagNames = [
    "Espresso",
    "Latte Art",
    "Cold Brew",
    "Single Origin",
    "Pour Over",
    "Sweet Drinks",
    "Caramel",
    "Oat Milk",
    "Pastry Lover",
    "Morning Buyer",
    "Promo Mingguan",
    "Member VIP",
    "Workshop",
    "New Menu",
  ];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✓ ${tagNames.length} tags created`);

  const productSeeds = [
    {
      name: "Espresso",
      price: 22000,
      category: "Coffee",
      description: "Shot espresso klasik dengan body kuat.",
    },
    {
      name: "Oat Latte",
      price: 36000,
      category: "Coffee",
      description: "Latte creamy dengan susu oat.",
    },
    {
      name: "Caramel Cold Brew",
      price: 34000,
      category: "Cold Coffee",
      description: "Cold brew manis dengan sentuhan caramel.",
    },
    {
      name: "Matcha Oat Latte",
      price: 38000,
      category: "Non Coffee",
      description: "Matcha premium dengan susu oat.",
    },
    {
      name: "Pour Over",
      price: 32000,
      category: "Manual Brew",
      description: "Single cup pour over sesuai origin pilihan.",
    },
    {
      name: "Croissant",
      price: 24000,
      category: "Pastry",
      description: "Butter croissant renyah untuk pairing kopi.",
    },
  ];

  for (const product of productSeeds) {
    const existing = await prisma.product.findFirst({
      where: {
        name: {
          equals: product.name,
          mode: "insensitive",
        },
      },
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
      await prisma.product.create({ data: product });
    }
  }

  console.log(`✓ ${productSeeds.length} products seeded`);

  const tags = await prisma.tag.findMany({
    select: { id: true, name: true },
  });

  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true },
  });

  const tagByName = new Map(tags.map((tag) => [tag.name, tag.id]));
  const productByName = new Map(products.map((product) => [product.name, product]));

  const customerSeeds = [
    {
      name: "Dian Pratama",
      email: "dian@contoh.id",
      phone: "081234567801",
      favoriteProductName: "Caramel Cold Brew",
      tags: ["Sweet Drinks", "Caramel", "Morning Buyer"],
    },
    {
      name: "Maya Sari",
      email: "maya@contoh.id",
      phone: "081234567802",
      favoriteProductName: "Oat Latte",
      tags: ["Oat Milk", "Pastry Lover", "Member VIP"],
    },
    {
      name: "Rizky Fadhil",
      email: "rizky@contoh.id",
      phone: "081234567803",
      favoriteProductName: "Espresso",
      tags: ["Espresso", "Single Origin", "Morning Buyer"],
    },
    {
      name: "Nadia Putri",
      email: "nadia@contoh.id",
      phone: "081234567804",
      favoriteProductName: "Matcha Oat Latte",
      tags: ["Oat Milk", "Sweet Drinks", "New Menu"],
    },
    {
      name: "Andri Kusuma",
      email: "andri@contoh.id",
      phone: "081234567805",
      favoriteProductName: "Croissant",
      tags: ["Pastry Lover", "Latte Art", "Promo Mingguan"],
    },
    {
      name: "Salsa Rahma",
      email: "salsa@contoh.id",
      phone: "081234567806",
      favoriteProductName: "Pour Over",
      tags: ["Workshop", "Pour Over", "Member VIP"],
    },
  ];

  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();

  const customersByEmail = new Map<string, { id: string; name: string }>();

  for (const customer of customerSeeds) {
    const createdCustomer = await prisma.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        favoriteProductId:
          productByName.get(customer.favoriteProductName)?.id ?? null,
        tags: {
          connect: customer.tags
            .map((tagName) => tagByName.get(tagName))
            .filter((id): id is string => Boolean(id))
            .map((id) => ({ id })),
        },
      },
    });

    customersByEmail.set(customer.email, {
      id: createdCustomer.id,
      name: createdCustomer.name,
    });
  }

  console.log(`✓ ${customerSeeds.length} customers seeded`);

  const saleSeeds = [
    {
      productName: "Caramel Cold Brew",
      customerEmail: "dian@contoh.id",
      quantity: 2,
      soldAt: new Date("2026-02-10T08:30:00+07:00"),
    },
    {
      productName: "Oat Latte",
      customerEmail: "maya@contoh.id",
      quantity: 1,
      soldAt: new Date("2026-02-10T14:10:00+07:00"),
    },
    {
      productName: "Espresso",
      customerEmail: "rizky@contoh.id",
      quantity: 3,
      soldAt: new Date("2026-02-11T07:55:00+07:00"),
    },
    {
      productName: "Matcha Oat Latte",
      customerEmail: "nadia@contoh.id",
      quantity: 2,
      soldAt: new Date("2026-02-12T16:20:00+07:00"),
    },
    {
      productName: "Croissant",
      customerEmail: "andri@contoh.id",
      quantity: 2,
      soldAt: new Date("2026-02-12T09:15:00+07:00"),
    },
    {
      productName: "Pour Over",
      customerEmail: "salsa@contoh.id",
      quantity: 1,
      soldAt: new Date("2026-02-13T11:45:00+07:00"),
    },
    {
      productName: "Oat Latte",
      customerEmail: null,
      quantity: 1,
      soldAt: new Date("2026-02-13T18:30:00+07:00"),
    },
    {
      productName: "Espresso",
      customerEmail: null,
      quantity: 2,
      soldAt: new Date("2026-02-14T08:05:00+07:00"),
    },
  ];

  for (const sale of saleSeeds) {
    const product = productByName.get(sale.productName);
    if (!product) continue;

    const customer = sale.customerEmail
      ? customersByEmail.get(sale.customerEmail)
      : null;

    await prisma.sale.create({
      data: {
        productId: product.id,
        customerId: customer?.id ?? null,
        quantity: sale.quantity,
        totalPrice: product.price * sale.quantity,
        soldAt: sale.soldAt,
      },
    });
  }

  console.log(`✓ ${saleSeeds.length} sales seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
