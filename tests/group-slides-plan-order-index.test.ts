import assert from "node:assert/strict";
import test from "node:test";
import { applyGroupSlidesPlanOrderIndexes, parseGroupSlidesPlan } from "@/lib/groupSlidesPlanOrderIndex";

const STRUCTURE_CATEGORY = "Structure & Sequencing";

function readStructureOrderIndex(slide: Record<string, unknown> | undefined): string | undefined {
  const structure = slide?.[STRUCTURE_CATEGORY];
  if (typeof structure !== "object" || structure === null || Array.isArray(structure)) {
    return undefined;
  }
  const orderIndex = (structure as Record<string, unknown>).orderIndex;
  return typeof orderIndex === "string" ? orderIndex : undefined;
}

test("parseGroupSlidesPlan reads newline-delimited plan rows", () => {
  const plan =
    '{"orderIndex":1,"slideType":"textSlide","textSubtype":"explanation"}\n' +
    '{"orderIndex":3,"slideType":"activitySlide","activityId":"ACT-009"}';

  const entries = parseGroupSlidesPlan(plan);
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.orderIndex, 1);
  assert.equal(entries[1]?.activityId, "ACT-009");
});

test("applyGroupSlidesPlanOrderIndexes assigns unified order within mixed groups", () => {
  const groupEntry = {
    "Structure & Sequencing": {
      groupSlidesPlan:
        '{"orderIndex":1,"slideType":"textSlide","textSubtype":"explanation"}\n' +
        '{"orderIndex":2,"slideType":"textSlide","textSubtype":"example"}\n' +
        '{"orderIndex":3,"slideType":"activitySlide","activityId":"ACT-009"}\n' +
        '{"orderIndex":4,"slideType":"activitySlide","activityId":"ACT-010"}',
    },
  };

  const slides = [
    {
      slideId: "text-1",
      "Content & Media": { textSubtype: "explanation" },
      "Structure & Sequencing": { orderIndex: "1" },
    },
    {
      slideId: "text-2",
      "Content & Media": { textSubtype: "example" },
      "Structure & Sequencing": { orderIndex: "2" },
    },
  ];

  const activitySlides = [
    {
      slideId: "act-9",
      "Identity & Lifecycle": { activityId: "ACT-009" },
      "Structure & Sequencing": { orderIndex: "1" },
    },
    {
      slideId: "act-10",
      "Identity & Lifecycle": { activityId: "ACT-010" },
      "Structure & Sequencing": { orderIndex: "2" },
    },
  ];

  const ordered = applyGroupSlidesPlanOrderIndexes(groupEntry, slides, activitySlides);
  assert.equal(readStructureOrderIndex(ordered.activitySlides[0]), "3");
  assert.equal(readStructureOrderIndex(ordered.activitySlides[1]), "4");
});
