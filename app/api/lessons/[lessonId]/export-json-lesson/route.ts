import { loadLessonById, type LessonDetailRow } from "@/lib/lessons";
import { loadGroupById, loadGroups, type GroupDetailRow } from "@/lib/groups";
import {
  loadGroupConfigCategories,
  loadLessonConfigCategories,
  type UniversalConfigCategory,
} from "@/lib/universalConfigs";

export const dynamic = "force-dynamic";

type ConfigPayload = Record<string, Record<string, string>>;

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

function buildLessonPayload(
  lessonRecord: LessonDetailRow,
  categories: UniversalConfigCategory[]
): ConfigPayload {
  const payload: ConfigPayload = {};

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "lessonId") {
        continue;
      }
      const value = resolveLessonFieldValue(lessonRecord, category.key, field.key);
      categoryPayload[field.key] = value ?? "";
    }

    payload[category.key] = categoryPayload;
  }

  return payload;
}

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

function buildGroupPayload(
  groupRecord: GroupDetailRow,
  categories: UniversalConfigCategory[]
): ConfigPayload {
  const payload: ConfigPayload = {};

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "groupId") {
        continue;
      }
      const value = resolveGroupFieldValue(groupRecord, category.key, field.key);
      categoryPayload[field.key] = value ?? "";
    }

    payload[category.key] = categoryPayload;
  }

  return payload;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
  try {
    const { lessonId } = await context.params;
    const [lessonCategories, groupCategories, lessonRecord, groups] = await Promise.all([
      loadLessonConfigCategories(),
      loadGroupConfigCategories(),
      loadLessonById(lessonId),
      loadGroups(),
    ]);

    if (!lessonRecord) {
      return new Response("Lesson not found.", { status: 404 });
    }

    const nestedGroupIds = groups.filter((group) => group.lesson_id === lessonRecord.id).map((group) => group.id);
    const nestedGroupRecords = (
      await Promise.all(nestedGroupIds.map((groupId) => loadGroupById(String(groupId))))
    ).filter((group): group is GroupDetailRow => group !== null);

    const payload = {
      lessonId: lessonRecord.id,
      moduleId: lessonRecord.module_id,
      ...buildLessonPayload(lessonRecord, lessonCategories),
      groups: nestedGroupRecords.map((groupRecord) => ({
        groupId: groupRecord.id,
        lessonId: groupRecord.lesson_id,
        ...buildGroupPayload(groupRecord, groupCategories),
      })),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lesson-${lessonRecord.id}-nested.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export nested lesson JSON.";
    return new Response(message, { status: 400 });
  }
}
