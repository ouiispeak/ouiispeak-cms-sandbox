-- Migration: Add status column to lessons table
-- Date: 2025
-- Description: Adds status column for lesson workflow: draft, waiting_review, published.
--   - waiting_review: Queued for inspection (visible only on Queued page)
--   - draft: Approved, editable (visible in dashboard, hierarchy, etc.)
--   - published: Approved and live
--
-- P8 — CMS Ingestion Communication Layer (Step 1.1)

-- Step 1: Add status column with default 'draft'
-- Existing lessons become 'draft' (treated as approved)
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Step 2: Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_status_check'
    AND conrelid = 'public.lessons'::regclass
  ) THEN
    ALTER TABLE public.lessons
    ADD CONSTRAINT lessons_status_check
    CHECK (status IN ('draft', 'waiting_review', 'published'));
  END IF;
END $$;

-- Step 3: Create index for filtering by status (Queued page, dashboard)
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);

COMMENT ON COLUMN public.lessons.status IS 'Workflow status: draft (approved/editable), waiting_review (queued for inspection), published (live)';
