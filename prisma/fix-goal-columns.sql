-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='start_date') THEN
    ALTER TABLE "goals" ADD COLUMN "start_date" DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='expense_category_id') THEN
    ALTER TABLE "goals" ADD COLUMN "expense_category_id" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='expense_tag') THEN
    ALTER TABLE "goals" ADD COLUMN "expense_tag" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='target_amount') THEN
    ALTER TABLE "goals" ADD COLUMN "target_amount" DECIMAL(12, 2);
  END IF;
END $$;

-- Add foreign key if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='goals_expense_category_id_fkey') THEN
    ALTER TABLE "goals" ADD CONSTRAINT "goals_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
