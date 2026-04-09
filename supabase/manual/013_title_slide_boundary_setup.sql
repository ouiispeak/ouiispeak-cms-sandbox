-- 013_title_slide_boundary_setup.sql
-- Purpose: add lesson-scoped title boundary component runtime tables and atomic import RPC.
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.title_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS title_slides_lesson_id_idx ON public.title_slides(lesson_id);

CREATE TABLE IF NOT EXISTS public.title_slide_field_values (
  title_slide_id UUID NOT NULL REFERENCES public.title_slides(id) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL DEFAULT 'title_slides',
  category_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (title_slide_id, component_name, category_name, field_name),
  CONSTRAINT title_slide_field_values_component_name_check CHECK (component_name = 'title_slides'),
  CONSTRAINT title_slide_field_values_no_system_slide_id_check CHECK (field_name <> 'slideId')
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'title_slide_field_values_no_system_slide_id_check'
      AND conrelid = 'public.title_slide_field_values'::regclass
  ) THEN
    ALTER TABLE public.title_slide_field_values
      ADD CONSTRAINT title_slide_field_values_no_system_slide_id_check
      CHECK (field_name <> 'slideId');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'title_slide_field_values_component_field_fk'
      AND conrelid = 'public.title_slide_field_values'::regclass
  ) THEN
    ALTER TABLE public.title_slide_field_values
      ADD CONSTRAINT title_slide_field_values_component_field_fk
      FOREIGN KEY (component_name, category_name, field_name)
      REFERENCES public.component_config_fields(component_name, category_name, field_name)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END $$;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.title_slides TO service_role;
GRANT SELECT ON public.title_slides TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.title_slide_field_values TO service_role;
GRANT SELECT ON public.title_slide_field_values TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.import_title_slides_create_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core JSONB;
  v_values JSONB;
  v_title_slide_id UUID;
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

      INSERT INTO public.title_slides (lesson_id)
      VALUES (v_lesson_id)
      RETURNING id INTO v_title_slide_id;

      INSERT INTO public.title_slide_field_values (title_slide_id, component_name, category_name, field_name, field_value)
      SELECT
        v_title_slide_id,
        'title_slides',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (title_slide_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Title slide create import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_title_slides_update_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core_patch JSONB;
  v_values JSONB;
  v_title_slide_id UUID;
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
      v_title_slide_id := NULLIF(v_row->>'slideId', '')::UUID;
      v_core_patch := COALESCE(v_row->'core_patch', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_title_slide_id IS NULL THEN
        RAISE EXCEPTION 'Each update entry must include a valid uuid "slideId".';
      END IF;

      IF jsonb_typeof(v_core_patch) <> 'object' THEN
        RAISE EXCEPTION 'core_patch must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      UPDATE public.title_slides ts
      SET
        lesson_id = CASE
          WHEN v_core_patch ? 'lesson_id' THEN NULLIF(v_core_patch->>'lesson_id', '')::UUID
          ELSE ts.lesson_id
        END
      WHERE ts.id = v_title_slide_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Title slide % not found.', v_title_slide_id;
      END IF;

      INSERT INTO public.title_slide_field_values (title_slide_id, component_name, category_name, field_name, field_value)
      SELECT
        v_title_slide_id,
        'title_slides',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (title_slide_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Title slide update import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_title_slides_create_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_title_slides_update_atomic(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_title_slides_create_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_title_slides_update_atomic(JSONB) TO service_role;
