/*
  # Sistema Automático de Criação de Perfis e Clientes - CORRIGIDO
  
  1. Adiciona constraint única em user_id
  2. Trigger para criar perfil e cliente automaticamente  
  3. Cria perfis e clientes para usuários existentes
  4. Insere empresas padrão
*/

-- Adicionar constraint única em user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_user_id_key'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  user_name text;
BEGIN
  -- Extrair nome do email ou metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Inserir perfil
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'pedrootonielsantos@outlook.com' THEN 'admin'
      ELSE 'client'
    END,
    user_name,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Se não for admin, criar cliente
  IF NEW.email != 'pedrootonielsantos@outlook.com' THEN
    -- Buscar admin
    SELECT id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Se admin existe, criar cliente
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO public.clients (
        admin_id,
        user_id,
        name,
        document,
        email,
        phone,
        address,
        client_type,
        is_active
      )
      VALUES (
        admin_user_id,
        NEW.id,
        user_name,
        COALESCE(NEW.raw_user_meta_data->>'document', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        '',
        'residential',
        true
      )
      ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        document = CASE WHEN EXCLUDED.document != '' THEN EXCLUDED.document ELSE clients.document END,
        email = EXCLUDED.email,
        phone = CASE WHEN EXCLUDED.phone != '' THEN EXCLUDED.phone ELSE clients.phone END,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar perfis e clientes para usuários existentes
DO $$
DECLARE
  user_record RECORD;
  admin_id uuid;
  user_name text;
BEGIN
  -- Primeiro, garantir que o admin existe
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE email = 'pedrootonielsantos@outlook.com'
  LOOP
    user_name := COALESCE(
      user_record.raw_user_meta_data->>'full_name',
      'Admin',
      SPLIT_PART(user_record.email, '@', 1)
    );
    
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (
      user_record.id,
      'admin',
      user_name,
      COALESCE(user_record.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = now();
      
    admin_id := user_record.id;
  END LOOP;
  
  -- Se não encontrou admin nos auth.users, busca nos profiles
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;
  END IF;
  
  -- Agora criar perfis e clientes para outros usuários
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE email != 'pedrootonielsantos@outlook.com'
  LOOP
    user_name := COALESCE(
      user_record.raw_user_meta_data->>'full_name',
      SPLIT_PART(user_record.email, '@', 1)
    );
    
    -- Criar perfil
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (
      user_record.id,
      'client',
      user_name,
      COALESCE(user_record.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      phone = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
      updated_at = now();
    
    -- Criar cliente se admin existe
    IF admin_id IS NOT NULL THEN
      INSERT INTO public.clients (
        admin_id,
        user_id,
        name,
        document,
        email,
        phone,
        address,
        client_type,
        is_active
      )
      VALUES (
        admin_id,
        user_record.id,
        user_name,
        COALESCE(user_record.raw_user_meta_data->>'document', ''),
        user_record.email,
        COALESCE(user_record.raw_user_meta_data->>'phone', ''),
        '',
        'residential',
        true
      )
      ON CONFLICT (user_id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, clients.name),
        document = CASE WHEN EXCLUDED.document != '' THEN EXCLUDED.document ELSE clients.document END,
        email = COALESCE(EXCLUDED.email, clients.email),
        phone = CASE WHEN EXCLUDED.phone != '' THEN EXCLUDED.phone ELSE clients.phone END,
        updated_at = now();
    END IF;
  END LOOP;
  
  -- Log do resultado
  RAISE NOTICE 'Perfis e clientes criados com sucesso!';
END $$;

-- Inserir empresas padrão
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO companies (
      admin_id,
      trade_name,
      company_name,
      cnpj,
      address,
      city,
      state,
      zip_code,
      phone,
      email,
      municipal_registration,
      is_active
    )
    VALUES 
      (
        admin_id,
        'OTONIEL ANTONIO DOS SANTOS',
        'OTONIEL ANTONIO DOS SANTOS - ME',
        '01.260.756/0001-32',
        'W-5, 159 - RES. MORADA DOS IPES',
        'GOIANIA',
        'GO',
        '74692105',
        '62565351',
        'supremocristina@gmail.com',
        '197618',
        true
      ),
      (
        admin_id,
        'PEDRO OTONIEL DE OLIVEIRA SANTOS',
        'PEDRO OTONIEL DE OLIVEIRA SANTOS ME',
        '51.518.502/0001-40',
        'Rua 34, 0 - Setor Santos Dumont',
        'Goiânia',
        'GO',
        '74463730',
        '62565351',
        'supremocristina@gmail.com',
        '',
        true
      )
    ON CONFLICT (cnpj) DO NOTHING;
    
    RAISE NOTICE 'Empresas cadastradas com sucesso!';
  END IF;
END $$;
