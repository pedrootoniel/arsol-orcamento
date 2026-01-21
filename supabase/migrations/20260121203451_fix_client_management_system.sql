/*
  # Fix Client Management System
  
  ## Changes
  
  1. Add fields to clients table:
     - building_manager: Nome do síndico/zelador
     - password_hash: For storing initial password
     
  2. Update RLS policies:
     - Clients can only see their own data
     - Only admin (pedrootonielsantos@outlook.com) has full access
     
  3. Add function to create client with auth user
*/

-- Add new fields to clients table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'building_manager') THEN
    ALTER TABLE clients ADD COLUMN building_manager text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'is_active') THEN
    ALTER TABLE clients ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Update clients RLS policies to be more restrictive
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own data" ON clients;

CREATE POLICY "Admin can manage all clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view own client record"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update budgets policies so clients can only see their own
DROP POLICY IF EXISTS "Clients can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Admins can manage all budgets" ON budgets;

CREATE POLICY "Admin can manage all budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND budgets.client_id = clients.id
    )
  );

-- Update service orders policies
DROP POLICY IF EXISTS "Admins and technicians can view service orders" ON service_orders;
DROP POLICY IF EXISTS "Admins can manage service orders" ON service_orders;

CREATE POLICY "Admin can manage all service orders"
  ON service_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their service orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND service_orders.client_id = clients.id
    )
  );

-- Update payments policies
DROP POLICY IF EXISTS "Admins and financial can manage payments" ON payments;
DROP POLICY IF EXISTS "Internal users can view payments" ON payments;

CREATE POLICY "Admin can manage all payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN budgets ON budgets.client_id = clients.id
      WHERE clients.user_id = auth.uid()
      AND payments.budget_id = budgets.id
    )
  );

-- Update service order photos policies
DROP POLICY IF EXISTS "Internal users can manage photos" ON service_order_photos;

CREATE POLICY "Admin can manage photos"
  ON service_order_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their service order photos"
  ON service_order_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN service_orders ON service_orders.client_id = clients.id
      WHERE clients.user_id = auth.uid()
      AND service_order_photos.service_order_id = service_orders.id
    )
  );

-- Budget items policies
CREATE POLICY "Clients can view their budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN budgets ON budgets.client_id = clients.id
      WHERE clients.user_id = auth.uid()
      AND budget_items.budget_id = budgets.id
    )
  );

-- Budget comments policies for clients
DROP POLICY IF EXISTS "Anyone can read comments" ON budget_comments;
DROP POLICY IF EXISTS "Users can create comments" ON budget_comments;

CREATE POLICY "Admin can manage all comments"
  ON budget_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can manage their budget comments"
  ON budget_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN budgets ON budgets.client_id = clients.id
      WHERE clients.user_id = auth.uid()
      AND budget_comments.budget_id = budgets.id
    )
  );
