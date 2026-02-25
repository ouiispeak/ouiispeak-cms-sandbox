import { supabase } from "../supabase";
import { groupInputSchema } from "../schemas/groupSchema";
import type { Group, GroupMinimal } from "../domain/group";
import { toGroup, toGroupMinimal } from "../mappers/groupMapper";
import { executeTransaction, transactionResultToStandard } from "../utils/transactions";

/**
 * Standard fields to select from lesson_groups table
 * Centralized to avoid repetition across pages
 */
const GROUP_FIELDS_FULL = "id, lesson_id, label, title, order_index, group_code, short_summary, group_type, group_summary, extractability_tier, purpose_relationship_tag, target_node_keys, group_goal, prerequisites, is_required_to_pass, passing_score_type, passing_score_value, max_score_value, extra_practice_notes, l1_l2, media_used_ids, group_slides_plan";

/**
 * Minimal fields for dropdowns/lists
 */
const GROUP_FIELDS_MINIMAL = "id, lesson_id, order_index, label, title";

/**
 * Type for group data returned from the database
 */
export type GroupData = {
  id: string;
  lesson_id: string | null;
  label: string | null;
  title: string | null;
  order_index: number | null;
  group_code: string | null;
  short_summary: string | null;
  group_type: string | null;
  group_summary: string | null;
  extractability_tier: string | null;
  purpose_relationship_tag: string | null;
  target_node_keys: string[] | null;
  group_goal: string | null;
  prerequisites: string | null;
  is_required_to_pass: boolean | null;
  passing_score_type: string | null;
  passing_score_value: number | null;
  max_score_value: number | null;
  extra_practice_notes: string | null;
  l1_l2: string | null;
  media_used_ids: string | null;
  group_slides_plan: unknown | null;
};

/**
 * Minimal group data for dropdowns/lists
 */
export type GroupDataMinimal = {
  id: string;
  lesson_id: string | null;
  order_index: number | null;
  label: string | null;
  title: string | null;
};

/**
 * Type for creating a new group
 */
export type CreateGroupInput = {
  lesson_id: string;
  label: string;
  title?: string | null;
  order_index?: number | null;
  group_code?: string | null;
  short_summary?: string | null;
  group_type?: string | null;
  group_summary?: string | null;
  extractability_tier?: string | null;
  purpose_relationship_tag?: string | null;
  target_node_keys?: string[] | null;
  group_goal?: string | null;
  prerequisites?: string | null;
  is_required_to_pass?: boolean | null;
  passing_score_type?: string | null;
  passing_score_value?: number | null;
  max_score_value?: number | null;
  extra_practice_notes?: string | null;
  l1_l2?: string | null;
  media_used_ids?: string | null;
  group_slides_plan?: unknown | null;
};

/**
 * Type for updating a group
 */
export type UpdateGroupInput = Partial<CreateGroupInput>;

/**
 * Result type for data operations
 */
export type GroupResult<T> = {
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
 * Load groups by lesson ID, ordered by order_index
 * Returns domain models (camelCase)
 */
export async function loadGroupsByLesson(lessonId: string): Promise<GroupResult<GroupMinimal[]>> {
  const { data, error } = await supabase
    .from("lesson_groups")
    .select(GROUP_FIELDS_MINIMAL)
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const rows = (data ?? []) as GroupDataMinimal[];
  return { data: rows.map(toGroupMinimal), error: null };
}

/**
 * Tier 2.1 Step 2b: Load all groups with pagination
 * Returns group data with pagination metadata
 * 
 * @param page - 1-indexed page number (default: 1)
 * @param pageSize - Number of items per page (default: 50)
 */
export async function loadGroupsPaginated(
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResult<GroupDataMinimal[]>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count, error: countError } = await supabase
    .from("lesson_groups")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return { data: null, error: countError.message, meta: null };
  }

  const total = count ?? 0;

  // Get paginated data (ordered by lesson_id, then order_index for dashboard consistency)
  const { data, error } = await supabase
    .from("lesson_groups")
    .select(GROUP_FIELDS_MINIMAL)
    .order("lesson_id", { ascending: true })
    .order("order_index", { ascending: true })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message, meta: null };
  }

  const rows = (data ?? []) as GroupDataMinimal[];
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
 * Load a single group by ID
 * Returns domain model (camelCase)
 */
export async function loadGroupById(id: string): Promise<GroupResult<Group>> {
  const { data, error } = await supabase
    .from("lesson_groups")
    .select(GROUP_FIELDS_FULL)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No group found with id "${id}"` };
  }

  return { data: toGroup(data as GroupData), error: null };
}

/**
 * Create a new group
 * Returns domain model (camelCase)
 * 
 * Defaults for required NOT NULL fields:
 * - is_required_to_pass: false (if not provided)
 * @param client - Optional Supabase client (e.g. service role) to bypass RLS
 */
export async function createGroup(
  input: CreateGroupInput,
  client?: import("@supabase/supabase-js").SupabaseClient
): Promise<GroupResult<GroupMinimal>> {
  // Validate input using schema
  // Apply defaults for required NOT NULL fields
  const validationResult = groupInputSchema.safeParse({
    lesson_id: input.lesson_id,
    label: input.label.trim(),
    title: input.title?.trim() || null,
    order_index: input.order_index ?? null,
    group_code: input.group_code?.trim() || null,
    short_summary: input.short_summary?.trim() || null,
    group_type: input.group_type?.trim() || null,
    group_summary: input.group_summary?.trim() || null,
    extractability_tier: input.extractability_tier?.trim() || null,
    purpose_relationship_tag: input.purpose_relationship_tag?.trim() || null,
    target_node_keys: input.target_node_keys ?? null,
    group_goal: input.group_goal?.trim() || null,
    prerequisites: input.prerequisites?.trim() || null,
    is_required_to_pass: input.is_required_to_pass ?? false, // Default to false for required NOT NULL field
    passing_score_type: input.passing_score_type?.trim() || null,
    passing_score_value: input.passing_score_value ?? null,
    max_score_value: input.max_score_value ?? null,
    extra_practice_notes: input.extra_practice_notes?.trim() || null,
    l1_l2: input.l1_l2?.trim() || null,
    media_used_ids: input.media_used_ids?.trim() || null,
    group_slides_plan: input.group_slides_plan ?? null,
  });

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { data: null, error: `Validation error: ${firstError.message}` };
  }

  const db = client ?? supabase;
  const { data, error } = await db
    .from("lesson_groups")
    .insert(validationResult.data)
    .select("id, lesson_id, order_index, label, title")
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "Insert succeeded but no data returned" };
  }

  return { data: toGroupMinimal(data as GroupDataMinimal), error: null };
}

/**
 * Update an existing group
 * Returns domain model (camelCase)
 */
export async function updateGroup(
  id: string,
  input: UpdateGroupInput
): Promise<GroupResult<Group>> {
  const updateData: Record<string, unknown> = {};

  if (input.lesson_id !== undefined) updateData.lesson_id = input.lesson_id;
  if (input.label !== undefined) updateData.label = input.label.trim() || null;
  if (input.title !== undefined) updateData.title = input.title?.trim() || null;
  if (input.order_index !== undefined) updateData.order_index = input.order_index;
  if (input.group_code !== undefined) updateData.group_code = input.group_code?.trim() || null;
  if (input.short_summary !== undefined) updateData.short_summary = input.short_summary?.trim() || null;
  if (input.group_type !== undefined) updateData.group_type = input.group_type?.trim() || null;
  if (input.group_summary !== undefined) updateData.group_summary = input.group_summary?.trim() || null;
  if (input.extractability_tier !== undefined) updateData.extractability_tier = input.extractability_tier?.trim() || null;
  if (input.purpose_relationship_tag !== undefined) updateData.purpose_relationship_tag = input.purpose_relationship_tag?.trim() || null;
  if (input.target_node_keys !== undefined) updateData.target_node_keys = input.target_node_keys;
  if (input.group_goal !== undefined) updateData.group_goal = input.group_goal?.trim() || null;
  if (input.prerequisites !== undefined) updateData.prerequisites = input.prerequisites?.trim() || null;
  if (input.is_required_to_pass !== undefined) updateData.is_required_to_pass = input.is_required_to_pass;
  if (input.passing_score_type !== undefined) updateData.passing_score_type = input.passing_score_type?.trim() || null;
  if (input.passing_score_value !== undefined) updateData.passing_score_value = input.passing_score_value;
  if (input.max_score_value !== undefined) updateData.max_score_value = input.max_score_value;
  if (input.extra_practice_notes !== undefined) updateData.extra_practice_notes = input.extra_practice_notes?.trim() || null;
  if (input.l1_l2 !== undefined) updateData.l1_l2 = input.l1_l2?.trim() || null;
  if (input.media_used_ids !== undefined) updateData.media_used_ids = input.media_used_ids?.trim() || null;
  if (input.group_slides_plan !== undefined) updateData.group_slides_plan = input.group_slides_plan;

  // Validate update data using schema (partial validation)
  const validationResult = groupInputSchema.partial().safeParse(updateData);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { data: null, error: `Validation error: ${firstError.message}` };
  }

  const { data, error } = await supabase
    .from("lesson_groups")
    .update(validationResult.data)
    .eq("id", id)
    .select(GROUP_FIELDS_FULL)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No group found with id "${id}"` };
  }

  return { data: toGroup(data as GroupData), error: null };
}

/**
 * Delete a group by ID
 * 
 * Tier 2.2 Step 4: Uses transaction wrapper for atomic deletion
 * Deletes the group and all its slides atomically.
 */
export async function deleteGroup(id: string): Promise<GroupResult<void>> {
  const result = await executeTransaction<void>(
    "delete_group_transaction",
    { group_id: id }
  );

  return transactionResultToStandard(result);
}

