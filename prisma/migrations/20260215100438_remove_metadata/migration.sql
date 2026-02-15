/*
  Warnings:

  - You are about to drop the `_CustomerToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductToPromoIdea` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PromoIdeaToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CustomerToTag" DROP CONSTRAINT "_CustomerToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_CustomerToTag" DROP CONSTRAINT "_CustomerToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToPromoIdea" DROP CONSTRAINT "_ProductToPromoIdea_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToPromoIdea" DROP CONSTRAINT "_ProductToPromoIdea_B_fkey";

-- DropForeignKey
ALTER TABLE "_PromoIdeaToTag" DROP CONSTRAINT "_PromoIdeaToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_PromoIdeaToTag" DROP CONSTRAINT "_PromoIdeaToTag_B_fkey";

-- DropTable
DROP TABLE "_CustomerToTag";

-- DropTable
DROP TABLE "_ProductToPromoIdea";

-- DropTable
DROP TABLE "_PromoIdeaToTag";

-- CreateTable
CREATE TABLE "_CustomerTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomerTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PromoIdeaProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PromoIdeaProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PromoIdeaTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PromoIdeaTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CustomerTags_B_index" ON "_CustomerTags"("B");

-- CreateIndex
CREATE INDEX "_PromoIdeaProducts_B_index" ON "_PromoIdeaProducts"("B");

-- CreateIndex
CREATE INDEX "_PromoIdeaTags_B_index" ON "_PromoIdeaTags"("B");

-- AddForeignKey
ALTER TABLE "_CustomerTags" ADD CONSTRAINT "_CustomerTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerTags" ADD CONSTRAINT "_CustomerTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromoIdeaProducts" ADD CONSTRAINT "_PromoIdeaProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromoIdeaProducts" ADD CONSTRAINT "_PromoIdeaProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "PromoIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromoIdeaTags" ADD CONSTRAINT "_PromoIdeaTags_A_fkey" FOREIGN KEY ("A") REFERENCES "PromoIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromoIdeaTags" ADD CONSTRAINT "_PromoIdeaTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
