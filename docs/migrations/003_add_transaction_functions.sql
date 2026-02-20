-- Tier 2.2 Step 2: Add Transaction Functions
-- Last updated: December 2024
--
-- This migration adds PostgreSQL functions that wrap deletion operations
-- in transactions to ensure atomicity. If any operation fails, the entire
-- transaction is rolled back.
--
-- Functions:
--   - delete_module_transaction(module_id UUID)
--   - delete_lesson_transaction(lesson_id UUID)
--   - delete_group_transaction(group_id UUID)
--   - delete_slide_transaction(slide_id UUID)

-- ============================================================================
-- Delete Module Transaction
-- ============================================================================
-- Deletes a module and all its children (lessons, groups, slides) atomically.
-- Order: slides → groups → lessons → module
CREATE OR REPLACE FUNCTION delete_module_transaction(module_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_module_id UUID;
  lesson_ids UUID[];
BEGIN
  -- Store parameter in local variable to avoid ambiguity with lessons.module_id
  target_module_id := delete_module_transaction.module_id;

  -- Get all lesson IDs for this module
  SELECT ARRAY_AGG(id) INTO lesson_ids
  FROM lessons
  WHERE lessons.module_id = target_module_id;

  -- Delete slides for these lessons (if any)
  IF lesson_ids IS NOT NULL AND array_length(lesson_ids, 1) > 0 THEN
    DELETE FROM slides
    WHERE lesson_id = ANY(lesson_ids);
  END IF;

  -- Delete groups for these lessons (if any)
  IF lesson_ids IS NOT NULL AND array_length(lesson_ids, 1) > 0 THEN
    DELETE FROM lesson_groups
    WHERE lesson_id = ANY(lesson_ids);
  END IF;

  -- Delete lessons for this module
  DELETE FROM lessons
  WHERE lessons.module_id = target_module_id;

  -- Finally, delete the module
  DELETE FROM modules
  WHERE modules.id = target_module_id;

  -- If module doesn't exist, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Module with id % not found', target_module_id;
  END IF;
END;
$$;

-- ============================================================================
-- Delete Lesson Transaction
-- ============================================================================
-- Deletes a lesson and all its children (groups, slides) atomically.
-- Order: slides → groups → lesson
CREATE OR REPLACE FUNCTION delete_lesson_transaction(lesson_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete slides for this lesson
  DELETE FROM slides
  WHERE lesson_id = delete_lesson_transaction.lesson_id;

  -- Delete groups for this lesson
  DELETE FROM lesson_groups
  WHERE lesson_id = delete_lesson_transaction.lesson_id;

  -- Finally, delete the lesson
  DELETE FROM lessons
  WHERE id = delete_lesson_transaction.lesson_id;

  -- If lesson doesn't exist, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson with id % not found', lesson_id;
  END IF;
END;
$$;

-- ============================================================================
-- Delete Group Transaction
-- ============================================================================
-- Deletes a group and all its slides atomically.
-- Order: slides → group
CREATE OR REPLACE FUNCTION delete_group_transaction(group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_group_id UUID;
BEGIN
  -- Store parameter in local variable to avoid ambiguity
  target_group_id := delete_group_transaction.group_id;
  
  -- Delete slides for this group
  DELETE FROM slides
  WHERE slides.group_id = target_group_id;

  -- Finally, delete the group
  DELETE FROM lesson_groups
  WHERE lesson_groups.id = target_group_id;

  -- If group doesn't exist, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group with id % not found', target_group_id;
  END IF;
END;
$$;

-- ============================================================================
-- Delete Slide Transaction
-- ============================================================================
-- Deletes a single slide atomically.
CREATE OR REPLACE FUNCTION delete_slide_transaction(slide_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the slide
  DELETE FROM slides
  WHERE id = delete_slide_transaction.slide_id;

  -- If slide doesn't exist, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slide with id % not found', slide_id;
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION delete_module_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_lesson_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_group_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_slide_transaction(UUID) TO authenticated;

-- Note: These functions use SECURITY DEFINER to run with elevated privileges,
-- allowing them to perform deletions that the caller might not have direct
-- permission to perform. This is safe because the functions only perform
-- deletions within the transaction and don't expose additional privileges.

