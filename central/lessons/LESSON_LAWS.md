Authority Role: guide
Artifact Type: component-behavior-guide
Canonical Source: central/CONSTITUTION.md
Constitution Reference: central/CONSTITUTION.md

# Lesson Laws

Date: 2026-04-07
Repository: ouiispeak-cms-sandbox

1. Lessons are nested under modules through `public.lessons.module_id` (UUID FK).
2. Runtime lesson authority is Supabase tables `public.lessons` (core) and `public.lesson_field_values` (config-driven fields), not Markdown mirrors.
3. `/edit-lesson/new` must create one lesson record and then redirect to `/edit-lesson/[lessonId]` (where `[lessonId]` is a UUID value).
4. `/edit-lesson/[lessonId]` must prefill inputs from `public.lesson_field_values` for enabled lesson config fields.
5. `Save Changes` on `/edit-lesson/[lessonId]` must upsert all posted config fields to `public.lesson_field_values`.
6. Lesson field availability in UI is controlled by config authority (`public.field_dictionary` -> `public.universal_fields` and `public.field_dictionary_component_rules` -> `public.component_config_fields`).
7. Lesson active fields are controlled only by `public.field_dictionary_component_rules` (`component_name = 'lessons'`) and mirrored in `central/SOT/lessons_configs.md`.
8. `lessonId` is system-controlled:
   - On `/edit-lesson/new`, it must be non-editable and not user-submittable.
   - On `/edit-lesson/[lessonId]`, it must display `public.lessons.id` and remain non-editable.
9. Dashboard hierarchy must render lessons under their parent module.
10. `Export JSON File` on `/lessons` must generate a template from current lesson config fields.
11. Lesson create import requires top-level `moduleId` (uuid) and lesson fields matching current lesson config.
12. Lesson update import requires top-level `lessonId` (uuid); optional `moduleId` can re-parent a lesson.
13. `/edit-lesson/[lessonId]` must provide `Export JSON File` for that exact lesson.
14. Individual lesson export must include top-level `lessonId` and `moduleId` and follow current lesson config template shape with empty fields emitted as empty strings, excluding system-controlled `lessonId` from category payload blocks.
15. Lesson JSON category payload keys use canonical keys (`title`, `text`, `subtitle`, plus any additional active lesson keys).
16. Lesson import payloads must reject category keys that map to system-controlled runtime fields (`lessonId`).
17. `public.lesson_field_values` must never store `field_name = 'lessonId'`.
18. Lesson batch create/update imports must execute as one atomic transaction through Supabase RPC (`public.import_lessons_create_atomic`, `public.import_lessons_update_atomic`).
19. Import failure gate messages must include component and mode context (for example `Lesson create failed on import because: ...`).
