/*
  # Correção de Políticas RLS e Sistema de Múltiplas Empresas
  
  1. Correções
    - Corrige políticas RLS que estavam causando erros 500
    - Simplifica políticas para melhor performance
    - Adiciona políticas faltantes
    
  2. Nova Tabela
    - companies: Tabela de empresas emissoras de NF-e
    - Suporta múltiplas empresas por admin
    
  3. Atualizações
    - Adiciona company_id em nfe_invoices
    - Melhora índices para performance
*/

-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados da empresa
  trade_name text NOT NULL,
  company_name text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  state_registration text,
  municipal_registration text,
  
  -- Endereço
  address text NOT NULL,
  number text,
  complement text,
  neighborhood text,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  
  -- Contato
  phone text,
  email text,
  website text,
  
  -- Logo
  logo_url text,
  
  -- Configurações NF-e
  nfe_series integer DEFAULT 1,
  next_nfe_number integer DEFAULT 1,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar company_id em nfe_invoices se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Políticas para companies
DROP POLICY IF EXISTS "Admin can manage own companies" ON companies;
CREATE POLICY "Admin can manage own companies"
  ON companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.id = companies.admin_id
    )
  );

-- Corrigir política de profiles para permitir INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Corrigir políticas de clients
DROP POLICY IF EXISTS "Admin can manage all clients" ON clients;
CREATE POLICY "Admin can manage all clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Clients can view own data" ON clients;
CREATE POLICY "Clients can view own data"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow client self-registration" ON clients;
CREATE POLICY "Allow client self-registration"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Corrigir políticas de budgets
DROP POLICY IF EXISTS "Admin can manage all budgets" ON budgets;
CREATE POLICY "Admin can manage all budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Clients can view their budgets" ON budgets;
CREATE POLICY "Clients can view their budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() 
      AND clients.id = budgets.client_id
    )
  );

DROP POLICY IF EXISTS "Clients can update their budgets" ON budgets;
CREATE POLICY "Clients can update their budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() 
      AND clients.id = budgets.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() 
      AND clients.id = budgets.client_id
    )
  );

-- Adicionar operação de natureza em nfe_invoices se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'operation_nature'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN operation_nature text DEFAULT 'Venda Dentro do Estado';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'cfop'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN cfop text DEFAULT '5102';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN payment_method text DEFAULT 'PIX';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'freight_type'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN freight_type text DEFAULT 'Sem Ocorrência de Transporte';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'discount'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN discount numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'freight'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN freight numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'insurance'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN insurance numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'other_expenses'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN other_expenses numeric DEFAULT 0;
  END IF;
END $$;

-- Criar tabela de produtos para NF-e de venda
CREATE TABLE IF NOT EXISTS nfe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id uuid REFERENCES nfe_invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do produto
  sequence_number integer NOT NULL,
  product_code text,
  ean text,
  description text NOT NULL,
  ncm text,
  cfop text DEFAULT '5102',
  unit text DEFAULT 'UN',
  quantity numeric NOT NULL DEFAULT 1,
  unit_value numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  
  -- Impostos
  icms_rate numeric DEFAULT 0,
  icms_value numeric DEFAULT 0,
  ipi_rate numeric DEFAULT 0,
  ipi_value numeric DEFAULT 0,
  pis_rate numeric DEFAULT 0,
  pis_value numeric DEFAULT 0,
  cofins_rate numeric DEFAULT 0,
  cofins_value numeric DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS para nfe_products
ALTER TABLE nfe_products ENABLE ROW LEVEL SECURITY;

-- Políticas para nfe_products
DROP POLICY IF EXISTS "Admin can manage all products" ON nfe_products;
CREATE POLICY "Admin can manage all products"
  ON nfe_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Clients can view their invoice products" ON nfe_products;
CREATE POLICY "Clients can view their invoice products"
  ON nfe_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN nfe_invoices ON nfe_invoices.client_id = clients.id
      WHERE clients.user_id = auth.uid() AND nfe_products.nfe_id = nfe_invoices.id
    )
  );

-- Trigger para atualizar updated_at em companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_admin_id ON companies(admin_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_company_id ON nfe_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_nfe_products_nfe_id ON nfe_products(nfe_id);
