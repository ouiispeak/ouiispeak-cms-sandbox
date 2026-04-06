# Slide Laws

Date: 2026-04-06
Repository: ouiispeak-cms-sandbox

1. A slide must always belong to a group through `public.slides.group_id` (UUID FK).
2. A slide cannot be created or saved without a valid UUID group parent.
3. Runtime slide authority is Supabase tables `public.slides` (core) and `public.slide_field_values` (config-driven fields), not Markdown mirrors.
4. `/edit-slide/new` must create one slide record and then redirect to `/edit-slide/[slideId]` (where `[slideId]` is a UUID value).
5. `/edit-slide/[slideId]` must prefill inputs from `public.slide_field_values` for enabled slide config fields.
6. `Save Changes` on `/edit-slide/[slideId]` must upsert all posted config fields to `public.slide_field_values`.
7. Slide field availability in UI is controlled by config authority (`public.field_dictionary` -> `public.universal_fields` and `public.field_dictionary_component_rules` -> `public.component_config_fields`).
8. Slide config fields currently active are `slideId` only.
9. `slideId` is system-controlled:
   - On `/edit-slide/new`, it must be non-editable and not user-submittable.
   - On `/edit-slide/[slideId]`, it must display `public.slides.id` and remain non-editable.
10. `public.slide_field_values` must never store `field_name = 'slideId'`.
11. Slides are listed on dashboard hierarchy under their parent group; `/slides` is an action page and not a listing page.
12. Slide JSON template export source is `/api/slides/export-json`.
13. Individual slide JSON export source is `/api/slides/[slideId]/export-json`.
14. Slide JSON import source is `/api/slides/import-json` in modes `create` and `update`.
15. Slide JSON create requires top-level `groupId`; slide JSON update requires top-level `slideId` and allows optional top-level `groupId`.
16. Slide batch create/update imports must run through atomic RPC functions (`public.import_slides_create_atomic`, `public.import_slides_update_atomic`) so one failing entry rolls back the whole upload.
17. Slide category payloads in JSON import/export must use canonical keys only.
