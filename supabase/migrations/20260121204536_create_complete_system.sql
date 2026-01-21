/*
  # Sistema Completo ArsolUp - Gestão de Orçamentos e Ordens de Serviço

  ## Tabelas Criadas

  ### 1. profiles
  - Perfis de usuários (admin ou client)
  - Vinculado a auth.users
  - Campos: role, full_name, phone

  ### 2. clients
  - Cadastro completo de clientes
  - CPF/CNPJ, endereço, tipo de cliente
  - Campo building_manager para síndico/zelador
  - Campo is_active para ativar/desativar
  - Vinculado a usuário (user_id) quando tem acesso ao portal

  ### 3. budgets
  - Orçamentos completos com itens
  - Status, valores, descontos, impostos
  - Campos de aprovação/rejeição com IP
  - Sistema de versionamento

  ### 4. budget_items
  - Itens individuais do orçamento
  - Materiais, mão de obra, adicionais
  - Quantidade, preço unitário, total

  ### 5. budget_comments
  - Sistema de comentários nos orçamentos
  - Comunicação cliente-admin

  ### 6. service_orders
  - Ordens de serviço geradas de orçamentos
  - Status, datas, observações técnicas
  - Vinculado a cliente e orçamento

  ### 7. service_order_photos
  - Fotos antes/durante/depois
  - Upload e descrição

  ### 8. payments
  - Controle financeiro completo
  - Formas de pagamento, parcelas
  - Status de pagamento

  ### 9. budget_attachments
  - Anexos dos orçamentos
  - PDFs, imagens, documentos

  ### 10. audit_logs
  - Log de todas as ações
  - IP, timestamps, valores antigos/novos

  ## Segurança (RLS)
  - Admin (pedrootonielsantos@outlook.com): acesso total
  - Clientes: apenas seus próprios dados
  - Políticas restritivas em todas as tabelas
*/

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  document text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  building_manager text,
  client_type text NOT NULL DEFAULT 'residential' CHECK (client_type IN ('residential', 'commercial', 'industrial')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view own client record"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE SEQUENCE IF NOT EXISTS budget_number_seq START 1000;

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  budget_number text UNIQUE,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'cancelled')),
  total_materials numeric DEFAULT 0,
  total_labor numeric DEFAULT 0,
  total_additional numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  discount_value numeric DEFAULT 0,
  bdi_percentage numeric DEFAULT 0,
  tax_percentage numeric DEFAULT 0,
  validity_date date,
  approval_date timestamptz,
  approval_ip text,
  approval_notes text,
  rejection_date timestamptz,
  rejection_reason text,
  is_locked boolean DEFAULT false,
  version integer DEFAULT 1,
  parent_budget_id uuid REFERENCES budgets(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() AND budgets.client_id = clients.id
    )
  );

CREATE POLICY "Clients can update their budgets (approval)"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() AND budgets.client_id = clients.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() AND budgets.client_id = clients.id
    )
  );

-- ============================================
-- BUDGET ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'un',
  unit_price numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  category text DEFAULT 'material' CHECK (category IN ('material', 'labor', 'additional')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all budget items"
  ON budget_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN budgets ON budgets.client_id = clients.id
      WHERE clients.user_id = auth.uid() AND budget_items.budget_id = budgets.id
    )
  );

-- ============================================
-- BUDGET COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all comments"
  ON budget_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can manage their budget comments"
  ON budget_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN budgets ON budgets.client_id = clients.id
      WHERE clients.user_id = auth.uid() AND budget_comments.budget_id = budgets.id
    )
  );

-- ============================================
-- SERVICE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  order_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  start_date date,
  deadline_date date,
  completion_date date,
  technical_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all service orders"
  ON service_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their service orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() AND service_orders.client_id = clients.id
    )
  );

-- ============================================
-- SERVICE ORDER PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_order_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'during', 'after')),
  description text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_order_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage photos"
  ON service_order_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their service order photos"
  ON service_order_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN service_orders ON service_orders.client_id = clients.id
      WHERE clients.user_id = auth.uid() AND service_order_photos.service_order_id = service_orders.id
    )
  );

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('full', 'installment', 'down_payment')),
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'bank_slip', 'bank_transfer')),
  installment_number integer,
  total_installments integer,
  amount numeric NOT NULL,
  due_date date,
  payment_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  notes text,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN budgets ON budgets.client_id = clients.id
      WHERE clients.user_id = auth.uid() AND payments.budget_id = budgets.id
    )
  );

-- ============================================
-- BUDGET ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage attachments"
  ON budget_attachments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their budget attachments"
  ON budget_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN budgets ON budgets.client_id = clients.id
      WHERE clients.user_id = auth.uid() AND budget_attachments.budget_id = budgets.id
    )
  );

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate budget number
CREATE OR REPLACE FUNCTION generate_budget_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  year_prefix text;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  next_num := nextval('budget_number_seq');
  RETURN year_prefix || '-' || lpad(next_num::text, 4, '0');
END;
$$;

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

-- Audit triggers
DROP TRIGGER IF EXISTS audit_budgets_trigger ON budgets;
CREATE TRIGGER audit_budgets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON clients(admin_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_budget_number ON budgets(budget_number);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_budget_id ON service_orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_budget_id ON payments(budget_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
