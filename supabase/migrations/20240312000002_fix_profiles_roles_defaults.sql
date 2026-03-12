-- Adicionando DEFAULT gen_random_uuid() nas tabelas problemáticas
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.user_roles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Recriando a trigger handle_new_user de forma mais segura
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenta inserir o profile, lidando com nulls no display_name
  INSERT INTO public.profiles (user_id, email, display_name, active)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''), 
      split_part(NEW.email, '@', 1),
      'Usuário'
    ), 
    CASE 
      WHEN NEW.email = 'joao.winicius@nicolasgomesadv.com.br' OR NEW.email = 'joaowinicius@nicolasgomesadv.com.br' THEN true
      ELSE false
    END
  );

  -- Tenta inserir a role correspondente
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (
    NEW.id, 
    CASE 
      WHEN NEW.email = 'joao.winicius@nicolasgomesadv.com.br' OR NEW.email = 'joaowinicius@nicolasgomesadv.com.br' THEN 'admin'
      ELSE 'user'
    END
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro na trigger, a conta no auth.users ainda será criada.
  -- É melhor logar do que quebrar a criação do usuário inteiro mas no Supabase não temos console.log.
  -- Faremos um RAISE LOG que aparece nos logs do Postgres.
  RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$;
