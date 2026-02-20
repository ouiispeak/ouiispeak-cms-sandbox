# OuiiSpeak CMS — Architecture Overview

**Purpose:** Single reference for developers to understand the engineering of this system.  
**Last updated:** 2025-02-19

---

## 1. System Summary

The OuiiSpeak CMS is a Next.js Content Management System for language learning content. It manages a hierarchy of **Modules → Lessons → Groups → Slides**, stored in Supabase, with a configuration-driven slide editing system. A separate **LaDy** (lesson generator) system produces lessons as JSON; the CMS ingests them via scripts and exposes them on a **Queued** page for review. Approved content is consumed by the **OuiiSpeak Player** (external app) via a REST export API.

---

## 2. Data Model

### Entity Hierarchy

```
CEFR Level (A0, A1, ...)
  └── modules (slug, title, level, order_index)
        └── lessons (status, slug, title, metadata)
              └── lesson_groups (order_index, label)
                    └── slides (type, props_json, order_index)
```

### Tables

| Table | Purpose |
|-------|---------|
| `modules` | Course modules; belong to a CEFR level |
| `lessons` | Lessons within a module; have `status` (draft \| waiting_review \| published) and optional `metadata` JSONB |
| `lesson_groups` | Groups of slides within a lesson |
| `slides` | Individual slides; `type` determines form and player behavior; `props_json` holds type-specific fields |
| `slide_type_configs` | Per-type form configuration (which fields appear, in what sections) |
| `levels` | CEFR levels (A0, A1, etc.) |

### Slide Types

| Type | Purpose |
|------|---------|
| `title-slide` | Lesson intro |
| `text-slide` | Text content (body) |
| `lesson-end` | End-of-lesson message and actions |
| `ai-speak-repeat` | AI speaks, learner repeats |
| `ai-speak-student-repeat` | Student repeat with elements |
| `speech-match` | Match speech to options |
| `speech-choice-verify` | Choose correct option |

### Lesson Status

- **draft** — In progress; visible in dashboard
- **waiting_review** — Ingested from LaDy; visible only on `/queued`
- **published** — Approved for player

---

## 3. Key Systems

### 3.1 Dashboard & Hierarchy

- **Source:** `app/page.tsx`, `lib/hooks/cms/useCmsDashboard.ts`, `lib/data/buildHierarchy.ts`
- **Data flow:** Load modules, lessons, groups, slides → build `CmsHierarchyMaps` → render tree
- **Sections:** CEFR levels (A0, A1, …) → Modules → Lessons → Groups → Slides
- **Queued:** Separate section for lessons with `status = waiting_review` (LaDy-ingested)

### 3.2 Slide Editor (Configuration-Driven)

- **Form config:** `slide_type_configs` table + `lib/schemas/slideFieldRegistry.ts` (field definitions)
- **Components:** `DynamicSlideForm.tsx` renders form from config
- **Hooks:** `useSlideFormData`, `useSlideFormState`, `useSlideFormValidation`, `useSlideFormSave`
- **Data:** `lib/data/slides.ts`, `lib/mappers/slideMapper.ts`
- **Constitution:** [docs/CMS_CONSTITUTION.md](./CMS_CONSTITUTION.md) — field sections, migration policy

### 3.3 LaDy Ingestion (P8)

LaDy (lesson-compiler-core) generates lessons as JSON. The CMS ingests them into the `incoming` module.

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ingest script** | `scripts/ingest-lady-lesson.ts` | Parse LaDy JSON → create lesson, groups, slides; set `status = waiting_review` |
| **Mapper** | `lib/mappers/ladyToCmsMapper.ts` | Map LaDy schema → CMS entities |
| **Types** | `lib/types/ladyLesson.ts` | `LadyLessonOutput`, `LadySlide` (title \| text) |
| **Run script** | `scripts/run-lady-and-ingest.sh` | Optional: run LaDy → emit-release-cms → batch ingest |

**Flow:** LaDy JSON → ingest → lesson appears on `/queued` → human approves → `status = draft` → visible in dashboard → edit/approve → `status = published` → player can load.

**LaDy output path:** `lesson-compiler-core/scripts/output/cms/<releaseId>/*.cms.json`

**Docs:** [docs/P8_IMPLEMENTATION_LOG.md](./P8_IMPLEMENTATION_LOG.md), [docs/P8_Phase4_Execution_Workflow.md](./P8_Phase4_Execution_Workflow.md)

### 3.4 Player Integration

- **Export API:** `GET /api/v1/lessons/[lessonId]/export` — returns lesson + groups + slides as JSON
- **Player base URL:** `NEXT_PUBLIC_PLAYER_BASE_URL` (e.g. `http://localhost:3000/lecons/db/{lessonId}`)
- **Player:** External Next.js app; consumes CMS export for production lessons
- **Preview:** `app/lesson-preview/[lessonId]` — JSON preview in CMS

---

## 4. Data Access Layer

| Layer | Location | Purpose |
|-------|----------|---------|
| **Data** | `lib/data/*.ts` | Supabase queries (modules, lessons, groups, slides, hierarchy) |
| **Domain** | `lib/domain/*.ts` | Domain models (Module, Lesson, Group, Slide) |
| **Mappers** | `lib/mappers/*.ts` | DB ↔ domain, LaDy → CMS |
| **Schemas** | `lib/schemas/*.ts` | Validation, field registry, lesson/group schemas |
| **Types** | `lib/types/*.ts` | Slide props, LaDy types, DB types |

---

## 5. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1/lessons/[lessonId]` | GET | Lesson by ID |
| `/api/v1/lessons/[lessonId]/groups` | GET | Groups for lesson |
| `/api/v1/lessons/[lessonId]/slides` | GET | Slides for lesson |
| `/api/v1/lessons/[lessonId]/export` | GET | Full lesson export for player |

---

## 6. Configuration & Environment

See [docs/SETUP_ENV_VARIABLES.md](./SETUP_ENV_VARIABLES.md) for full reference.

**Required:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Optional:**

- `LADY_INGEST_MODULE_SLUG` (default `incoming`)
- `LADY_REPO_PATH`, `LADY_OUTPUT_PATH` (scripts)
- `NEXT_PUBLIC_PLAYER_BASE_URL`
- `NEXT_PUBLIC_USE_DYNAMIC_FORM`, `NEXT_PUBLIC_DYNAMIC_FORM_TYPES`, `NEXT_PUBLIC_ENABLE_DEBUG` (feature flags)

---

## 7. Scripts Overview

| Script | Purpose |
|--------|---------|
| `ingest-lady-lesson.ts` | Ingest one or more LaDy JSON files (or a directory) |
| `run-lady-and-ingest.sh` | Run LaDy + emit-release-cms + batch ingest (when `LADY_REPO_PATH` set) |
| `p8-setup-prereqs.ts` | Create `incoming` module if missing |
| `create-all-slide-configs.ts` | Create slide type configs in DB |
| Migrations | `docs/migrations/*.sql` — run in order via Supabase |

---

## 8. Related Repositories

| Repo | Purpose |
|------|---------|
| **ouiispeak-cms** (this repo) | Content authoring, ingest, export API |
| **lesson-compiler-core** (LaDy) | Lesson generation; outputs JSON for ingest |
| **OuiiSpeak Player** | Learner-facing app; consumes CMS export |
