/**
 * Pedagogical appendices (Layer 5 Reference RAG)
 *
 * Metadata-rich library of anecdotes, metaphors, cultural context. Tagged by
 * target_key (canonical_node_key or slice key) for L6 linkage. CMS = state
 * manager; LaDy exports active entries and injects into the generator prompt.
 */

import { supabase } from "../supabase";

export type AssetType = "anecdote" | "metaphor" | "cultural_context" | "teaching_tip" | "l1_friction";

export type PedagogicalAppendixRow = {
  id: string;
  target_type: "node" | "slice" | "edge";
  target_key: string;
  content: string;
  asset_type: AssetType | null;
  content_type: string | null;
  is_active: boolean | null;
  target_l1: string | null;
  added_at: string | null;
  created_at: string | null;
};

export type PedagogicalAppendixEntry = {
  targetType: "node" | "slice" | "edge";
  targetKey: string;
  content: string;
  assetType?: AssetType;
  contentType?: string;
  targetL1?: string;
  addedAt?: string;
};

export type PedagogicalAppendicesExport = {
  version: string;
  entries: PedagogicalAppendixEntry[];
};

export type LoadPedagogicalAppendicesOpts = {
  /** Only active entries (default: true) */
  activeOnly?: boolean;
  /** Filter by L1 (e.g. "fr"); omit for all L1s */
  targetL1?: string;
};

/**
 * Load pedagogical appendices for export to LaDy.
 * Filters by is_active and optional target_l1.
 */
export async function loadPedagogicalAppendices(
  opts: LoadPedagogicalAppendicesOpts = {}
): Promise<PedagogicalAppendicesExport> {
  const { activeOnly = true, targetL1 } = opts;

  let query = supabase
    .from("pedagogical_appendices")
    .select("target_type, target_key, content, asset_type, content_type, is_active, target_l1, added_at")
    .order("added_at", { ascending: true, nullsFirst: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load pedagogical appendices: ${error.message}`);
  }

  let rows = (data ?? []) as PedagogicalAppendixRow[];
  if (targetL1 != null && targetL1.trim()) {
    const l1 = targetL1.trim();
    rows = rows.filter((r) => r.target_l1 == null || r.target_l1 === l1);
  }

  const entries: PedagogicalAppendixEntry[] = rows.map((row) => ({
    targetType: row.target_type,
    targetKey: row.target_key,
    content: row.content || "",
    ...(row.asset_type && { assetType: row.asset_type }),
    ...(row.content_type && { contentType: row.content_type }),
    ...(row.target_l1 && { targetL1: row.target_l1 }),
    ...(row.added_at && { addedAt: row.added_at }),
  }));

  return {
    version: "0.1.0",
    entries,
  };
}

/** Parse L1 from slice key (e.g. "s00046_...l1:fr_l2:en-US..." → "fr") */
function parseL1FromSliceKey(key: string): string | null {
  const m = key.match(/l1:(\w+)/);
  return m ? m[1] : null;
}

export type InsertPedagogicalAppendixInput = {
  targetType: "node" | "slice";
  targetKey: string;
  content: string;
  assetType: AssetType;
  targetL1?: string | null;
};

/**
 * Insert a pedagogical appendix (e.g. when human adds anecdote while editing a lesson).
 * Used for CMS → RAG feedback: save lesson with signature_metaphors or notes_for_teacher_or_ai
 * → automatically push to pedagogical_appendices for future LaDy generations.
 */
export async function insertPedagogicalAppendix(
  input: InsertPedagogicalAppendixInput
): Promise<{ id: string; error: string | null }> {
  const { targetType, targetKey, content, assetType, targetL1 } = input;
  if (!content?.trim()) {
    return { id: "", error: "Content is required" };
  }

  const { data, error } = await supabase
    .from("pedagogical_appendices")
    .insert({
      target_type: targetType,
      target_key: targetKey,
      content: content.trim(),
      asset_type: assetType,
      is_active: true,
      target_l1: targetL1?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return { id: "", error: error.message };
  }
  return { id: data?.id ?? "", error: null };
}

export type PushToRagFromLessonMetadataOpts = {
  metadata: { canonical_node_key?: unknown; targetSliceRef?: string } | null;
  signatureMetaphors: string | null;
  notesForTeacherOrAI: string | null;
};

/**
 * When lesson is saved with signature_metaphors or notes_for_teacher_or_ai,
 * push to pedagogical_appendices using lesson metadata for target linkage.
 * Returns count of entries added.
 */
export async function pushToRagFromLessonMetadata(
  opts: PushToRagFromLessonMetadataOpts
): Promise<{ added: number; errors: string[] }> {
  const { metadata, signatureMetaphors, notesForTeacherOrAI } = opts;
  const errors: string[] = [];
  let added = 0;

  const targetSliceRef = metadata?.targetSliceRef;
  const canonicalNodeKey = metadata?.canonical_node_key;

  const targetKey = targetSliceRef
    ? targetSliceRef
    : Array.isArray(canonicalNodeKey)
      ? canonicalNodeKey[0]
      : typeof canonicalNodeKey === "string"
        ? canonicalNodeKey
        : null;

  const targetType = targetSliceRef ? "slice" : "node";
  const targetL1 = targetSliceRef ? parseL1FromSliceKey(targetSliceRef) : null;

  if (!targetKey?.trim()) {
    return { added: 0, errors: [] };
  }

  if (signatureMetaphors?.trim()) {
    const result = await insertPedagogicalAppendix({
      targetType,
      targetKey: targetKey.trim(),
      content: signatureMetaphors.trim(),
      assetType: "metaphor",
      targetL1,
    });
    if (result.error) {
      errors.push(`signature_metaphors → RAG: ${result.error}`);
    } else if (result.id) {
      added++;
    }
  }

  if (notesForTeacherOrAI?.trim()) {
    const result = await insertPedagogicalAppendix({
      targetType,
      targetKey: targetKey.trim(),
      content: notesForTeacherOrAI.trim(),
      assetType: "teaching_tip",
      targetL1,
    });
    if (result.error) {
      errors.push(`notes_for_teacher_or_ai → RAG: ${result.error}`);
    } else if (result.id) {
      added++;
    }
  }

  return { added, errors };
}
