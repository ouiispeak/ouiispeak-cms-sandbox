Authority Role: guide
Artifact Type: component-behavior-guide
Canonical Source: central/CONSTITUTION.md
Constitution Reference: central/CONSTITUTION.md

# title_slides Laws

Date: 2026-04-07
Repository: ouiispeak-cms-sandbox

1. A title_slides is a lesson-scoped boundary component and must belong to a lesson through `public.title_slides.lesson_id` (UUID FK).
2. A title_slides cannot be created or saved without a valid UUID lesson parent.
3. Runtime title_slides authority is Supabase tables `public.title_slides` (core) and `public.title_slide_field_values` (config-driven fields), not Markdown mirrors.
4. title_slides must not be persisted in `public.slides`; `public.slides` remains group-scoped content slide storage.
5. `/edit-title-slide/new` must create one title_slides record and then redirect to `/edit-title-slide/[titleSlideId]` (where `[titleSlideId]` is a UUID value).
6. `/edit-title-slide/[titleSlideId]` must prefill inputs from `public.title_slide_field_values` for enabled title_slides config fields.
7. `Save Changes` on `/edit-title-slide/[titleSlideId]` must upsert all posted config fields to `public.title_slide_field_values`.
8. title_slides field availability in UI is controlled by config authority (`public.field_dictionary` -> `public.universal_fields` and `public.field_dictionary_component_rules` -> `public.component_config_fields`).
9. title_slides active fields are controlled only by `public.field_dictionary_component_rules` (`component_name = 'title_slides'`) and mirrored in `central/SOT/title_slides_configs.md`.
10. `slideId` is system-controlled:
    - On `/edit-title-slide/new`, it must be non-editable and not user-submittable.
    - On `/edit-title-slide/[titleSlideId]`, it must display `public.title_slides.id` and remain non-editable.
11. `public.title_slide_field_values` must never store `field_name = 'slideId'`.
12. title_slides are listed on dashboard hierarchy under their parent lesson; `/title-slides` is an action page and not a listing page.
13. title_slides JSON template export source is `/api/title-slides/export-json`.
14. Individual title_slides JSON export source is `/api/title-slides/[titleSlideId]/export-json`.
15. title_slides JSON import source is `/api/title-slides/import-json` in modes `create` and `update`.
16. title_slides JSON create requires top-level `lessonId`; title_slides JSON update requires top-level `slideId` and allows optional top-level `lessonId`.
17. title_slides batch create/update imports must run through atomic RPC functions (`public.import_title_slides_create_atomic`, `public.import_title_slides_update_atomic`) so one failing entry rolls back the whole upload.
18. title_slides category payloads in JSON import/export must use canonical keys only.
