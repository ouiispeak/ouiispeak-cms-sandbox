/**
 * LaDy lesson output schema (P8 — CMS Ingestion)
 *
 * Shape for CMS ingestion. Supports title, text, ai-speak-repeat, and speech-match slides.
 */

/** S1 canonical slide types + need-to-be-created. Legacy: title, text (alias for title-slide, text-slide). */
export type LadySlideType =
  | "title-slide"
  | "title"
  | "lesson-end"
  | "text-slide"
  | "text"
  | "ai-speak-repeat"
  | "ai-speak-student-repeat"
  | "student-record-accuracy"
  | "student-speak-only"
  | "spell-and-pronounce"
  | "speech-match"
  | "speech-choice-verify"
  | "avatar-command-round"
  | "need-to-be-created";

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

/** Choice element for speech-choice-verify (label, referenceText, speech) */
export interface LadySpeechChoiceElement {
  label: string;
  referenceText: string;
  speech: { mode: "tts" | "file"; text?: string; fileUrl?: string; lang?: string };
}

/** Action for avatar-command-round */
export interface LadyAvatarCommandAction {
  label: string;
  commands: string[];
  avatarAction: string;
}

export type LadySlide = {
  type: LadySlideType;
  /** title-slide: label for the slide */
  label?: string | null;
  /** title-slide: main title shown to learner */
  title?: string | null;
  /** text-slide: body content */
  body?: string | null;
  /** text-slide: pedagogical subtype (MOTIVATION, INSTRUCTION, EXPLANATION, EXAMPLE, FEEDBACK_SUMMARY) */
  text_subtype?: string | null;
  /** ai-speak-repeat: phrases organized as lines (rows of {label, speech}) */
  lines?: LadyLineCell[][] | null;
  /** speech-match, ai-speak-student-repeat, student-speak-only: elements */
  elements?: (LadyChoiceElement | LadySpeechChoiceElement | { samplePrompt?: string; referenceText?: string; speech?: unknown })[] | null;
  /** ai-speak-student-repeat, student-record-accuracy, student-speak-only: sample prompt */
  samplePrompt?: string | null;
  /** ai-speak-student-repeat, student-record-accuracy: reference text */
  referenceText?: string | null;
  /** spell-and-pronounce: imageUrl, word */
  imageUrl?: string | null;
  word?: string | null;
  /** avatar-command-round: actions */
  actions?: LadyAvatarCommandAction[] | null;
  /** lesson-end: message, actions */
  message?: string | null;
  lessonEndActions?: unknown;
  /** speech-match: optional note below subtitle */
  note?: string | null;
  /** subtitle for ai-speak-repeat, speech-match */
  subtitle?: string | null;
  /** need-to-be-created: LLM-proposed activity type (e.g. SENTENCE_TEMPLATE_CHOICE) */
  proposedType?: string | null;
  /** need-to-be-created: human-readable content from proposed activity */
  proposedContent?: string | null;
  /** need-to-be-created: stimulus (what learner sees/hears) */
  stimulus?: string | null;
  /** need-to-be-created: action (what learner does) */
  action?: string | null;
  /** need-to-be-created: feedback (response to action) */
  feedback?: string | null;
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

/** Group Laws V1: when LaDy produces groups (future) */
export type LadyGroupType =
  | "ORIENTATION"
  | "INPUT"
  | "SCAFFOLDED_PRACTICE"
  | "TARGET_PERFORMANCE"
  | "INTEGRATION";

export type LadyExtractabilityTier = "HIGH" | "MEDIUM" | "LOW";

export type LadyPurposeRelationshipTag =
  | "PREPARE_FOR_PURPOSE"
  | "SUPPORT_FIRST_CONTROL"
  | "MEASURE_FIRST_CONTROL"
  | "STABILIZE_TRANSFER";

export type LadyGroup = {
  group_type: LadyGroupType;
  group_summary: string;
  group_code?: string | null;
  target_node_keys?: string[] | null;
  extractability_tier?: LadyExtractabilityTier | null;
  purpose_relationship_tag?: LadyPurposeRelationshipTag | null;
  prerequisites?: string[] | null;
  slides: LadySlide[];
};

export type LadyLessonMetadata = {
  title?: string | null;
  system_purpose?: string | null;
  learner_outcome?: string | null;
  short_summary_admin?: string | null;
  short_summary_student?: string | null;
  course_organization_group?: string | null;
  slide_contents?: string | null;
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
  /** When present, use groups (with nested slides). Otherwise fall back to 1-slide-per-group from slides. */
  groups?: LadyGroup[] | null;
  slides: LadySlide[];
  compilerMeta?: LadyCompilerMeta | null;
  lessonMetadata?: LadyLessonMetadata | null;
  [key: string]: unknown;
};

const VALID_SLIDE_TYPES = [
  "title-slide", "title", "lesson-end", "text-slide", "text",
  "ai-speak-repeat", "ai-speak-student-repeat", "student-record-accuracy", "student-speak-only",
  "spell-and-pronounce", "speech-match", "speech-choice-verify", "avatar-command-round",
  "need-to-be-created",
] as const;

/**
 * Minimal validation: lessonId, targetNodeIds, slides[] required.
 * Each slide must have type in VALID_SLIDE_TYPES.
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
    if ((type === "ai-speak-repeat") && !Array.isArray(s.lines)) return false;
    if (type === "speech-match" && !Array.isArray(s.elements)) return false;
    if (type === "need-to-be-created") {
      if (typeof s.proposedType !== "string" || typeof s.proposedContent !== "string") return false;
      if (s.rawActivity !== null && (typeof s.rawActivity !== "object" || Array.isArray(s.rawActivity))) return false;
    }
  }

  return true;
}
