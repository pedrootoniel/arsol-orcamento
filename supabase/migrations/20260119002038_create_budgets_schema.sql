/*
  # Budget Management System for Engineers

  ## Overview
  Creates a comprehensive budget management system for engineering projects.

  ## New Tables
  
  ### budgets
  Main table storing budget/project information:
  - id (uuid, primary key) - Unique identifier
  - user_id (uuid) - References auth.users
  - title (text) - Project/budget name
  - client_name (text) - Client information
  - description (text) - Project description
  - status (text) - Budget status (draft, sent, approved, rejected)
  - created_at (timestamptz) - Creation timestamp
  - updated_at (timestamptz) - Last update timestamp
  
  ### budget_items
  Individual items/services within each budget:
  - id (uuid, primary key) - Unique identifier
  - budget_id (uuid) - References budgets table
  - description (text) - Item/service description
  - quantity (numeric) - Quantity
  - unit (text) - Unit of measurement
  - unit_price (numeric) - Price per unit
  - category (text) - Item category
  - created_at (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own budgets and items
  - Policies for SELECT, INSERT, UPDATE, DELETE operations
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  client_name text DEFAULT '',
  description text DEFAULT '',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'un',
  unit_price numeric DEFAULT 0,
  category text DEFAULT 'material',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Budgets policies
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Budget items policies
CREATE POLICY "Users can view own budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);
CREATE INDEX IF NOT EXISTS budget_items_budget_id_idx ON budget_items(budget_id);