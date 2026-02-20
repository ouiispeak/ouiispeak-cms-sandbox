/**
 * LaDy → CMS mapper (P8 — CMS Ingestion)
 *
 * Maps LaDy lesson output to CMS Lesson, Groups, Slides.
 * Supports title, text, ai-speak-repeat, and speech-match slides.
 */

import type {
  LadyLessonOutput,
  LadySlide,
  LadyLineCell,
  LadyChoiceElement,
} from "../types/ladyLesson";
import type { CreateLessonInput } from "../data/lessons";
import type { CreateGroupInput } from "../data/groups";
import type { CreateSlideInput } from "../data/slides";
import { SLIDE_TYPES } from "../constants/slideConstants";

export type LadySlideMapping = {
  group: Omit<CreateGroupInput, "lesson_id"> & { lesson_id?: string };
  slideTemplates: Omit<CreateSlideInput, "lesson_id" | "group_id">[];
};

export type LadyToCmsResult = {
  lesson: CreateLessonInput;
  slideMappings: LadySlideMapping[];
};

/**
 * Derive slug from lessonId and moduleSlug
 */
function deriveSlug(lessonId: string, moduleSlug: string): string {
  const safeId = lessonId.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 50);
  return `${moduleSlug}/lady-${safeId}`;
}

/**
 * Derive label from lessonId or first target (fallback when no lessonMetadata.title)
 */
function deriveLabel(lessonId: string, targetNodeIds: string | string[]): string {
  const firstTarget =
    Array.isArray(targetNodeIds) ? targetNodeIds[0] : String(targetNodeIds ?? "");
  if (firstTarget) {
    return firstTarget.length > 40 ? firstTarget.slice(0, 37) + "…" : firstTarget;
  }
  return lessonId.length > 40 ? lessonId.slice(0, 37) + "…" : lessonId;
}

/**
 * Map lessonMetadata fields to CreateLessonInput.
 * - slide_contents: Leave empty (future: slide-type structure like "Title; 3 text, 1 practice; outro")
 * - signature_metaphors: Leave empty (human-only; must be tagged to grammar topic, feeds back to LaDy)
 * - main_grammar_topics: Split "X and Y" into "X, Y" (comma-separated)
 */
function mapLessonMetadata(meta: import("../types/ladyLesson").LadyLessonMetadata | null | undefined): Partial<CreateLessonInput> {
  if (!meta || typeof meta !== "object") return {};
  const out: Partial<CreateLessonInput> = {};
  const skipFields = new Set(["slide_contents", "signature_metaphors"]);
  const fields: (keyof typeof meta)[] = [
    "title", "short_summary_admin", "short_summary_student",
    "course_organization_group", "slide_contents", "grouping_strategy_summary",
    "activity_types", "activity_description", "signature_metaphors",
    "main_grammar_topics", "pronunciation_focus", "vocabulary_theme",
    "l1_l2_issues", "prerequisites", "learning_objectives", "notes_for_teacher_or_ai"
  ];
  for (const k of fields) {
    if (skipFields.has(k)) continue;
    const v = meta[k];
    if (v != null && typeof v === "string" && v.trim()) {
      let val = v.trim();
      if (k === "main_grammar_topics") {
        val = val.replace(/\s+and\s+/gi, ", ").replace(/,(\S)/g, ", $1");
      }
      (out as Record<string, string | null>)[k] = val;
    }
  }
  return out;
}

/**
 * Sanitize a speech config. Ensures mode is tts|file; for tts requires text; for file requires fileUrl.
 * Strips unexpected keys. Returns null if invalid.
 */
function sanitizeSpeech(
  raw: unknown
): { mode: "tts" | "file"; text?: string; fileUrl?: string; lang?: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const mode = o.mode as string;
  if (mode !== "tts" && mode !== "file") return null;
  if (mode === "tts" && typeof o.text !== "string") return null;
  if (mode === "file" && typeof o.fileUrl !== "string") return null;
  const out: Record<string, unknown> = { mode };
  if (typeof o.text === "string") out.text = o.text;
  if (typeof o.fileUrl === "string") out.fileUrl = o.fileUrl;
  if (typeof o.lang === "string") out.lang = o.lang;
  return out as { mode: "tts" | "file"; text?: string; fileUrl?: string; lang?: string };
}

/**
 * Sanitize lines array for ai-speak-repeat. Returns sanitized array or empty array if invalid.
 */
function sanitizeLines(raw: unknown): LadyLineCell[][] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) =>
      row
        .map((cell): LadyLineCell | null => {
          if (!cell || typeof cell !== "object") return null;
          const c = cell as Record<string, unknown>;
          if (typeof c.label !== "string") return null;
          const speech = sanitizeSpeech(c.speech);
          if (!speech) return null;
          return { label: c.label, speech };
        })
        .filter((x): x is LadyLineCell => x !== null)
    )
    .filter((row) => row.length > 0);
}

/**
 * Sanitize elements array for speech-match. Returns sanitized array or empty array if invalid.
 */
function sanitizeElements(raw: unknown): LadyChoiceElement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((cell): LadyChoiceElement | null => {
      if (!cell || typeof cell !== "object") return null;
      const c = cell as Record<string, unknown>;
      if (typeof c.label !== "string") return null;
      const speech = sanitizeSpeech(c.speech);
      if (!speech) return null;
      return { label: c.label, speech };
    })
    .filter((x): x is LadyChoiceElement => x !== null);
}

/**
 * Build slide template for a LaDy slide (title, text, ai-speak-repeat, speech-match)
 */
function buildSlideTemplate(slide: LadySlide): Omit<CreateSlideInput, "lesson_id" | "group_id"> {
  const label = slide.label?.trim() || slide.type;

  if (slide.type === "title") {
    return {
      order_index: 1,
      type: SLIDE_TYPES.TITLE,
      props_json: {
        label: label,
        title: slide.title?.trim() || label,
        buttons: [{ label: "Start", action: "next" }],
        allowSkip: false,
        allowRetry: false,
        isInteractive: false,
      },
      is_activity: false,
      score_type: "none",
    };
  }

  if (slide.type === "text") {
    const props: Record<string, unknown> = {
      body: slide.body?.trim() || "(No content)",
      label: label,
      allowSkip: false,
      allowRetry: false,
      isInteractive: false,
    };
    // RAG-ready optional slots (MVP: pass-through; future: Reference RAG fills)
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.TEXT,
      props_json: props,
      is_activity: false,
      score_type: "none",
    };
  }

  if (slide.type === "ai-speak-repeat") {
    const lines = sanitizeLines(slide.lines);
    if (lines.length === 0) {
      throw new Error(
        `ai-speak-repeat slide "${label}" has no valid lines. Each row must contain {label, speech} with speech.mode "tts" and speech.text.`
      );
    }
    const props: Record<string, unknown> = {
      label,
      lines,
      subtitle: slide.subtitle?.trim() || undefined,
      allowSkip: false,
      allowRetry: false,
      isInteractive: true,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.AI_SPEAK_REPEAT,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "speech-match") {
    const elements = sanitizeElements(slide.elements);
    if (elements.length === 0) {
      throw new Error(
        `speech-match slide "${label}" has no valid elements. Each element must have {label, speech} with speech.mode "tts" and speech.text.`
      );
    }
    const props: Record<string, unknown> = {
      label,
      elements,
      subtitle: slide.subtitle?.trim() || undefined,
      note: slide.note?.trim() || undefined,
      allowSkip: false,
      allowRetry: false,
      isInteractive: true,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.SPEECH_MATCH,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "need-to-be-created") {
    const props: Record<string, unknown> = {
      label,
      proposedType: slide.proposedType?.trim() || "unknown",
      proposedContent: slide.proposedContent?.trim() || "(No content)",
      rawActivity: slide.rawActivity && typeof slide.rawActivity === "object" && !Array.isArray(slide.rawActivity)
        ? slide.rawActivity
        : {},
      allowSkip: true,
      allowRetry: false,
      isInteractive: false,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.NEED_TO_BE_CREATED,
      props_json: props,
      is_activity: false,
      score_type: "none",
    };
  }

  throw new Error(
    `Unsupported slide type: ${slide.type}. Allowed: title, text, ai-speak-repeat, speech-match, need-to-be-created.`
  );
}

/**
 * Map LaDy lesson output to CMS create inputs.
 * Supports title, text, ai-speak-repeat, and speech-match slides.
 */
export function mapLadyToCms(
  ladyLesson: LadyLessonOutput,
  moduleId: string,
  moduleSlug: string,
  orderIndex: number = 1
): LadyToCmsResult {
  const lessonId = ladyLesson.lessonId;
  const targetNodeIds = ladyLesson.targetNodeIds;

  const label = deriveLabel(lessonId, targetNodeIds);
  const slug = deriveSlug(lessonId, moduleSlug);

  const metadata: Record<string, unknown> = {
    canonical_node_key: Array.isArray(targetNodeIds) ? targetNodeIds : targetNodeIds,
    run_id: ladyLesson.compilerMeta?.runId ?? null,
    lessonSku: lessonId,
  };
  if (ladyLesson.compilerMeta?.targetSliceRef != null) {
    metadata.targetSliceRef = ladyLesson.compilerMeta.targetSliceRef;
  }
  const metaFields = mapLessonMetadata(ladyLesson.lessonMetadata);
  const lesson: CreateLessonInput = {
    module_id: moduleId,
    slug,
    label: (metaFields.title as string) || label,
    title: (metaFields.title as string) || label,
    status: "waiting_review",
    order_index: orderIndex,
    metadata,
    ...metaFields,
  };

  const slideMappings: LadySlideMapping[] = ladyLesson.slides.map((slide, index) => ({
    group: {
      label: slide.label?.trim() || slide.type,
      title: slide.type === "title" ? (slide.title?.trim() || slide.label || slide.type) : (slide.label?.trim() || slide.type),
      order_index: index + 1,
    },
    slideTemplates: [buildSlideTemplate(slide)],
  }));

  return {
    lesson,
    slideMappings,
  };
}
