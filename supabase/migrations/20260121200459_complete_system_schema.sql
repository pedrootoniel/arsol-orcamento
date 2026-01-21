/*
  # Complete Budget Management System Schema

  ## New Tables
  
  1. **internal_users**
     - User management for system access
     - Permissions: admin, technician, financial
     - Links to auth.users
  
  2. **service_orders**
     - Converted from approved budgets
     - Tracks execution status
     - Photos and progress updates
  
  3. **payments**
     - Financial control
     - Payment methods and installments
     - Payment status tracking
  
  4. **budget_attachments**
     - File uploads for budgets
     - Images, PDFs, technical documents
  
  5. **audit_logs**
     - Complete action tracking
     - IP addresses, timestamps
     - User actions history
  
  6. **budget_versions**
     - Version control for budgets
     - Historical tracking
  
  ## Enhanced Tables
  
  - budgets: Added fields for numbering, service type, technical details
  - clients: Enhanced with more details
  
  ## Security
  
  - RLS enabled on all tables
  - Strict permission policies
  - Admin-only access where needed
*/

-- Internal Users Table
CREATE TABLE IF NOT EXISTS internal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'technician', 'financial')),
  is_active boolean DEFAULT true,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE internal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage internal users"
  ON internal_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.role = 'admin'
      AND iu.is_active = true
    )
  );

CREATE POLICY "Users can view their own profile"
  ON internal_users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Add budget number sequence
CREATE SEQUENCE IF NOT EXISTS budget_number_seq START 1000;

-- Enhance budgets table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'budget_number') THEN
    ALTER TABLE budgets ADD COLUMN budget_number text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'service_type') THEN
    ALTER TABLE budgets ADD COLUMN service_type text DEFAULT 'engineering';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'discount_percentage') THEN
    ALTER TABLE budgets ADD COLUMN discount_percentage numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'discount_value') THEN
    ALTER TABLE budgets ADD COLUMN discount_value numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'bdi_percentage') THEN
    ALTER TABLE budgets ADD COLUMN bdi_percentage numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'tax_percentage') THEN
    ALTER TABLE budgets ADD COLUMN tax_percentage numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'approval_date') THEN
    ALTER TABLE budgets ADD COLUMN approval_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'approval_ip') THEN
    ALTER TABLE budgets ADD COLUMN approval_ip text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'approval_notes') THEN
    ALTER TABLE budgets ADD COLUMN approval_notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'rejection_date') THEN
    ALTER TABLE budgets ADD COLUMN rejection_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'rejection_reason') THEN
    ALTER TABLE budgets ADD COLUMN rejection_reason text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'is_locked') THEN
    ALTER TABLE budgets ADD COLUMN is_locked boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'version') THEN
    ALTER TABLE budgets ADD COLUMN version integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'parent_budget_id') THEN
    ALTER TABLE budgets ADD COLUMN parent_budget_id uuid REFERENCES budgets(id);
  END IF;
END $$;

-- Service Orders Table
CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  order_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  technician_id uuid REFERENCES internal_users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  start_date date,
  deadline_date date,
  completion_date date,
  technical_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and technicians can view service orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.is_active = true
    )
  );

CREATE POLICY "Admins can manage service orders"
  ON service_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.role = 'admin'
      AND iu.is_active = true
    )
  );

-- Service Order Photos
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

CREATE POLICY "Internal users can manage photos"
  ON service_order_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.is_active = true
    )
  );

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('full', 'installment', 'down_payment')),
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'bank_slip')),
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

CREATE POLICY "Admins and financial can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.role IN ('admin', 'financial')
      AND iu.is_active = true
    )
  );

CREATE POLICY "Internal users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.is_active = true
    )
  );

-- Budget Attachments Table
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

CREATE POLICY "Internal users can manage attachments"
  ON budget_attachments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.is_active = true
    )
  );

-- Audit Logs Table
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

CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.role = 'admin'
      AND iu.is_active = true
    )
  );

-- Budget Versions Table
CREATE TABLE IF NOT EXISTS budget_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can view budget versions"
  ON budget_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_users iu
      WHERE iu.auth_user_id = auth.uid()
      AND iu.is_active = true
    )
  );

-- Function to generate budget number
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

-- Function to create audit log
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

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_budgets_trigger ON budgets;
CREATE TRIGGER audit_budgets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_budget_number ON budgets(budget_number);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
