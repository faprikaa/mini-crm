/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `_CustomerTags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PromoIdeaProducts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PromoIdeaTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CustomerTags" DROP CONSTRAINT "_CustomerTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_CustomerTags" DROP CONSTRAINT "_CustomerTags_B_fkey";

-- DropForeignKey
ALTER TABLE "_PromoIdeaProducts" DROP CONSTRAINT "_PromoIdeaProducts_A_fkey";

-- DropForeignKey
ALTER TABLE "_PromoIdeaProducts" DROP CONSTRAINT "_PromoIdeaProducts_B_fkey";

-- DropForeignKey
ALTER TABLE "_PromoIdeaTags" DROP CONSTRAINT "_PromoIdeaTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_PromoIdeaTags" DROP CONSTRAINT "_PromoIdeaTags_B_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";

-- DropTable
DROP TABLE "_CustomerTags";

-- DropTable
DROP TABLE "_PromoIdeaProducts";

-- DropTable
DROP TABLE "_PromoIdeaTags";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "CustomerTag" (
    "customerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("customerId","tagId")
);

-- CreateTable
CREATE TABLE "PromoIdeaTag" (
    "promoIdeaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PromoIdeaTag_pkey" PRIMARY KEY ("promoIdeaId","tagId")
);

-- CreateTable
CREATE TABLE "PromoIdeaProduct" (
    "promoIdeaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PromoIdeaProduct_pkey" PRIMARY KEY ("promoIdeaId","productId")
);

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoIdeaTag" ADD CONSTRAINT "PromoIdeaTag_promoIdeaId_fkey" FOREIGN KEY ("promoIdeaId") REFERENCES "PromoIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoIdeaTag" ADD CONSTRAINT "PromoIdeaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoIdeaProduct" ADD CONSTRAINT "PromoIdeaProduct_promoIdeaId_fkey" FOREIGN KEY ("promoIdeaId") REFERENCES "PromoIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoIdeaProduct" ADD CONSTRAINT "PromoIdeaProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
