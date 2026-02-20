-- Migration: Enhance pedagogical_appendices with asset_type, is_active, target_l1
-- Date: 2025
-- Description: Layer 5 Reference RAG — metadata-rich, categorized.
--   asset_type: anecdote, metaphor, cultural_context, teaching_tip, l1_friction
--   is_active: toggle whether LaDy may use this entry
--   target_l1: L1 filter (e.g. "fr" for French speakers); NULL = any L1
--
-- Run after 007_create_pedagogical_appendices.sql

-- Add asset_type: primary categorizer for RAG content
ALTER TABLE public.pedagogical_appendices
ADD COLUMN IF NOT EXISTS asset_type TEXT;

-- Add constraint for allowed asset types (after column exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pedagogical_appendices_asset_type_check'
  ) THEN
    ALTER TABLE public.pedagogical_appendices
    ADD CONSTRAINT pedagogical_appendices_asset_type_check
    CHECK (asset_type IS NULL OR asset_type IN (
      'anecdote', 'metaphor', 'cultural_context', 'teaching_tip', 'l1_friction'
    ));
  END IF;
END $$;

-- Add is_active: toggle without deletion
ALTER TABLE public.pedagogical_appendices
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add target_l1: L1 filter (e.g. "fr", "es"); NULL = applies to any L1
ALTER TABLE public.pedagogical_appendices
ADD COLUMN IF NOT EXISTS target_l1 TEXT;

-- Index for filtered queries (active + target)
CREATE INDEX IF NOT EXISTS idx_pedagogical_appendices_active_l1
  ON public.pedagogical_appendices(is_active, target_l1)
  WHERE is_active = true;

COMMENT ON COLUMN public.pedagogical_appendices.asset_type IS 'Category: anecdote, metaphor, cultural_context, teaching_tip, l1_friction';
COMMENT ON COLUMN public.pedagogical_appendices.is_active IS 'When false, LaDy export excludes this entry';
COMMENT ON COLUMN public.pedagogical_appendices.target_l1 IS 'L1 filter (e.g. fr, es); NULL = any L1';
