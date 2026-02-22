-- Migration: Atomic slide ordering (ouiispeak-cms audit #1)
-- Date: 2025
-- Description: Add RPC functions for atomic insert-at-index and swap-order operations.
-- Prevents partial failures that corrupt order_index when create/reorder are split across multiple updates.
--
-- Functions:
--   - insert_slide_at_index_transaction(...)  -- shift + insert in one transaction
--   - swap_slides_order_transaction(slide_id_1, slide_id_2)  -- swap order_index atomically

-- ============================================================================
-- Insert Slide at Index Transaction
-- ============================================================================
-- Atomically: (1) increment order_index for all slides at or after position,
--             (2) insert the new slide at the given position.
-- Returns the new slide's id, or raises on error.
CREATE OR REPLACE FUNCTION insert_slide_at_index_transaction(
  p_group_id UUID,
  p_lesson_id UUID,
  p_type TEXT,
  p_order_index INT,
  p_props_json JSONB DEFAULT '{}',
  p_meta_json JSONB DEFAULT '{}',
  p_aid_hook TEXT DEFAULT NULL,
  p_code TEXT DEFAULT NULL,
  p_is_activity BOOLEAN DEFAULT NULL,
  p_score_type TEXT DEFAULT 'none',
  p_passing_score_value INT DEFAULT NULL,
  p_max_score_value INT DEFAULT NULL,
  p_pass_required_for_next BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  is_activity_val BOOLEAN;
BEGIN
  -- Compute is_activity: default from type (most slides are activities except title/text/lesson-end)
  IF p_is_activity IS NOT NULL THEN
    is_activity_val := p_is_activity;
  ELSE
    is_activity_val := NOT (LOWER(TRIM(p_type)) IN ('default', 'title-slide', 'title', 'lesson-end', 'text-slide', 'text', 'need-to-be-created'));
  END IF;

  -- Step 1: Make room - increment order_index for slides at or after insertion position
  UPDATE slides
  SET order_index = order_index + 1
  WHERE group_id = p_group_id
    AND order_index >= p_order_index;

  -- Step 2: Insert the new slide
  INSERT INTO slides (
    lesson_id,
    group_id,
    order_index,
    type,
    props_json,
    meta_json,
    aid_hook,
    code,
    is_activity,
    score_type,
    passing_score_value,
    max_score_value,
    pass_required_for_next
  ) VALUES (
    p_lesson_id,
    p_group_id,
    p_order_index,
    p_type,
    COALESCE(p_props_json, '{}'),
    COALESCE(p_meta_json, '{}'),
    p_aid_hook,
    p_code,
    is_activity_val,
    COALESCE(p_score_type, 'none'),
    p_passing_score_value,
    p_max_score_value,
    COALESCE(p_pass_required_for_next, false)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================================
-- Swap Slides Order Transaction
-- ============================================================================
-- Atomically swaps order_index of two slides. Both must belong to the same group.
-- Raises if either slide not found or they are in different groups.
-- Uses a single UPDATE with CASE to avoid unique constraint conflicts.
CREATE OR REPLACE FUNCTION swap_slides_order_transaction(
  p_slide_id_1 UUID,
  p_slide_id_2 UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  grp_1 UUID;
  grp_2 UUID;
  rows_affected INT;
BEGIN
  -- Validate both slides exist and belong to same group
  SELECT group_id INTO grp_1 FROM slides WHERE id = p_slide_id_1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slide with id % not found', p_slide_id_1;
  END IF;

  SELECT group_id INTO grp_2 FROM slides WHERE id = p_slide_id_2;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slide with id % not found', p_slide_id_2;
  END IF;

  IF grp_1 IS DISTINCT FROM grp_2 THEN
    RAISE EXCEPTION 'Slides must belong to the same group to swap order';
  END IF;

  -- Atomic swap: single UPDATE swaps both values
  WITH swapped AS (
    SELECT id, order_index,
      CASE id
        WHEN p_slide_id_1 THEN (SELECT order_index FROM slides WHERE id = p_slide_id_2)
        WHEN p_slide_id_2 THEN (SELECT order_index FROM slides WHERE id = p_slide_id_1)
      END AS new_idx
    FROM slides
    WHERE id IN (p_slide_id_1, p_slide_id_2)
  )
  UPDATE slides s
  SET order_index = sw.new_idx
  FROM swapped sw
  WHERE s.id = sw.id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected <> 2 THEN
    RAISE EXCEPTION 'Swap failed: expected 2 rows updated, got %', rows_affected;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_slide_at_index_transaction(UUID, UUID, TEXT, INT, JSONB, JSONB, TEXT, TEXT, BOOLEAN, TEXT, INT, INT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION swap_slides_order_transaction(UUID, UUID) TO authenticated;
