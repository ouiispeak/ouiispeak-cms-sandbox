/**
 * LaDy lesson output schema (P8 — CMS Ingestion)
 *
 * Shape for CMS ingestion. Supports title, text, ai-speak-repeat, and speech-match slides.
 */

export type LadySlideType = "title" | "text" | "ai-speak-repeat" | "speech-match" | "need-to-be-created";

/** Line cell for ai-speak-repeat (label + speech config) */
export interface LadyLineCell {
  label: string;
  speech: { mode: "tts" | "file"; text?: string; fileUrl?: string; lang?: string };
}

/** Choice element for speech-match */
export interface LadyChoiceElement {
  label: string;
  speech: { mode: "tts" | "file"; text?: string; fileUrl?: string; lang?: string };
}

export type LadySlide = {
  type: LadySlideType;
  /** title-slide: label for the slide */
  label?: string | null;
  /** title-slide: main title shown to learner */
  title?: string | null;
  /** text-slide: body content */
  body?: string | null;
  /** ai-speak-repeat: phrases organized as lines (rows of {label, speech}) */
  lines?: LadyLineCell[][] | null;
  /** speech-match: choice elements with label and speech */
  elements?: LadyChoiceElement[] | null;
  /** speech-match: optional note below subtitle */
  note?: string | null;
  /** subtitle for ai-speak-repeat, speech-match */
  subtitle?: string | null;
  /** need-to-be-created: LLM-proposed activity type (e.g. SENTENCE_TEMPLATE_CHOICE) */
  proposedType?: string | null;
  /** need-to-be-created: human-readable content from proposed activity */
  proposedContent?: string | null;
  /** need-to-be-created: full raw activity object for manual implementation */
  rawActivity?: Record<string, unknown> | null;
  /** RAG-ready (MVP: optional; future: Reference RAG fills these) */
  l1_l2_friction_warning?: string | null;
  cultural_context?: string | null;
  simplification_hint?: string | null;
  [key: string]: unknown;
};

export type LadyCompilerMeta = {
  runId?: string | null;
  /** Slice SKU for L6 telemetry / autonomous expansion */
  targetSliceRef?: string | null;
  [key: string]: unknown;
};

export type LadyLessonMetadata = {
  title?: string | null;
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

export type LadyLessonOutput = {
  lessonId: string;
  targetNodeIds: string | string[];
  slides: LadySlide[];
  compilerMeta?: LadyCompilerMeta | null;
  lessonMetadata?: LadyLessonMetadata | null;
  [key: string]: unknown;
};

const VALID_SLIDE_TYPES = ["title", "text", "ai-speak-repeat", "speech-match", "need-to-be-created"] as const;

/**
 * Minimal validation: lessonId, targetNodeIds, slides[] required.
 * Each slide must have type "title", "text", "ai-speak-repeat", "speech-match", or "need-to-be-created".
 * ai-speak-repeat requires lines; speech-match requires elements; need-to-be-created requires proposedType, proposedContent, rawActivity.
 */
export function isValidLadyLesson(data: unknown): data is LadyLessonOutput {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (!obj.lessonId || typeof obj.lessonId !== "string") return false;
  if (obj.targetNodeIds === undefined) return false;
  if (!Array.isArray(obj.slides)) return false;

  for (const slide of obj.slides) {
    if (!slide || typeof slide !== "object") return false;
    const s = slide as Record<string, unknown>;
    const type = String(s.type ?? "");
    if (!(VALID_SLIDE_TYPES as readonly string[]).includes(type)) return false;
    if (type === "ai-speak-repeat" && !Array.isArray(s.lines)) return false;
    if (type === "speech-match" && !Array.isArray(s.elements)) return false;
    if (type === "need-to-be-created") {
      if (typeof s.proposedType !== "string" || typeof s.proposedContent !== "string") return false;
      if (s.rawActivity !== null && (typeof s.rawActivity !== "object" || Array.isArray(s.rawActivity))) return false;
    }
  }

  return true;
}
