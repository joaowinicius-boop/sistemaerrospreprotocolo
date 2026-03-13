-- Passo 1: Remover o check constraint antigo
ALTER TABLE public.priorities DROP CONSTRAINT IF EXISTS priorities_current_sector_check;

-- Passo 2: Alterar current_sector de TEXT para TEXT[]
ALTER TABLE public.priorities 
  ALTER COLUMN current_sector SET DATA TYPE TEXT[] 
  USING ARRAY[current_sector]::TEXT[];

-- Passo 3: Alterar responsible_name de TEXT para TEXT[]
ALTER TABLE public.priorities 
  ALTER COLUMN responsible_name SET DATA TYPE TEXT[] 
  USING ARRAY[responsible_name]::TEXT[];

-- Passo 4: Adicionar coluna logs caso não exista
ALTER TABLE public.priorities 
  ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]'::jsonb;
