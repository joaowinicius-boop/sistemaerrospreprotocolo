-- Migration to ensure team_members has a default UUID generation for id
ALTER TABLE public.team_members ALTER COLUMN id SET DEFAULT gen_random_uuid();
