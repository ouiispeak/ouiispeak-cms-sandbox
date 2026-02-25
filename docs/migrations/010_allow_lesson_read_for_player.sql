-- Allow ouiispeak player to read lessons, groups, and slides
-- Fixes: [loadLessonFromDb] Lesson not found (RLS blocking read)
--
-- Run in Supabase Dashboard → SQL Editor if the player cannot load lessons.

-- Enable RLS if not already (required before adding policies)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read lessons for the player
DROP POLICY IF EXISTS "lessons_select_for_player" ON public.lessons;
CREATE POLICY "lessons_select_for_player" ON public.lessons
  FOR SELECT USING (true);

-- Allow read of lesson_groups (needed for group titles, ordering)
DROP POLICY IF EXISTS "lesson_groups_select_for_player" ON public.lesson_groups;
CREATE POLICY "lesson_groups_select_for_player" ON public.lesson_groups
  FOR SELECT USING (true);

-- Allow read of slides (needed for lesson content)
DROP POLICY IF EXISTS "slides_select_for_player" ON public.slides;
CREATE POLICY "slides_select_for_player" ON public.slides
  FOR SELECT USING (true);
