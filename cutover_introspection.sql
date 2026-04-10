\set ON_ERROR_STOP on
\pset pager off
\pset null '(null)'
\timing on

\echo '=== SESSION ==='
SELECT current_database() AS db, current_user AS user, now() AS ts, version();

BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '45s';
SET LOCAL search_path = public;

\echo '=== TABLE EXISTENCE (CORE + TARGET) ==='
WITH wanted(name) AS (
  VALUES
    ('modules'),
    ('lessons'),
    ('lesson_groups'),
    ('groups'),
    ('slides'),
    ('slide_field_values'),
    ('title_slides'),
    ('title_slide_field_values'),
    ('lesson_ends'),
    ('lesson_end_field_values'),
    ('activity_slides'),
    ('activity_slide_field_values'),
    ('module_field_values'),
    ('lesson_field_values'),
    ('group_field_values')
)
SELECT name AS table_name,
       CASE WHEN to_regclass('public.' || name) IS NULL THEN 'missing' ELSE 'present' END AS status
FROM wanted
ORDER BY 1;

\echo '=== KEY COLUMN TYPES (ID/FK) ==='
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('id','module_id','lesson_id','group_id','slide_id','activity_slide_id','title_slide_id','lesson_end_id','activity_id')
ORDER BY table_name, column_name;

\echo '=== CONSTRAINTS (PK/FK/CHECK/UNIQUE) ==='
SELECT rel.relname AS table_name,
       con.conname AS constraint_name,
       CASE con.contype
         WHEN 'p' THEN 'PRIMARY KEY'
         WHEN 'f' THEN 'FOREIGN KEY'
         WHEN 'u' THEN 'UNIQUE'
         WHEN 'c' THEN 'CHECK'
         ELSE con.contype::text
       END AS constraint_type,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
ORDER BY rel.relname, constraint_type, con.conname;

\echo '=== TRIGGERS ==='
SELECT c.relname AS table_name,
       t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

\echo '=== RPC FUNCTIONS (transaction/import/update atomic) ==='
SELECT n.nspname AS schema,
       p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname ~ 'transaction'
    OR p.proname ~ 'import_.*atomic'
    OR p.proname ~ 'update_.*atomic'
    OR p.proname IN (
      'delete_module_transaction',
      'delete_lesson_transaction',
      'delete_group_transaction',
      'delete_slide_transaction',
      'insert_slide_at_index_transaction',
      'swap_slides_order_transaction',
      'import_activity_slides_create_atomic',
      'import_activity_slides_update_atomic'
    )
  )
ORDER BY 2,3;

\echo '=== COMPATIBILITY VIEWS ==='
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%slide%'
    OR table_name ILIKE '%lesson%'
    OR view_definition ILIKE '%slides%'
    OR view_definition ILIKE '%activity_slides%'
  )
ORDER BY table_name;

\echo '=== SLIDES-LANE ACTIVITY DEPENDENCY CHECKS ==='
SELECT (
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='slides' AND column_name='type'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='slides' AND column_name='activity_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='slides' AND column_name='props_json'
  )
) AS slides_has_legacy_activity_columns \gset
\if :slides_has_legacy_activity_columns
SELECT
  count(*) FILTER (WHERE lower(type) = 'activity') AS slides_type_activity_rows,
  count(*) FILTER (WHERE type ~* '^ACT-[0-9]{3}$') AS slides_legacy_act_type_rows,
  count(*) FILTER (WHERE activity_id IS NOT NULL AND trim(activity_id) <> '') AS slides_with_activity_id,
  count(*) FILTER (WHERE props_json IS NOT NULL) AS slides_with_props_json
FROM public.slides;
\else
SELECT 'slides legacy activity columns missing (type/activity_id/props_json)' AS note;
\endif

\echo '=== SLUG HEALTH (conditional) ==='
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='modules' AND column_name='slug'
) AS modules_has_slug \gset
\if :modules_has_slug
SELECT
  count(*) AS modules_total,
  count(*) FILTER (WHERE slug IS NULL OR trim(slug)='') AS modules_slug_missing,
  count(*) - count(DISTINCT slug) FILTER (WHERE slug IS NOT NULL AND trim(slug) <> '') AS modules_slug_duplicates
FROM public.modules;
\else
SELECT 'modules.slug missing' AS note;
\endif

SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='lessons' AND column_name='slug'
) AS lessons_has_slug \gset
\if :lessons_has_slug
SELECT
  count(*) AS lessons_total,
  count(*) FILTER (WHERE slug IS NULL OR trim(slug)='') AS lessons_slug_missing,
  count(*) - count(DISTINCT slug) FILTER (WHERE slug IS NOT NULL AND trim(slug) <> '') AS lessons_slug_duplicates
FROM public.lessons;
\else
SELECT 'lessons.slug missing' AS note;
\endif

\echo '=== CONTAMINATION CHECKS (conditional) ==='
SELECT CASE WHEN to_regclass('public.slide_field_values') IS NULL THEN 0 ELSE 1 END AS has_slide_field_values \gset
\if :has_slide_field_values
SELECT
  count(*) FILTER (WHERE field_name = 'type' AND lower(field_value) = 'activity') AS sfv_type_activity_rows,
  count(*) FILTER (WHERE field_name IN ('lines','choiceElements','audio','buttons','targetText','correctAnswer','audioPrompt')) AS sfv_structured_key_rows
FROM public.slide_field_values;
\else
SELECT 'slide_field_values missing' AS note;
\endif

SELECT CASE WHEN to_regclass('public.activity_slide_field_values') IS NULL THEN 0 ELSE 1 END AS has_asfv \gset
\if :has_asfv
SELECT field_name, count(*) AS rows
FROM public.activity_slide_field_values
WHERE field_name IN (
  'lines','choiceElements','audio','buttons','targetText','correctAnswer','audioPrompt',
  'blanks','wordBank','avatarDialogues','audioClips','sentenceWithGaps','targetKeywords',
  'letterUnits','correctOrderClips','tenseBins','sentenceCards','word'
)
GROUP BY field_name
ORDER BY rows DESC, field_name;
\else
SELECT 'activity_slide_field_values missing' AS note;
\endif

\echo '=== SUMMARY SIGNALS ==='
SELECT
  CASE WHEN to_regclass('public.activity_slides') IS NULL THEN 'NO' ELSE 'YES' END AS has_activity_slides,
  CASE WHEN to_regclass('public.activity_slide_field_values') IS NULL THEN 'NO' ELSE 'YES' END AS has_activity_slide_field_values,
  CASE WHEN to_regclass('public.slide_field_values') IS NULL THEN 'NO' ELSE 'YES' END AS has_slide_field_values;

ROLLBACK;
