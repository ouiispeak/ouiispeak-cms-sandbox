-- 016_activity_slides_setup.sql
-- Purpose: add group-scoped activity slide component runtime tables and atomic import RPC.
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.activity_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_slides_group_id_idx ON public.activity_slides(group_id);

CREATE TABLE IF NOT EXISTS public.activity_slide_field_values (
  activity_slide_id UUID NOT NULL REFERENCES public.activity_slides(id) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL DEFAULT 'activity_slides',
  category_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (activity_slide_id, component_name, category_name, field_name),
  CONSTRAINT activity_slide_field_values_component_name_check CHECK (component_name = 'activity_slides'),
  CONSTRAINT activity_slide_field_values_no_system_slide_id_check CHECK (field_name <> 'slideId')
);

CREATE OR REPLACE FUNCTION public.enforce_activity_slide_structured_payload_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_keys TEXT[] := ARRAY[
    'lines',
    'targetText',
    'body',
    'choiceElements',
    'audio',
    'buttons',
    'promptMode',
    'intonationOptions',
    'correctCurveId',
    'audioPrompt',
    'syllableBreakdown',
    'correctStressIndex'
  ];
  v_props_json_raw TEXT;
  v_props_json JSONB;
  v_conflicting_fields TEXT[];
BEGIN
  IF NEW.component_name <> 'activity_slides' THEN
    RETURN NEW;
  END IF;

  IF NEW.field_name = 'propsJson' THEN
    IF NEW.field_value IS NULL OR btrim(NEW.field_value) = '' THEN
      RETURN NEW;
    END IF;

    BEGIN
      v_props_json := NEW.field_value::JSONB;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Activity slide % propsJson must be valid JSON.', NEW.activity_slide_id;
    END;

    SELECT ARRAY_AGG(field_name ORDER BY field_name)
    INTO v_conflicting_fields
    FROM public.activity_slide_field_values
    WHERE activity_slide_id = NEW.activity_slide_id
      AND component_name = 'activity_slides'
      AND field_name = ANY(v_conflict_keys)
      AND field_value IS NOT NULL
      AND btrim(field_value) <> ''
      AND (v_props_json ? field_name);

    IF COALESCE(array_length(v_conflicting_fields, 1), 0) > 0 THEN
      RAISE EXCEPTION
        'Activity slide % cannot persist propsJson with duplicate top-level structured fields: %.',
        NEW.activity_slide_id,
        array_to_string(v_conflicting_fields, ', ');
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.field_name = ANY(v_conflict_keys) AND NEW.field_value IS NOT NULL AND btrim(NEW.field_value) <> '' THEN
    SELECT field_value
    INTO v_props_json_raw
    FROM public.activity_slide_field_values
    WHERE activity_slide_id = NEW.activity_slide_id
      AND component_name = 'activity_slides'
      AND field_name = 'propsJson'
    LIMIT 1;

    IF v_props_json_raw IS NULL OR btrim(v_props_json_raw) = '' THEN
      RETURN NEW;
    END IF;

    BEGIN
      v_props_json := v_props_json_raw::JSONB;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Activity slide % has invalid stored propsJson JSON.', NEW.activity_slide_id;
    END;

    IF v_props_json ? NEW.field_name THEN
      RAISE EXCEPTION
        'Activity slide % cannot persist top-level field "%" when propsJson already defines "%".',
        NEW.activity_slide_id,
        NEW.field_name,
        NEW.field_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activity_slide_structured_payload_guard
ON public.activity_slide_field_values;

CREATE TRIGGER activity_slide_structured_payload_guard
BEFORE INSERT OR UPDATE
ON public.activity_slide_field_values
FOR EACH ROW
EXECUTE FUNCTION public.enforce_activity_slide_structured_payload_guard();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'activity_slide_field_values_no_system_slide_id_check'
      AND conrelid = 'public.activity_slide_field_values'::regclass
  ) THEN
    ALTER TABLE public.activity_slide_field_values
      ADD CONSTRAINT activity_slide_field_values_no_system_slide_id_check
      CHECK (field_name <> 'slideId');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'activity_slide_field_values_component_field_fk'
      AND conrelid = 'public.activity_slide_field_values'::regclass
  ) THEN
    ALTER TABLE public.activity_slide_field_values
      ADD CONSTRAINT activity_slide_field_values_component_field_fk
      FOREIGN KEY (component_name, category_name, field_name)
      REFERENCES public.component_config_fields(component_name, category_name, field_name)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END $$;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.activity_slides TO service_role;
GRANT SELECT ON public.activity_slides TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.activity_slide_field_values TO service_role;
GRANT SELECT ON public.activity_slide_field_values TO anon, authenticated;

-- Keep content slides and activity slides separated in active config projection.
UPDATE public.field_dictionary_component_rules
SET
  is_present = false,
  is_required = false
WHERE component_name = 'slides'
  AND field_key IN ('activityId', 'lines', 'propsJson', 'runtimeContractV1');

CREATE OR REPLACE FUNCTION public.import_activity_slides_create_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core JSONB;
  v_values JSONB;
  v_activity_slide_id UUID;
  v_group_id UUID;
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
      v_group_id := NULLIF(v_row->>'groupId', '')::UUID;
      v_core := COALESCE(v_row->'core', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Each create entry must include a valid uuid "groupId".';
      END IF;

      IF jsonb_typeof(v_core) <> 'object' THEN
        RAISE EXCEPTION 'core must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      INSERT INTO public.activity_slides (group_id)
      VALUES (v_group_id)
      RETURNING id INTO v_activity_slide_id;

      INSERT INTO public.activity_slide_field_values
        (activity_slide_id, component_name, category_name, field_name, field_value)
      SELECT
        v_activity_slide_id,
        'activity_slides',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (activity_slide_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Activity slide create import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_activity_slides_update_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core_patch JSONB;
  v_values JSONB;
  v_activity_slide_id UUID;
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
      v_activity_slide_id := NULLIF(v_row->>'slideId', '')::UUID;
      v_core_patch := COALESCE(v_row->'core_patch', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_activity_slide_id IS NULL THEN
        RAISE EXCEPTION 'Each update entry must include a valid uuid "slideId".';
      END IF;

      IF jsonb_typeof(v_core_patch) <> 'object' THEN
        RAISE EXCEPTION 'core_patch must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      UPDATE public.activity_slides s
      SET
        group_id = CASE
          WHEN v_core_patch ? 'group_id' THEN NULLIF(v_core_patch->>'group_id', '')::UUID
          ELSE s.group_id
        END
      WHERE s.id = v_activity_slide_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Activity slide % not found.', v_activity_slide_id;
      END IF;

      INSERT INTO public.activity_slide_field_values
        (activity_slide_id, component_name, category_name, field_name, field_value)
      SELECT
        v_activity_slide_id,
        'activity_slides',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (activity_slide_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Activity slide update import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_activity_slides_create_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_activity_slides_update_atomic(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_activity_slides_create_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_activity_slides_update_atomic(JSONB) TO service_role;
