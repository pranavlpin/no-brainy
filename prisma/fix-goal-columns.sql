-- Fix: rename snake_case columns to camelCase (matching existing schema convention)
-- and add missing columns if they don't exist

-- Drop old snake_case columns and FK if they exist (from bad migration)
ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_expense_category_id_fkey";
ALTER TABLE "goals" DROP COLUMN IF EXISTS "start_date";
ALTER TABLE "goals" DROP COLUMN IF EXISTS "expense_category_id";
ALTER TABLE "goals" DROP COLUMN IF EXISTS "expense_tag";
ALTER TABLE "goals" DROP COLUMN IF EXISTS "target_amount";

-- Add correct camelCase columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='startDate') THEN
    ALTER TABLE "goals" ADD COLUMN "startDate" DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='expenseCategoryId') THEN
    ALTER TABLE "goals" ADD COLUMN "expenseCategoryId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='expenseTag') THEN
    ALTER TABLE "goals" ADD COLUMN "expenseTag" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='targetAmount') THEN
    ALTER TABLE "goals" ADD COLUMN "targetAmount" DECIMAL(12, 2);
  END IF;
END $$;

-- Add foreign key
ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_expenseCategoryId_fkey";
ALTER TABLE "goals" ADD CONSTRAINT "goals_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
