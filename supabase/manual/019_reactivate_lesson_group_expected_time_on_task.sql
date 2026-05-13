-- 019_reactivate_lesson_group_expected_time_on_task.sql
-- Purpose: restore expectedTimeOnTask on lessons and groups.
-- Idempotent: safe to re-run.

UPDATE public.field_dictionary_component_rules
SET is_present = true,
    is_required = false
WHERE (component_name, field_key) IN (
  ('lessons', 'expectedTimeOnTask'),
  ('groups', 'expectedTimeOnTask')
);

SELECT public.set_component_config_field_enabled(
  'lessons',
  'Telemetry & Analytics',
  'expectedTimeOnTask',
  true
);

SELECT public.set_component_config_field_enabled(
  'groups',
  'Telemetry & Analytics',
  'expectedTimeOnTask',
  true
);
