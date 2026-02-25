-- Migration: Remove Deprecated Activity Types from Supabase
-- Date: 2026-02-25
-- Description: Removes EXPOSE, PRODUCE, EXPLAIN, PRACTICE from lessons.activity_types (TEXT[]).
--   Part of Slide Laws Implementation — unify LaDy, CMS, and Player around canonical slide types.
-- Run manually in Supabase SQL editor.

-- Remove deprecated values from activity_types array; set to NULL if result is empty
UPDATE public.lessons
SET activity_types = (
  SELECT array_agg(x)
  FROM unnest(COALESCE(activity_types, ARRAY[]::TEXT[])) AS x
  WHERE x NOT IN ('EXPOSE', 'PRODUCE', 'EXPLAIN', 'PRACTICE')
)
WHERE activity_types && ARRAY['EXPOSE', 'PRODUCE', 'EXPLAIN', 'PRACTICE']::TEXT[];
