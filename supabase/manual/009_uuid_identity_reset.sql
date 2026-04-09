CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS public.import_slides_update_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_slides_create_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_lesson_ends_update_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_lesson_ends_create_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_title_slides_update_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_title_slides_create_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_groups_update_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_groups_create_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_lessons_update_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_lessons_create_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_modules_update_atomic(JSONB);
DROP FUNCTION IF EXISTS public.import_modules_create_atomic(JSONB);
DROP FUNCTION IF EXISTS public.set_scoped_field_mapping(TEXT, TEXT, TEXT);

DROP TABLE IF EXISTS public.field_dictionary_scoped_mappings CASCADE;

DROP TABLE IF EXISTS public.slide_field_values CASCADE;
DROP TABLE IF EXISTS public.slides CASCADE;
DROP TABLE IF EXISTS public.lesson_end_field_values CASCADE;
DROP TABLE IF EXISTS public.lesson_ends CASCADE;
DROP TABLE IF EXISTS public.title_slide_field_values CASCADE;
DROP TABLE IF EXISTS public.title_slides CASCADE;
DROP TABLE IF EXISTS public.group_field_values CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.lesson_field_values CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.module_field_values CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.lessons_orphan_archive CASCADE;

CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  text TEXT,
  level_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.module_field_values (
  module_id UUID NOT NULL REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL DEFAULT 'modules',
  category_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (module_id, component_name, category_name, field_name),
  CONSTRAINT module_field_values_component_name_check CHECK (component_name = 'modules'),
  CONSTRAINT module_field_values_no_system_module_id_check CHECK (field_name <> 'moduleId')
);

ALTER TABLE public.module_field_values
  ADD CONSTRAINT module_field_values_component_field_fk
  FOREIGN KEY (component_name, category_name, field_name)
  REFERENCES public.component_config_fields(component_name, category_name, field_name)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

CREATE INDEX modules_level_number_idx ON public.modules(level_number);

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title TEXT,
  text TEXT,
  subtitle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lesson_field_values (
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL DEFAULT 'lessons',
  category_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lesson_id, component_name, category_name, field_name),
  CONSTRAINT lesson_field_values_component_name_check CHECK (component_name = 'lessons'),
  CONSTRAINT lesson_field_values_no_system_lesson_id_check CHECK (field_name <> 'lessonId')
);

ALTER TABLE public.lesson_field_values
  ADD CONSTRAINT lesson_field_values_component_field_fk
  FOREIGN KEY (component_name, category_name, field_name)
  REFERENCES public.component_config_fields(component_name, category_name, field_name)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

CREATE INDEX lessons_module_id_idx ON public.lessons(module_id);

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title TEXT,
  text TEXT,
  subtitle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.group_field_values (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL DEFAULT 'groups',
  category_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, component_name, category_name, field_name),
  CONSTRAINT group_field_values_component_name_check CHECK (component_name = 'groups'),
  CONSTRAINT group_field_values_no_system_group_id_check CHECK (field_name <> 'groupId')
);

ALTER TABLE public.group_field_values
  ADD CONSTRAINT group_field_values_component_field_fk
  FOREIGN KEY (component_name, category_name, field_name)
  REFERENCES public.component_config_fields(component_name, category_name, field_name)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

CREATE INDEX groups_lesson_id_idx ON public.groups(lesson_id);

CREATE TABLE public.slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.slide_field_values (
  slide_id UUID NOT NULL REFERENCES public.slides(id) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL DEFAULT 'slides',
  category_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (slide_id, component_name, category_name, field_name),
  CONSTRAINT slide_field_values_component_name_check CHECK (component_name = 'slides'),
  CONSTRAINT slide_field_values_no_system_slide_id_check CHECK (field_name <> 'slideId')
);

ALTER TABLE public.slide_field_values
  ADD CONSTRAINT slide_field_values_component_field_fk
  FOREIGN KEY (component_name, category_name, field_name)
  REFERENCES public.component_config_fields(component_name, category_name, field_name)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

CREATE INDEX slides_group_id_idx ON public.slides(group_id);

GRANT INSERT, SELECT, UPDATE, DELETE ON public.modules TO service_role;
GRANT SELECT ON public.modules TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.module_field_values TO service_role;
GRANT SELECT ON public.module_field_values TO anon, authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.lessons TO service_role;
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.lesson_field_values TO service_role;
GRANT SELECT ON public.lesson_field_values TO anon, authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.groups TO service_role;
GRANT SELECT ON public.groups TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.group_field_values TO service_role;
GRANT SELECT ON public.group_field_values TO anon, authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.slides TO service_role;
GRANT SELECT ON public.slides TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.slide_field_values TO service_role;
GRANT SELECT ON public.slide_field_values TO anon, authenticated;

SELECT *
FROM public.upsert_field_dictionary_entry(
  'moduleId',
  'Identity & Lifecycle',
  'text',
  1,
  'active',
  NULL
);

SELECT *
FROM public.upsert_field_dictionary_entry(
  'lessonId',
  'Identity & Lifecycle',
  'text',
  2,
  'active',
  NULL
);

SELECT *
FROM public.upsert_field_dictionary_entry(
  'groupId',
  'Identity & Lifecycle',
  'text',
  3,
  'active',
  NULL
);

SELECT *
FROM public.upsert_field_dictionary_entry(
  'slug',
  'Identity & Lifecycle',
  'text',
  5,
  'active',
  NULL
);

SELECT *
FROM public.upsert_field_dictionary_entry(
  'slideId',
  'Identity & Lifecycle',
  'text',
  4,
  'active',
  NULL
);

SELECT public.set_field_dictionary_status('id', 'legacy');

SELECT public.set_field_dictionary_component_presence('id', 'modules', false, false);
SELECT public.set_field_dictionary_component_presence('slideId', 'modules', false, false);
SELECT public.set_field_dictionary_component_presence('moduleId', 'modules', true, true);
SELECT public.set_field_dictionary_component_presence('slug', 'modules', true, true);
SELECT public.set_field_dictionary_component_presence('title', 'modules', true, true);
SELECT public.set_field_dictionary_component_presence('text', 'modules', true, false);
SELECT public.set_field_dictionary_component_presence('level', 'modules', true, true);
SELECT public.set_field_dictionary_component_presence('subtitle', 'modules', false, false);

SELECT public.set_field_dictionary_component_presence('id', 'lessons', false, false);
SELECT public.set_field_dictionary_component_presence('slideId', 'lessons', false, false);
SELECT public.set_field_dictionary_component_presence('lessonId', 'lessons', true, true);
SELECT public.set_field_dictionary_component_presence('slug', 'lessons', true, true);
SELECT public.set_field_dictionary_component_presence('moduleId', 'lessons', false, false);
SELECT public.set_field_dictionary_component_presence('title', 'lessons', true, false);
SELECT public.set_field_dictionary_component_presence('text', 'lessons', true, false);
SELECT public.set_field_dictionary_component_presence('subtitle', 'lessons', true, false);
SELECT public.set_field_dictionary_component_presence('level', 'lessons', false, false);

SELECT public.set_field_dictionary_component_presence('id', 'groups', false, false);
SELECT public.set_field_dictionary_component_presence('slideId', 'groups', false, false);
SELECT public.set_field_dictionary_component_presence('groupId', 'groups', true, true);
SELECT public.set_field_dictionary_component_presence('slug', 'groups', true, true);
SELECT public.set_field_dictionary_component_presence('lessonId', 'groups', false, false);
SELECT public.set_field_dictionary_component_presence('title', 'groups', true, false);
SELECT public.set_field_dictionary_component_presence('text', 'groups', true, false);
SELECT public.set_field_dictionary_component_presence('subtitle', 'groups', true, false);
SELECT public.set_field_dictionary_component_presence('level', 'groups', false, false);

SELECT public.set_field_dictionary_component_presence('id', 'slides', false, false);
SELECT public.set_field_dictionary_component_presence('moduleId', 'slides', false, false);
SELECT public.set_field_dictionary_component_presence('lessonId', 'slides', false, false);
SELECT public.set_field_dictionary_component_presence('groupId', 'slides', false, false);
SELECT public.set_field_dictionary_component_presence('slideId', 'slides', true, true);
SELECT public.set_field_dictionary_component_presence('slug', 'slides', true, true);
SELECT public.set_field_dictionary_component_presence('title', 'slides', false, false);
SELECT public.set_field_dictionary_component_presence('text', 'slides', false, false);
SELECT public.set_field_dictionary_component_presence('subtitle', 'slides', false, false);
SELECT public.set_field_dictionary_component_presence('level', 'slides', false, false);

CREATE OR REPLACE FUNCTION public.import_modules_create_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core JSONB;
  v_values JSONB;
  v_module_id UUID;
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
      v_core := COALESCE(v_row->'core', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF jsonb_typeof(v_core) <> 'object' THEN
        RAISE EXCEPTION 'core must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      INSERT INTO public.modules (title, text, level_number)
      VALUES (
        CASE WHEN v_core ? 'title' THEN v_core->>'title' ELSE NULL END,
        CASE WHEN v_core ? 'text' THEN v_core->>'text' ELSE NULL END,
        CASE WHEN v_core ? 'level_number' THEN NULLIF(v_core->>'level_number', '')::INTEGER ELSE NULL END
      )
      RETURNING id INTO v_module_id;

      INSERT INTO public.module_field_values (module_id, component_name, category_name, field_name, field_value)
      SELECT
        v_module_id,
        'modules',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (module_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Module create import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_modules_update_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core_patch JSONB;
  v_values JSONB;
  v_module_id UUID;
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
      v_module_id := NULLIF(v_row->>'moduleId', '')::UUID;
      v_core_patch := COALESCE(v_row->'core_patch', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_module_id IS NULL THEN
        RAISE EXCEPTION 'Each update entry must include a valid uuid "moduleId".';
      END IF;

      IF jsonb_typeof(v_core_patch) <> 'object' THEN
        RAISE EXCEPTION 'core_patch must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      UPDATE public.modules m
      SET
        title = CASE WHEN v_core_patch ? 'title' THEN v_core_patch->>'title' ELSE m.title END,
        text = CASE WHEN v_core_patch ? 'text' THEN v_core_patch->>'text' ELSE m.text END,
        level_number = CASE
          WHEN v_core_patch ? 'level_number' THEN NULLIF(v_core_patch->>'level_number', '')::INTEGER
          ELSE m.level_number
        END
      WHERE m.id = v_module_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Module % not found.', v_module_id;
      END IF;

      INSERT INTO public.module_field_values (module_id, component_name, category_name, field_name, field_value)
      SELECT
        v_module_id,
        'modules',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (module_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Module update import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_lessons_create_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core JSONB;
  v_values JSONB;
  v_module_id UUID;
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
      v_module_id := NULLIF(v_row->>'moduleId', '')::UUID;
      v_core := COALESCE(v_row->'core', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_module_id IS NULL THEN
        RAISE EXCEPTION 'Each create entry must include a valid uuid "moduleId".';
      END IF;

      IF jsonb_typeof(v_core) <> 'object' THEN
        RAISE EXCEPTION 'core must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      INSERT INTO public.lessons (module_id, title, text, subtitle)
      VALUES (
        v_module_id,
        CASE WHEN v_core ? 'title' THEN v_core->>'title' ELSE NULL END,
        CASE WHEN v_core ? 'text' THEN v_core->>'text' ELSE NULL END,
        CASE WHEN v_core ? 'subtitle' THEN v_core->>'subtitle' ELSE NULL END
      )
      RETURNING id INTO v_lesson_id;

      INSERT INTO public.lesson_field_values (lesson_id, component_name, category_name, field_name, field_value)
      SELECT
        v_lesson_id,
        'lessons',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (lesson_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Lesson create import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_lessons_update_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core_patch JSONB;
  v_values JSONB;
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
      v_core_patch := COALESCE(v_row->'core_patch', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_lesson_id IS NULL THEN
        RAISE EXCEPTION 'Each update entry must include a valid uuid "lessonId".';
      END IF;

      IF jsonb_typeof(v_core_patch) <> 'object' THEN
        RAISE EXCEPTION 'core_patch must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      UPDATE public.lessons l
      SET
        module_id = CASE
          WHEN v_core_patch ? 'module_id' THEN NULLIF(v_core_patch->>'module_id', '')::UUID
          ELSE l.module_id
        END,
        title = CASE WHEN v_core_patch ? 'title' THEN v_core_patch->>'title' ELSE l.title END,
        text = CASE WHEN v_core_patch ? 'text' THEN v_core_patch->>'text' ELSE l.text END,
        subtitle = CASE WHEN v_core_patch ? 'subtitle' THEN v_core_patch->>'subtitle' ELSE l.subtitle END
      WHERE l.id = v_lesson_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson % not found.', v_lesson_id;
      END IF;

      INSERT INTO public.lesson_field_values (lesson_id, component_name, category_name, field_name, field_value)
      SELECT
        v_lesson_id,
        'lessons',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (lesson_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Lesson update import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_groups_create_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core JSONB;
  v_values JSONB;
  v_group_id UUID;
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

      INSERT INTO public.groups (lesson_id, title, text, subtitle)
      VALUES (
        v_lesson_id,
        CASE WHEN v_core ? 'title' THEN v_core->>'title' ELSE NULL END,
        CASE WHEN v_core ? 'text' THEN v_core->>'text' ELSE NULL END,
        CASE WHEN v_core ? 'subtitle' THEN v_core->>'subtitle' ELSE NULL END
      )
      RETURNING id INTO v_group_id;

      INSERT INTO public.group_field_values (group_id, component_name, category_name, field_name, field_value)
      SELECT
        v_group_id,
        'groups',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (group_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Group create import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_groups_update_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core_patch JSONB;
  v_values JSONB;
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
      v_core_patch := COALESCE(v_row->'core_patch', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Each update entry must include a valid uuid "groupId".';
      END IF;

      IF jsonb_typeof(v_core_patch) <> 'object' THEN
        RAISE EXCEPTION 'core_patch must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      UPDATE public.groups g
      SET
        lesson_id = CASE
          WHEN v_core_patch ? 'lesson_id' THEN NULLIF(v_core_patch->>'lesson_id', '')::UUID
          ELSE g.lesson_id
        END,
        title = CASE WHEN v_core_patch ? 'title' THEN v_core_patch->>'title' ELSE g.title END,
        text = CASE WHEN v_core_patch ? 'text' THEN v_core_patch->>'text' ELSE g.text END,
        subtitle = CASE WHEN v_core_patch ? 'subtitle' THEN v_core_patch->>'subtitle' ELSE g.subtitle END
      WHERE g.id = v_group_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Group % not found.', v_group_id;
      END IF;

      INSERT INTO public.group_field_values (group_id, component_name, category_name, field_name, field_value)
      SELECT
        v_group_id,
        'groups',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (group_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Group update import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_slides_create_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core JSONB;
  v_values JSONB;
  v_slide_id UUID;
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

      INSERT INTO public.slides (group_id)
      VALUES (v_group_id)
      RETURNING id INTO v_slide_id;

      INSERT INTO public.slide_field_values (slide_id, component_name, category_name, field_name, field_value)
      SELECT
        v_slide_id,
        'slides',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (slide_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Slide create import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_slides_update_atomic(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_core_patch JSONB;
  v_values JSONB;
  v_slide_id UUID;
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
      v_slide_id := NULLIF(v_row->>'slideId', '')::UUID;
      v_core_patch := COALESCE(v_row->'core_patch', '{}'::jsonb);
      v_values := COALESCE(v_row->'values', '[]'::jsonb);

      IF v_slide_id IS NULL THEN
        RAISE EXCEPTION 'Each update entry must include a valid uuid "slideId".';
      END IF;

      IF jsonb_typeof(v_core_patch) <> 'object' THEN
        RAISE EXCEPTION 'core_patch must be an object.';
      END IF;

      IF jsonb_typeof(v_values) <> 'array' THEN
        RAISE EXCEPTION 'values must be an array.';
      END IF;

      UPDATE public.slides s
      SET
        group_id = CASE
          WHEN v_core_patch ? 'group_id' THEN NULLIF(v_core_patch->>'group_id', '')::UUID
          ELSE s.group_id
        END
      WHERE s.id = v_slide_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Slide % not found.', v_slide_id;
      END IF;

      INSERT INTO public.slide_field_values (slide_id, component_name, category_name, field_name, field_value)
      SELECT
        v_slide_id,
        'slides',
        value_row->>'category_name',
        value_row->>'field_name',
        CASE
          WHEN value_row ? 'field_value' AND jsonb_typeof(value_row->'field_value') = 'null' THEN NULL
          ELSE value_row->>'field_value'
        END
      FROM jsonb_array_elements(v_values) AS value_row
      ON CONFLICT (slide_id, component_name, category_name, field_name)
      DO UPDATE SET
        field_value = EXCLUDED.field_value,
        updated_at = NOW();

      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Slide update import entry % failed: %', COALESCE(v_entry_index, v_count + 1), SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_modules_create_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_modules_update_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_lessons_create_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_lessons_update_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_groups_create_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_groups_update_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_slides_create_atomic(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_slides_update_atomic(JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.import_modules_create_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_modules_update_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_lessons_create_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_lessons_update_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_groups_create_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_groups_update_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_slides_create_atomic(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_slides_update_atomic(JSONB) TO service_role;
