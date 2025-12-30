# CMS Repository Cleanup Audit
**Date:** 2025-12-30

---

## 🔍 Items Found for Cleanup

### 1. **Debug/Test Routes** ⚠️ VERIFY IF STILL NEEDED
- `app/debug/lesson-preview/[lessonId]/page.tsx` - Debug route for lesson preview
- `app/debug/test-dynamic-form/page.tsx` - Debug route for form testing
- `app/test-env/page.tsx` - Test environment page
- `app/test-pagination/page.tsx` - Test pagination page
- **Action:** Verify if these are still needed for development/debugging
- **Recommendation:** Keep if actively used, archive if obsolete

### 2. **Deprecated Route** ❌ DELETE
- `app/manage-slides/page.tsx` - Marked as deprecated, just redirects to "/"
- **Status:** Comment says "deprecated and does not have real persistence"
- **Action:** Delete file (route just redirects anyway)

### 3. **One-Time Script** ⚠️ ARCHIVE OR DELETE
- `update_slide.js` - Appears to be a one-time migration script
- **Status:** Hardcoded slide ID, looks like a one-time use script
- **Action:** Archive to `scripts/archive/` or delete if no longer needed

### 4. **Build Artifacts** ❌ DELETE (gitignored)
- `.next/dev/logs/next-development.log` - Next.js dev log file
- **Status:** Build artifact, should be gitignored
- **Action:** Delete (will be regenerated)

### 5. **Deprecated Code** ⚠️ REVIEW
- `lib/types/slideProps.ts` - Has deprecated function `mapCmsLanguageToPlayer`
- `lib/utils/logger.ts` - Has deprecated function
- **Action:** Review and remove deprecated functions if unused

### 6. **Documentation Files** ⚠️ REVIEW
Multiple markdown files in root - verify if all are still relevant:
- `AI_SPEAK_STUDENT_CHOOSE_IMPLEMENTATION.md`
- `HARDCODED_VS_CMS_COMPARISON.md`
- `HARDCODED_VS_CMS_FINDINGS.md`
- `PRONUNCIATION_API_DIAGNOSIS.md`
- `PRONUNCIATION_ASSESSMENT_INVESTIGATION.md`
- `SLIDE_ORDERING_ISSUE.md`
- `SLIDE_TYPE_EDITOR_DESIRED_SYSTEM.md`
- `SLIDE_TYPE_EDITOR_MISALIGNMENTS.md`
- **Action:** Review and archive outdated docs

---

## 📊 Recommendations

### High Priority (Safe to Delete):
1. ✅ Delete `app/manage-slides/page.tsx` (deprecated, just redirects)
2. ✅ Delete `.next/dev/logs/next-development.log` (build artifact)

### Medium Priority (Verify First):
1. ⚠️ Archive or delete `update_slide.js` if one-time script
2. ⚠️ Review debug/test routes - keep if needed, archive if obsolete
3. ⚠️ Remove deprecated functions if unused

### Low Priority (Documentation):
1. 📝 Review markdown files and archive outdated ones

---

## ⚠️ Notes

- Debug/test routes might be actively used for development
- Verify usage before deleting debug routes
- Check if deprecated functions are imported anywhere
- Documentation files might contain useful historical context

