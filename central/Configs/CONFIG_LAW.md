configs are controlled by supabase sot tables.
the primary authority for all config fields is public.field_dictionary.
public.universal_fields is a runtime projection of public.field_dictionary and is fk-guarded by public.universal_fields_dictionary_fk.
component visibility and requirement authority is public.field_dictionary_component_rules.
public.component_config_fields is a runtime projection of public.field_dictionary_component_rules constrained by universal field fks.
orphan fields are forbidden; no parser or ui layer may auto-create implicit categories.
all fields must be nested under an explicit category.
field creation and updates must be done through public.upsert_field_dictionary_entry.
field status changes must be done through public.set_field_dictionary_status.
component include/exclude and required flags must be done through public.set_field_dictionary_component_presence.
field renames must be done through public.rename_universal_field(old_name, new_name) so dictionary, universal projection, and component mappings stay coordinated.
field display order must be managed through public.set_universal_field_order.
direct writes to projection tables (public.universal_fields, public.component_config_fields) are disallowed in normal operation.
when field dictionary entries change, config pages must reflect those changes without manual hardcoded patches.
the single runtime mapping boundary for hierarchy components is lib/canonicalFieldMap.ts.
json import/export for modules, lessons, groups, and slides must use canonical runtime field keys.
module, lesson, group, and slide import category payloads may not include system-controlled runtime identifiers (moduleId, lessonId, groupId, slideId).
batch module/lesson/group/slide imports must run through atomic rpc functions so one failing entry rolls back the whole upload.
the files in central/SOT are mirrors for documentation and must stay aligned with the supabase authority tables.
for modules, the config field key level maps to public.modules.level_number.
for lessons, hierarchy parent assignment is persisted in public.lessons.module_id.
for groups, hierarchy parent assignment is persisted in public.groups.lesson_id.
for slides, hierarchy parent assignment is persisted in public.slides.group_id.
group creation without a lesson is invalid by law and must be blocked by both database schema and ui flow.
slide creation without a group is invalid by law and must be blocked by both database schema and ui flow.
the module/lesson/group/slide export templates must be generated from current component config fields, not hardcoded keys.
shared parser-validation-import-upsert behavior must live in lib/componentCore.ts and lib/hierarchyComponentEngine.ts to avoid component drift.
