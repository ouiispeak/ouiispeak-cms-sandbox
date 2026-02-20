-- Fix: column reference "lesson_id" is ambiguous in delete_lesson_transaction
-- The parameter name shadows/conflicts with column names. Use a local variable
-- (same pattern as delete_group_transaction) to resolve ambiguity.
--
-- Run this migration if delete_lesson_transaction fails with:
--   "column reference \"lesson_id\" is ambiguous"

CREATE OR REPLACE FUNCTION delete_lesson_transaction(lesson_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_lesson_id UUID;
BEGIN
  -- Store parameter in local variable to avoid ambiguity with column names
  target_lesson_id := delete_lesson_transaction.lesson_id;

  -- Delete slides for this lesson
  DELETE FROM slides
  WHERE slides.lesson_id = target_lesson_id;

  -- Delete groups for this lesson
  DELETE FROM lesson_groups
  WHERE lesson_groups.lesson_id = target_lesson_id;

  -- Finally, delete the lesson
  DELETE FROM lessons
  WHERE lessons.id = target_lesson_id;

  -- If lesson doesn't exist, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson with id % not found', target_lesson_id;
  END IF;
END;
$$;
