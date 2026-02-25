import { z } from "zod";

/**
 * Schema for creating a new lesson
 * Matches the current form fields and validation rules
 * activity_types can be a comma-separated string (from form) or array (from parsed data)
 */
export const createLessonSchema = z.object({
  module_id: z.string().min(1, "Module is required."),
  slug: z.string().trim().min(1, "Slug is required."),
  label: z.string().trim().min(1, "Label is required for CMS navigation."),
  status: z.enum(["draft", "waiting_review", "published"]).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  title: z.string().trim().nullable().optional(),
  order_index: z.number().int().positive(),
  estimated_minutes: z.number().int().positive().nullable().optional(),
  required_score: z.number().nullable().optional(),
  content: z.string().trim().nullable().optional(),
  short_summary_admin: z.string().trim().nullable().optional(),
  short_summary_student: z.string().trim().nullable().optional(),
  course_organization_group: z.string().trim().nullable().optional(),
  slide_contents: z.string().trim().nullable().optional(),
  activity_types: z.union([
    z.string().trim(),
    z.array(z.string().trim())
  ]).nullable().optional().transform((val) => {
    if (!val) return null;
    if (Array.isArray(val)) return val.length > 0 ? val : null;
    // Parse comma-separated string
    const parsed = val.split(",").map(s => s.trim()).filter(s => s.length > 0);
    return parsed.length > 0 ? parsed : null;
  }),
  activity_description: z.string().trim().nullable().optional(),
  signature_metaphors: z.string().trim().nullable().optional(),
  main_grammar_topics: z.string().trim().nullable().optional(),
  pronunciation_focus: z.string().trim().nullable().optional(),
  vocabulary_theme: z.string().trim().nullable().optional(),
  l1_l2_issues: z.string().trim().nullable().optional(),
  prerequisites: z.string().trim().nullable().optional(),
  learning_objectives: z.string().trim().nullable().optional(),
  notes_for_teacher_or_ai: z.string().trim().nullable().optional(),
});

/**
 * Schema for updating a lesson
 * All fields are optional
 */
export const updateLessonSchema = createLessonSchema.partial();

/**
 * Input schema variant for data layer (snake_case fields)
 * Converts empty strings to null for optional fields
 * Handles activity_types as string (comma-separated) or array
 */
export const lessonInputSchema = z.object({
  module_id: z.string(),
  slug: z.string().trim(),
  label: z.string().trim().min(1),
  status: z.enum(["draft", "waiting_review", "published"]).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  title: z.string().trim().nullable(),
  order_index: z.number().int().nullable(),
  estimated_minutes: z.number().int().nullable(),
  required_score: z.number().nullable(),
  content: z.string().trim().nullable(),
  short_summary_admin: z.string().trim().nullable(),
  short_summary_student: z.string().trim().nullable(),
  course_organization_group: z.string().trim().nullable(),
  slide_contents: z.string().trim().nullable(),
  activity_types: z.union([z.string().trim().nullable(), z.array(z.string()).nullable()]).nullable(),
  activity_description: z.string().trim().nullable(),
  signature_metaphors: z.string().trim().nullable(),
  main_grammar_topics: z.string().trim().nullable(),
  pronunciation_focus: z.string().trim().nullable(),
  vocabulary_theme: z.string().trim().nullable(),
  l1_l2_issues: z.string().trim().nullable(),
  prerequisites: z.string().trim().nullable(),
  learning_objectives: z.string().trim().nullable(),
  notes_for_teacher_or_ai: z.string().trim().nullable(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type LessonInput = z.infer<typeof lessonInputSchema>;

