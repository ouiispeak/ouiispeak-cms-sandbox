-- Migration: Add metadata JSONB column to lessons table
-- Date: 2025
-- Description: Adds metadata column for P7 telemetry loop (CMS → LaDy feedback).
--   Stores canonical_node_key, run_id, lessonSku and other ingestion/compiler metadata.
--
-- P8 — CMS Ingestion Communication Layer (Step 1.2)

-- Add metadata column (nullable, default empty object for convenience)
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Index for querying by metadata keys (e.g. run_id, canonical_node_key)
CREATE INDEX IF NOT EXISTS idx_lessons_metadata_run_id ON public.lessons((metadata->>'run_id'))
WHERE metadata->>'run_id' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_metadata_canonical ON public.lessons((metadata->>'canonical_node_key'))
WHERE metadata->>'canonical_node_key' IS NOT NULL;

COMMENT ON COLUMN public.lessons.metadata IS 'P7 telemetry: canonical_node_key, run_id, lessonSku. Used for CMS → LaDy feedback loop.';
