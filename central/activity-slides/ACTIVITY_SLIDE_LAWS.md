Authority Role: guide
Artifact Type: component-behavior-guide
Canonical Source: central/CONSTITUTION.md
Constitution Reference: central/CONSTITUTION.md

# activity_slides Laws

Date: 2026-04-07
Repository: ouiispeak-cms-sandbox

1. An activity_slides must always belong to a group through `public.activity_slides.group_id` (UUID FK).
2. An activity_slides cannot be created or saved without a valid UUID group parent.
3. Runtime activity_slides authority is Supabase tables `public.activity_slides` (core) and `public.activity_slide_field_values` (config-driven fields), not Markdown mirrors.
4. `/edit-activity-slide/new` must create one activity_slides record and then redirect to `/edit-activity-slide/[activitySlideId]` (where `[activitySlideId]` is a UUID value).
5. `/edit-activity-slide/[activitySlideId]` must prefill inputs from `public.activity_slide_field_values` for enabled activity_slides config fields.
6. `Save Changes` on `/edit-activity-slide/[activitySlideId]` must upsert all posted config fields to `public.activity_slide_field_values`.
7. activity_slides field availability in UI is controlled by config authority (`public.field_dictionary` -> `public.universal_fields` and `public.field_dictionary_component_rules` -> `public.component_config_fields`).
8. activity_slides active fields are controlled only by `public.field_dictionary_component_rules` (`component_name = 'activity_slides'`) and mirrored in `central/SOT/activity_slides_configs.md`.
9. `slideId` is system-controlled:
   - On `/edit-activity-slide/new`, it must be non-editable and not user-submittable.
   - On `/edit-activity-slide/[activitySlideId]`, it must display `public.activity_slides.id` and remain non-editable.
10. `public.activity_slide_field_values` must never store `field_name = 'slideId'`.
11. activity_slides are listed on dashboard hierarchy under their parent group; `/activity-slides` is an action page and not a listing page.
12. activity_slides JSON template export source is `/api/activity-slides/export-json`.
13. Individual activity_slides JSON export source is `/api/activity-slides/[activitySlideId]/export-json`.
14. activity_slides JSON import source is `/api/activity-slides/import-json` in modes `create` and `update`.
15. activity_slides JSON create requires top-level `groupId`; activity_slides JSON update requires top-level `slideId` and allows optional top-level `groupId`.
16. activity_slides batch create/update imports must run through atomic RPC functions (`public.import_activity_slides_create_atomic`, `public.import_activity_slides_update_atomic`) so one failing entry rolls back the whole upload.
17. activity_slides category payloads in JSON import/export must use canonical keys only.
18. Activity profiles in this repo are ACT-001..ACT-005 and ACT-009..ACT-026 (ACT-006/007/008 are inactive); profile switching in configs/edit routes must stay under `activity_slides` authority and may not mutate `slides` authority.
