/*
  # Adicionar Tipo de NF-e e Campos de Transporte Completos
  
  1. Adicionar nfe_type para diferenciar produto e serviço
  2. Adicionar todos os campos de transporte e volumes
  3. Adicionar campos de empresa e cliente que faltavam
*/

-- Adicionar nfe_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nfe_invoices' AND column_name = 'nfe_type'
  ) THEN
    ALTER TABLE nfe_invoices ADD COLUMN nfe_type text DEFAULT 'service' CHECK (nfe_type IN ('service', 'product'));
  END IF;
END $$;

-- Adicionar campos de empresa que faltam
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_name') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_document') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_document text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_im') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_im text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_address') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_city') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_state') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_state text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_zipcode') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_zipcode text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_phone') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'company_email') THEN
    ALTER TABLE nfe_invoices ADD COLUMN company_email text;
  END IF;
END $$;

-- Adicionar campos de cliente que faltam
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'customer_name') THEN
    ALTER TABLE nfe_invoices ADD COLUMN customer_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'customer_document') THEN
    ALTER TABLE nfe_invoices ADD COLUMN customer_document text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'customer_address') THEN
    ALTER TABLE nfe_invoices ADD COLUMN customer_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'customer_city') THEN
    ALTER TABLE nfe_invoices ADD COLUMN customer_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'customer_state') THEN
    ALTER TABLE nfe_invoices ADD COLUMN customer_state text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'customer_email') THEN
    ALTER TABLE nfe_invoices ADD COLUMN customer_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'service_description') THEN
    ALTER TABLE nfe_invoices ADD COLUMN service_description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'service_total') THEN
    ALTER TABLE nfe_invoices ADD COLUMN service_total numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'liquid_value') THEN
    ALTER TABLE nfe_invoices ADD COLUMN liquid_value numeric DEFAULT 0;
  END IF;
END $$;

-- Adicionar campos de transporte
DO $$
BEGIN
  -- Transportador
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'carrier_name') THEN
    ALTER TABLE nfe_invoices ADD COLUMN carrier_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'carrier_document') THEN
    ALTER TABLE nfe_invoices ADD COLUMN carrier_document text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'carrier_address') THEN
    ALTER TABLE nfe_invoices ADD COLUMN carrier_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'carrier_city') THEN
    ALTER TABLE nfe_invoices ADD COLUMN carrier_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'carrier_state') THEN
    ALTER TABLE nfe_invoices ADD COLUMN carrier_state text;
  END IF;
  
  -- Veículo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'vehicle_plate') THEN
    ALTER TABLE nfe_invoices ADD COLUMN vehicle_plate text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'vehicle_state') THEN
    ALTER TABLE nfe_invoices ADD COLUMN vehicle_state text;
  END IF;
  
  -- Volumes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'quantity_volumes') THEN
    ALTER TABLE nfe_invoices ADD COLUMN quantity_volumes integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'volume_type') THEN
    ALTER TABLE nfe_invoices ADD COLUMN volume_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'volume_brand') THEN
    ALTER TABLE nfe_invoices ADD COLUMN volume_brand text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'volume_number') THEN
    ALTER TABLE nfe_invoices ADD COLUMN volume_number text;
  END IF;
  
  -- Pesos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'gross_weight') THEN
    ALTER TABLE nfe_invoices ADD COLUMN gross_weight numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfe_invoices' AND column_name = 'net_weight') THEN
    ALTER TABLE nfe_invoices ADD COLUMN net_weight numeric DEFAULT 0;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_nfe_type ON nfe_invoices(nfe_type);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_status ON nfe_invoices(status);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_issue_date ON nfe_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_nfe_invoices_client_id ON nfe_invoices(client_id);
