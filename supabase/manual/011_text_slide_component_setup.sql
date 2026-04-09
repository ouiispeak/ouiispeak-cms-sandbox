-- 011_text_slide_component_setup.sql
-- Purpose: initial text-slide activation baseline.
-- Note: full current component activation is seeded by 012_component_activation_seed.sql.
-- Idempotent: safe to re-run.

-- Ensure slides component is minimal for text/content slide.
UPDATE public.field_dictionary_component_rules
SET
  is_present = false,
  is_required = false
WHERE component_name = 'slides'
  AND field_key NOT IN ('slideId', 'slug', 'type', 'body1', 'assessmentPlan', 'successCriteria');

-- Activate required identity field.
SELECT public.set_field_dictionary_component_presence('slideId', 'slides', true, true);
SELECT public.set_field_dictionary_component_presence('slug', 'slides', true, true);
SELECT public.set_field_dictionary_component_presence('type', 'slides', true, false);

-- Activate minimal text/content and assessment fields.
SELECT public.set_field_dictionary_component_presence('body1', 'slides', true, false);
SELECT public.set_field_dictionary_component_presence('assessmentPlan', 'slides', true, false);
SELECT public.set_field_dictionary_component_presence('successCriteria', 'slides', true, false);
