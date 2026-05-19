type ObjectEntry = Record<string, unknown>;

const STRUCTURE_CATEGORY = "Structure & Sequencing";

export type GroupSlidesPlanEntry = {
  orderIndex: number;
  slideType?: string;
  activityId?: string;
  textSubtype?: string;
};

export function parseGroupSlidesPlan(planRaw: unknown): GroupSlidesPlanEntry[] {
  if (typeof planRaw !== "string" || planRaw.trim().length === 0) {
    return [];
  }

  const entries: GroupSlidesPlanEntry[] = [];
  for (const line of planRaw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const orderIndex = Number(parsed.orderIndex);
      if (!Number.isInteger(orderIndex) || orderIndex < 1) {
        continue;
      }
      entries.push({
        orderIndex,
        slideType: typeof parsed.slideType === "string" ? parsed.slideType : undefined,
        activityId: typeof parsed.activityId === "string" ? parsed.activityId : undefined,
        textSubtype: typeof parsed.textSubtype === "string" ? parsed.textSubtype : undefined,
      });
    } catch {
      continue;
    }
  }
  return entries;
}

function isObjectRecord(value: unknown): value is ObjectEntry {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTextSubtype(slideEntry: ObjectEntry): string | undefined {
  const content = slideEntry["Content & Media"];
  if (isObjectRecord(content) && typeof content.textSubtype === "string" && content.textSubtype.trim()) {
    return content.textSubtype.trim();
  }
  return undefined;
}

function readActivityId(activitySlideEntry: ObjectEntry): string | undefined {
  const identity = activitySlideEntry[IDENTITY_LIFECYCLE_CATEGORY];
  if (isObjectRecord(identity) && typeof identity.activityId === "string" && identity.activityId.trim()) {
    return identity.activityId.trim();
  }
  if (typeof activitySlideEntry.activityId === "string" && activitySlideEntry.activityId.trim()) {
    return activitySlideEntry.activityId.trim();
  }
  return undefined;
}

const IDENTITY_LIFECYCLE_CATEGORY = "Identity & Lifecycle";

function setSlideOrderIndex(slideEntry: ObjectEntry, orderIndex: number): void {
  const structure = slideEntry[STRUCTURE_CATEGORY];
  slideEntry[STRUCTURE_CATEGORY] = {
    ...(isObjectRecord(structure) ? structure : {}),
    orderIndex: String(orderIndex),
  };
}

export function applyGroupSlidesPlanOrderIndexes(
  groupEntry: ObjectEntry,
  slides: ObjectEntry[],
  activitySlides: ObjectEntry[]
): { slides: ObjectEntry[]; activitySlides: ObjectEntry[] } {
  const structure = groupEntry[STRUCTURE_CATEGORY];
  const planRaw = isObjectRecord(structure)
    ? structure.groupSlidesPlan ?? structure.groupPlan
    : undefined;
  const planEntries = parseGroupSlidesPlan(planRaw);
  if (planEntries.length === 0) {
    return { slides, activitySlides };
  }

  const nextSlides = slides.map((slide) => ({ ...slide }));
  const nextActivitySlides = activitySlides.map((slide) => ({ ...slide }));

  for (const planItem of planEntries) {
    if (planItem.slideType === "activitySlide" && planItem.activityId) {
      const match = nextActivitySlides.find((slide) => readActivityId(slide) === planItem.activityId);
      if (match) {
        setSlideOrderIndex(match, planItem.orderIndex);
      }
      continue;
    }

    if (planItem.slideType === "textSlide" && planItem.textSubtype) {
      const match = nextSlides.find((slide) => readTextSubtype(slide) === planItem.textSubtype);
      if (match) {
        setSlideOrderIndex(match, planItem.orderIndex);
      }
    }
  }

  return { slides: nextSlides, activitySlides: nextActivitySlides };
}

export function collectOrderIndexPatchesFromNestedLesson(
  lessonEntry: ObjectEntry
): Array<{ table: "slides" | "activity_slides"; slideId: string; orderIndex: number }> {
  const patches: Array<{ table: "slides" | "activity_slides"; slideId: string; orderIndex: number }> = [];
  const groupsRaw = lessonEntry.groups;
  if (!Array.isArray(groupsRaw)) {
    return patches;
  }

  for (const groupRaw of groupsRaw) {
    if (!isObjectRecord(groupRaw)) {
      continue;
    }
    const slidesRaw = groupRaw.slides;
    const activitySlidesRaw = groupRaw.activitySlides;
    const slides = Array.isArray(slidesRaw)
      ? slidesRaw.filter((entry): entry is ObjectEntry => isObjectRecord(entry))
      : [];
    const activitySlides = Array.isArray(activitySlidesRaw)
      ? activitySlidesRaw.filter((entry): entry is ObjectEntry => isObjectRecord(entry))
      : [];

    const normalized = applyGroupSlidesPlanOrderIndexes(groupRaw, slides, activitySlides);

    for (const slide of normalized.slides) {
      const slideId = slide.slideId;
      const orderIndexRaw = isObjectRecord(slide[STRUCTURE_CATEGORY])
        ? slide[STRUCTURE_CATEGORY].orderIndex
        : undefined;
      const orderIndex = Number(orderIndexRaw);
      if (typeof slideId === "string" && Number.isInteger(orderIndex) && orderIndex >= 1) {
        patches.push({ table: "slides", slideId, orderIndex });
      }
    }

    for (const activitySlide of normalized.activitySlides) {
      const slideId = activitySlide.slideId;
      const orderIndexRaw = isObjectRecord(activitySlide[STRUCTURE_CATEGORY])
        ? activitySlide[STRUCTURE_CATEGORY].orderIndex
        : undefined;
      const orderIndex = Number(orderIndexRaw);
      if (typeof slideId === "string" && Number.isInteger(orderIndex) && orderIndex >= 1) {
        patches.push({ table: "activity_slides", slideId, orderIndex });
      }
    }
  }

  return patches;
}
