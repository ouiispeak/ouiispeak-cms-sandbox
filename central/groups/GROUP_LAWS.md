# Group Laws

Date: 2026-04-06
Repository: ouiispeak-cms-sandbox

1. A group must always belong to a lesson through `public.groups.lesson_id` (UUID FK).
2. A group cannot be created or saved without a valid UUID lesson parent.
3. Runtime group authority is Supabase tables `public.groups` (core) and `public.group_field_values` (config-driven fields), not Markdown mirrors.
4. `/edit-group/new` must create one group record and then redirect to `/edit-group/[groupId]` (where `[groupId]` is a UUID value).
5. `/edit-group/[groupId]` must prefill inputs from `public.group_field_values` for enabled group config fields.
6. `Save Changes` on `/edit-group/[groupId]` must upsert all posted config fields to `public.group_field_values`.
7. Group field availability in UI is controlled by config authority (`public.field_dictionary` -> `public.universal_fields` and `public.field_dictionary_component_rules` -> `public.component_config_fields`).
8. Group config fields currently active are `groupId`, `title`, `text`, and `subtitle`.
9. Group type specializations are not in scope; `group` is a single plain component type.
10. `groupId` is system-controlled:
    - On `/edit-group/new`, it must be non-editable and not user-submittable.
    - On `/edit-group/[groupId]`, it must display `public.groups.id` and remain non-editable.
11. `public.group_field_values` must never store `field_name = 'groupId'`.
12. Groups are listed on dashboard hierarchy under their parent lesson; `/groups` is an action page and not a listing page.
13. Group JSON template export source is `/api/groups/export-json`.
14. Individual group JSON export source is `/api/groups/[groupId]/export-json`.
15. Group JSON import source is `/api/groups/import-json` in modes `create` and `update`.
16. Group JSON create requires top-level `lessonId`; group JSON update requires top-level `groupId` and allows optional top-level `lessonId`.
17. Group batch create/update imports must run through atomic RPC functions (`public.import_groups_create_atomic`, `public.import_groups_update_atomic`) so one failing entry rolls back the whole upload.
18. Group category payloads in JSON import/export must use canonical keys (`title`, `text`, `subtitle`, plus any additional active group keys).
