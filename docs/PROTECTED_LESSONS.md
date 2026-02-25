# Protected Lessons

Manually created lessons can be protected from accidental deletion.

## Setup

Add to `.env.local`:

```
PROTECTED_LESSON_IDS=uuid-1,uuid-2
```

Use comma-separated lesson UUIDs (the `id` from the `lessons` table).

## Behavior

- **Deletion**: `deleteLesson()` rejects deletion for protected IDs. The Queued page will show: "Deletion failed: Cannot delete: this lesson is protected (PROTECTED_LESSON_IDS)."
- **Ingest**: The ingest script only **creates** new lessons; it never overwrites. Protected lessons are unaffected by ingest.

## Finding your lesson UUIDs

- In the CMS: edit a lesson and check the URL (`/edit-lesson/[lessonId]`).
- In Supabase: `SELECT id, label FROM lessons WHERE ...`.
