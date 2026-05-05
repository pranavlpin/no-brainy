-- AlterTable
ALTER TABLE "goals" ADD COLUMN "start_date" DATE;
ALTER TABLE "goals" ADD COLUMN "expense_category_id" TEXT;
ALTER TABLE "goals" ADD COLUMN "expense_tag" TEXT;
ALTER TABLE "goals" ADD COLUMN "target_amount" DECIMAL(12, 2);

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
