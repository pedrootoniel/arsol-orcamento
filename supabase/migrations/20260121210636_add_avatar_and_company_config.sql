/*
  # Adicionar Avatar e Configurações da Empresa

  ## Modificações

  ### 1. Tabela profiles
  - Adiciona campo `avatar_url` para foto do perfil

  ### 2. Nova Tabela company_config
  - Configurações da empresa para emissão de NFe
  - CNPJ, razão social, inscrição estadual
  - Dados fiscais e endereço
  - Certificado digital

  ### 3. Nova Tabela nfe_invoices
  - Notas fiscais emitidas
  - Dados completos da NFe
  - Status de emissão
  - XML e PDF

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Apenas admin pode acessar company_config e nfe_invoices
*/

-- Adicionar avatar_url na tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Tabela de configuração da empresa
CREATE TABLE IF NOT EXISTS company_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  trade_name text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  state_registration text,
  municipal_registration text,
  tax_regime text NOT NULL DEFAULT 'simples_nacional' CHECK (tax_regime IN ('simples_nacional', 'lucro_presumido', 'lucro_real')),
  address text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  website text,
  logo_url text,
  certificate_base64 text,
  certificate_password text,
  certificate_expiry date,
  nfe_series integer DEFAULT 1,
  next_nfe_number integer DEFAULT 1,
  nfe_environment text DEFAULT 'homologacao' CHECK (nfe_environment IN ('producao', 'homologacao')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can manage company config"
  ON company_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Tabela de notas fiscais
CREATE TABLE IF NOT EXISTS nfe_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_number text NOT NULL,
  nfe_series integer NOT NULL,
  nfe_key text UNIQUE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL,
  issue_date timestamptz DEFAULT now(),
  nature_operation text NOT NULL DEFAULT 'Venda de mercadoria',
  cfop text NOT NULL DEFAULT '5102',
  total_products numeric NOT NULL DEFAULT 0,
  total_services numeric NOT NULL DEFAULT 0,
  discount_value numeric DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  icms_value numeric DEFAULT 0,
  ipi_value numeric DEFAULT 0,
  pis_value numeric DEFAULT 0,
  cofins_value numeric DEFAULT 0,
  iss_value numeric DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'authorized', 'cancelled', 'rejected')),
  authorization_protocol text,
  authorization_date timestamptz,
  xml_content text,
  pdf_url text,
  cancellation_reason text,
  cancellation_date timestamptz,
  rejection_reason text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nfe_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can manage nfe invoices"
  ON nfe_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their own nfe invoices"
  ON nfe_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() AND nfe_invoices.client_id = clients.id
    )
  );

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_company_config_updated_at ON company_config;
CREATE TRIGGER update_company_config_updated_at
  BEFORE UPDATE ON company_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nfe_invoices_updated_at ON nfe_invoices;
CREATE TRIGGER update_nfe_invoices_updated_at
  BEFORE UPDATE ON nfe_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger para NFe
DROP TRIGGER IF EXISTS audit_nfe_invoices_trigger ON nfe_invoices;
CREATE TRIGGER audit_nfe_invoices_trigger
  AFTER INSERT OR UPDATE OR DELETE ON nfe_invoices
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Índices
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_client_id ON nfe_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_budget_id ON nfe_invoices(budget_id);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_status ON nfe_invoices(status);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_nfe_number ON nfe_invoices(nfe_number);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_issue_date ON nfe_invoices(issue_date DESC);
