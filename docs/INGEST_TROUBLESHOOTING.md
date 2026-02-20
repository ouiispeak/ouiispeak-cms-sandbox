# LaDy Ingest Troubleshooting

If lessons don't appear on the Queued page after running the ingest script, run these steps in order.

## 1. Ensure the incoming module exists

```bash
cd ouiispeak-cms
npx tsx scripts/p8-setup-prereqs.ts
```

This creates a module with slug `incoming` (or the value of `LADY_INGEST_MODULE_SLUG`) if it doesn't exist.

## 2. Ensure migrations are applied

In Supabase Dashboard → SQL Editor, run (if not already applied):

- `docs/migrations/004_add_lesson_status_column.sql`
- `docs/migrations/005_add_lesson_metadata_column.sql`
- `docs/migrations/006_fix_delete_lesson_ambiguity.sql` (if delete fails)

## 3. Promote the lesson and ingest

From **lesson-compiler-core** (use quoted path; the `;` in the path breaks unquoted shell):

```bash
cd lesson-compiler-core
node scripts/promote-lesson-to-cms.mjs "out/plan--job--s00046_sntdlex_l1:fr_l2:en-US_select-frequency-adverb-for-habitual-context--srev-in--sdle-ti--sxdac;sxdth--sfb3--sfnne-to-kn--sl3--0.1.0--0.1.0/lesson::plan::job::s00046_sntdlex_l1:fr_l2:en-US_select-frequency-adverb-for-habitual-context::srev-in::sdle-ti::sxdac;sxdth::sfb3::sfnne-to-kn::sl3::0.1.0::0.1.0.json"
```

Then from **ouiispeak-cms** (use the path printed by promote, or tab-complete):

```bash
cd ouiispeak-cms
npx tsx scripts/ingest-lady-lesson.ts "/Users/raycheljohnson/Desktop/Lady/lesson-compiler-core/scripts/output/cms/single-lesson/lesson--plan--job--s00046_sntdlex_l1-fr_l2-en-US_select-frequency-adverb-for-habitual-context--srev-in--sdle-ti--sxdac-s.cms.json"
```

**Important:** Quote the path. The filename may be truncated; use tab-completion or list the directory:

```bash
ls lesson-compiler-core/scripts/output/cms/single-lesson/
```

## 4. If ingest succeeds but Queued page is empty

The script now verifies that the lesson appears in the queued list. If you see:

```
Warning: Lesson was created but does not appear in queued list. Check RLS policies or status column.
```

Then:

- Check Supabase RLS policies on `lessons` — the client (anon or service role) must be able to SELECT rows with `status = 'waiting_review'`.
- In Supabase Table Editor → `lessons`, confirm the new row has `status = waiting_review`.

## 5. Environment variables

Ensure `.env.local` has:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY` if using service role)

The ingest uses whichever credentials your app uses. If RLS restricts access, you may need the service role key for ingestion.
