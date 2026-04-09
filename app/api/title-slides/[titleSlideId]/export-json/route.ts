import { loadTitleSlideById, type TitleSlideDetailRow } from "@/lib/titleSlides";
import { loadTitleSlideConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";
import { exportValueFromStoredValue, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";

export const dynamic = "force-dynamic";
const TITLE_SLIDE_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("title_slides");

type TitleSlideTemplate = Record<string, Record<string, ExportTemplateValue>>;

function resolveTitleSlideFieldValue(
  titleSlideRecord: TitleSlideDetailRow,
  categoryKey: string,
  fieldKey: string
): string | undefined {
  if (fieldKey === "slideId") {
    return String(titleSlideRecord.id);
  }

  const categoryValues = titleSlideRecord.values[categoryKey];
  if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
    return categoryValues[fieldKey] ?? undefined;
  }

  return undefined;
}

function buildTitleSlideTemplate(
  titleSlideRecord: TitleSlideDetailRow,
  categories: UniversalConfigCategory[]
): TitleSlideTemplate {
  const template: TitleSlideTemplate = {};

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (TITLE_SLIDE_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }
      const value = resolveTitleSlideFieldValue(titleSlideRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    template[category.key] = categoryPayload;
  }

  return template;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ titleSlideId: string }> }
): Promise<Response> {
  try {
    const { titleSlideId } = await context.params;
    const [categories, titleSlideRecord] = await Promise.all([
      loadTitleSlideConfigCategories(),
      loadTitleSlideById(titleSlideId),
    ]);

    if (!titleSlideRecord) {
      return new Response("Title slide not found.", { status: 404 });
    }

    const payload = {
      slideId: titleSlideRecord.id,
      lessonId: titleSlideRecord.lesson_id,
      ...buildTitleSlideTemplate(titleSlideRecord, categories),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="title-slide-${titleSlideRecord.id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export title slide JSON.";
    return new Response(message, { status: 400 });
  }
}
