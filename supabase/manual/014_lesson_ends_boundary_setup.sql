-- 014_lesson_ends_boundary_setup.sql
-- Purpose: add lesson-scoped lesson_ends boundary component runtime tables and atomic import RPC.
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.lesson_ends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_ends_lesson_id_idx ON public.lesson_ends(lesson_id);

CREATE TABLE IF NOT EXISTS public.lesson_end_field_values (
  lesson_end_id UUID NOT NULL REFERENCES public.lesson_ends(id) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL DEFAULT 'lesson_ends',
  category_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lesson_end_id, component_name, category_name, field_name),
  CONSTRAINT lesson_end_field_values_component_name_check CHECK (component_name = 'lesson_ends'),
  CONSTRAINT lesson_end_field_values_no_system_slide_id_check CHECK (field_name <> 'slideId')
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lesson_end_field_values_no_system_slide_id_check'
      AND conrelid = 'public.lesson_end_field_values'::regclass
  ) THEN
    ALTER TABLE public.lesson_end_field_values
      ADD CONSTRAINT lesson_end_field_values_no_system_slide_id_check
      CHECK (field_name <> 'slideId');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lesson_end_field_values_component_field_fk'
      AND conrelid = 'public.lesson_end_field_values'::regclass
  ) THEN
    ALTER TABLE public.lesson_end_field_values
      ADD CONSTRAINT lesson_end_field_values_component_field_fk
      FOREIGN KEY (component_name, category_name, field_name)
      REFERENCES public.component_config_fields(component_name, category_name, field_name)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END $$;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.lesson_ends TO service_role;
GRANT SELECT ON public.lesson_ends TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.lesson_end_field_values TO service_role;
GRANT SELECT ON public.lesson_end_field_values TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.import_lesson_ends_create_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core JSONB;
  v_values JSONB;
  v_lesson_end_id UUID;
  v_lesson_id UUID;
  v_entry_index INTEGER;
  v_count INTEGER := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'Import payload cannot be empty.';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      IF jsonb_typeof(v_row) <> 'object' THEN
        RAISE EXCEPTION 'Each entry must be an object.';
      END IF;

      v_entry_index := COALESCE(NULLIF(v_row->>'entry_index', '')::INTEGER, v_count + 1);
      v_lesson_id := NULLIF(v_row->>'lessonId', '')::UUID;
      v_core := COALESCE(v_row->'core', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_lesson_id IS NULL THEN
        RAISE EXCEPTION 'Each create entry must include a valid uuid "lessonId".';
      END IF;

      IF jsonb_typeof(v_core) <> 'object' THEN
        RAISE EXCEPTION 'core must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      INSERT INTO public.lesson_ends (lesson_id)
      VALUES (v_lesson_id)
      RETURNING id INTO v_lesson_end_id;

      INSERT INTO public.lesson_end_field_values (lesson_end_id, component_name, category_name, field_name, field_value)
      SELECT
        v_lesson_end_id,
        'lesson_ends',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (lesson_end_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'lesson_ends create import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_lesson_ends_update_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core_patch JSONB;
  v_values JSONB;
  v_lesson_end_id UUID;
  v_entry_index INTEGER;
  v_count INTEGER := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'Import payload cannot be empty.';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      IF jsonb_typeof(v_row) <> 'object' THEN
        RAISE EXCEPTION 'Each entry must be an object.';
      END IF;

      v_entry_index := COALESCE(NULLIF(v_row->>'entry_index', '')::INTEGER, v_count + 1);
      v_lesson_end_id := NULLIF(v_row->>'slideId', '')::UUID;
      v_core_patch := COALESCE(v_row->'core_patch', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_lesson_end_id IS NULL THEN
        RAISE EXCEPTION 'Each update entry must include a valid uuid "slideId".';
      END IF;

      IF jsonb_typeof(v_core_patch) <> 'object' THEN
        RAISE EXCEPTION 'core_patch must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      UPDATE public.lesson_ends le
      SET
        lesson_id = CASE
          WHEN v_core_patch ? 'lesson_id' THEN NULLIF(v_core_patch->>'lesson_id', '')::UUID
          ELSE le.lesson_id
        END
      WHERE le.id = v_lesson_end_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'lesson_ends % not found.', v_lesson_end_id;
      END IF;

      INSERT INTO public.lesson_end_field_values (lesson_end_id, component_name, category_name, field_name, field_value)
      SELECT
        v_lesson_end_id,
        'lesson_ends',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (lesson_end_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'lesson_ends update import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_lesson_ends_create_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_lesson_ends_update_atomic(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_lesson_ends_create_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_lesson_ends_update_atomic(JSONB) TO service_role;
