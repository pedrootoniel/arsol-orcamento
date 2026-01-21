/*
  # Corrigir Política de INSERT em Profiles
  
  Adiciona política para permitir que novos usuários criem seu próprio perfil na primeira vez
*/

-- Remover política antiga se existir e criar nova
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
