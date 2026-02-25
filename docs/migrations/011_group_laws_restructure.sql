-- Migration: Group Laws Structural Reordering
-- Date: 2026-02-25
-- Description: Adds extractability_tier, purpose_relationship_tag, target_node_keys to lesson_groups;
--   enforces group_type enum (ORIENTATION, INPUT, SCAFFOLDED_PRACTICE, TARGET_PERFORMANCE, INTEGRATION);
--   removes obsolete grouping_strategy_summary from lessons (structure now defined by purpose + per-group group_summary).
-- Part of: Group Laws V1 — portable blocks, node tagging, strict phase types.

-- Step 1: Nullify invalid group_type values before adding constraint
-- (title, intro, practice, test, wrap-up, finale → NULL; pedagogically safer than auto-mapping)
UPDATE public.lesson_groups
SET group_type = NULL
WHERE group_type IS NOT NULL
  AND group_type NOT IN ('ORIENTATION', 'INPUT', 'SCAFFOLDED_PRACTICE', 'TARGET_PERFORMANCE', 'INTEGRATION');

-- Step 2: Add new columns to lesson_groups
ALTER TABLE public.lesson_groups
ADD COLUMN IF NOT EXISTS extractability_tier TEXT,
ADD COLUMN IF NOT EXISTS purpose_relationship_tag TEXT,
ADD COLUMN IF NOT EXISTS target_node_keys JSONB;

COMMENT ON COLUMN public.lesson_groups.extractability_tier IS 'HIGH | MEDIUM | LOW — governs extraction for remediation, spaced repetition, standalone practice';
COMMENT ON COLUMN public.lesson_groups.purpose_relationship_tag IS 'PREPARE_FOR_PURPOSE | SUPPORT_FIRST_CONTROL | MEASURE_FIRST_CONTROL | STABILIZE_TRANSFER';
COMMENT ON COLUMN public.lesson_groups.target_node_keys IS 'Array of canonical_node_key strings — node tagging for portable groups';

-- Step 3: Add check constraint for group_type
ALTER TABLE public.lesson_groups
DROP CONSTRAINT IF EXISTS lesson_groups_group_type_check;

ALTER TABLE public.lesson_groups
ADD CONSTRAINT lesson_groups_group_type_check
CHECK (group_type IS NULL OR group_type IN (
  'ORIENTATION', 'INPUT', 'SCAFFOLDED_PRACTICE', 'TARGET_PERFORMANCE', 'INTEGRATION'
));

-- Step 4: Drop obsolete grouping_strategy_summary from lessons
-- Structure is now defined by purpose + per-group group_summary
ALTER TABLE public.lessons
DROP COLUMN IF EXISTS grouping_strategy_summary;
