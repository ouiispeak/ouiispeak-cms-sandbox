-- 017_boundary_uniqueness_hardening.sql
-- Purpose: enforce one boundary row per lesson for title_slides and lesson_ends.
-- Idempotent: safe to re-run.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.title_slides
    GROUP BY lesson_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot apply title_slides uniqueness constraint: duplicate title boundaries exist per lesson.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.lesson_ends
    GROUP BY lesson_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot apply lesson_ends uniqueness constraint: duplicate lessonEnd boundaries exist per lesson.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS title_slides_lesson_id_unique_idx ON public.title_slides(lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_ends_lesson_id_unique_idx ON public.lesson_ends(lesson_id);
