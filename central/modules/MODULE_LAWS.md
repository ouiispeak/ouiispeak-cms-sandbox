# Module Laws

Date: 2026-04-06
Repository: ouiispeak-cms-sandbox

1. A module may have null `public.modules.level_number`.
2. If `public.modules.level_number` is null, that module is omitted from dashboard level buckets.
3. Runtime module authority is Supabase tables `public.modules` (core) and `public.module_field_values` (config-driven fields), not Markdown mirrors.
4. `/edit-module/new` must create one module record and then redirect to `/edit-module/[moduleId]` (where `[moduleId]` is a UUID value).
5. `/edit-module/[moduleId]` must prefill inputs from `public.module_field_values` for enabled module config fields.
6. `Save Changes` on `/edit-module/[moduleId]` must upsert all posted config fields to `public.module_field_values`.
7. Module field availability in the UI is controlled by config authority (`public.field_dictionary` -> `public.universal_fields` and `public.field_dictionary_component_rules` -> `public.component_config_fields`).
8. Dashboard core fields remain synchronized in `public.modules`; config field key `level` maps to `public.modules.level_number`.
9. Dashboard hierarchy must place each module under its parent level using `public.modules.level_number`.
10. `Export JSON File` on `/modules` must generate a template from current module config fields.
11. `/import` must only accept valid JSON payloads that follow active module config keys.
12. `/import` create mode enforces required fields from `public.field_dictionary_component_rules.is_required` for `component_name = 'modules'`, excluding system-controlled `moduleId`.
13. `/import` update mode updates existing module records by top-level `moduleId` (uuid) and upserts provided config fields to `public.module_field_values`.
14. Update payload requires all enabled module fields currently marked required for `modules` in `public.field_dictionary_component_rules`.
15. In update mode, non-required fields can be any keys currently enabled for modules in `public.component_config_fields`.
16. Successful create or update imports must be visible in dashboard hierarchy immediately after redirect to `/`.
17. `/edit-module/[moduleId]` must provide `Export JSON File` for that exact module.
18. Individual module export must follow the current module config template shape and include empty fields as empty strings, excluding system-controlled `moduleId` from category payload blocks.
19. `moduleId` is system-controlled:
    - On `/edit-module/new`, it must be non-editable and not user-submittable.
    - On `/edit-module/[moduleId]`, it must display actual `public.modules.id` and remain non-editable.
20. `/edit-module/new` creation enforces required module fields from `public.field_dictionary_component_rules` (excluding `moduleId`).
21. `/import` must show a validation-failure gate on the import page for browser submissions, including the reason a create/update upload failed.
22. Module JSON category payload keys are canonical keys (`title`, `level`, `text`, and any other active module keys).
23. Module import payloads must reject category keys that map to system-controlled runtime fields (`moduleId`).
24. `public.module_field_values` must never store `field_name = 'moduleId'`.
25. Module batch create/update imports must execute as one atomic transaction through Supabase RPC (`public.import_modules_create_atomic`, `public.import_modules_update_atomic`).
26. Import failure gate messages must include component and mode context (for example `Module update failed on import because: ...`).
