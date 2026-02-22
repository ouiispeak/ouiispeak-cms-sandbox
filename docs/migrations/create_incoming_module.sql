-- Create the incoming module when RLS blocks script-based creation.
-- Run in Supabase Dashboard → SQL Editor.
-- Replace 'incoming-interactive' with your LADY_INGEST_MODULE_SLUG if different.

INSERT INTO public.modules (slug, label, title, level, order_index, status, visibility)
SELECT 'incoming-interactive', 'Incoming (LaDy)', 'Incoming', 'A0', 9999, 'draft', 'private'
WHERE NOT EXISTS (SELECT 1 FROM public.modules WHERE slug = 'incoming-interactive');
