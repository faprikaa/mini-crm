import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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

  const tags = await prisma.tag.findMany({
    select: { id: true, name: true },
  });

  const tagByName = new Map(tags.map((tag) => [tag.name, tag.id]));

  const customerSeeds = [
    {
      name: "Dian Pratama",
      email: "dian@contoh.id",
      phone: "081234567801",
      favoriteDrink: "Caramel Cold Brew",
      tags: ["Sweet Drinks", "Caramel", "Morning Buyer"],
    },
    {
      name: "Maya Sari",
      email: "maya@contoh.id",
      phone: "081234567802",
      favoriteDrink: "Oat Latte",
      tags: ["Oat Milk", "Pastry Lover", "Member VIP"],
    },
    {
      name: "Rizky Fadhil",
      email: "rizky@contoh.id",
      phone: "081234567803",
      favoriteDrink: "Espresso",
      tags: ["Espresso", "Single Origin", "Morning Buyer"],
    },
    {
      name: "Nadia Putri",
      email: "nadia@contoh.id",
      phone: "081234567804",
      favoriteDrink: "Matcha Oat Latte",
      tags: ["Oat Milk", "Sweet Drinks", "New Menu"],
    },
    {
      name: "Andri Kusuma",
      email: "andri@contoh.id",
      phone: "081234567805",
      favoriteDrink: "Croissant + Latte",
      tags: ["Pastry Lover", "Latte Art", "Promo Mingguan"],
    },
    {
      name: "Salsa Rahma",
      email: "salsa@contoh.id",
      phone: "081234567806",
      favoriteDrink: "Workshop Brew Set",
      tags: ["Workshop", "Pour Over", "Member VIP"],
    },
  ];

  await prisma.customer.deleteMany();

  for (const customer of customerSeeds) {
    await prisma.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        favoriteDrink: customer.favoriteDrink,
        tags: {
          connect: customer.tags
            .map((tagName) => tagByName.get(tagName))
            .filter((id): id is string => Boolean(id))
            .map((id) => ({ id })),
        },
      },
    });
  }

  console.log(`✓ ${customerSeeds.length} customers seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
