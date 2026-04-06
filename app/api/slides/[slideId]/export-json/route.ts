import { loadSlideById, type SlideDetailRow } from "@/lib/slides";
import { loadSlideConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";

export const dynamic = "force-dynamic";

type SlideTemplate = Record<string, Record<string, string>>;

function resolveSlideFieldValue(
  slideRecord: SlideDetailRow,
  categoryKey: string,
  fieldKey: string
): string | undefined {
  if (fieldKey === "slideId") {
    return String(slideRecord.id);
  }

  const categoryValues = slideRecord.values[categoryKey];
  if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
    return categoryValues[fieldKey] ?? undefined;
  }

  return undefined;
}

function buildSlideTemplate(
  slideRecord: SlideDetailRow,
  categories: UniversalConfigCategory[]
): SlideTemplate {
  const template: SlideTemplate = {};

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "slideId") {
        continue;
      }
      const value = resolveSlideFieldValue(slideRecord, category.key, field.key);
      categoryPayload[field.key] = value ?? "";
    }

    template[category.key] = categoryPayload;
  }

  return template;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slideId: string }> }
): Promise<Response> {
  try {
    const { slideId } = await context.params;
    const [categories, slideRecord] = await Promise.all([
      loadSlideConfigCategories(),
      loadSlideById(slideId),
    ]);

    if (!slideRecord) {
      return new Response("Slide not found.", { status: 404 });
    }

    const payload = {
      slideId: slideRecord.id,
      groupId: slideRecord.group_id,
      ...buildSlideTemplate(slideRecord, categories),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="slide-${slideRecord.id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export slide JSON.";
    return new Response(message, { status: 400 });
  }
}
