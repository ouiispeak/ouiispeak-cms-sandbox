import { supabase } from "../supabase";
import type { Slide, SlideMinimal } from "../domain/slide";
import { toSlide, toSlideMinimal } from "../mappers/slideMapper";
import { logger } from "../utils/logger";
import { executeTransaction, transactionResultToStandard } from "../utils/transactions";
import { validateSlidePropsRuntime } from "../utils/validateSlideProps";

/**
 * Standard fields to select from slides table
 * Centralized to avoid repetition across pages
 */
const SLIDE_FIELDS_FULL = "id, lesson_id, group_id, order_index, type, props_json, aid_hook, code, meta_json, is_activity, score_type, passing_score_value, max_score_value, pass_required_for_next";

/**
 * Minimal fields for dropdowns/lists
 */
const SLIDE_FIELDS_MINIMAL = "id, lesson_id, group_id, order_index, type";

/**
 * Type for slide data returned from the database
 */
export type SlideData = {
  id: string;
  lesson_id: string | null;
  group_id: string | null;
  order_index: number | null;
  type: string;
  props_json: unknown;
  aid_hook: string | null;
  code: string | null;
  meta_json: unknown | null;
  is_activity: boolean | null;
  score_type: string | null;
  passing_score_value: number | null;
  max_score_value: number | null;
  pass_required_for_next: boolean | null;
};

/**
 * Minimal slide data for dropdowns/lists
 */
export type SlideDataMinimal = {
  id: string;
  lesson_id: string | null;
  group_id: string | null;
  order_index: number | null;
  type: string;
};

/**
 * Type for creating a new slide
 * All NOT NULL fields are required: lesson_id, group_id, order_index, type
 */
export type CreateSlideInput = {
  lesson_id: string; // NOT NULL - required
  group_id: string; // NOT NULL - required (every slide belongs to a group)
  order_index: number; // NOT NULL - required
  type: string; // NOT NULL - required
  props_json?: unknown; // NOT NULL - defaults to {} if not provided
  aid_hook?: string | null;
  code?: string | null;
  meta_json?: unknown | null; // NOT NULL - defaults to {} if not provided
  is_activity?: boolean | null; // NOT NULL - defaults computed from type if not provided
  score_type?: string | null; // NOT NULL - defaults to 'none' if not provided
  passing_score_value?: number | null;
  max_score_value?: number | null;
  pass_required_for_next?: boolean | null; // NOT NULL - defaults to false if not provided
};

/**
 * Type for updating a slide
 */
export type UpdateSlideInput = Partial<CreateSlideInput>;

/**
 * Result type for data operations
 */
export type SlideResult<T> = {
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
 * Load slides by lesson ID
 * Returns domain models (camelCase)
 */
export async function loadSlidesByLesson(lessonId: string): Promise<SlideResult<SlideMinimal[]>> {
  const { data, error } = await supabase
    .from("slides")
    .select(SLIDE_FIELDS_MINIMAL)
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const rows = (data ?? []) as SlideDataMinimal[];
  return { data: rows.map(toSlideMinimal), error: null };
}

/**
 * Tier 2.1 Step 2c: Load all slides with pagination (includes props_json for dashboard)
 * Returns slide data with pagination metadata
 * 
 * @param page - 1-indexed page number (default: 1)
 * @param pageSize - Number of items per page (default: 50)
 */
export async function loadSlidesPaginated(
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResult<Array<SlideDataMinimal & { props_json: unknown }>>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count, error: countError } = await supabase
    .from("slides")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return { data: null, error: countError.message, meta: null };
  }

  const total = count ?? 0;

  // Get paginated data (ordered by lesson_id, then order_index for dashboard consistency)
  // Include props_json for dashboard display
  const { data, error } = await supabase
    .from("slides")
    .select("id, lesson_id, group_id, order_index, type, props_json")
    .order("lesson_id", { ascending: true })
    .order("order_index", { ascending: true })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message, meta: null };
  }

  const rows = (data ?? []) as Array<SlideDataMinimal & { props_json: unknown }>;
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
 * Load slides by group ID
 * Returns domain models (camelCase)
 */
export async function loadSlidesByGroup(groupId: string): Promise<SlideResult<SlideMinimal[]>> {
  const { data, error } = await supabase
    .from("slides")
    .select(SLIDE_FIELDS_MINIMAL)
    .eq("group_id", groupId)
    .order("order_index", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const rows = (data ?? []) as SlideDataMinimal[];
  return { data: rows.map(toSlideMinimal), error: null };
}

/**
 * Load a single slide by ID
 * Returns domain model (camelCase)
 */
/**
 * Load a single slide by ID
 * Returns domain model (camelCase)
 * 
 * Tier 3.2 Step 2: Validates props_json at runtime
 */
export async function loadSlideById(id: string): Promise<SlideResult<Slide>> {
  const { data, error } = await supabase
    .from("slides")
    .select(SLIDE_FIELDS_FULL)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No slide found with id "${id}"` };
  }

  const slideData = data as SlideData;

  // Tier 3.2 Step 2: Validate props_json at runtime
  const validation = validateSlidePropsRuntime(slideData.type, slideData.props_json, id);
  if (!validation.valid) {
    // Log validation errors but don't fail the load (non-breaking)
    logger.warn("[Slide Props Validation]", {
      slideId: id,
      slideType: slideData.type,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  }

  return { data: toSlide(slideData), error: null };
}

/**
 * Helper function to compute default is_activity based on slide type
 * Most slide types are activities by default, except title/text slides
 * Exported for testing
 */
export function defaultIsActivity(slideType: string, providedValue: boolean | null | undefined): boolean {
  if (providedValue !== null && providedValue !== undefined) {
    return providedValue;
  }
  // Default: most slides are activities, except title and text slides
  // Activity types include: ai-speak-repeat, ai-speak-student-repeat, speech-match, etc.
const nonActivityTypes = ["default", "title-slide", "title", "lesson-end", "text-slide", "text", "need-to-be-created"];
  return !nonActivityTypes.includes(slideType.toLowerCase().trim());
}

/**
 * Create a new slide
 * Returns domain model (camelCase)
 * 
 * Ensures all NOT NULL fields have safe defaults:
 * - lesson_id: required (must be provided)
 * - group_id: required (must be provided)
 * - order_index: required (must be provided)
 * - type: required (must be provided)
 * - props_json: defaults to {} if not provided
 * - meta_json: defaults to {} if not provided
 * - is_activity: computed from slide type if not provided
 * - score_type: defaults to 'none' if not provided
 * - pass_required_for_next: defaults to false if not provided
 */
export async function createSlide(input: CreateSlideInput): Promise<SlideResult<SlideMinimal>> {
  // Validate required NOT NULL fields
  if (!input.lesson_id) {
    return { data: null, error: "lesson_id is required (NOT NULL)" };
  }
  if (!input.group_id) {
    return { data: null, error: "group_id is required (NOT NULL). Every slide must belong to a group." };
  }
  if (input.order_index === undefined || input.order_index === null) {
    return { data: null, error: "order_index is required (NOT NULL)" };
  }
  if (!input.type) {
    return { data: null, error: "type is required (NOT NULL)" };
  }

  // Compute defaults for NOT NULL fields
  const isActivityValue = defaultIsActivity(input.type, input.is_activity);
  
  // Build insert payload explicitly, ensuring NOT NULL fields are never null
  const insertPayload = {
    lesson_id: input.lesson_id,
    group_id: input.group_id, // Required - never null
    order_index: input.order_index, // Required - never null
    type: input.type, // Required - never null
    props_json: input.props_json ?? {}, // NOT NULL - default to {}
    aid_hook: input.aid_hook ?? null,
    code: input.code ?? null,
    meta_json: input.meta_json ?? {}, // NOT NULL - default to {}
    is_activity: isActivityValue, // NOT NULL - always a boolean, never null
    score_type: input.score_type ?? 'none', // NOT NULL - default to 'none'
    passing_score_value: input.passing_score_value ?? null,
    max_score_value: input.max_score_value ?? null,
    pass_required_for_next: input.pass_required_for_next ?? false, // NOT NULL - default to false
  };

  const { data, error } = await supabase
    .from("slides")
    .insert(insertPayload)
    .select(SLIDE_FIELDS_MINIMAL)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "Insert succeeded but no data returned" };
  }

  return { data: toSlideMinimal(data as SlideDataMinimal), error: null };
}

/**
 * Update an existing slide
 * Returns domain model (camelCase)
 */
export async function updateSlide(
  id: string,
  input: UpdateSlideInput
): Promise<SlideResult<Slide>> {
  const updateData: Record<string, unknown> = {};

  if (input.lesson_id !== undefined) updateData.lesson_id = input.lesson_id;
  if (input.group_id !== undefined) updateData.group_id = input.group_id;
  if (input.order_index !== undefined) updateData.order_index = input.order_index;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.props_json !== undefined) updateData.props_json = input.props_json;
  if (input.aid_hook !== undefined) updateData.aid_hook = input.aid_hook;
  if (input.code !== undefined) updateData.code = input.code;
  if (input.meta_json !== undefined) updateData.meta_json = input.meta_json;
  if (input.is_activity !== undefined) updateData.is_activity = input.is_activity;
  if (input.score_type !== undefined) updateData.score_type = input.score_type;
  if (input.passing_score_value !== undefined) updateData.passing_score_value = input.passing_score_value;
  if (input.max_score_value !== undefined) updateData.max_score_value = input.max_score_value;
  if (input.pass_required_for_next !== undefined) updateData.pass_required_for_next = input.pass_required_for_next;

  // Debug logging
  logger.debug("[updateSlide] Updating slide:", id);
  logger.debug("[updateSlide] updateData:", JSON.stringify(updateData, null, 2));

  const { data, error } = await supabase
    .from("slides")
    .update(updateData)
    .eq("id", id)
    .select(SLIDE_FIELDS_FULL)
    .maybeSingle();

  // Debug logging
  if (error) {
    logger.error("[updateSlide] Database error:", error);
  } else {
    logger.debug("[updateSlide] Database response:", data);
    logger.debug("[updateSlide] Response props_json:", data?.props_json);
  }

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No slide found with id "${id}"` };
  }

  return { data: toSlide(data as SlideData), error: null };
}

/**
 * Delete a slide by ID
 * 
 * Tier 2.2 Step 3: Uses transaction wrapper for atomic deletion
 */
export async function deleteSlide(id: string): Promise<SlideResult<void>> {
  const result = await executeTransaction<void>(
    "delete_slide_transaction",
    { slide_id: id }
  );

  return transactionResultToStandard(result);
}
