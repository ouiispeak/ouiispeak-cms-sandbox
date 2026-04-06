# Order Of Operations

Date: 2026-04-06
Repository: ouiispeak-cms-sandbox

## 1) Local Supabase Setup Order
1. Start Supabase: `supabase start`
2. Apply SQL in strict order:
   1. `supabase/manual/001_levels_setup.sql`
   2. `supabase/manual/002_config_authority_setup.sql`
   3. `supabase/manual/004_field_dictionary_authority_setup.sql`
   4. `supabase/manual/009_uuid_identity_reset.sql`

## 2) Config Authority Update Order
1. Update dictionary authority through `public.upsert_field_dictionary_entry`.
2. Update status through `public.set_field_dictionary_status`.
3. Update component presence/required through `public.set_field_dictionary_component_presence`.
4. Use `public.rename_universal_field` for renames.
5. Use `public.set_universal_field_order` for ordering.
6. Verify projections:
   1. `public.universal_fields`
   2. `public.component_config_fields`

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
2. Click `Create Slide`.
3. Choose parent group.
4. Fill enabled slide fields.
5. Click `Add Slide`.
6. Confirm redirect to `/edit-slide/[slideId]` and UUID path value.
7. Confirm `slideId` is auto-filled and non-editable.

## 12) Slide JSON Import And Export
1. Go to `/slides` and click `Export JSON File` for template.
2. Optional: on `/edit-slide/[slideId]`, click `Export JSON File` for one slide.
3. For create mode include top-level `groupId` (uuid).
4. For update mode include top-level `slideId` (uuid); `groupId` optional.
5. Upload from `/import` using slide create/update.
6. Confirm atomic behavior and dashboard placement.

## 13) Import Validation Failure Gate
1. Submit invalid JSON from `/import`.
2. Confirm redirect to `/import` with `Validation Failed`.
3. Confirm message includes component + mode + reason.

## 14) Verification Gate Before Done
1. DB authority queries pass.
2. Route flow checks pass.
3. `npm run check` passes.
4. `central/*` and `docs/*` mirrors match runtime behavior.
