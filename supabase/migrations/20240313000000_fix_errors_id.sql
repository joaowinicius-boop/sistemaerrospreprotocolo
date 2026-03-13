-- Fix missing DEFAULT gen_random_uuid() for errors table
ALTER TABLE public.errors ALTER COLUMN id SET DEFAULT gen_random_uuid();
