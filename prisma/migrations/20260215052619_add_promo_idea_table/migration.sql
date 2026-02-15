-- CreateTable
CREATE TABLE "PromoIdeaWeek" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "lastGeneratedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoIdeaWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoIdea" (
    "id" TEXT NOT NULL,
    "promoWeekId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "whyNow" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "bestTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoIdeaWeek_weekStart_key" ON "PromoIdeaWeek"("weekStart");

-- CreateIndex
CREATE INDEX "PromoIdea_promoWeekId_idx" ON "PromoIdea"("promoWeekId");

-- AddForeignKey
ALTER TABLE "PromoIdea" ADD CONSTRAINT "PromoIdea_promoWeekId_fkey" FOREIGN KEY ("promoWeekId") REFERENCES "PromoIdeaWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
