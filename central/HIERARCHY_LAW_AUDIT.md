Authority Role: audit
Artifact Type: contract-verification-audit
Canonical Source: central/CONSTITUTION.md
Constitution Reference: central/CONSTITUTION.md

# Hierarchy Law Audit

Date: 2026-04-07
Repository: ouiispeak-cms-sandbox
Environment: local repository + local Supabase

## Verification Method
1. Read runtime code (`app/*`, `lib/*`, `supabase/manual/*`).
2. Verify DB schema and authority tables in local Supabase.
3. Verify import/export payload contracts.
4. Run `npm run check`.

## Current Contract Snapshot

### Identity Contract
- `public.modules.id` is UUID.
- `public.lessons.id` and `public.lessons.module_id` are UUID.
- `public.groups.id` and `public.groups.lesson_id` are UUID.
- `public.slides.id` and `public.slides.group_id` are UUID.
- `public.activity_slides.id` and `public.activity_slides.group_id` are UUID.
- `public.title_slides.id` and `public.title_slides.lesson_id` are UUID.
- `public.lesson_ends.id` and `public.lesson_ends.lesson_id` are UUID (lesson_ends boundary table).
- Module update import identity key is top-level `moduleId` (uuid).
- Lesson create parent key is top-level `moduleId` (uuid).
- Lesson update key is top-level `lessonId` (uuid).
- Group create parent key is top-level `lessonId` (uuid).
- Group update key is top-level `groupId` (uuid).
- Slide create parent key is top-level `groupId` (uuid).
- Slide update key is top-level `slideId` (uuid).
- activity_slides create parent key is top-level `groupId` (uuid).
- activity_slides update key is top-level `slideId` (uuid).
- title_slides create parent key is top-level `lessonId` (uuid).
- title_slides update key is top-level `slideId` (uuid).
- lesson_ends create parent key is top-level `lessonId` (uuid).
- lesson_ends update key is top-level `slideId` (uuid).

### Config Authority
- Primary authority chain:
  - `public.field_dictionary`
  - `public.universal_fields`
  - `public.field_dictionary_component_rules`
  - `public.component_config_fields`
- Current active dictionary catalog size must equal current universal projection size.
- Current active category set:
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
- Component activation state (`is_present = true`):
  - modules
  - lessons
  - groups
  - slides (content-only)
  - activity_slides (activity-only)
  - title_slides
  - lesson_ends (lesson_ends config-chain shape-lock + runtime DB boundary tables active)

### Mapping Boundary
- Source of truth: `lib/canonicalFieldMap.ts`.
- Runtime parser/import/export must use canonical field keys and this map.

### Data Integrity Guards
- Dynamic value tables reject system-controlled ids:
  - modules: `field_name <> 'moduleId'`
  - lessons: `field_name <> 'lessonId'`
  - groups: `field_name <> 'groupId'`
  - slides: `field_name <> 'slideId'`
  - activity_slides: `field_name <> 'slideId'`
  - title_slides: `field_name <> 'slideId'`
  - lesson_ends: `field_name <> 'slideId'`
- Batch import is atomic for modules/lessons/groups/slides/activity_slides/title_slides/lesson_ends via RPC.
- Import failure messages include component + mode + reason.

## Result Summary
1. Modules contract: PASS
2. Lessons contract: PASS
3. Groups contract: PASS
4. Slides contract: PASS
5. activity_slides contract: PASS
6. title_slides contract: PASS
7. lesson_ends config shape-lock contract: PASS (required baseline `lessonId,moduleId,slideId,slug,orderIndex`; runtime DB boundary tables active)
8. Authority chain and projection contract: PASS
9. Canonical mapping boundary: PASS
10. Atomic import contract: PASS
11. Build/lint/typecheck/tests (`npm run check`): PASS

## Notes
- Current runtime identity and import behavior must always be validated against `009_uuid_identity_reset.sql` + `010_field_dictionary_catalog_seed.sql` + `011_text_slide_component_setup.sql` + `012_component_activation_seed.sql` + `013_title_slide_boundary_setup.sql` + `014_lesson_ends_boundary_setup.sql` + `015_act_001_slide_setup.sql` + `016_activity_slides_setup.sql` + live DB schema.
