# P8 Phase 4: Execution Workflow & Schema Reference

> **Implementation tracking:** Use `docs/P8_IMPLEMENTATION_LOG.md` (CMS) and `lesson-compiler-core/docs/P8_IMPLEMENTATION_LOG.md` (LaDy) for step-by-step execution and cross-repo sync.

## Overview

This document defines:
1. **Phase 4 Execution Workflow** — How to run LaDy, then ingest into CMS
2. **Schema Reference Libraries** — What each entity (Lesson, Group, Slide) needs, required vs optional, field types
3. **Slide Types Library** — What slide types exist; which LaDy can generate (currently: title, text)
4. **Auto-sync Strategy** — How to keep LaDy’s schema in sync when CMS changes
5. **MVP Execution Plan** — Order of work: fake lesson → ingest → player check → expand types → adapt LaDy

---

## 1. Phase 4 Execution Workflow

### 1.1 Run LaDy (lesson-compiler-core)

```bash
cd lesson-compiler-core
node scripts/run-generation.mjs --mode commit
```

**Alternative** (depends on LaDy setup):

```bash
npm run golden-run
npm run build-release
# Output typically in releases/ or out/
```

### 1.2 Ingest into CMS

After LaDy writes JSON to its output directory:

```bash
cd ouiispeak-cms
npx tsx scripts/ingest-lady-lesson.ts path/to/output.json
```

**Env variables** (optional):

- `LADY_INGEST_MODULE_SLUG` — Target module slug (default: `incoming`)

**Prerequisites:**

- Migrations 004 and 005 applied
- Module with slug `incoming` (or your chosen slug) exists

### 1.3 Output Paths (To Be Wired)

| LaDy output location | Ingest script input | Notes |
|---------------------|---------------------|-------|
| `lesson-compiler-core/releases/*.json` | Pass full path | Typical release output |
| `lesson-compiler-core/out/*.json` | Pass full path | Build/dev output |
| (TBD by LaDy) | — | Add config when known |

**Proposed config** (future script/doc):

- `LADY_OUTPUT_DIR` — Base dir for LaDy output
- `LADY_OUTPUT_PATTERN` — e.g. `*.json` or `lesson-*.json`
- Optional script that runs LaDy + ingest in sequence

---

## 2. Schema Reference Libraries

These are the canonical definitions. LaDy output and CMS ingestion should align with them.

### 2.1 Lesson Library

**Source of truth:** `lib/schemas/lessonSchema.ts`, `lib/data/lessons.ts` (CreateLessonInput)

| Field | Type | Required | LaDy Mapped | Notes |
|-------|------|----------|-------------|-------|
| `module_id` | string | ✓ | No (config) | Target module UUID |
| `slug` | string | ✓ | Yes (derived) | From `lessonId` + module slug |
| `label` | string | ✓ | Yes (derived) | From `lessonId` or first target |
| `status` | enum | Optional | Yes | `waiting_review` for LaDy |
| `metadata` | object | Optional | Yes | `canonical_node_key`, `run_id`, `lessonSku` |
| `title` | string | Optional | Yes (derived) | Student-facing |
| `order_index` | number | ✓ | Yes | Sequence in module |
| `estimated_minutes` | number | Optional | No | — |
| `required_score` | number | Optional | No | — |
| `content` | string | Optional | No | — |
| `short_summary_admin` | string | Optional | No | — |
| `short_summary_student` | string | Optional | No | — |
| `course_organization_group` | string | Optional | No | — |
| `slide_contents` | string | Optional | No | — |
| `grouping_strategy_summary` | string | Optional | No | — |
| `activity_types` | string[] | Optional | No | Future |
| `activity_description` | string | Optional | No | — |
| `signature_metaphors` | string | Optional | No | — |
| `main_grammar_topics` | string | Optional | No | — |
| `pronunciation_focus` | string | Optional | No | — |
| `vocabulary_theme` | string | Optional | No | — |
| `l1_l2_issues` | string | Optional | No | — |
| `prerequisites` | string | Optional | No | — |
| `learning_objectives` | string | Optional | No | — |
| `notes_for_teacher_or_ai` | string | Optional | No | — |

---

### 2.2 Group Library

**Source of truth:** `lib/schemas/groupSchema.ts`, `lib/data/groups.ts` (CreateGroupInput)

| Field | Type | Required | LaDy Mapped | Notes |
|-------|------|----------|-------------|-------|
| `lesson_id` | string | ✓ | Yes (set at ingest) | — |
| `label` | string | ✓ | Yes | From slide label or type |
| `title` | string | Optional | Yes | Student-facing |
| `order_index` | number | ✓ | Yes | Sequence in lesson |
| `group_code` | string | Optional | No | — |
| `short_summary` | string | Optional | No | — |
| `group_type` | enum | Optional | No | title, intro, practice, etc. |
| `group_summary` | string | Optional | No | — |
| `group_goal` | string | Optional | No | — |
| `prerequisites` | string | Optional | No | — |
| `is_required_to_pass` | boolean | Optional | No | — |
| `passing_score_type` | enum | Optional | No | — |
| `passing_score_value` | number | Optional | No | — |
| `max_score_value` | number | Optional | No | — |
| `extra_practice_notes` | string | Optional | No | — |
| `l1_l2` | string | Optional | No | — |
| `media_used_ids` | string | Optional | No | — |
| `group_slides_plan` | string[] | Optional | No | JSON array |

---

### 2.3 Slide Library (props_json by type)

**Source of truth:** `lib/types/slideProps.ts`, `lib/constants/slideConstants.ts`, `lib/schemas/slideFieldRegistry.ts`

#### Slide Types (CMS)

| CMS Type Constant | Value | LaDy-Compatible | Notes |
|-------------------|-------|-----------------|-------|
| `TEXT` | `text-slide` | ✓ | Body content |
| `TITLE` | `title-slide` | ✓ | Title/intro |
| `LESSON_END` | `lesson-end` | No | End-of-lesson |
| `AI_SPEAK_REPEAT` | `ai-speak-repeat` | No | TTS phrases |
| `AI_SPEAK_STUDENT_REPEAT` | `ai-speak-student-repeat` | No | Student repeat |
| `SPEECH_MATCH` | `speech-match` | No | Match audio to text |
| `SPEECH_CHOICE_VERIFY` | `speech-choice-verify` | No | Whisper verify |

#### Title-Slide props_json

| Field | Type | Required | LaDy Mapped | Notes |
|-------|------|----------|-------------|-------|
| `label` | string | Optional | Yes | CMS internal |
| `title` | string | Optional | Yes | Main heading |
| `subtitle` | string | Optional | No | — |
| `note` | string | Optional | No | — |
| `buttons` | ButtonConfig[] | Optional | Yes (default) | e.g. `[{label:"Start", action:"next"}]` |
| `defaultLang` | string | Optional | No | english, french, both |
| `audioId` | string | Optional | No | — |
| `isInteractive` | boolean | Optional | Yes (default false) | — |
| `allowSkip` | boolean | Optional | Yes (default false) | — |
| `allowRetry` | boolean | Optional | Yes (default false) | — |

#### Text-Slide props_json

| Field | Type | Required | LaDy Mapped | Notes |
|-------|------|----------|-------------|-------|
| `label` | string | Optional | Yes | CMS internal |
| `title` | string | Optional | No | — |
| `subtitle` | string | Optional | No | — |
| `body` | string | Optional | Yes | Main content |
| `buttons` | ButtonConfig[] | Optional | No | — |
| `defaultLang` | string | Optional | No | — |
| `audioId` | string | Optional | No | — |
| `isInteractive` | boolean | Optional | Yes (default false) | — |
| `allowSkip` | boolean | Optional | Yes (default false) | — |
| `allowRetry` | boolean | Optional | Yes (default false) | — |

**Future example:** If you add `animation: "bounce"` to text-slide in CMS (`slideProps.ts`, `slideFieldRegistry.ts`), the LaDy library should be updated to allow that field so generation can use it.

---

### 2.4 LaDy Output Schema (Current)

**Source of truth:** `lib/types/ladyLesson.ts`

```typescript
LadyLessonOutput = {
  lessonId: string;           // required
  targetNodeIds: string | string[];  // required
  slides: LadySlide[];        // required
  compilerMeta?: { runId?: string };
}

LadySlide = {
  type: "title" | "text";    // required
  label?: string;
  title?: string;            // title-slide
  body?: string;             // text-slide
}
```

---

## 3. Auto-Sync Strategy (MVP and Future)

### MVP (Manual)

- Schema docs and this reference live in the CMS repo
- When CMS fields change, update:
  1. This doc
  2. `lib/types/ladyLesson.ts` if LaDy input/output changes
  3. `lib/mappers/ladyToCmsMapper.ts` for new field mappings

### Target (Later)

- **Option A:** Generate LaDy types from CMS schema (e.g. script that reads Zod schemas / TypeScript and emits a LaDy contract)
- **Option B:** Shared schema package or monorepo that both CMS and LaDy depend on
- **Option C:** CMS exposes a “schema API” (JSON) and LaDy fetches it at build time

### When You Add a New Field (e.g. `animation` on text-slide)

1. Add to `lib/types/slideProps.ts` (TextSlideProps)
2. Add to `lib/schemas/slideFieldRegistry.ts` if it appears in the editor
3. Add to this doc (Slide Library table)
4. Add to `lib/types/ladyLesson.ts` (LadySlide) if LaDy should produce it
5. Add to `lib/mappers/ladyToCmsMapper.ts` (buildSlideTemplate for text)

---

## 4. MVP Execution Plan

### Order of Work

1. **Schema docs (this doc)** — Canonical reference for Lesson, Group, Slide, LaDy.
2. **Fake lesson in LaDy** — Hardcoded or minimal JSON, not real generation:
   - `lessonId`, `targetNodeIds`, `slides` (1 title + 1+ text)
   - Output to a known path
3. **Ingest fake lesson** — Run `ingest-lady-lesson.ts` and confirm:
   - Lesson appears on Queued page
   - Groups and slides created
   - No ingest errors
4. **Verify player** — Approve lesson, open in player, confirm:
   - Title and text slides render
   - Navigation works
5. **Expand slide types in CMS** — Add more slide types and props as needed.
6. **Adapt LaDy generator** — Change real generation output to match:
   - Same structure as fake lesson
   - All required fields
   - Correct slide types and props

### Fake Lesson Example

```json
{
  "lessonId": "fake-lesson-mvp-001",
  "targetNodeIds": ["node-fake-1"],
  "compilerMeta": { "runId": "fake-run-123" },
  "slides": [
    {
      "type": "title",
      "label": "intro",
      "title": "Bienvenue"
    },
    {
      "type": "text",
      "label": "content-1",
      "body": "Ceci est un slide de test."
    }
  ]
}
```

---

## 5. Files to Update When CMS Changes

| Change | Files |
|--------|-------|
| New lesson field | `lessonSchema.ts`, `lessons.ts`, this doc, optionally `ladyLesson.ts` + `ladyToCmsMapper.ts` |
| New group field | `groupSchema.ts`, `groups.ts`, this doc, optionally LaDy |
| New slide type | `slideConstants.ts`, `slideProps.ts`, `slideFieldRegistry.ts`, `ladyLesson.ts`, `ladyToCmsMapper.ts`, this doc |
| New slide props field | `slideProps.ts`, `slideFieldRegistry.ts`, this doc, optionally `ladyLesson.ts` + mapper |
| Activities library (future) | New `activities` schema + doc + LaDy mapping |

---

## 6. Quick Reference: LaDy → CMS Mapping

| LaDy | CMS |
|------|-----|
| `lessonId` | `metadata.lessonSku`, slug derivation |
| `targetNodeIds` | `metadata.canonical_node_key` |
| `compilerMeta.runId` | `metadata.run_id` |
| Slide `type: "title"` | Group + Slide type `title-slide` |
| Slide `type: "text"` | Group + Slide type `text-slide` |
| Slide `label` | Group label/title, slide props.label |
| Slide `title` | props_json.title (title-slide) |
| Slide `body` | props_json.body (text-slide) |
