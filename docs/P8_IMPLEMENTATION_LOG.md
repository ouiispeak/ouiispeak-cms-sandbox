# P8 CMS Ingestion — Implementation Log

**Purpose:** Step-by-step implementation log. Keep in sync with `lesson-compiler-core/docs/P8_IMPLEMENTATION_LOG.md`.

**When to switch repos:** Each step below specifies `[CMS]` or `[LaDy]`. Work in that repo for that step.

---

## Agent / Manual Mode

- **Both repos accessible from Cursor:** Yes. LaDy is at `/Users/raycheljohnson/Desktop/Lady/lesson-compiler-core`. You can read/write both from the ouiispeak-cms workspace.
- **If working manually:** Open the repo indicated by each step. When the step says `[LaDy]`, switch to lesson-compiler-core; when it says `[CMS]`, switch to ouiispeak-cms.
- **After each step:** Update the "Last updated" and checkboxes in **both** log files so they stay in sync.

## Branch Setup (rollback reference)

| Repo | Safe branch (rollback) | Test branch (implementation) |
|------|------------------------|-----------------------------|
| **CMS** | `dev` | `p8-cms-ingestion-test` |
| **LaDy** | `v0.2-neo4j-integration-prep` | `p8-cms-ingestion-test` |

**To roll back:** `git checkout <safe-branch>` in each repo. Both repos are currently on `p8-cms-ingestion-test`.

---

## Sync Status

| Field | Value |
|-------|-------|
| **Last updated** | 2025-02-19 |
| **Current phase** | Phase 1 complete ✓ — Ready for Phase 2 |
| **Blocking on** | — |
| **LaDy doc path** | `lesson-compiler-core/docs/P8_IMPLEMENTATION_LOG.md` |
| **CMS doc path** | `ouiispeak-cms/docs/P8_IMPLEMENTATION_LOG.md` |
| **LaDy fake lesson path** | `lesson-compiler-core/scripts/output/fake-cms-lesson.json` |

---

## Phase 0: Setup & Prerequisites

### Step 0.1 — [CMS] Ensure migrations applied ✅
- [x] Run migration `004_add_lesson_status_column.sql` in Supabase
- [x] Run migration `005_add_lesson_metadata_column.sql` in Supabase
- [x] Verify: ingest succeeded (lessons has status and metadata)

### Step 0.2 — [CMS] Ensure incoming module exists ✅
- [x] Create module with slug `incoming` (or set `LADY_INGEST_MODULE_SLUG`)
- [x] Verify: module exists

### Step 0.3 — [BOTH] Verify paths ✅
- [x] CMS repo: `/Users/raycheljohnson/ouiispeak-cms`
- [x] LaDy repo: `/Users/raycheljohnson/Desktop/Lady/lesson-compiler-core`

---

## Phase 1: Fake Lesson & First Ingest

### Step 1.1 — [LaDy] Create fake CMS-compatible lesson JSON ✅ (pre-created)
**Repo:** lesson-compiler-core  
**File:** `scripts/output/fake-cms-lesson.json` (already created)  
**Action:** Verify file exists, or create with:

```json
{
  "lessonId": "fake-lesson-mvp-001",
  "targetNodeIds": ["node-fake-1"],
  "compilerMeta": { "runId": "fake-run-123" },
  "slides": [
    { "type": "title", "label": "intro", "title": "Bienvenue" },
    { "type": "text", "label": "content-1", "body": "Ceci est un slide de test." },
    { "type": "text", "label": "content-2", "body": "Un deuxième slide de texte." }
  ]
}
```

- [x] File created at LaDy repo
- [x] Validated: ingest works

### Step 1.2 — [CMS] Ingest fake lesson ✅
**Repo:** ouiispeak-cms  
**Action:** Run ingest with path to LaDy output:

```bash
cd /Users/raycheljohnson/ouiispeak-cms
npx tsx scripts/ingest-lady-lesson.ts /Users/raycheljohnson/Desktop/Lady/lesson-compiler-core/scripts/output/fake-cms-lesson.json
```

**Alternative** — use sample in CMS repo (same content):

```bash
npx tsx scripts/ingest-lady-lesson.ts scripts/sample-fake-lady-lesson.json
```

- [x] Ingest completes without error
- [x] Lesson appears on `/queued`
- [x] Groups and slides visible in sidebar when editing lesson

### Step 1.3 — [CMS] Approve lesson and verify in player ✅
- [x] Approve lesson from Queued page
- [x] Open lesson in player
- [x] Title slide displays correctly
- [x] Text slides display correctly
- [x] Navigation works

**Lesson ID from last ingest:** `2e2e9649-6898-4d8e-9389-5519bf4ec304`

---

## Phase 2: Wire LaDy Output to CMS Ingest Path

### Step 2.1 — [LaDy] Determine output location for CMS-compatible JSON
**Repo:** lesson-compiler-core  
**Action:** Decide where LaDy will write CMS-format JSON:
- Option A: `releases/<runId>/cms_import/` with per-lesson JSON
- Option B: `out/cms/` with flat JSON files
- Option C: Add `--format cms` to run-generation that emits CMS schema

- [ ] Output path documented in LaDy README or `docs/P8_IMPLEMENTATION_LOG.md`
- [ ] **Update CMS doc:** Add "LaDy CMS output path: `______`" below

### Step 2.2 — [LaDy] Add CMS-format output (or transform)
**Repo:** lesson-compiler-core  
**Action:** Either:
- A) Add a post-step that converts current `activities` format → CMS `slides` format
- B) Add a new output mode that writes CMS format directly
- C) Create a standalone script that reads one lesson JSON and writes CMS format

- [ ] Implemented
- [ ] Output path wired (see Step 2.1)

### Step 2.3 — [CMS] Add ingest-from-LaDy script (optional)
**Repo:** ouiispeak-cms  
**Action:** If desired, add env or config for LaDy output path:

```bash
LADY_OUTPUT_PATH=/path/to/lady/output.json npx tsx scripts/ingest-lady-lesson.ts
```

Or use `scripts/run-lady-and-ingest.sh` with `LADY_REPO_PATH` and `LADY_OUTPUT_DIR`.

- [ ] Tested end-to-end: LaDy run → ingest → Queued

---

## Phase 3: Adapt LaDy Generator to CMS Schema (Future)

### Step 3.1 — [LaDy] Map activities → CMS slides
**Repo:** lesson-compiler-core  
**Action:** Transform `EXPLAIN` → text slide, `PRACTICE` → text slide (or appropriate mapping). Ensure output matches `lib/types/ladyLesson.ts` in CMS.

- [ ] Mapping defined
- [ ] Output validated against CMS schema

### Step 3.2 — [BOTH] Add new slide types when ready
When CMS adds new slide types (e.g. ai-speak-repeat):
1. [CMS] Update `slideConstants.ts`, `slideProps.ts`, `ladyLesson.ts`, `ladyToCmsMapper.ts`
2. [LaDy] Update output schema and generator to produce new types
3. [BOTH] Update `docs/P8_Phase4_Execution_Workflow.md` schema tables

---

## Phase 4: Schema Sync (When CMS Changes)

When you add a field (e.g. `animation` on text-slide):

| Step | Repo | Action |
|------|------|--------|
| 4a | CMS | Add to `slideProps.ts`, `slideFieldRegistry.ts` |
| 4b | CMS | Update `docs/P8_Phase4_Execution_Workflow.md` |
| 4c | LaDy | Add to output schema if LaDy should generate it |
| 4d | CMS | Add to `ladyLesson.ts` and `ladyToCmsMapper.ts` |

---

## Quick Reference: When to Switch Repos

| Phase | Primary repo | Why |
|-------|--------------|-----|
| 0 | CMS | Migrations, module setup |
| 1.1 | LaDy | Create fake lesson file |
| 1.2–1.3 | CMS | Ingest, approve, player verify |
| 2.1–2.2 | LaDy | Output path, transform/output |
| 2.3 | CMS | Optional ingest script wiring |
| 3 | LaDy first, then CMS | Adapt generator, then mapper |

---

## Log Entries (append as you go)

```
[2025-02-19] Phase 0 complete. Migrations applied (ingest succeeded), module "incoming" exists.
[2025-02-19] Phase 1.1 complete. fake-cms-lesson.json exists in LaDy repo.
[2025-02-19] Phase 1.2 complete. Ingest succeeded. Lesson 2e2e9649-6898-4d8e-9389-5519bf4ec304 on Queued. 3 groups, 3 slides.
[2025-02-19] Created scripts/p8-setup-prereqs.ts for module setup.
[2025-02-19] Phase 1.3 complete. Approved lesson, verified in player. End-to-end works.
```
