/*
  # Correção de Recursão Infinita nas Políticas RLS
  
  1. Remove políticas que causam recursão
  2. Cria políticas simples e diretas
  3. Usa auth.uid() diretamente sem joins complexos
  
  IMPORTANTE: Políticas simplificadas para evitar recursão
*/

-- PROFILES: Políticas mais simples
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Perfil próprio: SELECT, INSERT, UPDATE
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- CLIENTS: Políticas sem recursão
DROP POLICY IF EXISTS "Admin can manage all clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Allow client self-registration" ON clients;

-- Admin: usa role diretamente do próprio perfil
CREATE POLICY "clients_admin_all"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

-- Cliente: vê apenas seus próprios dados
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Cliente: pode atualizar seus próprios dados
CREATE POLICY "clients_update_own"
  ON clients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- BUDGETS: Políticas sem recursão
DROP POLICY IF EXISTS "Admin can manage all budgets" ON budgets;
DROP POLICY IF EXISTS "Clients can view their budgets" ON budgets;
DROP POLICY IF EXISTS "Clients can update their budgets" ON budgets;

CREATE POLICY "budgets_admin_all"
  ON budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "budgets_client_select"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "budgets_client_update"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- BUDGET_ITEMS: Seguir mesma lógica
DROP POLICY IF EXISTS "Admin can manage all budget items" ON budget_items;
DROP POLICY IF EXISTS "Clients can view their budget items" ON budget_items;

CREATE POLICY "budget_items_admin_all"
  ON budget_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "budget_items_client_select"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN clients c ON c.id = b.client_id
      WHERE c.user_id = auth.uid()
      LIMIT 100
    )
  );

-- BUDGET_COMMENTS: Mesma lógica
DROP POLICY IF EXISTS "Admin can manage all comments" ON budget_comments;
DROP POLICY IF EXISTS "Clients can view their budget comments" ON budget_comments;
DROP POLICY IF EXISTS "Clients can add comments" ON budget_comments;

CREATE POLICY "budget_comments_admin_all"
  ON budget_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "budget_comments_client_select"
  ON budget_comments FOR SELECT
  TO authenticated
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN clients c ON c.id = b.client_id
      WHERE c.user_id = auth.uid()
      LIMIT 100
    )
  );

CREATE POLICY "budget_comments_client_insert"
  ON budget_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN clients c ON c.id = b.client_id
      WHERE c.user_id = auth.uid()
      LIMIT 100
    )
  );

-- SERVICE_ORDERS: Mesma lógica
DROP POLICY IF EXISTS "Admin can manage all service orders" ON service_orders;
DROP POLICY IF EXISTS "Clients can view their service orders" ON service_orders;

CREATE POLICY "service_orders_admin_all"
  ON service_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "service_orders_client_select"
  ON service_orders FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- NFE_INVOICES: Mesma lógica
DROP POLICY IF EXISTS "Admin can manage all invoices" ON nfe_invoices;
DROP POLICY IF EXISTS "Clients can view their invoices" ON nfe_invoices;

CREATE POLICY "nfe_invoices_admin_all"
  ON nfe_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "nfe_invoices_client_select"
  ON nfe_invoices FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- NFE_PRODUCTS: Mesma lógica
DROP POLICY IF EXISTS "Admin can manage all products" ON nfe_products;
DROP POLICY IF EXISTS "Clients can view their invoice products" ON nfe_products;

CREATE POLICY "nfe_products_admin_all"
  ON nfe_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

CREATE POLICY "nfe_products_client_select"
  ON nfe_products FOR SELECT
  TO authenticated
  USING (
    nfe_id IN (
      SELECT n.id FROM nfe_invoices n
      JOIN clients c ON c.id = n.client_id
      WHERE c.user_id = auth.uid()
      LIMIT 100
    )
  );

-- COMPANIES: Admin apenas
DROP POLICY IF EXISTS "Admin can manage own companies" ON companies;

CREATE POLICY "companies_admin_all"
  ON companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );
