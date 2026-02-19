/**
 * LaDy → CMS mapper (P8 — CMS Ingestion)
 *
 * Maps LaDy lesson output to CMS Lesson, Groups, Slides.
 * Only title-slide and text-slide. No activities.
 */

import type { LadyLessonOutput, LadySlide } from "../types/ladyLesson";
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
 * Derive label/title from lessonId or first target
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
 * Build slide template for a LaDy slide (title or text only)
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
    return {
      order_index: 1,
      type: SLIDE_TYPES.TEXT,
      props_json: {
        body: slide.body?.trim() || "(No content)",
        label: label,
        allowSkip: false,
        allowRetry: false,
        isInteractive: false,
      },
      is_activity: false,
      score_type: "none",
    };
  }

  throw new Error(`Unsupported slide type: ${slide.type}. Only "title" and "text" are allowed.`);
}

/**
 * Map LaDy lesson output to CMS create inputs.
 * Only title-slide and text-slide. No activities.
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

  const lesson: CreateLessonInput = {
    module_id: moduleId,
    slug,
    label,
    title: label,
    status: "waiting_review",
    order_index: orderIndex,
    metadata: {
      canonical_node_key: Array.isArray(targetNodeIds)
        ? targetNodeIds
        : targetNodeIds,
      run_id: ladyLesson.compilerMeta?.runId ?? null,
      lessonSku: lessonId,
    },
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
