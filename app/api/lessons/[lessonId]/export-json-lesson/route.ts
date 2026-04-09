import { loadLessonById, type LessonDetailRow } from "@/lib/lessons";
import { loadGroupById, loadGroups, type GroupDetailRow } from "@/lib/groups";
import { loadSlideById, loadSlides, type SlideDetailRow } from "@/lib/slides";
import {
  loadActivitySlideById,
  loadActivitySlides,
  type ActivitySlideDetailRow,
} from "@/lib/activitySlides";
import {
  loadActivitySlideConfigCategories,
  loadGroupConfigCategories,
  loadLessonConfigCategories,
  loadSlideConfigCategories,
  type UniversalConfigCategory,
} from "@/lib/universalConfigs";
import { exportValueFromStoredValue, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";

export const dynamic = "force-dynamic";
const LESSON_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("lessons");
const GROUP_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("groups");
const SLIDE_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("slides");
const ACTIVITY_SLIDE_TOP_LEVEL_ONLY_FIELDS = getTopLevelOnlyFieldKeys("activity_slides");

type ConfigPayload = Record<string, Record<string, ExportTemplateValue>>;

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
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (LESSON_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }
      const value = resolveLessonFieldValue(lessonRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
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
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (GROUP_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }
      const value = resolveGroupFieldValue(groupRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    payload[category.key] = categoryPayload;
  }

  return payload;
}

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

function buildSlidePayload(
  slideRecord: SlideDetailRow,
  categories: UniversalConfigCategory[]
): ConfigPayload {
  const payload: ConfigPayload = {};

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (SLIDE_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }

      const value = resolveSlideFieldValue(slideRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    payload[category.key] = categoryPayload;
  }

  return payload;
}

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

function buildActivitySlidePayload(
  activitySlideRecord: ActivitySlideDetailRow,
  categories: UniversalConfigCategory[]
): ConfigPayload {
  const payload: ConfigPayload = {};

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (ACTIVITY_SLIDE_TOP_LEVEL_ONLY_FIELDS.has(field.key)) {
        continue;
      }

      const value = resolveActivitySlideFieldValue(activitySlideRecord, category.key, field.key);
      categoryPayload[field.key] = exportValueFromStoredValue(field.inputType, value);
    }

    payload[category.key] = categoryPayload;
  }

  return payload;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
  try {
    const requestUrl = new URL(request.url);
    const viewParam = requestUrl.searchParams.get("view");
    const shouldRenderInline = viewParam === "1" || viewParam === "true";
    const { lessonId } = await context.params;
    const [
      lessonCategories,
      groupCategories,
      slideCategories,
      activitySlideCategories,
      lessonRecord,
      groups,
      slides,
      activitySlides,
    ] = await Promise.all([
      loadLessonConfigCategories(),
      loadGroupConfigCategories(),
      loadSlideConfigCategories(),
      loadActivitySlideConfigCategories(),
      loadLessonById(lessonId),
      loadGroups(),
      loadSlides(),
      loadActivitySlides(),
    ]);

    if (!lessonRecord) {
      return new Response("Lesson not found.", { status: 404 });
    }

    const nestedGroupIds = groups.filter((group) => group.lesson_id === lessonRecord.id).map((group) => group.id);
    const nestedGroupRecords = (
      await Promise.all(nestedGroupIds.map((groupId) => loadGroupById(String(groupId))))
    ).filter((group): group is GroupDetailRow => group !== null);

    const slidesByGroupId = new Map<string, SlideDetailRow[]>();
    const activitySlidesByGroupId = new Map<string, ActivitySlideDetailRow[]>();
    for (const groupRecord of nestedGroupRecords) {
      const nestedSlideIds = slides
        .filter((slide) => slide.group_id === groupRecord.id)
        .map((slide) => slide.id);
      const nestedSlideRecords = (
        await Promise.all(nestedSlideIds.map((slideId) => loadSlideById(String(slideId))))
      ).filter((slide): slide is SlideDetailRow => slide !== null);
      slidesByGroupId.set(groupRecord.id, nestedSlideRecords);

      const nestedActivitySlideIds = activitySlides
        .filter((activitySlide) => activitySlide.group_id === groupRecord.id)
        .map((activitySlide) => activitySlide.id);
      const nestedActivitySlideRecords = (
        await Promise.all(
          nestedActivitySlideIds.map((activitySlideId) => loadActivitySlideById(String(activitySlideId)))
        )
      ).filter((activitySlide): activitySlide is ActivitySlideDetailRow => activitySlide !== null);
      activitySlidesByGroupId.set(groupRecord.id, nestedActivitySlideRecords);
    }

    const payload = {
      lessonId: lessonRecord.id,
      moduleId: lessonRecord.module_id,
      ...buildLessonPayload(lessonRecord, lessonCategories),
      groups: nestedGroupRecords.map((groupRecord) => ({
        groupId: groupRecord.id,
        lessonId: groupRecord.lesson_id,
        ...buildGroupPayload(groupRecord, groupCategories),
        slides: (slidesByGroupId.get(groupRecord.id) ?? []).map((slideRecord) => ({
          slideId: slideRecord.id,
          groupId: slideRecord.group_id,
          ...buildSlidePayload(slideRecord, slideCategories),
        })),
        activitySlides: (activitySlidesByGroupId.get(groupRecord.id) ?? []).map((activitySlideRecord) => ({
          slideId: activitySlideRecord.id,
          groupId: activitySlideRecord.group_id,
          ...buildActivitySlidePayload(activitySlideRecord, activitySlideCategories),
        })),
      })),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `${
          shouldRenderInline ? "inline" : "attachment"
        }; filename="lesson-${lessonRecord.id}-nested.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export nested lesson JSON.";
    return new Response(message, { status: 400 });
  }
}
