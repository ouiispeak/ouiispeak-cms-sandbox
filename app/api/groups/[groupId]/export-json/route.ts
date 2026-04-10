import { loadGroupById, type GroupDetailRow } from "@/lib/groups";
import { loadGroupConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";
import { exportValueFromStoredValue, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";
import { assertExportRuntimeGate } from "@/lib/exportRuntimeGate";

export const dynamic = "force-dynamic";
const GROUP_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("groups");

type GroupTemplate = Record<string, Record<string, ExportTemplateValue>>;

function resolveGroupFieldValue(
  groupRecord: GroupDetailRow,
  categoryKey: string,
  fieldKey: string
): string | undefined {
  if (fieldKey === "groupId") {
    return String(groupRecord.id);
  }

  const categoryValues = groupRecord.values[categoryKey];
  if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
    return categoryValues[fieldKey] ?? undefined;
  }

  if (fieldKey === "title") {
    return groupRecord.title ?? undefined;
  }

  if (fieldKey === "text") {
    return groupRecord.text ?? undefined;
  }

  if (fieldKey === "subtitle") {
    return groupRecord.subtitle ?? undefined;
  }

  return undefined;
}

function buildGroupTemplate(
  groupRecord: GroupDetailRow,
  categories: UniversalConfigCategory[]
): GroupTemplate {
  const template: GroupTemplate = {};

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (GROUP_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }

      const value = resolveGroupFieldValue(groupRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    template[category.key] = categoryPayload;
  }

  return template;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ groupId: string }> }
): Promise<Response> {
  try {
    const { groupId } = await context.params;
    const [categories, groupRecord] = await Promise.all([
      loadGroupConfigCategories(),
      loadGroupById(groupId),
    ]);

    if (!groupRecord) {
      return new Response("Group not found.", { status: 404 });
    }

    const payload = {
      groupId: groupRecord.id,
      lessonId: groupRecord.lesson_id,
      ...buildGroupTemplate(groupRecord, categories),
    };
    assertExportRuntimeGate("groups", categories, payload, "Group export");

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="group-${groupRecord.id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export group JSON.";
    return new Response(message, { status: 400 });
  }
}
