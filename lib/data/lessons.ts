import { supabase } from "../supabase";
import { lessonInputSchema } from "../schemas/lessonSchema";
import type { Lesson, LessonMinimal } from "../domain/lesson";
import { toLesson, toLessonMinimal } from "../mappers/lessonMapper";
import { logger } from "../utils/logger";
import { executeTransaction, transactionResultToStandard } from "../utils/transactions";

/**
 * Standard fields to select from lessons table
 * Centralized to avoid repetition across pages
 */
const LESSON_FIELDS_FULL = "id, module_id, label, title, slug, order_index, status, metadata, estimated_minutes, required_score, content, short_summary_admin, short_summary_student, course_organization_group, slide_contents, grouping_strategy_summary, activity_types, activity_description, signature_metaphors, main_grammar_topics, pronunciation_focus, vocabulary_theme, l1_l2_issues, prerequisites, learning_objectives, notes_for_teacher_or_ai";

/** Status values: approved lessons (visible in dashboard, hierarchy, etc.) */
const APPROVED_STATUSES = ["draft", "published"];

/**
 * Minimal fields for dropdowns/lists
 */
const LESSON_FIELDS_MINIMAL = "id, slug, label, title";

/**
 * Type for lesson data returned from the database
 */
/** P7 telemetry metadata shape (canonical_node_key, run_id, lessonSku, etc.) */
export type LessonMetadata = {
  canonical_node_key?: string | string[] | null;
  run_id?: string | null;
  lessonSku?: string | null;
  [key: string]: unknown;
};

export type LessonData = {
  id: string;
  module_id: string | null;
  label: string | null;
  title: string | null;
  slug: string | null;
  order_index: number | null;
  status: string | null;
  metadata: LessonMetadata | null;
  estimated_minutes: number | null;
  required_score: number | null;
  content: string | null;
  short_summary_admin: string | null;
  short_summary_student: string | null;
  course_organization_group: string | null;
  slide_contents: string | null;
  grouping_strategy_summary: string | null;
  activity_types: string | null;
  activity_description: string | null;
  signature_metaphors: string | null;
  main_grammar_topics: string | null;
  pronunciation_focus: string | null;
  vocabulary_theme: string | null;
  l1_l2_issues: string | null;
  prerequisites: string | null;
  learning_objectives: string | null;
  notes_for_teacher_or_ai: string | null;
};

/**
 * Minimal lesson data for dropdowns/lists
 */
export type LessonDataMinimal = {
  id: string;
  slug: string | null;
  label: string | null;
  title: string | null;
};

/**
 * Type for creating a new lesson
 */
export type CreateLessonInput = {
  module_id: string;
  slug: string;
  label: string;
  status?: "draft" | "waiting_review" | "published";
  metadata?: LessonMetadata | null;
  title?: string | null;
  order_index?: number | null;
  estimated_minutes?: number | null;
  required_score?: number | null;
  content?: string | null;
  short_summary_admin?: string | null;
  short_summary_student?: string | null;
  course_organization_group?: string | null;
  slide_contents?: string | null;
  grouping_strategy_summary?: string | null;
  activity_types?: string | null;
  activity_description?: string | null;
  signature_metaphors?: string | null;
  main_grammar_topics?: string | null;
  pronunciation_focus?: string | null;
  vocabulary_theme?: string | null;
  l1_l2_issues?: string | null;
  prerequisites?: string | null;
  learning_objectives?: string | null;
  notes_for_teacher_or_ai?: string | null;
};

/**
 * Type for updating a lesson
 */
export type UpdateLessonInput = Partial<CreateLessonInput>;

/**
 * Result type for data operations
 */
export type LessonResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Pagination metadata
 */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

/**
 * Paginated result type
 */
export type PaginatedResult<T> = {
  data: T | null;
  error: string | null;
  meta: PaginationMeta | null;
};

/**
 * Load all approved lessons (minimal fields, for dropdowns)
 * Excludes queued (waiting_review) lessons - only draft and published.
 * Ordered by created_at DESC, limited to 50
 * Returns domain models (camelCase)
 */
export async function loadLessons(): Promise<LessonResult<LessonMinimal[]>> {
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_FIELDS_MINIMAL)
    .in("status", APPROVED_STATUSES)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { data: null, error: error.message };
  }

  const rows = (data ?? []) as LessonDataMinimal[];
  return { data: rows.map(toLessonMinimal), error: null };
}

/**
 * Load all lesson order_index values for a module (including queued).
 * Used by ingestion to compute next order_index.
 */
export async function loadLessonOrderIndexesByModule(
  moduleId: string
): Promise<LessonResult<number[]>> {
  const { data, error } = await supabase
    .from("lessons")
    .select("order_index")
    .eq("module_id", moduleId);

  if (error) {
    return { data: null, error: error.message };
  }

  const indexes = (data ?? [])
    .map((r: { order_index: number | null }) => r.order_index ?? 0)
    .filter((n: number) => typeof n === "number");
  return { data: indexes, error: null };
}

/**
 * Load approved lessons by module ID
 * Excludes queued (waiting_review) lessons.
 */
export async function loadLessonsByModule(moduleId: string): Promise<LessonResult<LessonData[]>> {
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_FIELDS_FULL)
    .eq("module_id", moduleId)
    .in("status", APPROVED_STATUSES)
    .order("order_index", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as LessonData[], error: null };
}

/**
 * Tier 2.1 Step 2a: Load all lessons with pagination
 * Returns lesson data with pagination metadata
 * 
 * @param page - 1-indexed page number (default: 1)
 * @param pageSize - Number of items per page (default: 50)
 */
export async function loadLessonsPaginated(
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResult<LessonData[]>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count (approved only)
  const { count, error: countError } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .in("status", APPROVED_STATUSES);

  if (countError) {
    return { data: null, error: countError.message, meta: null };
  }

  const total = count ?? 0;

  // Get paginated data (approved only, ordered by module_id, then order_index)
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_FIELDS_FULL)
    .in("status", APPROVED_STATUSES)
    .order("module_id", { ascending: true })
    .order("order_index", { ascending: true })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message, meta: null };
  }

  const rows = (data ?? []) as LessonData[];
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: rows,
    error: null,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Load all approved lessons (minimal fields) for browse/listing
 * Excludes queued lessons. No pagination - for modules browser etc.
 */
export async function loadApprovedLessonsForBrowse(): Promise<
  LessonResult<Array<{ id: string; module_id: string | null; slug: string | null; title: string | null; order_index: number | null }>>
> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, module_id, slug, title, order_index")
    .in("status", APPROVED_STATUSES)
    .order("order_index", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as Array<{ id: string; module_id: string | null; slug: string | null; title: string | null; order_index: number | null }>, error: null };
}

/**
 * Load lessons with status = waiting_review (queued for inspection)
 * Used by the Queued page. These lessons are NOT shown in dashboard, hierarchy, etc.
 */
export async function loadQueuedLessons(): Promise<LessonResult<LessonData[]>> {
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_FIELDS_FULL)
    .eq("status", "waiting_review")
    .order("order_index", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as LessonData[], error: null };
}

/**
 * Update a lesson's status (e.g. approve: waiting_review → draft)
 */
export async function updateLessonStatus(
  id: string,
  status: "draft" | "waiting_review" | "published"
): Promise<LessonResult<Lesson>> {
  const { data, error } = await supabase
    .from("lessons")
    .update({ status })
    .eq("id", id)
    .select(LESSON_FIELDS_FULL)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No lesson found with id "${id}"` };
  }

  return { data: toLesson(data as LessonData), error: null };
}

/**
 * Load a single lesson by ID
 * Returns domain model (camelCase)
 */
export async function loadLessonById(id: string): Promise<LessonResult<Lesson>> {
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_FIELDS_FULL)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No lesson found with id "${id}"` };
  }

  return { data: toLesson(data as LessonData), error: null };
}

/**
 * Create a new lesson
 */
export async function createLesson(input: CreateLessonInput): Promise<LessonResult<LessonDataMinimal>> {
  // Normalize activity_types: convert array to string if needed
  let activityTypesValue: string | null = null;
  if (input.activity_types) {
    if (Array.isArray(input.activity_types)) {
      activityTypesValue = input.activity_types.length > 0 ? input.activity_types.join(",") : null;
    } else {
      activityTypesValue = input.activity_types.trim() || null;
    }
  }

  // Validate input using schema (status defaults to 'draft' for manual creation)
  const validationResult = lessonInputSchema.safeParse({
    module_id: input.module_id,
    slug: input.slug,
    label: input.label.trim(),
    status: input.status ?? "draft",
    metadata: input.metadata ?? null,
    title: input.title?.trim() || null,
    order_index: input.order_index ?? null,
    estimated_minutes: input.estimated_minutes ?? null,
    required_score: input.required_score ?? null,
    content: input.content?.trim() || null,
    short_summary_admin: input.short_summary_admin?.trim() || null,
    short_summary_student: input.short_summary_student?.trim() || null,
    course_organization_group: input.course_organization_group?.trim() || null,
    slide_contents: input.slide_contents?.trim() || null,
    grouping_strategy_summary: input.grouping_strategy_summary?.trim() || null,
    activity_types: activityTypesValue,
    activity_description: input.activity_description?.trim() || null,
    signature_metaphors: input.signature_metaphors?.trim() || null,
    main_grammar_topics: input.main_grammar_topics?.trim() || null,
    pronunciation_focus: input.pronunciation_focus?.trim() || null,
    vocabulary_theme: input.vocabulary_theme?.trim() || null,
    l1_l2_issues: input.l1_l2_issues?.trim() || null,
    prerequisites: input.prerequisites?.trim() || null,
    learning_objectives: input.learning_objectives?.trim() || null,
    notes_for_teacher_or_ai: input.notes_for_teacher_or_ai?.trim() || null,
  });

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { data: null, error: `Validation error: ${firstError.message}` };
  }

  const { data, error } = await supabase
    .from("lessons")
    .insert(validationResult.data)
    .select("id, module_id, slug, label, title, order_index")
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "Insert succeeded but no data returned" };
  }

  return { data: { id: data.id, slug: data.slug, label: data.label, title: data.title } as LessonDataMinimal, error: null };
}

/**
 * Update an existing lesson
 * Returns domain model (camelCase)
 */
export async function updateLesson(
  id: string,
  input: UpdateLessonInput
): Promise<LessonResult<Lesson>> {
  const updateData: Record<string, unknown> = {};

  if (input.module_id !== undefined) updateData.module_id = input.module_id;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;
  if (input.label !== undefined) {
    // Handle null, empty string, or non-empty string
    updateData.label = input.label ? (input.label.trim() || null) : null;
  }
  if (input.title !== undefined) updateData.title = input.title?.trim() || null;
  if (input.order_index !== undefined) updateData.order_index = input.order_index;
  if (input.estimated_minutes !== undefined) updateData.estimated_minutes = input.estimated_minutes;
  if (input.required_score !== undefined) updateData.required_score = input.required_score;
  if (input.content !== undefined) updateData.content = input.content?.trim() || null;
  if (input.short_summary_admin !== undefined) updateData.short_summary_admin = input.short_summary_admin?.trim() || null;
  if (input.short_summary_student !== undefined) updateData.short_summary_student = input.short_summary_student?.trim() || null;
  if (input.course_organization_group !== undefined) updateData.course_organization_group = input.course_organization_group?.trim() || null;
  if (input.slide_contents !== undefined) updateData.slide_contents = input.slide_contents?.trim() || null;
  if (input.grouping_strategy_summary !== undefined) updateData.grouping_strategy_summary = input.grouping_strategy_summary?.trim() || null;
  
  // Normalize activity_types: convert string to array if needed (database column is TEXT[])
  if (input.activity_types !== undefined) {
    if (Array.isArray(input.activity_types)) {
      updateData.activity_types = input.activity_types.length > 0 ? input.activity_types : null;
    } else if (typeof input.activity_types === "string" && input.activity_types.trim()) {
      // Convert comma-separated string to array for database (column type is TEXT[])
      const parts = input.activity_types.split(",").map(s => s.trim()).filter(s => s.length > 0);
      updateData.activity_types = parts.length > 0 ? parts : null;
    } else {
      updateData.activity_types = null;
    }
  }
  
  if (input.activity_description !== undefined) updateData.activity_description = input.activity_description?.trim() || null;
  if (input.signature_metaphors !== undefined) updateData.signature_metaphors = input.signature_metaphors?.trim() || null;
  if (input.main_grammar_topics !== undefined) updateData.main_grammar_topics = input.main_grammar_topics?.trim() || null;
  if (input.pronunciation_focus !== undefined) updateData.pronunciation_focus = input.pronunciation_focus?.trim() || null;
  if (input.vocabulary_theme !== undefined) updateData.vocabulary_theme = input.vocabulary_theme?.trim() || null;
  if (input.l1_l2_issues !== undefined) updateData.l1_l2_issues = input.l1_l2_issues?.trim() || null;
  if (input.prerequisites !== undefined) updateData.prerequisites = input.prerequisites?.trim() || null;
  if (input.learning_objectives !== undefined) updateData.learning_objectives = input.learning_objectives?.trim() || null;
  if (input.notes_for_teacher_or_ai !== undefined) updateData.notes_for_teacher_or_ai = input.notes_for_teacher_or_ai?.trim() || null;

  // Validate update data using schema (partial validation)
  // Note: lessonInputSchema allows activity_types as string or array
  const validationResult = lessonInputSchema.partial().safeParse(updateData);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { data: null, error: `Validation error: ${firstError.message}` };
  }

  // Ensure activity_types is an array (not string) before sending to Supabase (column type is TEXT[])
  const finalUpdateData = { ...validationResult.data };
  if (finalUpdateData.activity_types !== undefined && typeof finalUpdateData.activity_types === "string") {
    // Convert string to array for database
    const parts = finalUpdateData.activity_types.split(",").map(s => s.trim()).filter(s => s.length > 0);
    finalUpdateData.activity_types = parts.length > 0 ? parts : null;
  }

  // Debug logging
  logger.debug("[lesson save payload]", {
    id,
    payloadKeys: Object.keys(finalUpdateData),
    hasLabel: "label" in finalUpdateData,
    labelValue: finalUpdateData.label,
    activityTypesType: typeof finalUpdateData.activity_types,
    activityTypesValue: finalUpdateData.activity_types,
    fullPayload: finalUpdateData,
  });

  const { data, error } = await supabase
    .from("lessons")
    .update(finalUpdateData)
    .eq("id", id)
    .select("id, label, title, " + LESSON_FIELDS_FULL)
    .single();

  // Debug logging
  const dataTyped = error ? null : (data as unknown as LessonData | null);
  logger.debug("[lesson save result]", {
    error: error ? { message: error.message, details: error.details, hint: error.hint, code: error.code } : null,
    data: dataTyped ? { id: dataTyped.id, label: dataTyped.label, title: dataTyped.title } : null,
    fullData: dataTyped,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No lesson found with id "${id}"` };
  }

  return { data: toLesson(data as unknown as LessonData), error: null };
}

/**
 * Delete a lesson by ID with cascading deletes
 * Deletes slides, groups, and the lesson itself atomically
 * 
 * Tier 2.2 Step 4: Uses transaction wrapper for atomic deletion
 * 
 * Note: DB has FK constraint user_lessons.lesson_id → lessons.id ON DELETE CASCADE,
 * so user_lessons records are automatically deleted by the database when the lesson is deleted.
 * No manual deletion of user_lessons is needed.
 */
export async function deleteLesson(id: string): Promise<LessonResult<void>> {
  const result = await executeTransaction<void>(
    "delete_lesson_transaction",
    { lesson_id: id }
  );

  return transactionResultToStandard(result);
}

