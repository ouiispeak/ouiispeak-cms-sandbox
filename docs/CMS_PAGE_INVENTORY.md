# CMS Page Inventory

**Purpose:** Page → file → table mapping for developers.  
**Last updated:** 2025-02-19

See also: [SITEMAP.md](./SITEMAP.md) for route overview, [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) for system context.

---

## Dashboard & Primary Navigation

### `/` (Home)
- **File:** `app/page.tsx`
- **Purpose:** Main dashboard. Shows CEFR hierarchy (A0, A1, …) → Modules → Lessons → Groups → Slides. Includes Queued section for lessons with `status = waiting_review`.
- **Tables:** `modules`, `lessons`, `lesson_groups`, `slides`, `levels`
- **Actions:** Expand/collapse tree; links to edit-module, edit-lesson, lesson-slides, edit-group, edit-slide

### `/queued`
- **File:** `app/queued/page.tsx`
- **Purpose:** Lessons with `status = waiting_review` (from LaDy ingestion). Approve to change status to `draft` (moves to dashboard).
- **Tables:** `lessons`, `lesson_groups`, `slides`
- **Actions:** Approve lesson; view/edit lesson

---

## Create

### `/new-module`
- **File:** `app/new-module/page.tsx`
- **Tables:** `modules`
- **Actions:** Form (title, slug, level, order_index, description); Create module
- **Query:** `?level=A1` (optional prefill)

### `/new-lesson`
- **File:** `app/new-lesson/page.tsx`
- **Tables:** `modules`, `lessons`
- **Actions:** Form (module, slug part, title, order index); Create lesson
- **Query:** `?module_id=...` (optional prefill)

### `/new-group`
- **File:** `app/new-group/page.tsx`
- **Tables:** `lessons`, `lesson_groups`
- **Actions:** Form (lesson, order index, group title); Create group

### `/new-slide`
- **File:** `app/new-slide/page.tsx` (if exists)
- **Tables:** `lessons`, `lesson_groups`, `slides`
- **Note:** Primary flow uses inline add on `/lesson-slides/[lessonId]` (Add slide to group)

---

## Edit

### `/edit-module/[moduleId]`
- **File:** `app/edit-module/[moduleId]/page.tsx`
- **Tables:** `modules`
- **Actions:** Edit module; link to Manage lessons & groups

### `/edit-lesson/[lessonId]`
- **File:** `app/edit-lesson/[lessonId]/page.tsx`
- **Tables:** `lessons`
- **Actions:** Edit lesson metadata; "Edit groups" → lesson-slides; "View in player" (if `NEXT_PUBLIC_PLAYER_BASE_URL` set)

### `/edit-group/[groupId]`
- **File:** `app/edit-group/[groupId]/page.tsx`
- **Tables:** `lesson_groups`
- **Actions:** Edit group; "Edit slides" → lesson-slides; "View in player"

### `/edit-slide/[slideId]`
- **File:** `app/edit-slide/[slideId]/page.tsx`
- **Tables:** `slides`, `slide_type_configs`
- **Actions:** Dynamic form driven by slide type config; "View in player"
- **Form:** Configuration-driven via `slide_type_configs` and `slideFieldRegistry.ts`

---

## Manage (Groups & Slides)

### `/lesson-slides/[lessonId]`
- **File:** `app/lesson-slides/[lessonId]/page.tsx`
- **Purpose:** Manage groups and slides for a lesson. Add groups, add slides, reorder, edit.
- **Tables:** `lesson_groups`, `slides`
- **Actions:** Add group; Add slide (text, ai-speak-repeat); Edit group; Edit slides; reorder

---

## Browse & Config

### `/modules-browser`
- **File:** `app/modules-browser/page.tsx`
- **Tables:** `modules`, `lessons`
- **Purpose:** Browse modules and lessons (alternative to dashboard)

### `/manage-modules/[level]`
- **File:** `app/manage-modules/[level]/page.tsx`
- **Purpose:** Manage modules for a CEFR level

### `/manage-slide-configs`
- **File:** `app/manage-slide-configs/page.tsx`
- **Tables:** `slide_type_configs`
- **Purpose:** Configure which form fields appear for each slide type

### `/edit-level/[level]`
- **File:** `app/edit-level/[level]/page.tsx`
- **Tables:** `levels`
- **Purpose:** Edit CEFR level

### `/level-aspects/[level]`
- **File:** `app/level-aspects/[level]/page.tsx`
- **Purpose:** Level aspects view

### `/cefr/a0/standards`
- **File:** `app/cefr/a0/standards/page.tsx`
- **Purpose:** CEFR standards

---

## Debug (require `NEXT_PUBLIC_ENABLE_DEBUG=true`)

### `/debug/lesson-preview/[lessonId]`
- **File:** `app/debug/lesson-preview/[lessonId]/page.tsx`
- **Tables:** `lessons`, `lesson_groups`, `slides`
- **Purpose:** JSON preview of lesson (same shape as export API)

### `/debug/test-dynamic-form`
- **File:** `app/debug/test-dynamic-form/page.tsx`
- **Purpose:** Test dynamic form rendering

---

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/v1/lessons/[lessonId]` | Lesson by ID |
| `GET /api/v1/lessons/[lessonId]/groups` | Groups for lesson |
| `GET /api/v1/lessons/[lessonId]/slides` | Slides for lesson |
| `GET /api/v1/lessons/[lessonId]/export` | Full export for player |
