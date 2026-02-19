/**
 * Domain model for Lesson
 * Uses camelCase field names for UI consumption
 */
export type LessonStatus = "draft" | "waiting_review" | "published";

/** P7 telemetry metadata (canonical_node_key, run_id, lessonSku, etc.) */
export type LessonMetadata = Record<string, unknown>;

export type Lesson = {
  id: string;
  moduleId: string | null;
  label: string | null;
  title: string | null;
  slug: string | null;
  orderIndex: number | null;
  status: LessonStatus | null;
  metadata: LessonMetadata | null;
  estimatedMinutes: number | null;
  requiredScore: number | null;
  content: string | null;
  shortSummaryAdmin: string | null;
  shortSummaryStudent: string | null;
  courseOrganizationGroup: string | null;
  slideContents: string | null;
  groupingStrategySummary: string | null;
  activityTypes: string | null;
  activityDescription: string | null;
  signatureMetaphors: string | null;
  mainGrammarTopics: string | null;
  pronunciationFocus: string | null;
  vocabularyTheme: string | null;
  l1L2Issues: string | null;
  prerequisites: string | null;
  learningObjectives: string | null;
  notesForTeacherOrAI: string | null;
};

/**
 * Minimal lesson data for dropdowns/lists
 */
export type LessonMinimal = {
  id: string;
  slug: string | null;
  label: string | null;
  title: string | null;
};

