/*
  # Sistema Completo de Notas Fiscais Eletrônicas (NF-e)
  
  1. Tabelas Criadas
    - nfe_invoices: Tabela principal de notas fiscais
    - nfe_services: Serviços/itens da nota fiscal
    - nfe_taxes: Impostos da nota fiscal
    
  2. Campos Principais
    - Dados do prestador de serviço
    - Dados do tomador (cliente)
    - Discriminação dos serviços
    - Impostos (INSS, PIS, COFINS, IRRF, CSLL, ISS)
    - Códigos fiscais (CNAE, NBS, LC 116/03, etc)
    - Dados de emissão e chave da NF-e
    
  3. Segurança
    - RLS habilitado
    - Admin pode gerenciar tudo
    - Clientes só veem suas próprias notas
*/

-- Tabela principal de notas fiscais
CREATE TABLE IF NOT EXISTS nfe_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL,
  
  -- Número e série
  nfe_number text NOT NULL,
  nfe_series integer DEFAULT 1,
  nfe_key text,
  
  -- Tipo e datas
  nfe_type text NOT NULL DEFAULT 'service' CHECK (nfe_type IN ('service', 'product')),
  issue_date timestamptz DEFAULT now(),
  delivery_date date,
  cancellation_date timestamptz,
  
  -- Empresa (Prestador)
  company_name text NOT NULL,
  company_document text NOT NULL,
  company_im text,
  company_address text NOT NULL,
  company_neighborhood text,
  company_city text NOT NULL,
  company_state text NOT NULL,
  company_zipcode text NOT NULL,
  company_phone text,
  company_email text,
  
  -- Cliente (Tomador)
  customer_name text NOT NULL,
  customer_document text NOT NULL,
  customer_ie text,
  customer_address text NOT NULL,
  customer_neighborhood text,
  customer_city text NOT NULL,
  customer_state text NOT NULL,
  customer_zipcode text NOT NULL,
  customer_email text,
  
  -- Descrição do serviço
  service_description text NOT NULL,
  
  -- Códigos fiscais
  cnae_code text,
  nbs_code text,
  lc_116_code text,
  cst_code text,
  operation_code text,
  tribute_classification_code text,
  
  -- Locais de serviço
  service_state text,
  service_city text,
  incident_state text,
  incident_city text,
  
  -- Valores de impostos (alíquotas e valores)
  inss_rate numeric DEFAULT 0,
  inss_value numeric DEFAULT 0,
  pis_rate numeric DEFAULT 0,
  pis_value numeric DEFAULT 0,
  cofins_rate numeric DEFAULT 0,
  cofins_value numeric DEFAULT 0,
  irrf_rate numeric DEFAULT 0,
  irrf_value numeric DEFAULT 0,
  csll_rate numeric DEFAULT 0,
  csll_value numeric DEFAULT 0,
  iss_rate numeric DEFAULT 0,
  iss_value numeric DEFAULT 0,
  issqn_rate numeric DEFAULT 0,
  issqn_value numeric DEFAULT 0,
  issqn_retained numeric DEFAULT 0,
  
  -- Deduções e descontos
  base_deductions numeric DEFAULT 0,
  conditional_discount numeric DEFAULT 0,
  unconditional_discount numeric DEFAULT 0,
  retention boolean DEFAULT false,
  
  -- Valores totais
  service_total numeric DEFAULT 0,
  liquid_value numeric DEFAULT 0,
  
  -- Status e observações
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'authorized', 'cancelled', 'rejected')),
  additional_info text,
  
  -- URLs
  pdf_url text,
  xml_url text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens/serviços da NFe (para notas com múltiplos itens)
CREATE TABLE IF NOT EXISTS nfe_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id uuid REFERENCES nfe_invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_value numeric DEFAULT 0,
  total_value numeric DEFAULT 0,
  cnae_code text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE nfe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfe_services ENABLE ROW LEVEL SECURITY;

-- Políticas para nfe_invoices
DROP POLICY IF EXISTS "Admin can manage all invoices" ON nfe_invoices;
CREATE POLICY "Admin can manage all invoices"
  ON nfe_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Clients can view their invoices" ON nfe_invoices;
CREATE POLICY "Clients can view their invoices"
  ON nfe_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid() AND nfe_invoices.client_id = clients.id
    )
  );

-- Políticas para nfe_services
DROP POLICY IF EXISTS "Admin can manage all services" ON nfe_services;
CREATE POLICY "Admin can manage all services"
  ON nfe_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Clients can view their invoice services" ON nfe_services;
CREATE POLICY "Clients can view their invoice services"
  ON nfe_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN nfe_invoices ON nfe_invoices.client_id = clients.id
      WHERE clients.user_id = auth.uid() AND nfe_services.nfe_id = nfe_invoices.id
    )
  );

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_nfe_invoices_updated_at ON nfe_invoices;
CREATE TRIGGER update_nfe_invoices_updated_at
  BEFORE UPDATE ON nfe_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_client_id ON nfe_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_budget_id ON nfe_invoices(budget_id);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_status ON nfe_invoices(status);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_issue_date ON nfe_invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_nfe_services_nfe_id ON nfe_services(nfe_id);
