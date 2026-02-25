import type { LessonData, LessonDataMinimal } from "../data/lessons";
import type { Lesson, LessonMinimal } from "../domain/lesson";
import { createMapper, withDefault } from "../utils/mapper";

/**
 * Mapper for full Lesson domain model
 */
const lessonMapper = createMapper<Lesson, LessonData>({
  fieldMappings: {
    id: "id",
    moduleId: "module_id",
    label: "label",
    title: "title",
    slug: "slug",
    orderIndex: "order_index",
    status: "status",
    metadata: "metadata",
    estimatedMinutes: "estimated_minutes",
    requiredScore: "required_score",
    content: "content",
    shortSummaryAdmin: "short_summary_admin",
    shortSummaryStudent: "short_summary_student",
    courseOrganizationGroup: "course_organization_group",
    slideContents: "slide_contents",
    activityTypes: "activity_types",
    activityDescription: "activity_description",
    signatureMetaphors: "signature_metaphors",
    mainGrammarTopics: "main_grammar_topics",
    pronunciationFocus: "pronunciation_focus",
    vocabularyTheme: "vocabulary_theme",
    l1L2Issues: "l1_l2_issues",
    prerequisites: "prerequisites",
    learningObjectives: "learning_objectives",
    notesForTeacherOrAI: "notes_for_teacher_or_ai",
  },
});

/**
 * Mapper for minimal Lesson domain model
 */
const lessonMinimalMapper = createMapper<LessonMinimal, LessonDataMinimal>({
  fieldMappings: {
    id: "id",
    slug: "slug",
    label: "label",
    title: withDefault("title", ""),
  },
});

/**
 * Convert database row to domain model
 */
export function toLesson(row: LessonData): Lesson {
  return lessonMapper.toDomain(row);
}

/**
 * Convert minimal database row to minimal domain model
 */
export function toLessonMinimal(row: LessonDataMinimal): LessonMinimal {
  return lessonMinimalMapper.toDomain(row);
}

/**
 * Convert domain model to database row update shape
 */
export function toLessonRowUpdate(input: Partial<Lesson>): Partial<LessonData> {
  return lessonMapper.toRowUpdate(input);
}

