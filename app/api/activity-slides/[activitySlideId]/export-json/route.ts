import { loadActivitySlideById, type ActivitySlideDetailRow } from "@/lib/activitySlides";
import { loadActivitySlideConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";
import { exportValueFromStoredValue, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";
import { filterActivitySlideCategoriesForProfile, resolveConcreteActivityProfileFromActivityId } from "@/lib/activityProfiles";

export const dynamic = "force-dynamic";
const ACTIVITY_SLIDE_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("activity_slides");

type ActivitySlideTemplate = Record<string, Record<string, ExportTemplateValue>>;

function resolveActivitySlideFieldValue(
  activitySlideRecord: ActivitySlideDetailRow,
  categoryKey: string,
  fieldKey: string
): string | undefined {
  if (fieldKey === "slideId") {
    return String(activitySlideRecord.id);
  }

  const categoryValues = activitySlideRecord.values[categoryKey];
  if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
    return categoryValues[fieldKey] ?? undefined;
  }

  return undefined;
}

function buildActivitySlideTemplate(
  activitySlideRecord: ActivitySlideDetailRow,
  categories: UniversalConfigCategory[]
): ActivitySlideTemplate {
  const template: ActivitySlideTemplate = {};

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (ACTIVITY_SLIDE_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }
      const value = resolveActivitySlideFieldValue(activitySlideRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    template[category.key] = categoryPayload;
  }

  return template;
}

function resolveActivityIdFromRecord(activitySlideRecord: ActivitySlideDetailRow): string | undefined {
  return (
    activitySlideRecord.values["Identity & Lifecycle"]?.activityId ??
    activitySlideRecord.values.Identity?.activityId ??
    undefined
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ activitySlideId: string }> }
): Promise<Response> {
  try {
    const { activitySlideId } = await context.params;
    const activitySlideRecord = await loadActivitySlideById(activitySlideId);

    if (!activitySlideRecord) {
      return new Response("Activity slide not found.", { status: 404 });
    }

    const profile = resolveConcreteActivityProfileFromActivityId(resolveActivityIdFromRecord(activitySlideRecord));
    const categories = filterActivitySlideCategoriesForProfile(
      await loadActivitySlideConfigCategories(),
      profile
    );

    const payload = {
      slideId: activitySlideRecord.id,
      groupId: activitySlideRecord.group_id,
      ...buildActivitySlideTemplate(activitySlideRecord, categories),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="activity-slide-${activitySlideRecord.id}-${profile}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export activity slide JSON.";
    return new Response(message, { status: 400 });
  }
}
