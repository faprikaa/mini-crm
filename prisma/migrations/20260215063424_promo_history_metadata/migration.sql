-- AlterTable
ALTER TABLE "PromoIdeaWeek" ADD COLUMN     "generatedById" TEXT;

-- CreateTable
CREATE TABLE "_ProductToPromoIdea" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToPromoIdea_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PromoIdeaToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PromoIdeaToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductToPromoIdea_B_index" ON "_ProductToPromoIdea"("B");

-- CreateIndex
CREATE INDEX "_PromoIdeaToTag_B_index" ON "_PromoIdeaToTag"("B");

-- CreateIndex
CREATE INDEX "PromoIdeaWeek_generatedById_idx" ON "PromoIdeaWeek"("generatedById");

-- AddForeignKey
ALTER TABLE "PromoIdeaWeek" ADD CONSTRAINT "PromoIdeaWeek_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPromoIdea" ADD CONSTRAINT "_ProductToPromoIdea_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPromoIdea" ADD CONSTRAINT "_ProductToPromoIdea_B_fkey" FOREIGN KEY ("B") REFERENCES "PromoIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromoIdeaToTag" ADD CONSTRAINT "_PromoIdeaToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "PromoIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromoIdeaToTag" ADD CONSTRAINT "_PromoIdeaToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
