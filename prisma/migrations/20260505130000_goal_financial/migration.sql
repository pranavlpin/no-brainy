-- AlterTable
ALTER TABLE "goals" ADD COLUMN "startDate" DATE;
ALTER TABLE "goals" ADD COLUMN "expenseCategoryId" TEXT;
ALTER TABLE "goals" ADD COLUMN "expenseTag" TEXT;
ALTER TABLE "goals" ADD COLUMN "targetAmount" DECIMAL(12, 2);

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
