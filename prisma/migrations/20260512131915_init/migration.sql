-- CreateTable
CREATE TABLE "VariantCombination" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "combination" JSONB NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantCombination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariantCombination_sku_key" ON "VariantCombination"("sku");

-- AddForeignKey
ALTER TABLE "VariantCombination" ADD CONSTRAINT "VariantCombination_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
