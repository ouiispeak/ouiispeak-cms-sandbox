import { isObjectRecord, parseImportEntries, parseUuid } from "@/lib/componentCore";
import {
  createGroupFromFormData,
  importGroupUpdatesFromJsonPayload,
} from "@/lib/groups";
import {
  createLessonFromFormData,
  importLessonUpdatesFromJsonPayload,
} from "@/lib/lessons";
import {
  createSlideFromFormData,
  importSlideUpdatesFromJsonPayload,
} from "@/lib/slides";
import {
  importActivitySlidesFromJsonPayload,
  importActivitySlideUpdatesFromJsonPayload,
} from "@/lib/activitySlides";

type ObjectEntry = Record<string, unknown>;

type ParsedNestedGroupEntry = {
  groupEntry: ObjectEntry;
  slides: ObjectEntry[];
  activitySlides: ObjectEntry[];
};

type ParsedNestedLessonEntry = {
  lessonEntry: ObjectEntry;
  groups: ParsedNestedGroupEntry[];
};

function valueToFormDataString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value) || isObjectRecord(value)) {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildFormDataFromComponentEntry(entry: ObjectEntry): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entry)) {
    if (key === "groups" || key === "slides" || key === "activitySlides") {
      continue;
    }

    if (isObjectRecord(value)) {
      for (const [fieldName, fieldValue] of Object.entries(value)) {
        formData.append(`${key}.${fieldName}`, valueToFormDataString(fieldValue));
      }
      continue;
    }

    formData.append(key, valueToFormDataString(value));
  }

  return formData;
}

function parseNestedLessonEntries(payload: unknown): ParsedNestedLessonEntry[] {
  const entries = parseImportEntries(payload);

  return entries.map((entry, index) => {
    if (!isObjectRecord(entry)) {
      throw new Error(`Each nested lesson entry must be an object (entry ${index + 1}).`);
    }

    const groupsRaw = entry.groups;
    const groups: ParsedNestedGroupEntry[] = [];

    if (groupsRaw !== undefined) {
      if (!Array.isArray(groupsRaw)) {
        throw new Error(`Nested lesson entry ${index + 1} has invalid "groups"; expected an array.`);
      }

      for (const [groupIndex, groupEntryRaw] of groupsRaw.entries()) {
        if (!isObjectRecord(groupEntryRaw)) {
          throw new Error(
            `Nested lesson entry ${index + 1} has invalid group at index ${groupIndex}; expected an object.`
          );
        }

        const slidesRaw = groupEntryRaw.slides;
        const slides: ObjectEntry[] = [];
        const activitySlidesRaw = groupEntryRaw.activitySlides;
        const activitySlides: ObjectEntry[] = [];

        if (slidesRaw !== undefined) {
          if (!Array.isArray(slidesRaw)) {
            throw new Error(
              `Nested lesson entry ${index + 1}, group ${groupIndex + 1} has invalid "slides"; expected an array.`
            );
          }

          for (const [slideIndex, slideEntryRaw] of slidesRaw.entries()) {
            if (!isObjectRecord(slideEntryRaw)) {
              throw new Error(
                `Nested lesson entry ${index + 1}, group ${groupIndex + 1} has invalid slide at index ${slideIndex}; expected an object.`
              );
            }
            slides.push(slideEntryRaw);
          }
        }

        if (activitySlidesRaw !== undefined) {
          if (!Array.isArray(activitySlidesRaw)) {
            throw new Error(
              `Nested lesson entry ${index + 1}, group ${groupIndex + 1} has invalid "activitySlides"; expected an array.`
            );
          }

          for (const [activitySlideIndex, activitySlideEntryRaw] of activitySlidesRaw.entries()) {
            if (!isObjectRecord(activitySlideEntryRaw)) {
              throw new Error(
                `Nested lesson entry ${index + 1}, group ${groupIndex + 1} has invalid activity slide at index ${activitySlideIndex}; expected an object.`
              );
            }
            activitySlides.push(activitySlideEntryRaw);
          }
        }

        const groupEntry: ObjectEntry = { ...groupEntryRaw };
        delete groupEntry.slides;
        delete groupEntry.activitySlides;
        groups.push({ groupEntry, slides, activitySlides });
      }
    }

    const lessonEntry: ObjectEntry = { ...entry };
    delete lessonEntry.groups;

    return { lessonEntry, groups };
  });
}

function ensureLessonId(entry: ObjectEntry, index: number): string {
  return parseUuid(
    entry.lessonId,
    `Nested lesson update entry ${index + 1} must include a valid uuid "lessonId".`
  );
}

function resolveGroupIdForUpdate(groupEntry: ObjectEntry, index: number, groupIndex: number): string | null {
  const groupId = groupEntry.groupId;
  if (groupId === undefined || groupId === null || (typeof groupId === "string" && groupId.trim().length === 0)) {
    return null;
  }

  return parseUuid(
    groupId,
    `Nested lesson update entry ${index + 1}, group ${groupIndex + 1} must include a valid uuid "groupId".`
  );
}

function resolveSlideIdForUpdate(
  slideEntry: ObjectEntry,
  index: number,
  groupIndex: number,
  slideIndex: number
): string | null {
  const slideId = slideEntry.slideId;
  if (slideId === undefined || slideId === null || (typeof slideId === "string" && slideId.trim().length === 0)) {
    return null;
  }

  return parseUuid(
    slideId,
    `Nested lesson update entry ${index + 1}, group ${groupIndex + 1}, slide ${slideIndex + 1} must include a valid uuid "slideId".`
  );
}

async function createSlidesForGroup(slides: ObjectEntry[], groupId: string): Promise<void> {
  for (const slideEntry of slides) {
    const slideFormData = buildFormDataFromComponentEntry({
      ...slideEntry,
      groupId,
    });
    await createSlideFromFormData(slideFormData);
  }
}

async function createActivitySlidesForGroup(activitySlides: ObjectEntry[], groupId: string): Promise<void> {
  if (activitySlides.length === 0) {
    return;
  }

  const createEntries = activitySlides.map((activitySlideEntry) => ({
    ...activitySlideEntry,
    groupId,
  }));
  await importActivitySlidesFromJsonPayload(createEntries);
}

async function updateOrCreateSlidesForGroup(
  slides: ObjectEntry[],
  groupId: string,
  lessonIndex: number,
  groupIndex: number
): Promise<void> {
  for (const [slideIndex, slideEntry] of slides.entries()) {
    const normalizedSlideEntry: ObjectEntry = {
      ...slideEntry,
      groupId,
    };

    const slideId = resolveSlideIdForUpdate(slideEntry, lessonIndex, groupIndex, slideIndex);
    if (slideId) {
      normalizedSlideEntry.slideId = slideId;
      await importSlideUpdatesFromJsonPayload([normalizedSlideEntry]);
      continue;
    }

    const slideFormData = buildFormDataFromComponentEntry(normalizedSlideEntry);
    await createSlideFromFormData(slideFormData);
  }
}

async function updateOrCreateActivitySlidesForGroup(
  activitySlides: ObjectEntry[],
  groupId: string,
  lessonIndex: number,
  groupIndex: number
): Promise<void> {
  const updateEntries: ObjectEntry[] = [];
  const createEntries: ObjectEntry[] = [];

  for (const [activitySlideIndex, activitySlideEntry] of activitySlides.entries()) {
    const normalizedActivitySlideEntry: ObjectEntry = {
      ...activitySlideEntry,
      groupId,
    };

    const activitySlideId = resolveSlideIdForUpdate(
      activitySlideEntry,
      lessonIndex,
      groupIndex,
      activitySlideIndex
    );
    if (activitySlideId) {
      normalizedActivitySlideEntry.slideId = activitySlideId;
      updateEntries.push(normalizedActivitySlideEntry);
      continue;
    }

    createEntries.push(normalizedActivitySlideEntry);
  }

  if (updateEntries.length > 0) {
    await importActivitySlideUpdatesFromJsonPayload(updateEntries);
  }

  if (createEntries.length > 0) {
    await importActivitySlidesFromJsonPayload(createEntries);
  }
}

export async function importNestedLessonsCreateFromJsonPayload(payload: unknown): Promise<number> {
  const entries = parseNestedLessonEntries(payload);
  let createdCount = 0;

  for (const [index, parsedEntry] of entries.entries()) {
    try {
      const lessonFormData = buildFormDataFromComponentEntry(parsedEntry.lessonEntry);
      const lessonId = await createLessonFromFormData(lessonFormData);
      createdCount += 1;

      for (const parsedGroup of parsedEntry.groups) {
        const groupFormData = buildFormDataFromComponentEntry({
          ...parsedGroup.groupEntry,
          lessonId,
        });
        const groupId = await createGroupFromFormData(groupFormData);

        if (parsedGroup.slides.length > 0) {
          await createSlidesForGroup(parsedGroup.slides, groupId);
        }

        if (parsedGroup.activitySlides.length > 0) {
          await createActivitySlidesForGroup(parsedGroup.activitySlides, groupId);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nested lesson create failed.";
      throw new Error(`Nested lesson create entry ${index + 1}: ${message}`);
    }
  }

  return createdCount;
}

export async function importNestedLessonsUpdateFromJsonPayload(payload: unknown): Promise<number> {
  const entries = parseNestedLessonEntries(payload);
  let updatedCount = 0;

  for (const [index, parsedEntry] of entries.entries()) {
    try {
      const lessonId = ensureLessonId(parsedEntry.lessonEntry, index);
      await importLessonUpdatesFromJsonPayload([parsedEntry.lessonEntry]);
      updatedCount += 1;

      for (const [groupIndex, parsedGroup] of parsedEntry.groups.entries()) {
        const normalizedGroupEntry: ObjectEntry = {
          ...parsedGroup.groupEntry,
          lessonId,
        };

        const existingGroupId = resolveGroupIdForUpdate(parsedGroup.groupEntry, index, groupIndex);
        let groupIdForSlides: string;

        if (existingGroupId) {
          normalizedGroupEntry.groupId = existingGroupId;
          await importGroupUpdatesFromJsonPayload([normalizedGroupEntry]);
          groupIdForSlides = existingGroupId;
        } else {
          const groupFormData = buildFormDataFromComponentEntry(normalizedGroupEntry);
          groupIdForSlides = await createGroupFromFormData(groupFormData);
        }

        if (parsedGroup.slides.length > 0) {
          await updateOrCreateSlidesForGroup(parsedGroup.slides, groupIdForSlides, index, groupIndex);
        }

        if (parsedGroup.activitySlides.length > 0) {
          await updateOrCreateActivitySlidesForGroup(
            parsedGroup.activitySlides,
            groupIdForSlides,
            index,
            groupIndex
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nested lesson update failed.";
      throw new Error(`Nested lesson update entry ${index + 1}: ${message}`);
    }
  }

  return updatedCount;
}
