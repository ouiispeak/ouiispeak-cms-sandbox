# Local Supabase Manual Setup

## Start And Apply SQL
1. Start local services:
   ```bash
   supabase start
   ```
2. Open Supabase Studio:
   - `http://127.0.0.1:54323`
3. Apply SQL in strict order:
   - `supabase/manual/001_levels_setup.sql`
   - `supabase/manual/002_config_authority_setup.sql`
   - `supabase/manual/004_field_dictionary_authority_setup.sql`
   - `supabase/manual/009_uuid_identity_reset.sql`

`009_uuid_identity_reset.sql` is mandatory for current runtime behavior.

## Baseline Verification
1. `public.levels` contains `Level 1` through `Level 10`.
2. Identity columns are UUID:
   - `public.modules.id`
   - `public.lessons.id`, `public.lessons.module_id`
   - `public.groups.id`, `public.groups.lesson_id`
   - `public.slides.id`, `public.slides.group_id`
3. Dynamic value tables exist and are wired to component config authority:
   - `public.module_field_values`
   - `public.lesson_field_values`
   - `public.group_field_values`
   - `public.slide_field_values`
4. Config authority chain exists:
   - `public.field_dictionary`
   - `public.universal_fields`
   - `public.field_dictionary_component_rules`
   - `public.component_config_fields`

## Current Active Field State
1. `public.field_dictionary` active keys (category `Identity and Hiearchy`):
   - `moduleId`
   - `lessonId`
   - `groupId`
   - `slideId`
   - `title`
   - `level`
   - `text`
   - `subtitle`
2. `public.field_dictionary_component_rules` current active-present keys:
   - modules: `moduleId` (required), `title` (required), `level` (required), `text` (optional)
   - lessons: `lessonId` (required), `title` (optional), `text` (optional), `subtitle` (optional)
   - groups: `groupId` (required), `title` (optional), `text` (optional), `subtitle` (optional)
   - slides: `slideId` (required)
3. `public.component_config_fields` is a projection of component rules.

## Guardrails
1. `public.universal_fields` is projection data from `public.field_dictionary`.
2. `public.component_config_fields` is projection data from `public.field_dictionary_component_rules`.
3. Direct writes to projection tables are not normal operations.
4. System-controlled fields are blocked from dynamic value persistence by DB constraints:
   - modules: `field_name <> 'moduleId'`
   - lessons: `field_name <> 'lessonId'`
   - groups: `field_name <> 'groupId'`
   - slides: `field_name <> 'slideId'`
5. Batch imports are atomic and run through RPC:
   - `public.import_modules_create_atomic`
   - `public.import_modules_update_atomic`
   - `public.import_lessons_create_atomic`
   - `public.import_lessons_update_atomic`
   - `public.import_groups_create_atomic`
   - `public.import_groups_update_atomic`
   - `public.import_slides_create_atomic`
   - `public.import_slides_update_atomic`

## JSON Import Contract
1. Modules:
   - create: category payload only (no top-level identity key)
   - update: top-level `moduleId` (uuid) required
2. Lessons:
   - create: top-level `moduleId` (uuid) required
   - update: top-level `lessonId` (uuid) required; `moduleId` optional
3. Groups:
   - create: top-level `lessonId` (uuid) required
   - update: top-level `groupId` (uuid) required; `lessonId` optional
4. Slides:
   - create: top-level `groupId` (uuid) required
   - update: top-level `slideId` (uuid) required; `groupId` optional
5. Category payload keys must be canonical runtime keys.

## Config Authority Operations
1. Upsert/update dictionary authority:
   ```sql
   select *
   from public.upsert_field_dictionary_entry(
     'drapes',
     'Identity and Hiearchy',
     'text',
     9,
     'active',
     null
   );
   ```
2. Rename a field transactionally:
   ```sql
   select * from public.rename_universal_field('text', 'drapes');
   ```
3. Reorder a field:
   ```sql
   select public.set_universal_field_order('Identity and Hiearchy', 'moduleId', 1);
   select public.set_universal_field_order('Identity and Hiearchy', 'slideId', 4);
   ```
4. Set component presence/required:
   ```sql
   select public.set_field_dictionary_component_presence('subtitle', 'modules', false, false);
   select public.set_field_dictionary_component_presence('subtitle', 'lessons', true, false);
   select public.set_field_dictionary_component_presence('slideId', 'slides', true, true);
   ```
5. Mark field legacy:
   ```sql
   select public.set_field_dictionary_status('drapes', 'legacy');
   ```

## Keep Mirrors Aligned
1. `central/SOT/universal_configs.md`
2. `central/SOT/module_configs.md`
3. `central/SOT/lessons_configs.md`
4. `central/SOT/groups_configs.md`
5. `central/SOT/slides_configs.md`
6. `central/modules/MODULE_LAWS.md`
7. `central/lessons/LESSON_LAWS.md`
8. `central/groups/GROUP_LAWS.md`
9. `central/slides/SLIDE_LAWS.md`
10. `central/ORDER_OF_OPERATIONS.md`
11. `central/HIERARCHY_LAW_AUDIT.md`
12. `central/CONSTITUTION.md`

## Environment
Update `.env.local` from:
```bash
supabase status -o env
```
