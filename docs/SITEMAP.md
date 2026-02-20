# CMS Sitemap

**Purpose:** Complete map of routes and their purpose.  
**Last updated:** 2025-02-19

---

## Primary Routes

### Dashboard & Navigation

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Main dashboard: CEFR → Modules → Lessons → Groups → Slides + Queued section |
| `/queued` | `app/queued/page.tsx` | Lessons with `status = waiting_review` (LaDy-ingested); approve to move to dashboard |

### Create

| Route | File | Purpose |
|-------|------|---------|
| `/new-module` | `app/new-module/page.tsx` | Create module (optional `?level=A1`) |
| `/new-lesson` | `app/new-lesson/page.tsx` | Create lesson (optional `?module_id=...`) |
| `/new-group` | `app/new-group/page.tsx` | Create group within lesson |
| `/new-slide` | *(if exists)* | Create slide — primary flow uses inline add on lesson-slides page |

### Edit

| Route | File | Purpose |
|-------|------|---------|
| `/edit-module/[moduleId]` | `app/edit-module/[moduleId]/page.tsx` | Edit module |
| `/edit-lesson/[lessonId]` | `app/edit-lesson/[lessonId]/page.tsx` | Edit lesson metadata |
| `/edit-group/[groupId]` | `app/edit-group/[groupId]/page.tsx` | Edit group |
| `/edit-slide/[slideId]` | `app/edit-slide/[slideId]/page.tsx` | Edit slide (dynamic form) |

### Manage (Groups & Slides)

| Route | File | Purpose |
|-------|------|---------|
| `/lesson-slides/[lessonId]` | `app/lesson-slides/[lessonId]/page.tsx` | Manage groups and slides for a lesson; add groups, add slides; links to edit |

### Browse / Alternative Views

| Route | File | Purpose |
|-------|------|---------|
| `/modules-browser` | `app/modules-browser/page.tsx` | Browse modules and lessons |
| `/manage-modules/[level]` | `app/manage-modules/[level]/page.tsx` | Manage modules for a CEFR level |
| `/manage-slide-configs` | `app/manage-slide-configs/page.tsx` | Configure slide type form fields (slide_type_configs) |

### Levels & CEFR

| Route | File | Purpose |
|-------|------|---------|
| `/edit-level/[level]` | `app/edit-level/[level]/page.tsx` | Edit CEFR level |
| `/level-aspects/[level]` | `app/level-aspects/[level]/page.tsx` | Level aspects |
| `/cefr/a0/standards` | `app/cefr/a0/standards/page.tsx` | CEFR standards |

---

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/v1/lessons/[lessonId]` | Lesson by ID |
| `GET /api/v1/lessons/[lessonId]/groups` | Groups for lesson |
| `GET /api/v1/lessons/[lessonId]/slides` | Slides for lesson |
| `GET /api/v1/lessons/[lessonId]/export` | Full lesson export for player |

---

## Debug / Test (Feature-Flagged or Internal)

| Route | File | Purpose |
|-------|------|---------|
| `/debug/lesson-preview/[lessonId]` | `app/debug/lesson-preview/[lessonId]/page.tsx` | JSON preview of lesson |
| `/debug/test-dynamic-form` | `app/debug/test-dynamic-form/page.tsx` | Test dynamic form |
| `/test-pagination` | `app/test-pagination/page.tsx` | Pagination test |
| `/test-env` | `app/test-env/page.tsx` | Env var test |

---

## Navigation Flow (Typical)

1. **Home** (`/`) → expand hierarchy → click Module → `/edit-module/[id]`
2. **Home** → click Lesson → `/lesson-slides/[id]` (primary) or `/edit-lesson/[id]`
3. **Lesson-slides** → click Group → `/edit-group/[id]` or Edit slides
4. **Lesson-slides** → click Slide → `/edit-slide/[id]`
5. **Queued** (`/queued`) → approve lesson → status changes → appears in dashboard
6. **Edit lesson** → "Edit groups" → `/lesson-slides/[id]`

---

## Route Conventions

- **IDs:** All use UUIDs (`[moduleId]`, `[lessonId]`, `[groupId]`, `[slideId]`)
- **Query params:** `/new-module?level=A1`, `/new-lesson?module_id=...`
- **Legacy / deprecated:** Routes under `/debug/*` and authoring-table routes are not for normal navigation
