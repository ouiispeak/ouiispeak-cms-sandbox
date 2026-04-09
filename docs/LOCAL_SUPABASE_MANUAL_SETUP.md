Authority Role: guide
Artifact Type: local-setup-runbook
Canonical Source: central/ORDER_OF_OPERATIONS.md
Constitution Reference: central/CONSTITUTION.md

# Local Supabase Manual Setup

## Start And Apply SQL
1. Start local services:
   ```bash
   supabase start
   ```
2. Open Supabase Studio:
   - `http://127.0.0.1:54323`
3. Apply SQL in strict order:
   - Canonical chain: `central/CONSTITUTION.md` -> `setup_sql_order`
   - Operational runbook mirror: `central/ORDER_OF_OPERATIONS.md` -> `1) Local Supabase Setup Order`
   - Do not execute a locally edited list from this guide; always use the canonical chain above.
4. CLI note:
   - In this sandbox, `supabase db query --file <path>` can fail on multi-statement files.
   - If that happens, run statements in Supabase Studio SQL editor or split into single-statement `supabase db query` calls.

`009_uuid_identity_reset.sql` is mandatory for current runtime behavior.

## Baseline Verification
1. `public.levels` contains `Level 1` through `Level 10`.
2. Identity columns are UUID:
   - `public.modules.id`
   - `public.lessons.id`, `public.lessons.module_id`
   - `public.groups.id`, `public.groups.lesson_id`
   - `public.slides.id`, `public.slides.group_id`
   - `public.activity_slides.id`, `public.activity_slides.group_id`
   - `public.title_slides.id`, `public.title_slides.lesson_id`
   - `public.lesson_ends.id`, `public.lesson_ends.lesson_id`
3. Dynamic value tables exist and are wired to component config authority:
   - `public.module_field_values`
   - `public.lesson_field_values`
   - `public.group_field_values`
   - `public.slide_field_values`
   - `public.activity_slide_field_values`
   - `public.title_slide_field_values`
   - `public.lesson_end_field_values`
4. Config authority chain exists:
   - `public.field_dictionary`
   - `public.universal_fields`
   - `public.field_dictionary_component_rules`
   - `public.component_config_fields`

## Current Active Field State
1. `public.field_dictionary` and `public.universal_fields` are expected to match on active key count.
3. Active category set (ordered):
   - `Identity & Lifecycle` (15)
   - `Purpose & Outcomes` (12)
   - `Scope, Prerequisites & Targeting` (14)
   - `Content & Media` (18)
   - `Instructions & Flow` (9)
   - `Pedagogy & Scaffolding` (13)
   - `Assessment & Mastery` (14)
   - `Structure & Sequencing` (12)
   - `Localization` (6)
   - `Teacher Guidance` (13)
   - `AI Generation & Prompting` (7)
   - `Activities & Interaction` (41)
   - `Links, Dependencies & Summaries` (12)
   - `Telemetry & Analytics` (10)
   - `Operations, Provenance & Governance` (11)
4. Component activation state (`is_present = true`) must include:
   - modules
   - lessons
   - groups
   - slides
   - activity_slides
   - title_slides
   - lesson_ends
5. Current activation baseline is seeded by `supabase/manual/012_component_activation_seed.sql`; additional activity shape activation is enforced by drift-gates for the active set ACT-001..ACT-005 and ACT-009..ACT-026.
6. Runtime activity_slides tables/RPC and slide/activity separation guard are created by `supabase/manual/016_activity_slides_setup.sql`.
7. Full universal field mirror is in `central/SOT/universal_configs.md`.

## Guardrails
1. `public.universal_fields` is projection data from `public.field_dictionary`.
2. `public.component_config_fields` is projection data from `public.field_dictionary_component_rules`.
3. Direct writes to projection tables are not normal operations.
4. System-controlled fields are blocked from dynamic value persistence by DB constraints:
   - modules: `field_name <> 'moduleId'`
   - lessons: `field_name <> 'lessonId'`
   - groups: `field_name <> 'groupId'`
   - slides: `field_name <> 'slideId'`
   - activity_slides: `field_name <> 'slideId'`
   - title_slides: `field_name <> 'slideId'`
   - lesson_ends: `field_name <> 'slideId'`
5. Batch imports are atomic and run through RPC:
   - `public.import_modules_create_atomic`
   - `public.import_modules_update_atomic`
   - `public.import_lessons_create_atomic`
   - `public.import_lessons_update_atomic`
   - `public.import_groups_create_atomic`
   - `public.import_groups_update_atomic`
   - `public.import_slides_create_atomic`
   - `public.import_slides_update_atomic`
   - `public.import_activity_slides_create_atomic`
   - `public.import_activity_slides_update_atomic`
   - `public.import_title_slides_create_atomic`
   - `public.import_title_slides_update_atomic`
   - `public.import_lesson_ends_create_atomic`
   - `public.import_lesson_ends_update_atomic`

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
5. activity_slides:
   - create: top-level `groupId` (uuid) required
   - update: top-level `slideId` (uuid) required; `groupId` optional
6. title_slides:
   - create: top-level `lessonId` (uuid) required
   - update: top-level `slideId` (uuid) required; `lessonId` optional
7. lesson_ends:
   - config chain is active (`lesson_ends`) with shape-locked baseline keys:
     - `lessonId`, `moduleId`, `slideId`, `slug`, `orderIndex`
   - runtime DB tables/RPC and CMS edit/create/import/export routes are active
8. Category payload keys must be canonical runtime keys.

## Config Authority Operations
1. Upsert/update dictionary authority:
   ```sql
   select *
   from public.upsert_field_dictionary_entry(
     'drapes',
     'Identity & Lifecycle',
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
   select public.set_universal_field_order('Identity & Lifecycle', 'moduleId', 1);
   select public.set_universal_field_order('Identity & Lifecycle', 'slideId', 4);
   ```
4. Set component presence/required (example calls):
   ```sql
   select public.set_field_dictionary_component_presence('subtitle', 'modules', false, false);
   select public.set_field_dictionary_component_presence('subtitle', 'lessons', true, false);
   select public.set_field_dictionary_component_presence('slideId', 'slides', true, true);
   select public.set_field_dictionary_component_presence('title', 'slides', true, false);
   select public.set_field_dictionary_component_presence('subtitle', 'slides', true, false);
   select public.set_field_dictionary_component_presence('body', 'slides', true, false);
   ```

## Keep Mirrors Aligned
1. `central/SOT/universal_configs.md`
2. `central/SOT/module_configs.md`
3. `central/SOT/lessons_configs.md`
4. `central/SOT/groups_configs.md`
5. `central/SOT/slides_configs.md`
6. `central/SOT/activity_slides_configs.md`
7. `central/SOT/title_slides_configs.md`
8. `central/SOT/lesson_ends_configs.md`
9. `central/modules/MODULE_LAWS.md`
10. `central/lessons/LESSON_LAWS.md`
11. `central/groups/GROUP_LAWS.md`
12. `central/slides/SLIDE_LAWS.md`
13. `central/activity-slides/ACTIVITY_SLIDE_LAWS.md`
14. `central/title-slides/TITLE_SLIDE_LAWS.md`
15. `central/ORDER_OF_OPERATIONS.md`
16. `central/HIERARCHY_LAW_AUDIT.md`
17. `central/CONSTITUTION.md`

## Environment
Update `.env.local` from:
```bash
supabase status -o env
```
