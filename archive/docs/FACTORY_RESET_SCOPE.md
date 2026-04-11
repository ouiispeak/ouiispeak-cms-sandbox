Authority Role: guide
Artifact Type: scope-summary
Canonical Source: central/CONSTITUTION.md
Constitution Reference: central/CONSTITUTION.md

# Factory Reset Scope

This repo intentionally keeps only the active sandbox baseline:

- Hierarchy: Levels -> Modules -> Lessons -> title_slides (boundary) + Groups -> Slides + activity_slides + lesson_ends (boundary)
- Supabase authority chain for config and component rules
- Config-driven create/edit/import/export for modules, lessons, groups, slides, activity_slides, title_slides, and lesson_ends records
- lesson_ends boundary is shape-locked in config chain (`lesson_ends`) and has runtime DB boundary tables plus CMS edit/create/import/export routes
- UUID runtime identity with canonical JSON keys (`moduleId`, `lessonId`, `groupId`, `slideId`)

Detailed authority/contracts live in:

- `central/CONSTITUTION.md`
- `central/ORDER_OF_OPERATIONS.md`
- `docs/LOCAL_SUPABASE_MANUAL_SETUP.md`
