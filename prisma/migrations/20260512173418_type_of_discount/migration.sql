/*
  Warnings:

  - Added the required column `amount` to the `Discount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Discount" ADD COLUMN     "amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "isPercent" BOOLEAN NOT NULL DEFAULT false;
