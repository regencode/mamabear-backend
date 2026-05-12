/*
  Warnings:

  - You are about to drop the column `attachmentUrl` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "attachmentUrl",
ADD COLUMN     "imageUrls" TEXT[];
