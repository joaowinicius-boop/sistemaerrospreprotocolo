-- Transformar 'sector' para TEXT[]
ALTER TABLE public.priorities 
  ALTER COLUMN sector SET DATA TYPE TEXT[] 
  USING ARRAY[sector]::TEXT[];

-- Transformar 'responsible_name' para TEXT[]
ALTER TABLE public.priorities 
  ALTER COLUMN responsible_name SET DATA TYPE TEXT[] 
  USING ARRAY[responsible_name]::TEXT[];

-- Adicionar a coluna 'logs' JSONB
ALTER TABLE public.priorities 
  ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]'::jsonb;
