-- Field dictionary authority model:
-- - field_dictionary is the write authority for universal fields
-- - universal_fields is the runtime projection consumed by UI/config views
-- - dictionary rows are seeded only from current universal_fields

CREATE TABLE IF NOT EXISTS public.field_dictionary (
  field_key TEXT PRIMARY KEY,
  category_name TEXT NOT NULL REFERENCES public.config_categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  input_type TEXT NOT NULL,
  select_options_json JSONB,
  select_source TEXT,
  is_read_only BOOLEAN NOT NULL DEFAULT false,
  field_order INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  definition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT field_dictionary_input_type_check CHECK (
    input_type IN (
      'text',
      'textarea',
      'number',
      'checkbox',
      'select',
      'json',
      'list',
      'audio_selector',
      'audio_list',
      'audio_prompt',
      'blanks_mapper',
      'audio_lines_mapper',
      'choice_elements_mapper',
      'match_pairs_mapper',
      'avatar_dialogues_mapper',
      'media_picker'
    )
  ),
  CONSTRAINT field_dictionary_select_options_json_type_check
    CHECK (select_options_json IS NULL OR jsonb_typeof(select_options_json) = 'array'),
  CONSTRAINT field_dictionary_select_source_check
    CHECK (select_source IS NULL OR btrim(select_source) <> ''),
  CONSTRAINT field_dictionary_select_metadata_check
    CHECK (
      input_type = 'select'
      OR (select_options_json IS NULL AND select_source IS NULL)
    ),
  CONSTRAINT field_dictionary_field_order_check CHECK (field_order >= 0),
  CONSTRAINT field_dictionary_status_check CHECK (status IN ('active', 'legacy'))
);

ALTER TABLE public.field_dictionary
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.field_dictionary
SET updated_at = COALESCE(updated_at, NOW())
WHERE updated_at IS NULL;

ALTER TABLE public.field_dictionary
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.field_dictionary
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE public.field_dictionary
  ADD COLUMN IF NOT EXISTS select_options_json JSONB;

ALTER TABLE public.field_dictionary
  ADD COLUMN IF NOT EXISTS select_source TEXT;

ALTER TABLE public.field_dictionary
  ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN;

UPDATE public.field_dictionary
SET is_read_only = false
WHERE is_read_only IS NULL;

ALTER TABLE public.field_dictionary
  ALTER COLUMN is_read_only SET NOT NULL;

ALTER TABLE public.field_dictionary
  ALTER COLUMN is_read_only SET DEFAULT false;

UPDATE public.field_dictionary
SET
  select_options_json = NULL,
  select_source = NULL
WHERE input_type <> 'select'
  AND (select_options_json IS NOT NULL OR select_source IS NOT NULL);

ALTER TABLE public.field_dictionary
  DROP CONSTRAINT IF EXISTS field_dictionary_input_type_check;

ALTER TABLE public.field_dictionary
  ADD CONSTRAINT field_dictionary_input_type_check
  CHECK (
    input_type IN (
      'text',
      'textarea',
      'number',
      'checkbox',
      'select',
      'json',
      'list',
      'audio_selector',
      'audio_list',
      'audio_prompt',
      'blanks_mapper',
      'audio_lines_mapper',
      'choice_elements_mapper',
      'match_pairs_mapper',
      'avatar_dialogues_mapper',
      'media_picker'
    )
  );

ALTER TABLE public.field_dictionary
  DROP CONSTRAINT IF EXISTS field_dictionary_select_options_json_type_check;

ALTER TABLE public.field_dictionary
  ADD CONSTRAINT field_dictionary_select_options_json_type_check
  CHECK (select_options_json IS NULL OR jsonb_typeof(select_options_json) = 'array');

ALTER TABLE public.field_dictionary
  DROP CONSTRAINT IF EXISTS field_dictionary_select_source_check;

ALTER TABLE public.field_dictionary
  ADD CONSTRAINT field_dictionary_select_source_check
  CHECK (select_source IS NULL OR btrim(select_source) <> '');

ALTER TABLE public.field_dictionary
  DROP CONSTRAINT IF EXISTS field_dictionary_select_metadata_check;

ALTER TABLE public.field_dictionary
  ADD CONSTRAINT field_dictionary_select_metadata_check
  CHECK (
    input_type = 'select'
    OR (select_options_json IS NULL AND select_source IS NULL)
  );

CREATE TABLE IF NOT EXISTS public.field_dictionary_locations (
  field_key TEXT NOT NULL REFERENCES public.field_dictionary(field_key) ON UPDATE CASCADE ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (field_key, location_name),
  CONSTRAINT field_dictionary_locations_name_check
    CHECK (location_name IN ('cms', 'lv2', 'lesson_player', 'supabase'))
);

CREATE TABLE IF NOT EXISTS public.field_dictionary_component_rules (
  field_key TEXT NOT NULL REFERENCES public.field_dictionary(field_key) ON UPDATE CASCADE ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  is_required BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (field_key, component_name)
);

ALTER TABLE public.field_dictionary_component_rules
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.field_dictionary_component_rules
SET updated_at = COALESCE(updated_at, NOW())
WHERE updated_at IS NULL;

ALTER TABLE public.field_dictionary_component_rules
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.field_dictionary_component_rules
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'field_dictionary_touch_updated_at'
      AND tgrelid = 'public.field_dictionary'::regclass
  ) THEN
    CREATE TRIGGER field_dictionary_touch_updated_at
      BEFORE UPDATE ON public.field_dictionary
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'field_dictionary_component_rules_touch_updated_at'
      AND tgrelid = 'public.field_dictionary_component_rules'::regclass
  ) THEN
    CREATE TRIGGER field_dictionary_component_rules_touch_updated_at
      BEFORE UPDATE ON public.field_dictionary_component_rules
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_field_dictionary_to_universal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    INSERT INTO public.config_categories (name)
    VALUES (NEW.category_name)
    ON CONFLICT (name) DO NOTHING;

    IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
      UPDATE public.universal_fields
      SET
        name = NEW.field_key,
        category_name = NEW.category_name,
        input_type = NEW.input_type,
        field_order = NEW.field_order
      WHERE name = OLD.field_key;

      IF NOT FOUND THEN
        INSERT INTO public.universal_fields (name, category_name, input_type, field_order)
        VALUES (NEW.field_key, NEW.category_name, NEW.input_type, NEW.field_order)
        ON CONFLICT (name) DO UPDATE
        SET
          category_name = EXCLUDED.category_name,
          input_type = EXCLUDED.input_type,
          field_order = EXCLUDED.field_order;
      END IF;
    ELSE
      INSERT INTO public.universal_fields (name, category_name, input_type, field_order)
      VALUES (NEW.field_key, NEW.category_name, NEW.input_type, NEW.field_order)
      ON CONFLICT (name) DO UPDATE
      SET
        category_name = EXCLUDED.category_name,
        input_type = EXCLUDED.input_type,
        field_order = EXCLUDED.field_order;
    END IF;

    IF NOT (TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.field_key <> NEW.field_key) THEN
      INSERT INTO public.component_config_fields (component_name, category_name, field_name)
      SELECT
        r.component_name,
        NEW.category_name,
        NEW.field_key
      FROM public.field_dictionary_component_rules r
      WHERE (r.field_key = NEW.field_key OR (TG_OP = 'UPDATE' AND r.field_key = OLD.field_key))
        AND r.is_present = true
      ON CONFLICT (component_name, category_name, field_name) DO NOTHING;
    END IF;
  ELSE
    DELETE FROM public.component_config_fields
    WHERE (category_name, field_name) IN (
      SELECT uf.category_name, uf.name
      FROM public.universal_fields uf
      WHERE uf.name = NEW.field_key
         OR (TG_OP = 'UPDATE' AND uf.name = OLD.field_key)
    );

    DELETE FROM public.universal_fields
    WHERE name = NEW.field_key
       OR (TG_OP = 'UPDATE' AND name = OLD.field_key);
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'field_dictionary_sync_to_universal'
      AND tgrelid = 'public.field_dictionary'::regclass
  ) THEN
    CREATE TRIGGER field_dictionary_sync_to_universal
      AFTER INSERT OR UPDATE OF field_key, category_name, input_type, field_order, status
      ON public.field_dictionary
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_field_dictionary_to_universal();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_component_rule_to_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_name TEXT;
  v_status TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.field_key <> NEW.field_key THEN
    RETURN NEW;
  END IF;

  SELECT fd.category_name, fd.status
  INTO v_category_name, v_status
  FROM public.field_dictionary fd
  WHERE fd.field_key = NEW.field_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Field "%" not found in field_dictionary', NEW.field_key;
  END IF;

  IF NEW.is_present AND v_status = 'active' THEN
    PERFORM public.set_component_config_field_enabled(NEW.component_name, v_category_name, NEW.field_key, true);
  ELSE
    PERFORM public.set_component_config_field_enabled(NEW.component_name, v_category_name, NEW.field_key, false);
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'field_dictionary_component_rules_sync'
      AND tgrelid = 'public.field_dictionary_component_rules'::regclass
  ) THEN
    CREATE TRIGGER field_dictionary_component_rules_sync
      AFTER INSERT OR UPDATE OF field_key, component_name, is_present
      ON public.field_dictionary_component_rules
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_component_rule_to_config();
  END IF;
END $$;

-- Backfill dictionary rows from current universal config (current state only).
INSERT INTO public.field_dictionary (field_key, category_name, input_type, field_order, status, definition)
SELECT
  uf.name,
  uf.category_name,
  uf.input_type,
  uf.field_order,
  'active',
  NULL
FROM public.universal_fields uf
ON CONFLICT (field_key) DO UPDATE
SET
  category_name = EXCLUDED.category_name,
  input_type = EXCLUDED.input_type,
  field_order = EXCLUDED.field_order,
  status = 'active';

-- Backfill component presence from current runtime mapping.
INSERT INTO public.field_dictionary_component_rules (field_key, component_name, is_present, is_required)
SELECT
  ccf.field_name,
  ccf.component_name,
  true,
  NULL
FROM public.component_config_fields ccf
JOIN public.universal_fields uf
  ON uf.category_name = ccf.category_name
 AND uf.name = ccf.field_name
ON CONFLICT (field_key, component_name) DO UPDATE
SET
  is_present = true;

DELETE FROM public.component_config_fields
WHERE field_name IN ('ingestSource', 'lastUpdatedAt', 'lastUpdatedBy', 'ownerTeam', 'version');

DELETE FROM public.universal_fields
WHERE name IN ('ingestSource', 'lastUpdatedAt', 'lastUpdatedBy', 'ownerTeam', 'version');

DELETE FROM public.field_dictionary
WHERE field_key IN ('ingestSource', 'lastUpdatedAt', 'lastUpdatedBy', 'ownerTeam', 'version');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'universal_fields_dictionary_fk'
      AND conrelid = 'public.universal_fields'::regclass
  ) THEN
    ALTER TABLE public.universal_fields
      ADD CONSTRAINT universal_fields_dictionary_fk
      FOREIGN KEY (name)
      REFERENCES public.field_dictionary(field_key)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_field_dictionary_entry(
  p_field_key TEXT,
  p_category_name TEXT,
  p_input_type TEXT DEFAULT 'text',
  p_field_order INTEGER DEFAULT 100,
  p_status TEXT DEFAULT 'active',
  p_definition TEXT DEFAULT NULL
)
RETURNS TABLE(field_key TEXT, category_name TEXT, input_type TEXT, field_order INTEGER, status TEXT, definition TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_field_key IS NULL OR btrim(p_field_key) = '' THEN
    RAISE EXCEPTION 'p_field_key cannot be empty';
  END IF;

  IF p_category_name IS NULL OR btrim(p_category_name) = '' THEN
    RAISE EXCEPTION 'p_category_name cannot be empty';
  END IF;

  IF p_input_type IS NULL OR p_input_type NOT IN (
    'text',
    'textarea',
    'number',
    'checkbox',
    'select',
    'json',
    'list',
    'audio_selector',
    'audio_list',
    'audio_prompt',
    'blanks_mapper',
    'audio_lines_mapper',
    'choice_elements_mapper',
    'match_pairs_mapper',
    'avatar_dialogues_mapper',
    'media_picker'
  ) THEN
    RAISE EXCEPTION
      'p_input_type must be one of: text, textarea, number, checkbox, select, json, list, audio_selector, audio_list, audio_prompt, blanks_mapper, audio_lines_mapper, choice_elements_mapper, match_pairs_mapper, avatar_dialogues_mapper, media_picker';
  END IF;

  IF p_field_order IS NULL OR p_field_order < 0 THEN
    RAISE EXCEPTION 'p_field_order must be >= 0';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'legacy') THEN
    RAISE EXCEPTION 'p_status must be active or legacy';
  END IF;

  INSERT INTO public.config_categories (name)
  VALUES (p_category_name)
  ON CONFLICT (name) DO NOTHING;

  RETURN QUERY
  INSERT INTO public.field_dictionary (field_key, category_name, input_type, field_order, status, definition)
  VALUES (p_field_key, p_category_name, p_input_type, p_field_order, p_status, p_definition)
  ON CONFLICT ON CONSTRAINT field_dictionary_pkey DO UPDATE
  SET
    category_name = EXCLUDED.category_name,
    input_type = EXCLUDED.input_type,
    field_order = EXCLUDED.field_order,
    status = EXCLUDED.status,
    definition = EXCLUDED.definition
  RETURNING
    public.field_dictionary.field_key,
    public.field_dictionary.category_name,
    public.field_dictionary.input_type,
    public.field_dictionary.field_order,
    public.field_dictionary.status,
    public.field_dictionary.definition;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_field_dictionary_entry(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_field_dictionary_entry(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.set_field_dictionary_status(p_field_key TEXT, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_field_key IS NULL OR btrim(p_field_key) = '' THEN
    RAISE EXCEPTION 'p_field_key cannot be empty';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'legacy') THEN
    RAISE EXCEPTION 'p_status must be active or legacy';
  END IF;

  UPDATE public.field_dictionary
  SET status = p_status
  WHERE field_key = p_field_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Field "%" not found in field_dictionary', p_field_key;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_field_dictionary_status(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_field_dictionary_status(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.set_field_dictionary_component_presence(
  p_field_key TEXT,
  p_component_name TEXT,
  p_is_present BOOLEAN,
  p_is_required BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_field_key IS NULL OR btrim(p_field_key) = '' THEN
    RAISE EXCEPTION 'p_field_key cannot be empty';
  END IF;

  IF p_component_name IS NULL OR btrim(p_component_name) = '' THEN
    RAISE EXCEPTION 'p_component_name cannot be empty';
  END IF;

  IF p_is_present IS NULL THEN
    RAISE EXCEPTION 'p_is_present cannot be null';
  END IF;

  INSERT INTO public.field_dictionary_component_rules (field_key, component_name, is_present, is_required)
  VALUES (p_field_key, p_component_name, p_is_present, p_is_required)
  ON CONFLICT (field_key, component_name) DO UPDATE
  SET
    is_present = EXCLUDED.is_present,
    is_required = EXCLUDED.is_required;
END;
$$;

REVOKE ALL ON FUNCTION public.set_field_dictionary_component_presence(TEXT, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_field_dictionary_component_presence(TEXT, TEXT, BOOLEAN, BOOLEAN) TO service_role;

CREATE OR REPLACE FUNCTION public.rename_universal_field(old_name TEXT, new_name TEXT)
RETURNS TABLE(category_name TEXT, name TEXT, input_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF old_name IS NULL OR btrim(old_name) = '' THEN
    RAISE EXCEPTION 'old_name cannot be empty';
  END IF;

  IF new_name IS NULL OR btrim(new_name) = '' THEN
    RAISE EXCEPTION 'new_name cannot be empty';
  END IF;

  IF old_name = new_name THEN
    RAISE EXCEPTION 'old_name and new_name must be different';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.field_dictionary fd
    WHERE fd.field_key = old_name
  ) THEN
    RAISE EXCEPTION 'Universal field "%" does not exist', old_name;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.field_dictionary fd
    WHERE fd.field_key = new_name
  ) THEN
    RAISE EXCEPTION 'Universal field "%" already exists', new_name;
  END IF;

  RETURN QUERY
  UPDATE public.field_dictionary fd
  SET field_key = new_name
  WHERE fd.field_key = old_name
  RETURNING fd.category_name, fd.field_key AS name, fd.input_type;

  INSERT INTO public.universal_field_rename_audit (old_name, new_name)
  VALUES (old_name, new_name);
END;
$$;

REVOKE ALL ON FUNCTION public.rename_universal_field(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rename_universal_field(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.set_universal_field_order(p_category_name TEXT, p_field_name TEXT, p_field_order INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_category_name IS NULL OR btrim(p_category_name) = '' THEN
    RAISE EXCEPTION 'p_category_name cannot be empty';
  END IF;

  IF p_field_name IS NULL OR btrim(p_field_name) = '' THEN
    RAISE EXCEPTION 'p_field_name cannot be empty';
  END IF;

  IF p_field_order IS NULL OR p_field_order < 0 THEN
    RAISE EXCEPTION 'p_field_order must be >= 0';
  END IF;

  UPDATE public.field_dictionary fd
  SET field_order = p_field_order
  WHERE fd.category_name = p_category_name
    AND fd.field_key = p_field_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Universal field "%.%" does not exist', p_category_name, p_field_name;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_universal_field_order(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_universal_field_order(TEXT, TEXT, INTEGER) TO service_role;

GRANT SELECT ON public.field_dictionary TO anon, authenticated;
GRANT SELECT ON public.field_dictionary_locations TO anon, authenticated;
GRANT SELECT ON public.field_dictionary_component_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.field_dictionary TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.field_dictionary_locations TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.field_dictionary_component_rules TO service_role;

SELECT public.set_field_dictionary_component_presence('id', 'modules', true, true);
SELECT public.set_field_dictionary_component_presence('title', 'modules', true, true);
SELECT public.set_field_dictionary_component_presence('level', 'modules', true, true);
SELECT public.set_field_dictionary_component_presence('text', 'modules', true, false);
SELECT public.set_field_dictionary_component_presence('subtitle', 'modules', false, false);
