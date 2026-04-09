import { loadLessonEndById, type LessonEndDetailRow } from "@/lib/lessonEnds";
import { loadLessonEndConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";
import { exportValueFromStoredValue, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";

export const dynamic = "force-dynamic";
const LESSON_END_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("lesson_ends");

type LessonEndTemplate = Record<string, Record<string, ExportTemplateValue>>;

function resolveLessonEndFieldValue(
  lessonEndRecord: LessonEndDetailRow,
  categoryKey: string,
  fieldKey: string
): string | undefined {
  if (fieldKey === "slideId") {
    return String(lessonEndRecord.id);
  }

  const categoryValues = lessonEndRecord.values[categoryKey];
  if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
    return categoryValues[fieldKey] ?? undefined;
  }

  return undefined;
}

function buildLessonEndTemplate(
  lessonEndRecord: LessonEndDetailRow,
  categories: UniversalConfigCategory[]
): LessonEndTemplate {
  const template: LessonEndTemplate = {};

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (LESSON_END_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }
      const value = resolveLessonEndFieldValue(lessonEndRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    template[category.key] = categoryPayload;
  }

  return template;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonEndId: string }> }
): Promise<Response> {
  try {
    const { lessonEndId } = await context.params;
    const [categories, lessonEndRecord] = await Promise.all([
      loadLessonEndConfigCategories(),
      loadLessonEndById(lessonEndId),
    ]);

    if (!lessonEndRecord) {
      return new Response("lesson_ends not found.", { status: 404 });
    }

    const payload = {
      slideId: lessonEndRecord.id,
      lessonId: lessonEndRecord.lesson_id,
      ...buildLessonEndTemplate(lessonEndRecord, categories),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lesson_ends-${lessonEndRecord.id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export lesson_ends JSON.";
    return new Response(message, { status: 400 });
  }
}
