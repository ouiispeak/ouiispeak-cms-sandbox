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
import {
  importTitleSlidesFromJsonPayload,
  importTitleSlideUpdatesFromJsonPayload,
} from "@/lib/titleSlides";
import { importLessonEndsFromJsonPayload, importLessonEndUpdatesFromJsonPayload } from "@/lib/lessonEnds";

type ObjectEntry = Record<string, unknown>;

type ParsedNestedBoundariesEntry = {
  title: ObjectEntry | null;
  lessonEnd: ObjectEntry | null;
};

type ParsedNestedGroupEntry = {
  groupEntry: ObjectEntry;
  slides: ObjectEntry[];
  activitySlides: ObjectEntry[];
};

type ParsedNestedLessonEntry = {
  lessonEntry: ObjectEntry;
  boundaries: ParsedNestedBoundariesEntry;
  groups: ParsedNestedGroupEntry[];
};

const IDENTITY_LIFECYCLE_CATEGORY = "Identity & Lifecycle";

function stampIdentityLifecycleField(
  entry: ObjectEntry,
  fieldName: string,
  fieldValue: string
): ObjectEntry {
  const normalized: ObjectEntry = { ...entry };
  const existingCategory = normalized[IDENTITY_LIFECYCLE_CATEGORY];
  normalized[IDENTITY_LIFECYCLE_CATEGORY] = {
    ...(isObjectRecord(existingCategory) ? existingCategory : {}),
    [fieldName]: fieldValue,
  };
  delete normalized[fieldName];
  return normalized;
}

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
    if (key === "groups" || key === "slides" || key === "activitySlides" || key === "boundaries") {
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
    const boundariesRaw = entry.boundaries;
    const boundaries: ParsedNestedBoundariesEntry = {
      title: null,
      lessonEnd: null,
    };

    if (boundariesRaw !== undefined) {
      if (!isObjectRecord(boundariesRaw)) {
        throw new Error(
          `Nested lesson entry ${index + 1} has invalid "boundaries"; expected an object.`
        );
      }

      const titleRaw = boundariesRaw.title;
      if (titleRaw !== undefined) {
        if (!isObjectRecord(titleRaw)) {
          throw new Error(
            `Nested lesson entry ${index + 1} has invalid "boundaries.title"; expected an object.`
          );
        }
        boundaries.title = titleRaw;
      }

      const lessonEndRaw = boundariesRaw.lessonEnd;
      if (lessonEndRaw !== undefined) {
        if (!isObjectRecord(lessonEndRaw)) {
          throw new Error(
            `Nested lesson entry ${index + 1} has invalid "boundaries.lessonEnd"; expected an object.`
          );
        }
        boundaries.lessonEnd = lessonEndRaw;
      }
    }

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
    delete lessonEntry.boundaries;

    return { lessonEntry, boundaries, groups };
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

function resolveBoundarySlideIdForUpdate(
  boundaryEntry: ObjectEntry,
  index: number,
  boundaryLabel: "title" | "lessonEnd"
): string | null {
  const slideId = boundaryEntry.slideId;
  if (slideId === undefined || slideId === null || (typeof slideId === "string" && slideId.trim().length === 0)) {
    return null;
  }

  return parseUuid(
    slideId,
    `Nested lesson update entry ${index + 1}, boundaries.${boundaryLabel} must include a valid uuid "slideId".`
  );
}

async function createSlidesForGroup(slides: ObjectEntry[], groupId: string, lessonId: string): Promise<void> {
  for (const slideEntry of slides) {
    const slideFormData = buildFormDataFromComponentEntry({
      ...stampIdentityLifecycleField(slideEntry, "lessonId", lessonId),
      groupId,
    });
    await createSlideFromFormData(slideFormData);
  }
}

async function createActivitySlidesForGroup(
  activitySlides: ObjectEntry[],
  groupId: string,
  lessonId: string
): Promise<void> {
  if (activitySlides.length === 0) {
    return;
  }

  const createEntries = activitySlides.map((activitySlideEntry) => ({
    ...stampIdentityLifecycleField(activitySlideEntry, "lessonId", lessonId),
    groupId,
  }));
  await importActivitySlidesFromJsonPayload(createEntries);
}

function sanitizeBoundaryPayloadForImport(
  boundaryEntry: ObjectEntry,
  boundaryLabel: "title" | "lessonEnd"
): ObjectEntry {
  const normalized: ObjectEntry = { ...boundaryEntry };

  if (boundaryLabel !== "lessonEnd") {
    return normalized;
  }

  for (const [categoryName, categoryPayload] of Object.entries(normalized)) {
    if (!isObjectRecord(categoryPayload)) {
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(categoryPayload, "orderIndex")) {
      continue;
    }

    const normalizedCategoryPayload: ObjectEntry = { ...categoryPayload };
    delete normalizedCategoryPayload.orderIndex;
    normalized[categoryName] = normalizedCategoryPayload;
  }

  return normalized;
}

function assertCreateBoundariesPresent(boundaries: ParsedNestedBoundariesEntry, index: number): void {
  if (!boundaries.title || !boundaries.lessonEnd) {
    throw new Error(
      `Nested lesson create entry ${index + 1} must include both "boundaries.title" and "boundaries.lessonEnd".`
    );
  }
}

async function createBoundariesForLesson(
  boundaries: ParsedNestedBoundariesEntry,
  lessonId: string
): Promise<void> {
  if (boundaries.title) {
    await importTitleSlidesFromJsonPayload([
      {
        ...sanitizeBoundaryPayloadForImport(boundaries.title, "title"),
        lessonId,
      },
    ]);
  }

  if (boundaries.lessonEnd) {
    await importLessonEndsFromJsonPayload([
      {
        ...sanitizeBoundaryPayloadForImport(boundaries.lessonEnd, "lessonEnd"),
        lessonId,
      },
    ]);
  }
}

async function updateOrCreateBoundariesForLesson(
  boundaries: ParsedNestedBoundariesEntry,
  lessonId: string,
  lessonIndex: number
): Promise<void> {
  if (boundaries.title) {
    const normalizedTitleBoundary: ObjectEntry = {
      ...sanitizeBoundaryPayloadForImport(boundaries.title, "title"),
      lessonId,
    };
    const titleBoundarySlideId = resolveBoundarySlideIdForUpdate(boundaries.title, lessonIndex, "title");
    if (titleBoundarySlideId) {
      normalizedTitleBoundary.slideId = titleBoundarySlideId;
      await importTitleSlideUpdatesFromJsonPayload([normalizedTitleBoundary]);
    } else {
      await importTitleSlidesFromJsonPayload([normalizedTitleBoundary]);
    }
  }

  if (boundaries.lessonEnd) {
    const normalizedLessonEndBoundary: ObjectEntry = {
      ...sanitizeBoundaryPayloadForImport(boundaries.lessonEnd, "lessonEnd"),
      lessonId,
    };
    const lessonEndSlideId = resolveBoundarySlideIdForUpdate(
      boundaries.lessonEnd,
      lessonIndex,
      "lessonEnd"
    );
    if (lessonEndSlideId) {
      normalizedLessonEndBoundary.slideId = lessonEndSlideId;
      await importLessonEndUpdatesFromJsonPayload([normalizedLessonEndBoundary]);
    } else {
      await importLessonEndsFromJsonPayload([normalizedLessonEndBoundary]);
    }
  }
}

async function updateOrCreateSlidesForGroup(
  slides: ObjectEntry[],
  groupId: string,
  lessonId: string,
  lessonIndex: number,
  groupIndex: number
): Promise<void> {
  for (const [slideIndex, slideEntry] of slides.entries()) {
    const normalizedSlideEntry: ObjectEntry = {
      ...stampIdentityLifecycleField(slideEntry, "lessonId", lessonId),
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
  lessonId: string,
  lessonIndex: number,
  groupIndex: number
): Promise<void> {
  const updateEntries: ObjectEntry[] = [];
  const createEntries: ObjectEntry[] = [];

  for (const [activitySlideIndex, activitySlideEntry] of activitySlides.entries()) {
    const normalizedActivitySlideEntry: ObjectEntry = {
      ...stampIdentityLifecycleField(activitySlideEntry, "lessonId", lessonId),
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
      assertCreateBoundariesPresent(parsedEntry.boundaries, index);
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
          await createSlidesForGroup(parsedGroup.slides, groupId, lessonId);
        }

        if (parsedGroup.activitySlides.length > 0) {
          await createActivitySlidesForGroup(parsedGroup.activitySlides, groupId, lessonId);
        }
      }

      await createBoundariesForLesson(parsedEntry.boundaries, lessonId);
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
          await updateOrCreateSlidesForGroup(
            parsedGroup.slides,
            groupIdForSlides,
            lessonId,
            index,
            groupIndex
          );
        }

        if (parsedGroup.activitySlides.length > 0) {
          await updateOrCreateActivitySlidesForGroup(
            parsedGroup.activitySlides,
            groupIdForSlides,
            lessonId,
            index,
            groupIndex
          );
        }
      }

      await updateOrCreateBoundariesForLesson(parsedEntry.boundaries, lessonId, index);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nested lesson update failed.";
      throw new Error(`Nested lesson update entry ${index + 1}: ${message}`);
    }
  }

  return updatedCount;
}
