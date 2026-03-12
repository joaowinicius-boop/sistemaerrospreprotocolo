-- 1. Updates team_members policies just in case.
DROP POLICY IF EXISTS "Authenticated can insert team_members" ON public.team_members;
CREATE POLICY "Authenticated can insert team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Modify profiles to default to inactive (awaiting approval)
ALTER TABLE public.profiles ALTER COLUMN active SET DEFAULT false;

-- 3. Update the handle_new_user trigger to approve the admin by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the master admin to be active and have admin role
  IF NEW.email = 'joao.winicius@nicolasgomesadv.com.br' OR NEW.email = 'joaowinicius@nicolasgomesadv.com.br' THEN
    INSERT INTO public.profiles (user_id, email, display_name, active)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), true);

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    -- Generic users are inactive by default
    INSERT INTO public.profiles (user_id, email, display_name, active)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), false);

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;
