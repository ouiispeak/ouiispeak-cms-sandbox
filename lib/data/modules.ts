import { supabase } from "../supabase";
import { moduleInputSchema } from "../schemas/moduleSchema";
import type { Module } from "../domain/module";
import { toModule } from "../mappers/moduleMapper";
import { executeTransaction, transactionResultToStandard } from "../utils/transactions";

/**
 * Standard fields to select from modules table
 * Centralized to avoid repetition across pages
 */
const MODULE_FIELDS = "id, slug, label, title, level, order_index, status, visibility, description, module_goal, core_topics, author_notes";

/**
 * Type for module data returned from the database
 */
export type ModuleData = {
  id: string;
  slug: string;
  label: string | null;
  title: string | null;
  level: string | null;
  order_index: number | null;
  status: string | null;
  visibility: string | null;
  description: string | null;
  module_goal: string | null;
  core_topics: string | null;
  author_notes: string | null;
};

/**
 * Type for creating a new module
 */
export type CreateModuleInput = {
  label: string;
  title?: string | null;
  slug: string;
  level?: string | null;
  order_index?: number | null;
  description?: string | null;
  status?: string | null;
  visibility?: string | null;
  module_goal?: string | null;
  core_topics?: string | null;
  author_notes?: string | null;
};

/**
 * Type for updating a module
 */
export type UpdateModuleInput = Partial<CreateModuleInput>;

/**
 * Result type for data operations
 */
export type ModuleResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Load all modules, ordered by order_index
 * Returns domain models (camelCase)
 */
export async function loadModules(): Promise<ModuleResult<Module[]>> {
  const { data, error } = await supabase
    .from("modules")
    .select(MODULE_FIELDS)
    .order("order_index", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const rows = (data ?? []) as ModuleData[];
  return { data: rows.map(toModule), error: null };
}

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
 * Tier 2.1 Step 1: Load modules with pagination
 * Returns domain models (camelCase) with pagination metadata
 * 
 * @param page - 1-indexed page number (default: 1)
 * @param pageSize - Number of items per page (default: 50)
 */
export async function loadModulesPaginated(
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResult<Module[]>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count, error: countError } = await supabase
    .from("modules")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return { data: null, error: countError.message, meta: null };
  }

  const total = count ?? 0;

  // Get paginated data
  const { data, error } = await supabase
    .from("modules")
    .select(MODULE_FIELDS)
    .order("order_index", { ascending: true })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message, meta: null };
  }

  const rows = (data ?? []) as ModuleData[];
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: rows.map(toModule),
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
 * Load a single module by ID
 * Returns domain model (camelCase)
 */
export async function loadModuleById(id: string): Promise<ModuleResult<Module>> {
  const { data, error } = await supabase
    .from("modules")
    .select(MODULE_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No module found with id "${id}"` };
  }

  return { data: toModule(data as ModuleData), error: null };
}

/**
 * Load a single module by slug
 * Used by LaDy ingestion to resolve target module (e.g. "incoming")
 */
export async function loadModuleBySlug(slug: string): Promise<ModuleResult<Module>> {
  const { data, error } = await supabase
    .from("modules")
    .select(MODULE_FIELDS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No module found with slug "${slug}"` };
  }

  return { data: toModule(data as ModuleData), error: null };
}

/**
 * Create a new module
 * Returns domain model (camelCase)
 */
export async function createModule(input: CreateModuleInput): Promise<ModuleResult<Module>> {
  // Validate input using schema
  // Apply defaults for required NOT NULL fields: status and visibility
  // DB requires title NOT NULL; use label as fallback when title is empty
  const titleValue = input.title?.trim() || input.label.trim() || null;

  const validationResult = moduleInputSchema.safeParse({
    label: input.label.trim(),
    title: titleValue,
    slug: input.slug.trim(),
    level: input.level?.trim() || null,
    order_index: input.order_index ?? null,
    description: input.description?.trim() || null,
    status: input.status || "draft", // Default to "draft" for required NOT NULL field
    visibility: input.visibility || "private", // Default to "private" for required NOT NULL field
    module_goal: input.module_goal?.trim() || null,
    core_topics: input.core_topics?.trim() || null,
    author_notes: input.author_notes?.trim() || null,
  });

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { data: null, error: `Validation error: ${firstError.message}` };
  }

  const insertData = { ...validationResult.data };
  if (!insertData.title) {
    insertData.title = insertData.label;
  }

  const { data, error } = await supabase
    .from("modules")
    .insert(insertData)
    .select(MODULE_FIELDS)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "Insert succeeded but no data returned" };
  }

  return { data: toModule(data as ModuleData), error: null };
}

/**
 * Update an existing module
 * Returns domain model (camelCase)
 */
export async function updateModule(
  id: string,
  input: UpdateModuleInput
): Promise<ModuleResult<Module>> {
  // Build update data object
  const updateData: Record<string, unknown> = {};

  if (input.label !== undefined) updateData.label = input.label.trim() || null;
  if (input.title !== undefined) updateData.title = input.title?.trim() || null;
  if (input.slug !== undefined) updateData.slug = input.slug.trim();
  if (input.level !== undefined) updateData.level = input.level?.trim() || null;
  if (input.order_index !== undefined) updateData.order_index = input.order_index;
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.visibility !== undefined) updateData.visibility = input.visibility;
  if (input.module_goal !== undefined) updateData.module_goal = input.module_goal?.trim() || null;
  if (input.core_topics !== undefined) updateData.core_topics = input.core_topics?.trim() || null;
  if (input.author_notes !== undefined) updateData.author_notes = input.author_notes?.trim() || null;

  // Validate update data using schema (partial validation)
  const validationResult = moduleInputSchema.partial().safeParse(updateData);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { data: null, error: `Validation error: ${firstError.message}` };
  }

  const { data, error } = await supabase
    .from("modules")
    .update(validationResult.data)
    .eq("id", id)
    .select(MODULE_FIELDS)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: `No module found with id "${id}"` };
  }

  return { data: toModule(data as ModuleData), error: null };
}

/**
 * Delete a module by ID with cascading deletes
 * Deletes all lessons, groups, and slides associated with the module atomically
 * 
 * Tier 2.2 Step 4: Uses transaction wrapper for atomic deletion
 * 
 * Note: DB has FK constraint user_lessons.lesson_id → lessons.id ON DELETE CASCADE,
 * so user_lessons records are automatically deleted by the database when lessons are deleted.
 * No manual deletion of user_lessons is needed.
 */
export async function deleteModule(id: string): Promise<ModuleResult<void>> {
  const result = await executeTransaction<void>(
    "delete_module_transaction",
    { module_id: id }
  );

  return transactionResultToStandard(result);
}

