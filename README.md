# CMS Barebones Factory Reset

Minimal local sandbox for the CMS hierarchy:

- Levels -> Modules -> Lessons -> Groups -> Slides
- Supabase-backed config authority
- JSON import/export for modules, lessons, groups, slides

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

1. `supabase/manual/001_levels_setup.sql`
2. `supabase/manual/002_config_authority_setup.sql`
3. `supabase/manual/004_field_dictionary_authority_setup.sql`
4. `supabase/manual/009_uuid_identity_reset.sql` (current runtime reset + contract)

## Identity Contract
- DB primary/foreign keys for modules, lessons, groups, and slides are UUID.
- UI route params remain `[moduleId]`, `[lessonId]`, `[groupId]`, `[slideId]`.
- JSON import/export identity keys:
  - module update: `moduleId`
  - lesson create parent: `moduleId`
  - lesson update: `lessonId` (`moduleId` optional reparent)
  - group create parent: `lessonId`
  - group update: `groupId` (`lessonId` optional reparent)
  - slide create parent: `groupId`
  - slide update: `slideId` (`groupId` optional reparent)

## Minimal Documentation Map
To prevent spec duplication, treat these as the only detailed docs:

- Contract and hierarchy authority: `central/CONSTITUTION.md`
- Operational sequence: `central/ORDER_OF_OPERATIONS.md`
- Local DB setup and verification: `docs/LOCAL_SUPABASE_MANUAL_SETUP.md`
- Config laws: `central/Configs/CONFIG_LAW.md`
- Component-specific laws: `central/modules/MODULE_LAWS.md`, `central/lessons/LESSON_LAWS.md`, `central/groups/GROUP_LAWS.md`, `central/slides/SLIDE_LAWS.md`
