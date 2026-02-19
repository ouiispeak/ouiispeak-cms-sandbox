/**
 * LaDy lesson output schema (P8 — CMS Ingestion)
 *
 * Minimal shape for CMS ingestion. LaDy is independent; only title and text slides.
 * No activities (EXPLAIN, PRACTICE, etc.).
 */

export type LadySlideType = "title" | "text";

export type LadySlide = {
  type: LadySlideType;
  /** title-slide: label for the slide */
  label?: string | null;
  /** title-slide: main title shown to learner */
  title?: string | null;
  /** text-slide: body content */
  body?: string | null;
  [key: string]: unknown;
};

export type LadyCompilerMeta = {
  runId?: string | null;
  [key: string]: unknown;
};

export type LadyLessonOutput = {
  lessonId: string;
  targetNodeIds: string | string[];
  slides: LadySlide[];
  compilerMeta?: LadyCompilerMeta | null;
  [key: string]: unknown;
};

/**
 * Minimal validation: lessonId, targetNodeIds, slides[] required.
 * Each slide must have type "title" or "text" only.
 */
export function isValidLadyLesson(data: unknown): data is LadyLessonOutput {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (!obj.lessonId || typeof obj.lessonId !== "string") return false;
  if (obj.targetNodeIds === undefined) return false;
  if (!Array.isArray(obj.slides)) return false;

  const validTypes = ["title", "text"];
  for (const slide of obj.slides) {
    if (!slide || typeof slide !== "object") return false;
    const type = (slide as Record<string, unknown>).type;
    if (!validTypes.includes(String(type))) return false;
  }

  return true;
}
