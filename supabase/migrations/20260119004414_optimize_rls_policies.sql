/*
  # Optimize RLS Policies for Performance

  ## Overview
  Optimizes all RLS policies to prevent re-evaluation of auth.uid() for each row
  by wrapping auth function calls in SELECT statements.

  ## Changes
  - Drop existing RLS policies
  - Recreate policies with optimized auth.uid() calls using (select auth.uid())
  
  ## Performance Impact
  This change significantly improves query performance at scale by evaluating
  the auth.uid() function once per query instead of once per row.
*/

-- Drop existing budgets policies
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can create own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;

-- Drop existing budget_items policies
DROP POLICY IF EXISTS "Users can view own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can create own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete own budget items" ON budget_items;

-- Recreate optimized budgets policies
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Recreate optimized budget_items policies
CREATE POLICY "Users can view own budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create own budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = (select auth.uid())
    )
  );