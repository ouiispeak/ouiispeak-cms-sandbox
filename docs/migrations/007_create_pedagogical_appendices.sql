-- Migration: Create pedagogical_appendices table (Layer 5 Reference RAG)
-- Date: 2025
-- Description: Metadata-rich library of pedagogical content (anecdotes, metaphors,
--   cultural_context) tagged by canonical_node_key (L6 node) or target_key (slice).
--   CMS = state manager; LaDy = stateless factory that queries and injects.
--
-- P7 Feedback Loop — Layer 5 Reference RAG

CREATE TABLE IF NOT EXISTS public.pedagogical_appendices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('node', 'slice', 'edge')),
  target_key TEXT NOT NULL,
  content TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IS NULL OR asset_type IN (
    'anecdote', 'metaphor', 'cultural_context', 'teaching_tip', 'l1_friction'
  )),
  content_type TEXT,
  is_active BOOLEAN DEFAULT true,
  target_l1 TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedagogical_appendices_target
  ON public.pedagogical_appendices(target_type, target_key);

CREATE INDEX IF NOT EXISTS idx_pedagogical_appendices_active_l1
  ON public.pedagogical_appendices(is_active, target_l1)
  WHERE is_active = true;

COMMENT ON TABLE public.pedagogical_appendices IS 'Layer 5 Reference RAG: Proven anecdotes, metaphors, cultural context. Tagged by target_key (canonical_node_key or slice key). LaDy exports active entries and injects into generator prompt.';
COMMENT ON COLUMN public.pedagogical_appendices.target_key IS 'Links to L6: canonical_node_key (nodes) or canonical_slice_key (slices)';
COMMENT ON COLUMN public.pedagogical_appendices.asset_type IS 'Category: anecdote, metaphor, cultural_context, teaching_tip, l1_friction';
COMMENT ON COLUMN public.pedagogical_appendices.is_active IS 'When false, LaDy export excludes this entry';
COMMENT ON COLUMN public.pedagogical_appendices.target_l1 IS 'L1 filter (e.g. fr, es); NULL = any L1';
