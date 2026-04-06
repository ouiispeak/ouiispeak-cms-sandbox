# Hierarchy Law Audit

Date: 2026-04-06
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
- Module update import identity key is top-level `moduleId` (uuid).
- Lesson create parent key is top-level `moduleId` (uuid).
- Lesson update key is top-level `lessonId` (uuid).
- Group create parent key is top-level `lessonId` (uuid).
- Group update key is top-level `groupId` (uuid).
- Slide create parent key is top-level `groupId` (uuid).
- Slide update key is top-level `slideId` (uuid).

### Config Authority
- Primary authority chain:
  - `public.field_dictionary`
  - `public.universal_fields`
  - `public.field_dictionary_component_rules`
  - `public.component_config_fields`
- Current active dictionary keys:
  - `moduleId`, `lessonId`, `groupId`, `slideId`, `title`, `level`, `text`, `subtitle`
- Active component fields:
  - modules: `moduleId`, `title`, `level`, `text`
  - lessons: `lessonId`, `title`, `text`, `subtitle`
  - groups: `groupId`, `title`, `text`, `subtitle`
  - slides: `slideId`

### Mapping Boundary
- Source of truth: `lib/canonicalFieldMap.ts`.
- Runtime parser/import/export must use canonical field keys and this map.

### Data Integrity Guards
- Dynamic value tables reject system-controlled ids:
  - modules: `field_name <> 'moduleId'`
  - lessons: `field_name <> 'lessonId'`
  - groups: `field_name <> 'groupId'`
  - slides: `field_name <> 'slideId'`
- Batch import is atomic for modules/lessons/groups/slides via RPC.
- Import failure messages include component + mode + reason.

## Result Summary
1. Modules contract: PASS
2. Lessons contract: PASS
3. Groups contract: PASS
4. Slides contract: PASS
5. Authority chain and projection contract: PASS
6. Canonical mapping boundary: PASS
7. Atomic import contract: PASS
8. Build/lint/typecheck/tests (`npm run check`): PASS

## Notes
- Current runtime identity and import behavior must always be validated against `009_uuid_identity_reset.sql` + live DB schema.
