CREATE TABLE IF NOT EXISTS public.levels (
  level_number INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  definition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.levels
  ADD COLUMN IF NOT EXISTS definition TEXT;

INSERT INTO public.levels (level_number, name, definition)
VALUES
  (1, 'Level 1', 'Survival Mapping: Recognizes key words/phrases and links them to meaning in context.'),
  (2, 'Level 2', 'Formulaic Use: Uses memorized chunks (fixed phrases) for basic needs.'),
  (3, 'Level 3', 'Pattern Noticing: Begins spotting patterns (word order, verb forms) without full control.'),
  (4, 'Level 4', 'Controlled Construction: Builds simple sentences deliberately, with frequent errors.'),
  (5, 'Level 5', 'Functional Communication: Communicates basic needs reliably; errors persist but meaning is clear.'),
  (6, 'Level 6', 'Flexible Sentence Building: Combines structures more freely; starts adapting language to new situations.'),
  (7, 'Level 7', 'Connected Discourse: Produces linked ideas (stories, explanations) with basic cohesion.'),
  (8, 'Level 8', 'Precision & Control: Reduces errors; chooses forms more accurately; handles more complexity.'),
  (9, 'Level 9', 'Nuance & Adaptation: Adjusts tone, register, and phrasing depending on context.'),
  (10, 'Level 10', 'Automaticity & Range: Uses language fluidly, with speed, flexibility, and minimal conscious effort.')
ON CONFLICT (level_number) DO UPDATE
SET
  name = EXCLUDED.name,
  definition = EXCLUDED.definition;

UPDATE public.levels
SET definition = COALESCE(definition, '')
WHERE definition IS NULL;

ALTER TABLE public.levels
  ALTER COLUMN definition SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'levels_level_number_range_check'
      AND conrelid = 'public.levels'::regclass
  ) THEN
    ALTER TABLE public.levels
      ADD CONSTRAINT levels_level_number_range_check
      CHECK (level_number BETWEEN 1 AND 10);
  END IF;
END $$;
