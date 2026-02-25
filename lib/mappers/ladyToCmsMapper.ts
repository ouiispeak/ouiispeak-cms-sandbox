/**
 * LaDy → CMS mapper (P8 — CMS Ingestion)
 *
 * Maps LaDy lesson output to CMS Lesson, Groups, Slides.
 * Supports title, text, ai-speak-repeat, and speech-match slides.
 */

import type {
  LadyLessonOutput,
  LadySlide,
  LadyGroup,
  LadyLineCell,
  LadyChoiceElement,
  LadySpeechChoiceElement,
  LadyAvatarCommandAction,
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
  const learnerOutcome = meta.learner_outcome?.trim();
  const fields: (keyof typeof meta)[] = [
    "title", "system_purpose", "learner_outcome", "short_summary_admin", "short_summary_student",
    "course_organization_group", "slide_contents",
    "activity_types", "activity_description", "signature_metaphors",
    "main_grammar_topics", "pronunciation_focus", "vocabulary_theme",
    "l1_l2_issues", "prerequisites", "learning_objectives", "notes_for_teacher_or_ai"
  ];
  for (const k of fields) {
    if (skipFields.has(k)) continue;
    if (k === "learning_objectives" && learnerOutcome) continue;
    const v = meta[k];
    if (v != null && typeof v === "string" && v.trim()) {
      let val = v.trim();
      if (k === "main_grammar_topics") {
        val = val.replace(/\s+and\s+/gi, ", ").replace(/,(\S)/g, ", $1");
      }
      if (k === "learner_outcome") {
        (out as Record<string, string | null>).learning_objectives = val;
      } else if (k !== "system_purpose") {
        (out as Record<string, string | null>)[k] = val;
      }
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
function sanitizeSpeechMatchElements(raw: unknown): LadyChoiceElement[] {
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
 * Sanitize elements for speech-choice-verify (label, referenceText, speech).
 */
function sanitizeSpeechChoiceElements(raw: unknown): LadySpeechChoiceElement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((cell): LadySpeechChoiceElement | null => {
      if (!cell || typeof cell !== "object") return null;
      const c = cell as Record<string, unknown>;
      if (typeof c.label !== "string" || typeof c.referenceText !== "string") return null;
      const speech = sanitizeSpeech(c.speech);
      if (!speech) return null;
      return { label: c.label, referenceText: c.referenceText, speech };
    })
    .filter((x): x is LadySpeechChoiceElement => x !== null);
}

/**
 * Sanitize elements for ai-speak-student-repeat / student-speak-only.
 */
function sanitizeStudentRepeatElements(raw: unknown): Array<{ samplePrompt: string; referenceText?: string; speech?: { mode: "tts" | "file"; text?: string; fileUrl?: string; lang?: string } }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((cell) => {
      if (!cell || typeof cell !== "object") return null;
      const c = cell as Record<string, unknown>;
      if (typeof c.samplePrompt !== "string") return null;
      const speech = c.speech ? sanitizeSpeech(c.speech) : undefined;
      return {
        samplePrompt: c.samplePrompt,
        referenceText: typeof c.referenceText === "string" ? c.referenceText : undefined,
        speech: speech ?? undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/**
 * Sanitize actions for avatar-command-round.
 */
function sanitizeAvatarActions(raw: unknown): LadyAvatarCommandAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((cell) => {
      if (!cell || typeof cell !== "object") return null;
      const c = cell as Record<string, unknown>;
      if (typeof c.label !== "string" || !Array.isArray(c.commands) || typeof c.avatarAction !== "string") return null;
      const commands = c.commands.filter((x): x is string => typeof x === "string");
      if (commands.length === 0) return null;
      return { label: c.label, commands, avatarAction: c.avatarAction };
    })
    .filter((x): x is LadyAvatarCommandAction => x !== null);
}

/**
 * Build slide template for a LaDy slide (all S1 types + need-to-be-created)
 */
function buildSlideTemplate(slide: LadySlide): Omit<CreateSlideInput, "lesson_id" | "group_id"> {
  const label = slide.label?.trim() || slide.type;

  if (slide.type === "title" || slide.type === "title-slide") {
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

  if (slide.type === "text" || slide.type === "text-slide") {
    const validSubtypes = ["MOTIVATION", "INSTRUCTION", "EXPLANATION", "EXAMPLE", "FEEDBACK_SUMMARY"];
    const textSubtype =
      slide.text_subtype && validSubtypes.includes(String(slide.text_subtype))
        ? String(slide.text_subtype)
        : "INSTRUCTION";
    const props: Record<string, unknown> = {
      body: slide.body?.trim() || "(No content)",
      text_subtype: textSubtype,
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

  if (slide.type === "lesson-end") {
    const props: Record<string, unknown> = {
      label,
      title: slide.title?.trim() || "Lesson Complete",
      message: slide.message?.trim() || "",
      actions: Array.isArray(slide.lessonEndActions) ? slide.lessonEndActions : [{ type: "restart", label: "Recommencer" }, { type: "progress", label: "Voir ma progression" }],
      allowSkip: false,
      allowRetry: false,
      isInteractive: false,
    };
    return {
      order_index: 1,
      type: SLIDE_TYPES.LESSON_END,
      props_json: props,
      is_activity: false,
      score_type: "none",
    };
  }

  if (slide.type === "ai-speak-student-repeat") {
    const elements = sanitizeStudentRepeatElements(slide.elements);
    const hasElements = elements.length > 0;
    const hasLegacy = slide.samplePrompt?.trim();
    if (!hasElements && !hasLegacy) {
      throw new Error(
        `ai-speak-student-repeat slide "${label}" has no valid elements or samplePrompt.`
      );
    }
    const props: Record<string, unknown> = {
      label,
      title: slide.title?.trim() || "",
      instructions: slide.subtitle?.trim() || "",
      samplePrompt: slide.samplePrompt?.trim() || undefined,
      referenceText: slide.referenceText?.trim() || undefined,
      elements: hasElements ? elements : undefined,
      allowSkip: false,
      allowRetry: false,
      isInteractive: true,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.AI_SPEAK_STUDENT_REPEAT,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "student-record-accuracy") {
    const props: Record<string, unknown> = {
      label,
      title: slide.title?.trim() || "",
      instructions: slide.subtitle?.trim() || "",
      samplePrompt: slide.samplePrompt?.trim() || undefined,
      referenceText: slide.referenceText?.trim() || undefined,
      allowSkip: false,
      allowRetry: false,
      isInteractive: true,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.STUDENT_RECORD_ACCURACY,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "student-speak-only") {
    const elements = sanitizeStudentRepeatElements(slide.elements);
    const hasElements = elements.length > 0;
    const hasLegacy = slide.samplePrompt?.trim();
    if (!hasElements && !hasLegacy) {
      throw new Error(
        `student-speak-only slide "${label}" has no valid elements or samplePrompt.`
      );
    }
    const props: Record<string, unknown> = {
      label,
      title: slide.title?.trim() || "",
      instructions: slide.subtitle?.trim() || "",
      samplePrompt: slide.samplePrompt?.trim() || undefined,
      referenceText: slide.referenceText?.trim() || undefined,
      elements: hasElements ? elements : undefined,
      allowSkip: false,
      allowRetry: false,
      isInteractive: true,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.STUDENT_SPEAK_ONLY,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "spell-and-pronounce") {
    const imageUrl = slide.imageUrl?.trim();
    const word = slide.word?.trim();
    if (!imageUrl || !word) {
      throw new Error(
        `spell-and-pronounce slide "${label}" requires imageUrl and word.`
      );
    }
    const props: Record<string, unknown> = {
      label,
      title: slide.title?.trim() || "",
      instructions: slide.subtitle?.trim() || "",
      imageUrl,
      word,
      allowSkip: false,
      allowRetry: false,
      isInteractive: true,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.SPELL_AND_PRONOUNCE,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "speech-choice-verify") {
    const elements = sanitizeSpeechChoiceElements(slide.elements);
    if (elements.length === 0) {
      throw new Error(
        `speech-choice-verify slide "${label}" has no valid elements. Each element must have {label, referenceText, speech}.`
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
      type: SLIDE_TYPES.SPEECH_CHOICE_VERIFY,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "avatar-command-round") {
    const actions = sanitizeAvatarActions(slide.actions);
    if (actions.length === 0) {
      throw new Error(
        `avatar-command-round slide "${label}" has no valid actions. Each action must have {label, commands, avatarAction}.`
      );
    }
    const props: Record<string, unknown> = {
      label,
      title: slide.title?.trim() || "",
      instructions: slide.subtitle?.trim() || "",
      instructionsFr: (slide as Record<string, unknown>).instructionsFr as string | undefined || "",
      actions,
      allowSkip: false,
      allowRetry: false,
      isInteractive: true,
    };
    if (slide.l1_l2_friction_warning) props.l1_l2_friction_warning = slide.l1_l2_friction_warning;
    if (slide.cultural_context) props.cultural_context = slide.cultural_context;
    if (slide.simplification_hint) props.simplification_hint = slide.simplification_hint;
    return {
      order_index: 1,
      type: SLIDE_TYPES.AVATAR_COMMAND_ROUND,
      props_json: props,
      is_activity: true,
      score_type: "none",
    };
  }

  if (slide.type === "speech-match") {
    const elements = sanitizeSpeechMatchElements(slide.elements);
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
      stimulus: slide.stimulus?.trim() || undefined,
      action: slide.action?.trim() || undefined,
      feedback: slide.feedback?.trim() || undefined,
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
    `Unsupported slide type: ${slide.type}. Allowed: title-slide, title, lesson-end, text-slide, text, ai-speak-repeat, ai-speak-student-repeat, student-record-accuracy, student-speak-only, spell-and-pronounce, speech-match, speech-choice-verify, avatar-command-round, need-to-be-created.`
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
  const sysPurpose = ladyLesson.lessonMetadata?.system_purpose?.trim();
  if (sysPurpose) {
    metadata.system_purpose = sysPurpose;
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

  let slideMappings: LadySlideMapping[];

  if (Array.isArray(ladyLesson.groups) && ladyLesson.groups.length > 0) {
    slideMappings = ladyLesson.groups.map((grp: LadyGroup, index: number) => {
      const firstSlide = grp.slides?.[0];
      const label = firstSlide?.label?.trim() || firstSlide?.type || `group-${index + 1}`;
      const title =
        (firstSlide?.type === "title" || firstSlide?.type === "title-slide")
          ? (firstSlide.title?.trim() || firstSlide.label || grp.group_summary)
          : (grp.group_summary || label);
      const groupInput = {
        label,
        title,
        order_index: index + 1,
        group_type: grp.group_type,
        group_summary: grp.group_summary,
        group_code: grp.group_code ?? null,
        target_node_keys: grp.target_node_keys ?? null,
        extractability_tier: grp.extractability_tier ?? null,
        purpose_relationship_tag: grp.purpose_relationship_tag ?? null,
      };
      const slideTemplates = (grp.slides ?? []).map((s) => buildSlideTemplate(s));
      return { group: groupInput, slideTemplates };
    });
  } else {
    slideMappings = ladyLesson.slides.map((slide, index) => ({
      group: {
        label: slide.label?.trim() || slide.type,
        title:
          (slide.type === "title" || slide.type === "title-slide")
            ? (slide.title?.trim() || slide.label || slide.type)
            : (slide.label?.trim() || slide.type),
        order_index: index + 1,
      },
      slideTemplates: [buildSlideTemplate(slide)],
    }));
  }

  return {
    lesson,
    slideMappings,
  };
}
