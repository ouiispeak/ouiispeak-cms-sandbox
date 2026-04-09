Authority Role: mirror
Artifact Type: lv2-json-contract
Canonical Source: central/INGEST_CONTRACT.md
Constitution Reference: central/CONSTITUTION.md

# LV2 JSON Contract Law (v1)

Date: 2026-04-07  
Repository: ouiispeak-cms-sandbox

## Purpose
This law defines the JSON contract LV2 must use when generating payloads for CMS import.

## Source Of Truth
- Field authority: Supabase `public.field_dictionary` -> `public.universal_fields` -> `public.field_dictionary_component_rules` -> `public.component_config_fields`.
- Mapping authority: `lib/canonicalFieldMap.ts`.

## Create vs Update
- Create uses template shape and parent linkage keys only.
- Update uses the same category shape plus top-level identity key.

## Top-Level Identity/Parent Keys
- `modules`: `moduleId` (update identity only)
- `lessons`: `lessonId` (update identity), `moduleId` (parent linkage)
- `groups`: `groupId` (update identity), `lessonId` (parent linkage)
- `slides`: `slideId` (update identity), `groupId` (parent linkage)
- `title_slides`: `slideId` (update identity), `lessonId` (parent linkage)
- `lesson_ends`: `slideId` (update identity), `lessonId` (parent linkage)

## Naming Decision (ACT-NAMING-001)
- Final choice: `slideId` is the canonical slide-family update identity key.
- `slideUuid` is legacy and forbidden in LV2 payloads.
- No compatibility alias is allowed from `slideUuid` to `slideId`.

## Naming Decision (CMP-NAMING-001)
- Final choice: component token is `lesson_ends`; collection URL slug is `lesson-ends`; entity route param is `lessonEndId`; DB FK is `lesson_end_id`.
- Legacy component-token variants are forbidden: `Lesson End Slide`, `lesson end`, `lesson ends`, `lesson-end`, `lesson-ends`.
- No compatibility alias is allowed for component-token naming.

Note:
- CMS JSON routes for this component are active under `/api/lesson-ends/*`.
- `moduleId`, `slug`, and `orderIndex` remain required baseline fields in lesson_ends config payloads.
- Current player B2 runtime reads the lesson_ends identity baseline from `public.lesson_end_field_values`.

## Category Payload Rule
- Category payloads contain only component-config fields.
- Top-level identity/parent keys must never appear inside any category payload.

## Export Contract
- Template export = create shape (no record identity key in categories).
- Instance export = update shape (top-level identity key included).
- Nested lesson export uses the same rule for lesson/group/slide objects.

## Fail-Closed Import Rule
- If a top-level key appears inside a category payload, import must reject.
- If a field is not active in the component config, import must reject.
- If required fields are missing, import must reject.

## No Fallback Rule
- No legacy compatibility keys.
- No fallback mapping.
- No dual-write behavior.
