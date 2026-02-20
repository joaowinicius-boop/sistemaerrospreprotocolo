
-- Create errors table
CREATE TABLE public.errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  process_id TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Análise', 'Resolvido')),
  solution_responsible TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Public access policies (shared team app, no auth required)
CREATE POLICY "Allow full access to errors" ON public.errors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.errors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;

-- Insert default team members
INSERT INTO public.team_members (name) VALUES ('EMERSON'), ('SANDRA'), ('MATEUS');
