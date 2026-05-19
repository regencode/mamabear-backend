import "dotenv/config";
import * as crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Product } from "../src/generated/prisma/client";
import { products, users, categories, highlights } from "./data.v2";
import { EmbeddingsService } from "@/embeddings/embeddings.service";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const REVIEW_TITLES = [
    "Bagus sekali!",
    "Sangat membantu",
    "Lumayan",
    "Produknya enak",
    "ASI lancar",
    "Recommended banget",
    "Cocok untuk busui",
    "Kualitas oke",
    "Puas dengan hasilnya",
    "Worth it",
    "Rasanya enak",
    "Efeknya terasa",
    "Sangat puas",
    "Good product",
    "Manfaatnya nyata",
];

const REVIEW_DESCRIPTIONS = [
    "Setelah konsumsi rutin, ASI saya jadi lancar. Terima kasih MamaBear!",
    "Rasanya enak dan mudah diseduh. Cocok untuk ibu menyusui.",
    "Produk ini benar-benar membantu produksi ASI saya. Sangat recommended!",
    "Awalnya ragu, tapi setelah coba hasilnya memuaskan. ASI jadi lebih banyak.",
    "Packagingnya rapi dan higienis. Produk berkualitas.",
    "Sudah beberapa kali beli, selalu puas. Bayi saya juga sehat-sehat saja.",
    "Rasanya enak, tidak terlalu manis. Pas untuk dikonsumsi setiap hari.",
    "Harga worth it dengan manfaat yang didapat. Akan beli lagi.",
    "Dokter juga merekomendasikan produk ini. Senang sudah mencoba.",
    "ASI saya meningkat drastis setelah 1 minggu konsumsi. Syukur banget.",
    "Suami saya yang belikan, dan saya tidak menyesal. Produk bagus!",
    "Sudah coba berbagai brand, ini yang paling cocok untuk saya.",
    "Kirimannya cepat dan packaging aman. Produk original.",
    "Sangat membantu di masa-masa awal menyusui. Terima kasih!",
    "Kualitasnya konsisten, tidak pernah mengecewakan.",
];

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number, daysAhead: number): Date {
    const now = Date.now();
    const offset = randInt(-daysAgo * 86400000, daysAhead * 86400000);
    return new Date(now + offset);
}

async function main() {
    const embedService = new EmbeddingsService();
    console.log("Seeding database...");

    console.log("Deleting existing data and resetting sequences...");
    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "ProductImage", "ProductVariant", "Discount", "Review", "Product", "Category", "Highlight", "User" RESTART IDENTITY CASCADE;`,
    );

    console.log("Inserting user data...");
    for (const user of users) {
        await prisma.user.create({ data: user });
    }
    console.log(`Inserted ${users.length} users.`);

    console.log("Inserting category data...");
    for (const category of categories) {
        await prisma.category.create({ data: category });
    }
    console.log(`Inserted ${categories.length} categories.`);

    console.log("Inserting highlight data...");
    for (const highlight of highlights) {
        await prisma.highlight.create({ data: highlight });
    }
    console.log(`Inserted ${highlights.length} highlights.`);

    console.log("Inserting product data...");
    const createdProducts: Product[] = [];
    const allVariantIds: number[] = [];

    for (const { images, variants, ...productData } of products) {
        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({ data: {...productData } });
            const embed = await embedService.generateEmbeddingsFromProduct(p);
            await tx.$executeRaw`
                UPDATE "Product" 
                SET embedding = ${embedService.embeddingArrayToString(embed)}::vector
                WHERE id = ${p.id}
            `;
            if (variants?.length) {
                for (const { images: variantImages, ...variantData } of variants) {
                    const v = await tx.productVariant.create({
                        data: { ...variantData, productId: p.id },
                    });
                    if (variantImages?.length) {
                        await tx.productImage.createMany({
                            data: variantImages.map((img: { imageUrl: string; sortOrder: number; altText?: string }) => ({
                                ...img,
                                publicId: crypto.randomUUID(),
                                productId: null,
                                variantId: v.id,
                            })),
                        });
                    }
                }
            }
            if (images?.length) {
                await tx.productImage.createMany({
                    data: images.map((img) => ({ ...img, publicId: crypto.randomUUID(), productId: p.id })),
                });
            }
            return p;
        });
        createdProducts.push(product);

        const createdVariants = await prisma.productVariant.findMany({
            where: { productId: product.id },
            select: { id: true },
        });
        allVariantIds.push(...createdVariants.map((v) => v.id));
    }
    console.log(`Inserted ${products.length} products.`);

    console.log("Inserting discount data...");
    const discountedVariantIds = allVariantIds
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.ceil(allVariantIds.length / 2));

    for (const variantId of discountedVariantIds) {
        const isPercent = Math.random() < 0.5;
        const isActive = Math.random() < 0.7;

        const startedAt = isActive
            ? randomDate(30, 0)
            : randomDate(0, 30);
        const endsAt = isActive
            ? randomDate(0, 60)
            : randomDate(31, 90);

        await prisma.discount.create({
            data: {
                variantId,
                amount: isPercent ? randInt(10, 20) : randInt(5000, 20000),
                isPercent,
                startedAt,
                endsAt,
            },
        });
    }
    console.log(`Inserted ${discountedVariantIds.length} discounts.`);

    console.log("Inserting review data...");
    const nonAdminUsers = await prisma.user.findMany({
        where: { role: "USER" },
        select: { id: true },
    });
    const reviewerIds = nonAdminUsers.map((u) => u.id);

    let totalReviews = 0;
    for (const product of createdProducts) {
        const reviewCount = randInt(5, 10);
        for (let i = 0; i < reviewCount; i++) {
            await prisma.review.create({
                data: {
                    title: pickRandom(REVIEW_TITLES),
                    description: pickRandom(REVIEW_DESCRIPTIONS),
                    rating: randFloat(3.0, 5.0),
                    numUpvotes: randInt(0, 50),
                    imageUrls: [],
                    reviewerId: pickRandom(reviewerIds),
                    productId: product.id,
                },
            });
        }
        totalReviews += reviewCount;
    }
    console.log(`Inserted ${totalReviews} reviews.`);

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
