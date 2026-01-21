/*
  # Criar Storage Bucket para Avatares e Arquivos

  ## Storage Buckets
  
  1. **public** - Bucket público para avatares de usuários e logos
  2. **attachments** - Bucket privado para anexos de orçamentos
  3. **invoices** - Bucket privado para arquivos de NFe
  
  ## Políticas de Storage
  - Autenticados podem fazer upload de avatares
  - Admin pode fazer upload em todos os buckets
  - Clientes podem ver apenas seus arquivos
*/

-- Criar bucket público para avatares e logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para anexos de orçamentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para NFe
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para bucket public (avatares e logos)
CREATE POLICY "Authenticated users can upload to public bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

CREATE POLICY "Anyone can view public bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');

CREATE POLICY "Users can update their own files in public bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files in public bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para bucket attachments
CREATE POLICY "Admin can manage attachments"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'attachments' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Políticas para bucket invoices
CREATE POLICY "Admin can manage invoices"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Clients can view their own invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.user_id = auth.uid()
  )
);
