-- 018_component_field_deactivations.sql
-- Purpose: deactivate selected component fields per May 2026 scope update.
-- Idempotent: safe to re-run.

UPDATE public.field_dictionary_component_rules
SET is_present = false,
    is_required = false
WHERE (component_name, field_key) IN (
  ('title_slides', 'tags'),
  ('title_slides', 'buttons'),
  ('title_slides', 'description'),
  ('lesson_ends', 'telemetryTags'),
  ('activity_slides', 'textSubtype'),
  ('activity_slides', 'timeExpectationActivity'),
  ('slides', 'buttons')
);

-- Keep component_config_fields aligned with activation state.
DELETE FROM public.component_config_fields ccf
USING public.field_dictionary_component_rules fdcr
WHERE ccf.component_name = fdcr.component_name
  AND ccf.field_name = fdcr.field_key
  AND fdcr.is_present = false
  AND (fdcr.component_name, fdcr.field_key) IN (
    ('title_slides', 'tags'),
    ('title_slides', 'buttons'),
    ('title_slides', 'description'),
    ('lesson_ends', 'telemetryTags'),
    ('activity_slides', 'textSubtype'),
    ('activity_slides', 'timeExpectationActivity'),
    ('slides', 'buttons')
  );
