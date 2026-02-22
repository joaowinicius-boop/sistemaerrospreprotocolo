
-- Add notes column to errors table (preserving all existing data)
ALTER TABLE public.errors ADD COLUMN notes text NOT NULL DEFAULT '';
