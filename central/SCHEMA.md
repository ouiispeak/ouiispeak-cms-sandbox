Authority Role: canonical
Artifact Type: database-schema-model
Canonical Source: central/SCHEMA.md
Constitution Reference: central/CONSTITUTION.md

# SCHEMA

Date: 2026-04-09
Last Updated: 2026-04-10
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox
Validation source: local Supabase (`supabase db query`) + migration chain in `supabase/manual`

## Scope
This document is the canonical database model reference for:
1. Live table model (`public` schema)
2. Constraint and guard map
3. Migration ledger (ordered chain)
4. Fresh-setup migration application notes, including CLI caveat

This document intentionally does not duplicate the full seeded field catalog row set (`010`) or full component activation row set (`012`).

## Live Table Model

### Governance + Config Authority

| Table | Stores | Key columns |
|---|---|---|
| `public.config_categories` | Category taxonomy and order | `name` (PK), `category_order`, `created_at` |
| `public.field_dictionary` | Canonical field authority | `field_key` (PK), `category_name`, `input_type`, `field_order`, `status`, `select_options_json`, `select_source`, `is_read_only`, `definition`, timestamps |
| `public.field_dictionary_locations` | Field location mapping | `(field_key, location_name)` (PK), `created_at` |
| `public.field_dictionary_component_rules` | Per-component presence/required policy | `(field_key, component_name)` (PK), `is_present`, `is_required`, timestamps |
| `public.universal_fields` | Runtime projection of active dictionary rows | `name` (PK), `category_name`, `input_type`, `field_order`, `created_at` |
| `public.component_config_fields` | Runtime projection of active component-field rows | `(component_name, category_name, field_name)` (PK), `created_at` |
| `public.universal_field_rename_audit` | Rename audit log | `id` (identity PK), `old_name`, `new_name`, `renamed_at` |

### Hierarchy Core Rows

| Table | Stores | Key columns |
|---|---|---|
| `public.levels` | Static level taxonomy | `level_number` (PK), `name` (UNIQUE), `definition`, `created_at` |
| `public.modules` | Module core rows | `id` (UUID PK), `title`, `text`, `level_number`, `created_at` |
| `public.lessons` | Lesson core rows | `id` (UUID PK), `module_id` (FK), `title`, `text`, `subtitle`, `created_at` |
| `public.groups` | Group core rows | `id` (UUID PK), `lesson_id` (FK), `title`, `text`, `subtitle`, `created_at` |
| `public.slides` | Slides core rows | `id` (UUID PK), `group_id` (FK), `created_at` |
| `public.title_slides` | title_slides core rows | `id` (UUID PK), `lesson_id` (FK), `created_at` |
| `public.lesson_ends` | lesson_ends core rows | `id` (UUID PK), `lesson_id` (FK), `created_at` |
| `public.activity_slides` | activity_slides core rows | `id` (UUID PK), `group_id` (FK), `created_at` |

### Dynamic Value Rows (`*_field_values` pattern)

| Table | Row identity column | Component token enforced |
|---|---|---|
| `public.module_field_values` | `module_id` | `modules` |
| `public.lesson_field_values` | `lesson_id` | `lessons` |
| `public.group_field_values` | `group_id` | `groups` |
| `public.slide_field_values` | `slide_id` | `slides` |
| `public.title_slide_field_values` | `title_slide_id` | `title_slides` |
| `public.lesson_end_field_values` | `lesson_end_id` | `lesson_ends` |
| `public.activity_slide_field_values` | `activity_slide_id` | `activity_slides` |

Shared shape across all `*_field_values` tables:
1. Composite PK: `(row_id, component_name, category_name, field_name)`
2. FK to owning core table (`*_id`)
3. FK `(component_name, category_name, field_name)` -> `public.component_config_fields`
4. `field_value TEXT` + `updated_at TIMESTAMPTZ`
5. CHECK to block persistence of system-controlled id field key (`moduleId` / `lessonId` / `groupId` / `slideId`)

## Views

| View | Purpose |
|---|---|
| `public.config_universal_fields` | Read projection for universal config surface with category order and select metadata |
| `public.config_component_fields` | Read projection for component-scoped config surface with category order and select metadata |

## Constraint Map (Named Constraints)

### Foundational checks
1. `levels_level_number_range_check`: `level_number BETWEEN 1 AND 10`
2. `config_categories_category_order_check`: `category_order >= 0`
3. `universal_fields_input_type_check`: allow-list of supported input types
4. `universal_fields_field_order_check`: `field_order >= 0`
5. `field_dictionary_input_type_check`: allow-list of supported input types
6. `field_dictionary_select_options_json_type_check`: `select_options_json` is JSON array when present
7. `field_dictionary_select_source_check`: `select_source` non-empty when present
8. `field_dictionary_select_metadata_check`: select metadata allowed only for `input_type = 'select'`
9. `field_dictionary_field_order_check`: `field_order >= 0`
10. `field_dictionary_status_check`: `status IN ('active', 'legacy')`
11. `field_dictionary_locations_name_check`: `location_name` in (`cms`, `lv2`, `lesson_player`, `supabase`)

### Projection and relationship constraints
1. `component_config_fields_category_fk` and `component_config_fields_field_fk`
2. `universal_fields_dictionary_fk`
3. Core hierarchy FKs:
   - `lessons.module_id` -> `modules.id`
   - `groups.lesson_id` -> `lessons.id`
   - `slides.group_id` -> `groups.id`
   - `title_slides.lesson_id` -> `lessons.id`
   - `lesson_ends.lesson_id` -> `lessons.id`
   - `activity_slides.group_id` -> `groups.id`

### `*_field_values` guard constraints
1. Component token lock checks:
   - `module_field_values_component_name_check`
   - `lesson_field_values_component_name_check`
   - `group_field_values_component_name_check`
   - `slide_field_values_component_name_check`
   - `title_slide_field_values_component_name_check`
   - `lesson_end_field_values_component_name_check`
   - `activity_slide_field_values_component_name_check`
2. System id block checks:
   - `module_field_values_no_system_module_id_check`
   - `lesson_field_values_no_system_lesson_id_check`
   - `group_field_values_no_system_group_id_check`
   - `slide_field_values_no_system_slide_id_check`
   - `title_slide_field_values_no_system_slide_id_check`
   - `lesson_end_field_values_no_system_slide_id_check`
   - `activity_slide_field_values_no_system_slide_id_check`

## Trigger and Guard Map

| Trigger | Table | Timing/events | Guard behavior |
|---|---|---|---|
| `field_dictionary_touch_updated_at` | `field_dictionary` | BEFORE UPDATE | Maintains `updated_at` |
| `field_dictionary_component_rules_touch_updated_at` | `field_dictionary_component_rules` | BEFORE UPDATE | Maintains `updated_at` |
| `field_dictionary_sync_to_universal` | `field_dictionary` | AFTER INSERT/UPDATE | Syncs active dictionary rows into `universal_fields` and `component_config_fields` |
| `field_dictionary_component_rules_sync` | `field_dictionary_component_rules` | AFTER INSERT/UPDATE | Syncs component presence changes into `component_config_fields` |
| `activity_slide_structured_payload_guard` | `activity_slide_field_values` | BEFORE INSERT/UPDATE | Blocks `propsJson` collisions with duplicate structured top-level keys |

## Function Surface (Operational)

### Authority management
1. `upsert_field_dictionary_entry`
2. `set_field_dictionary_status`
3. `set_field_dictionary_component_presence`
4. `rename_universal_field`
5. `set_universal_field_order`
6. `set_component_config_field_enabled`

### Atomic import RPC
1. `import_modules_create_atomic` / `import_modules_update_atomic`
2. `import_lessons_create_atomic` / `import_lessons_update_atomic`
3. `import_groups_create_atomic` / `import_groups_update_atomic`
4. `import_slides_create_atomic` / `import_slides_update_atomic`
5. `import_title_slides_create_atomic` / `import_title_slides_update_atomic`
6. `import_lesson_ends_create_atomic` / `import_lesson_ends_update_atomic`
7. `import_activity_slides_create_atomic` / `import_activity_slides_update_atomic`

## Migration Ledger (Ordered)

Canonical execution order source: `central/CONSTITUTION.md` -> `setup_sql_order`.

| Order | File | Type | Effect |
|---|---|---|---|
| 001 | `supabase/manual/001_levels_setup.sql` | schema + seed | Creates `levels`, seeds Level 1..10, enforces range check |
| 002 | `supabase/manual/002_config_authority_setup.sql` | schema + ops functions | Creates config/projection tables, views, ordering and rename utilities |
| 004 | `supabase/manual/004_field_dictionary_authority_setup.sql` | schema + sync triggers/functions | Creates dictionary authority tables, sync triggers, authority write functions |
| 009 | `supabase/manual/009_uuid_identity_reset.sql` | schema reset + runtime import RPC | Rebuilds hierarchy core + base `*_field_values` + import RPC for modules/lessons/groups/slides |
| 010 | `supabase/manual/010_field_dictionary_catalog_seed.sql` | seed | Seeds approved field catalog in `field_dictionary` |
| 011 | `supabase/manual/011_text_slide_component_setup.sql` | seed | Applies initial `slides` text baseline |
| 012 | `supabase/manual/012_component_activation_seed.sql` | seed | Seeds deterministic component activation in `field_dictionary_component_rules` |
| 013 | `supabase/manual/013_title_slide_boundary_setup.sql` | schema + import RPC | Adds `title_slides`, `title_slide_field_values`, atomic import RPC |
| 014 | `supabase/manual/014_lesson_ends_boundary_setup.sql` | schema + import RPC | Adds `lesson_ends`, `lesson_end_field_values`, atomic import RPC |
| 015 | `supabase/manual/015_act_001_slide_setup.sql` | seed | Seeds ACT baseline activation on `activity_slides` |
| 016 | `supabase/manual/016_activity_slides_setup.sql` | schema + trigger + import RPC | Adds `activity_slides`, `activity_slide_field_values`, structured payload guard trigger, atomic import RPC |

## Migration Application (Fresh Setup)

1. Start local services:
   ```bash
   supabase start
   ```
2. Read the canonical order from `central/CONSTITUTION.md` (`setup_sql_order`).
3. Apply files in that exact order.
4. Recommended execution mode for this repo: Supabase Studio SQL editor (`http://127.0.0.1:54323`) file-by-file.

### CLI caveat (important)
In this sandbox, `supabase db query --file <path>` can fail on multi-statement files. For fresh setup:
1. Prefer Supabase Studio SQL editor, or
2. Split migration content into single-statement `supabase db query` calls

## Minimal Verification Queries

```sql
-- Table inventory
select tablename
from pg_tables
where schemaname = 'public'
order by tablename;

-- Views inventory
select table_name
from information_schema.views
where table_schema = 'public'
order by table_name;

-- Guard triggers inventory
select event_object_table as table_name, trigger_name, action_timing
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```
