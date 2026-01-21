/*
  # Enhanced Budget Management System for Engineering

  ## Overview
  Comprehensive system for engineering companies with Admin and Client roles.
  Supports Electrical, Solar, Hydraulic, and Pool categories.

  ## New Tables

  ### profiles
  User profiles with role-based access:
  - id (uuid) - References auth.users
  - role (text) - 'admin' or 'client'
  - full_name (text) - User's full name
  - phone (text) - Contact phone
  - created_at (timestamptz)

  ### clients
  Client/company information:
  - id (uuid) - Primary key
  - admin_id (uuid) - Admin who created the client
  - name (text) - Full name or company name
  - document (text) - CPF or CNPJ
  - email (text) - Contact email
  - phone (text) - Phone/WhatsApp
  - address (text) - Work address
  - client_type (text) - residential/commercial/industrial
  - user_id (uuid) - Optional linked auth user for portal access
  - created_at (timestamptz)

  ### budget_comments
  Comment system for client requests:
  - id (uuid) - Primary key
  - budget_id (uuid) - References budgets
  - user_id (uuid) - Who made the comment
  - content (text) - Comment text
  - is_admin_reply (boolean) - True if admin reply
  - created_at (timestamptz)

  ## Modified Tables

  ### budgets (new columns)
  - client_id (uuid) - References clients
  - responsible_name (text) - Technical responsible
  - validity_date (date) - Budget expiration
  - total_materials (numeric)
  - total_labor (numeric)
  - total_additional (numeric)
  - profit_margin (numeric)

  ### budget_items (new columns)
  - technical_specs (jsonb) - Category-specific technical data

  ## Security
  - RLS policies for admin and client access
  - Clients can only view their own budgets
  - Admins have full access to their data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  full_name text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'client'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  document text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  client_type text DEFAULT 'residential',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_client_type CHECK (client_type IN ('residential', 'commercial', 'industrial'))
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (admin_id = (select auth.uid()) OR user_id = (select auth.uid()));

CREATE POLICY "Admins can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = (select auth.uid()));

CREATE POLICY "Admins can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (admin_id = (select auth.uid()))
  WITH CHECK (admin_id = (select auth.uid()));

CREATE POLICY "Admins can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (admin_id = (select auth.uid()));

-- Add new columns to budgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE budgets ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'responsible_name'
  ) THEN
    ALTER TABLE budgets ADD COLUMN responsible_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'validity_date'
  ) THEN
    ALTER TABLE budgets ADD COLUMN validity_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'total_materials'
  ) THEN
    ALTER TABLE budgets ADD COLUMN total_materials numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'total_labor'
  ) THEN
    ALTER TABLE budgets ADD COLUMN total_labor numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'total_additional'
  ) THEN
    ALTER TABLE budgets ADD COLUMN total_additional numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'profit_margin'
  ) THEN
    ALTER TABLE budgets ADD COLUMN profit_margin numeric DEFAULT 0;
  END IF;
END $$;

-- Add technical_specs to budget_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_items' AND column_name = 'technical_specs'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN technical_specs jsonb DEFAULT '{}';
  END IF;
END $$;

-- Update budget_items category constraint
ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_category_check;
ALTER TABLE budget_items ADD CONSTRAINT budget_items_category_check 
  CHECK (category IN ('material', 'labor', 'equipment', 'service', 'electrical', 'solar', 'hydraulic', 'pool', 'additional'));

-- Create budget_comments table
CREATE TABLE IF NOT EXISTS budget_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_admin_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_comments ENABLE ROW LEVEL SECURITY;

-- Comments can be viewed by budget owner (admin) or client linked to budget
CREATE POLICY "Users can view budget comments"
  ON budget_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets b
      LEFT JOIN clients c ON b.client_id = c.id
      WHERE b.id = budget_comments.budget_id
      AND (b.user_id = (select auth.uid()) OR c.user_id = (select auth.uid()))
    )
  );

CREATE POLICY "Users can create comments on accessible budgets"
  ON budget_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM budgets b
      LEFT JOIN clients c ON b.client_id = c.id
      WHERE b.id = budget_comments.budget_id
      AND (b.user_id = (select auth.uid()) OR c.user_id = (select auth.uid()))
    )
  );

-- Update budgets policies to allow client access (view only)
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = budgets.client_id
      AND c.user_id = (select auth.uid())
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS clients_admin_id_idx ON clients(admin_id);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
CREATE INDEX IF NOT EXISTS budgets_client_id_idx ON budgets(client_id);
CREATE INDEX IF NOT EXISTS budget_comments_budget_id_idx ON budget_comments(budget_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (new.id, 'admin', COALESCE(new.raw_user_meta_data->>'full_name', ''));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();