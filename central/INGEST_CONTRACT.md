Authority Role: canonical
Artifact Type: ingest-export-contract
Canonical Source: central/INGEST_CONTRACT.md
Constitution Reference: central/CONSTITUTION.md

# INGEST_CONTRACT

Date: 2026-04-09
Last Updated: 2026-04-10
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox

## Purpose
This document is the canonical JSON contract for CMS ingest and export inside this repository.

## Authority Order
1. `central/CONSTITUTION.md` (identity + naming laws)
2. `lib/canonicalFieldMap.ts` (canonical field key mapping)
3. `lib/componentCore.ts` (shared ingest parsing and validation)
4. `lib/activitySlidePreflight.ts` and `lib/activityShapeLock.ts` (`activity_slides` fail-closed rules)

## Canonical Naming Locks
1. Component tokens are plural snake_case (`modules`, `lessons`, `groups`, `slides`, `activity_slides`, `title_slides`, `lesson_ends`).
2. Top-level identity keys are singular camelCase + `Id` (`moduleId`, `lessonId`, `groupId`, `slideId`).
3. `slideId` is the only canonical update identity key for slide-family components.
4. `slideUuid` is forbidden.

## Accepted Payload Rules
1. Payload root must be a JSON object with component-compatible categories.
2. Create mode must include the canonical parent key when parent linkage exists.
3. Update mode must include the canonical identity key.
4. Category objects may include only active fields for that component from `public.component_config_fields`.
5. Top-level identity keys must never appear inside category payload objects.
6. `activity_slides` must satisfy `propsJson` + `runtimeContractV1` envelope and ACT shape-lock rules.
7. Imports are atomic per uploaded file (one failing row rejects the batch).

## Rejected Payload Rules (Fail Closed)
1. Unknown component field for the target component.
2. Missing required key for create/update mode.
3. Legacy identity key usage (`slideUuid`) or alias payloads.
4. Top-level/category contamination (identity keys or blocked duplicates in category objects).
5. Missing required `activity_slides` envelope/shape for active ACT ids.
6. Unsupported or inactive `activityId` (`ACT-006`, `ACT-007`, `ACT-008`).

## Identity/Parent Key Matrix
| Component | Create requires | Update requires | Update optional reparent |
|---|---|---|---|
| `modules` | — | `moduleId` | — |
| `lessons` | `moduleId` | `lessonId` | `moduleId` |
| `groups` | `lessonId` | `groupId` | `lessonId` |
| `slides` | `groupId` | `slideId` | `groupId` |
| `activity_slides` | `groupId` | `slideId` | `groupId` |
| `title_slides` | `lessonId` | `slideId` | `lessonId` |
| `lesson_ends` | `lessonId` | `slideId` | `lessonId` |

## JSON Round-Trip Matrix
| Component family | Template export route | Instance export route | Import route(s) | Deterministic parity expectation |
|---|---|---|---|---|
| `modules` | `/api/modules/export-json` | `/api/modules/[moduleId]/export-json` | `/api/modules/import-json` | Exported canonical keys re-import without shape drift. |
| `lessons` | `/api/lessons/export-json` | `/api/lessons/[lessonId]/export-json` and `/api/lessons/[lessonId]/export-json-lesson` | `/api/lessons/import-json` and `/api/lessons/import-json-nested` | Flat and nested lesson payloads preserve canonical key shape. |
| `groups` | `/api/groups/export-json` | `/api/groups/[groupId]/export-json` | `/api/groups/import-json` | Canonical category objects round-trip with no alias keys. |
| `slides` | `/api/slides/export-json` | `/api/slides/[slideId]/export-json` | `/api/slides/import-json` | `slideId` update identity and category payload keys remain canonical. |
| `activity_slides` | `/api/activity-slides/export-json` | `/api/activity-slides/[activitySlideId]/export-json` | `/api/activity-slides/import-json` | ACT envelope and shape-lock constraints remain valid after round-trip. |
| `title_slides` | `/api/title-slides/export-json` | `/api/title-slides/[titleSlideId]/export-json` | `/api/title-slides/import-json` | Canonical `slideId` identity preserved across import/export. |
| `lesson_ends` | `/api/lesson-ends/export-json` | `/api/lesson-ends/[lessonEndId]/export-json` | `/api/lesson-ends/import-json` | Canonical `slideId` identity preserved across import/export. |

## Notes
1. Runtime authority is local CMS sandbox code and local Supabase schema in this repo only.
2. No external repository is authoritative for this contract.
