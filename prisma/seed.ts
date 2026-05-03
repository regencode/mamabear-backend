import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { products, users } from "./data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Seeding database...");

  console.log("Deleting existing data and resetting sequences...");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "ProductImage", "ProductVariant", "Product", "Category", "User" RESTART IDENTITY CASCADE;`,
  );

  console.log("Inserting user data...");
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  console.log(`Inserted ${users.length} users.`);

  console.log("Inserting product data...");
  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log(`Inserted ${products.length} products.`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
