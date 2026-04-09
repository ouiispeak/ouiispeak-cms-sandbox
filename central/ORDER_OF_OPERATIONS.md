Authority Role: canonical
Artifact Type: operational-runbook
Canonical Source: central/ORDER_OF_OPERATIONS.md
Constitution Reference: central/CONSTITUTION.md

# Order Of Operations

Date: 2026-04-07
Repository: ouiispeak-cms-sandbox

## 0) Preflight Checkpoint (Required Before Build Work)
1. Run and record:
   1. `git status --short --branch`
   2. `npm run check`
2. Create a checkpoint note before implementation starts:
   1. Date/time
   2. Branch
   3. Dirty/clean state
   4. Count of modified and untracked files
3. Do not start implementation until the checkpoint is recorded.

### Recorded Checkpoint
1. Date: 2026-04-07
2. Branch: `dev`
3. State: dirty worktree
4. Snapshot command: `git status --short --branch`
5. Snapshot summary: 49 changed paths (modified + untracked)

## 1) Local Supabase Setup Order
1. Start Supabase: `supabase start`
2. Apply SQL in strict order:
   1. `supabase/manual/001_levels_setup.sql`
   2. `supabase/manual/002_config_authority_setup.sql`
   3. `supabase/manual/004_field_dictionary_authority_setup.sql`
   4. `supabase/manual/009_uuid_identity_reset.sql`
   5. `supabase/manual/010_field_dictionary_catalog_seed.sql`
   6. `supabase/manual/011_text_slide_component_setup.sql`
   7. `supabase/manual/012_component_activation_seed.sql`
   8. `supabase/manual/013_title_slide_boundary_setup.sql`
   9. `supabase/manual/014_lesson_ends_boundary_setup.sql`
   10. `supabase/manual/015_act_001_slide_setup.sql`
   11. `supabase/manual/016_activity_slides_setup.sql`

## 2) Config Authority Update Order
1. Update dictionary authority through `public.upsert_field_dictionary_entry`.
2. Update status through `public.set_field_dictionary_status`.
3. Update component presence/required through `public.set_field_dictionary_component_presence`.
4. Use `public.rename_universal_field` for renames.
5. Use `public.set_universal_field_order` for ordering.
6. Verify projections:
   1. `public.universal_fields`
   2. `public.component_config_fields`

## Current Baseline
1. Universal dictionary is populated.
2. Component activation is controlled by `public.field_dictionary_component_rules` and projected into `public.component_config_fields`.
3. Current component activation baseline is seeded by `supabase/manual/012_component_activation_seed.sql`, reinforced by `supabase/manual/015_act_001_slide_setup.sql`, and mirrored in `central/SOT/*_configs.md`.
4. Runtime `activity_slides` tables and atomic RPC are created by `supabase/manual/016_activity_slides_setup.sql`.
5. `lesson_ends` config-chain shape-lock is active, runtime DB boundary tables/RPC exist, and CMS edit/create/import/export routes are active.

## 3) Manual Module Creation
1. Go to `/modules`.
2. Click `Create Module`.
3. Fill enabled module fields.
4. Click `Add Module`.
5. Confirm redirect to `/edit-module/[moduleId]` and UUID path value.
6. Confirm `moduleId` is auto-filled from `public.modules.id` and is non-editable.

## 4) Module Edit Save
1. Open `/edit-module/[moduleId]`.
2. Update fields.
3. Click `Save Changes`.
4. Confirm data persists after refresh.

## 5) Module JSON Import
1. Go to `/modules`.
2. Click `Export JSON File` to get current template.
3. Fill category keys based on current module config.
4. For update mode, include top-level `moduleId` (uuid).
5. Go to `/import` and upload in module create/update mode.
6. Confirm import is atomic (all succeed or none).
7. Confirm redirect to `/` and dashboard placement.

## 6) Manual Lesson Creation
1. Go to `/lessons`.
2. Click `Create Lesson`.
3. Choose parent module.
4. Fill enabled lesson fields.
5. Click `Add Lesson`.
6. Confirm redirect to `/edit-lesson/[lessonId]` and UUID path value.
7. Confirm `lessonId` is auto-filled and non-editable.

## 7) Lesson Edit Save
1. Open `/edit-lesson/[lessonId]`.
2. Update fields and/or parent module.
3. Click `Save Changes`.
4. Confirm data persists after refresh.

## 8) Lesson JSON Import And Nested Export
1. Go to `/lessons` and click `Export JSON File` for template.
2. Optional: on `/edit-lesson/[lessonId]`, click `Export JSON Lesson` for nested lesson+groups export.
3. For create mode include top-level `moduleId` (uuid).
4. For update mode include top-level `lessonId` (uuid); `moduleId` optional.
5. Upload from `/import` using lesson create/update.
6. Confirm atomic behavior and dashboard placement.

## 9) Manual Group Creation
1. Go to `/groups`.
2. Click `Create Group`.
3. Choose parent lesson.
4. Fill enabled group fields.
5. Click `Add Group`.
6. Confirm redirect to `/edit-group/[groupId]` and UUID path value.
7. Confirm `groupId` is auto-filled and non-editable.

## 10) Group JSON Import And Export
1. Go to `/groups` and click `Export JSON File` for template.
2. Optional: on `/edit-group/[groupId]`, click `Export JSON File` for one group.
3. For create mode include top-level `lessonId` (uuid).
4. For update mode include top-level `groupId` (uuid); `lessonId` optional.
5. Upload from `/import` using group create/update.
6. Confirm atomic behavior and dashboard placement.

## 11) Manual Slide Creation
1. Go to `/slides`.
2. Click `Create Text Slide`.
3. Choose parent group.
4. Fill enabled slide fields.
5. Click `Add Text Slide`.
6. Confirm redirect to `/edit-slide/[slideId]` and UUID path value.
7. Confirm `slideId` is auto-filled and non-editable.

## 12) Slide JSON Import And Export
1. Go to `/slides` and click `Export JSON File` for template.
2. Optional: on `/edit-slide/[slideId]`, click `Export JSON File` for one slide.
3. For create mode include top-level `groupId` (uuid).
4. For update mode include top-level `slideId` (uuid); `groupId` optional.
5. Upload from `/import` using slide create/update.
6. Confirm atomic behavior and dashboard placement.

## 13) Manual activity_slides Creation
1. Go to `/activity-slides`.
2. Click `Create ACT activity_slides` for the target active ACT profile.
3. Choose parent group.
4. Fill enabled activity_slides fields.
5. Click `Add ACT activity_slides`.
6. Confirm redirect to `/edit-activity-slide/[activitySlideId]` and UUID path value.
7. Confirm `slideId` is auto-filled and non-editable.

## 14) activity_slides JSON Import And Export
1. Go to `/activity-slides` and click `Export JSON File` for template.
2. Optional: on `/edit-activity-slide/[activitySlideId]`, click `Export JSON File` for one activity_slides.
3. For create mode include top-level `groupId` (uuid).
4. For update mode include top-level `slideId` (uuid); `groupId` optional.
5. For ACT create/update, keep `type = "activity"` and set `activityId` to the active profile target (`ACT-001..ACT-005` or `ACT-009..ACT-026`; `ACT-006/007/008` are inactive).
6. Upload from `/import` using activity_slides create/update.
7. Confirm atomic behavior and dashboard placement.

## 15) Manual title_slides Creation
1. Go to `/title-slides`.
2. Click `Create title_slides`.
3. Choose parent lesson.
4. Fill enabled title_slides fields.
5. Click `Add title_slides`.
6. Confirm redirect to `/edit-title-slide/[titleSlideId]` and UUID path value.
7. Confirm `slideId` is auto-filled and non-editable.

## 16) title_slides JSON Import And Export
1. Go to `/title-slides` and click `Export JSON File` for template.
2. Optional: on `/edit-title-slide/[titleSlideId]`, click `Export JSON File` for one title_slides.
3. For create mode include top-level `lessonId` (uuid).
4. For update mode include top-level `slideId` (uuid); `lessonId` optional.
5. Upload from `/import` using title_slides create/update.
6. Confirm atomic behavior and dashboard placement.

## 17) Import Validation Failure Gate
1. Submit invalid JSON from `/import`.
2. Confirm redirect to `/import` with `Validation Failed`.
3. Confirm message includes component + mode + reason.

## 18) Verification Gate Before Done
1. DB authority queries pass.
2. Route flow checks pass.
3. `npm run check` passes.
4. `central/*` and `docs/*` mirrors match runtime behavior.
