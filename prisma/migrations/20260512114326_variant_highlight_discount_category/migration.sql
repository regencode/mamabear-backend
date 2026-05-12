/*
  Warnings:

  - You are about to drop the column `price_idr` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weight_g` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price_idr` on the `ProductVariant` table. All the data in the column will be lost.
  - Added the required column `ingredients` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageInstructions` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceIdr` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weightG` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price_idr",
DROP COLUMN "sku",
DROP COLUMN "stock",
DROP COLUMN "weight_g",
ADD COLUMN     "highlightId" INTEGER,
ADD COLUMN     "ingredients" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "usageInstructions" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "variantId" INTEGER,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "price_idr",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priceIdr" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "weightG" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Discount" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discount_variantId_key" ON "Discount"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Highlight_slug_key" ON "Highlight"("slug");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Highlight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
