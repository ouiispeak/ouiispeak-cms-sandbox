import { loadLessonById, type LessonDetailRow } from "@/lib/lessons";
import { loadLessonConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";
import { exportValueFromStoredValue, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";

export const dynamic = "force-dynamic";
const LESSON_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("lessons");

type LessonTemplate = Record<string, Record<string, ExportTemplateValue>>;

function resolveLessonFieldValue(
  lessonRecord: LessonDetailRow,
  categoryKey: string,
  fieldKey: string
): string | undefined {
  if (fieldKey === "lessonId") {
    return String(lessonRecord.id);
  }

  const categoryValues = lessonRecord.values[categoryKey];
  if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
    return categoryValues[fieldKey] ?? undefined;
  }

  if (fieldKey === "title") {
    return lessonRecord.title ?? undefined;
  }

  if (fieldKey === "text") {
    return lessonRecord.text ?? undefined;
  }

  if (fieldKey === "subtitle") {
    return lessonRecord.subtitle ?? undefined;
  }

  return undefined;
}

function buildLessonTemplate(
  lessonRecord: LessonDetailRow,
  categories: UniversalConfigCategory[]
): LessonTemplate {
  const template: LessonTemplate = {};

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (LESSON_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }
      const value = resolveLessonFieldValue(lessonRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    template[category.key] = categoryPayload;
  }

  return template;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
  try {
    const { lessonId } = await context.params;
    const [categories, lessonRecord] = await Promise.all([
      loadLessonConfigCategories(),
      loadLessonById(lessonId),
    ]);

    if (!lessonRecord) {
      return new Response("Lesson not found.", { status: 404 });
    }

    const template = buildLessonTemplate(lessonRecord, categories);
    const payload = {
      lessonId: lessonRecord.id,
      moduleId: lessonRecord.module_id,
      ...template,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lesson-${lessonRecord.id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export lesson JSON.";
    return new Response(message, { status: 400 });
  }
}
