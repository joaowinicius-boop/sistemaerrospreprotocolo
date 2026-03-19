-- Garantir que user_id é UNIQUE na tabela profiles para prevenir duplicatas
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
