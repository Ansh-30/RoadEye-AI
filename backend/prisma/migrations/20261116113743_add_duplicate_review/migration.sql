-- CreateEnum
CREATE TYPE "DuplicateReviewDecision" AS ENUM ('DUPLICATE', 'NOT_DUPLICATE');

-- CreateTable
CREATE TABLE "DuplicateReview" (
    "id" TEXT NOT NULL,
    "reportAId" TEXT NOT NULL,
    "reportBId" TEXT NOT NULL,
    "decision" "DuplicateReviewDecision" NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateReview_reportAId_reportBId_key" ON "DuplicateReview"("reportAId", "reportBId");

-- Require callers to store each unordered pair in canonical ID order.
ALTER TABLE "DuplicateReview"
ADD CONSTRAINT "DuplicateReview_report_pair_order_check" CHECK ("reportAId" < "reportBId");

-- AddForeignKey
ALTER TABLE "DuplicateReview" ADD CONSTRAINT "DuplicateReview_reportAId_fkey" FOREIGN KEY ("reportAId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateReview" ADD CONSTRAINT "DuplicateReview_reportBId_fkey" FOREIGN KEY ("reportBId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateReview" ADD CONSTRAINT "DuplicateReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
