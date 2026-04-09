Authority Role: guide
Artifact Type: repo-overview
Canonical Source: central/CONSTITUTION.md
Constitution Reference: central/CONSTITUTION.md

# CMS Barebones Factory Reset

Minimal local sandbox for the CMS hierarchy:

- Levels -> Modules -> Lessons -> title_slides (boundary) + Groups -> Slides
- Levels -> Modules -> Lessons -> title_slides (boundary) + Groups -> Slides + activity_slides + lesson_ends (boundary)
- Supabase-backed config authority
- JSON import/export for modules, lessons, groups, slides, activity_slides, title_slides, and lesson_ends records
- Slides are content-only; active ACT profiles (`ACT-001..ACT-005`, `ACT-009..ACT-026`) live under dedicated `activity_slides`

## Runtime Authority
Single runtime authority chain:

- `public.field_dictionary`
- `public.universal_fields` (projection)
- `public.field_dictionary_component_rules`
- `public.component_config_fields` (projection)

Single canonical mapping boundary:

- `lib/canonicalFieldMap.ts`

Shared parser/validation/import core:

- `lib/componentCore.ts`
- `lib/hierarchyComponentEngine.ts`

## Primary Routes
- Dashboard: `/`
- Levels: `/levels`
- Modules: `/modules`
- Lessons: `/lessons`
- Groups: `/groups`
- Slides: `/slides`
- activity_slides: `/activity-slides`
- title_slides: `/title-slides`
- Import: `/import`
- Configs: `/configs`

## Commands
```bash
npm install
npm run dev
npm run check
```

Open [http://localhost:3000](http://localhost:3000).

## Local Supabase Setup
```bash
supabase start
```
Apply SQL in strict order:

1. Canonical source: `central/CONSTITUTION.md` -> `setup_sql_order`.
2. Operational runbook mirror: `central/ORDER_OF_OPERATIONS.md` -> `1) Local Supabase Setup Order`.
3. Execute only that canonical sequence; do not introduce local order variants in guide docs.

Current baseline: universal field catalog is populated and component field activation is managed in `public.field_dictionary_component_rules`.

## Identity Contract
- DB primary/foreign keys for modules, lessons, groups, and slides are UUID.
- DB primary/foreign keys for activity_slides are UUID (`activity_slides.id`, `activity_slides.group_id`).
- DB primary/foreign keys for title_slides are UUID (`title_slides.id`, `title_slides.lesson_id`).
- DB primary/foreign keys for lesson_ends records are UUID (`lesson_ends.id`, `lesson_ends.lesson_id`).
- UI route params are `[moduleId]`, `[lessonId]`, `[groupId]`, `[slideId]`, `[activitySlideId]`, `[titleSlideId]`, and `[lessonEndId]`.
- Naming decision `ACT-NAMING-001` is closed: use `slideId` only. `slideUuid` is legacy and unsupported.
- Naming decision `CMP-NAMING-001` is closed: component token is `lesson_ends`, collection URL slug is `lesson-ends`, entity route param is `lessonEndId`, and DB FK is `lesson_end_id`.
- JSON import/export identity keys:
  - module update: `moduleId`
  - lesson create parent: `moduleId`
  - lesson update: `lessonId` (`moduleId` optional reparent)
  - group create parent: `lessonId`
  - group update: `groupId` (`lessonId` optional reparent)
  - slide create parent: `groupId`
  - slide update: `slideId` (`groupId` optional reparent)
  - activity_slides create parent: `groupId`
  - activity_slides update: `slideId` (`groupId` optional reparent)
  - title_slides create parent: `lessonId`
  - title_slides update: `slideId` (`lessonId` optional reparent)
  - lesson_ends create parent: `lessonId`
  - lesson_ends update: `slideId` (`lessonId` optional reparent)

## Minimal Documentation Map
To prevent spec duplication, treat these as the only detailed docs:

- Contract and hierarchy authority: `central/CONSTITUTION.md`
- Operational sequence: `central/ORDER_OF_OPERATIONS.md`
- Local DB setup and verification: `docs/LOCAL_SUPABASE_MANUAL_SETUP.md`
- Config laws: `central/Configs/CONFIG_LAW.md`
- Component-specific laws: `central/modules/MODULE_LAWS.md`, `central/lessons/LESSON_LAWS.md`, `central/groups/GROUP_LAWS.md`, `central/slides/SLIDE_LAWS.md`, `central/activity-slides/ACTIVITY_SLIDE_LAWS.md`, `central/title-slides/TITLE_SLIDE_LAWS.md`
- Per-ACT required runtime profiles: `central/ACTIVITY_PROFILES.md`
- Ingest/export contract authority: `central/INGEST_CONTRACT.md`
- Open unresolved-items log: `central/OPEN_ITEMS.md`

## Authority Registry
- One canonical source per artifact type is defined in `central/CONSTITUTION.md` under `authority_registry`.
- `central/SOT/*.md` files are mirrors only and must not override canonical authority.
