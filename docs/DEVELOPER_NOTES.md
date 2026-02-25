# Developer Notes

## Group Laws V1 (2025-02)

### `grouping_strategy_summary` removed from lessons

The lesson-level field `grouping_strategy_summary` was removed in migration `011_group_laws_restructure.sql`. Lesson structure is now defined by:

- **Lesson purpose** (from lesson metadata)
- **Per-group `group_summary`** on each `lesson_groups` row

The CMS edit-lesson page no longer shows a "Grouping Strategy Summary" field. Structure is inferred from the ordered groups and their individual summaries.
