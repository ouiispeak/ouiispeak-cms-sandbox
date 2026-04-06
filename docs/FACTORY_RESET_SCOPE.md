# Factory Reset Scope

This repo intentionally keeps only the active sandbox baseline:

- Hierarchy: Levels -> Modules -> Lessons -> Groups -> Slides
- Supabase authority chain for config and component rules
- Config-driven create/edit/import/export for modules, lessons, groups, slides
- UUID runtime identity with canonical JSON keys (`moduleId`, `lessonId`, `groupId`, `slideId`)

Detailed authority/contracts live in:

- `central/CONSTITUTION.md`
- `central/ORDER_OF_OPERATIONS.md`
- `docs/LOCAL_SUPABASE_MANUAL_SETUP.md`
