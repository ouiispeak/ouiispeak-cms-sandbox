import test from "node:test";
import assert from "node:assert/strict";
import type { UniversalConfigCategory, UniversalConfigField } from "../lib/universalConfigs";
import { assertExportRuntimeGate } from "../lib/exportRuntimeGate";

function makeField(
  key: string,
  inputType: UniversalConfigField["inputType"] = "text"
): UniversalConfigField {
  return {
    key,
    label: key,
    inputType,
    options: [],
    selectSource: null,
    isReadOnly: false,
    descriptor: `${inputType} field`,
    isRequired: false,
  };
}

function makeCategory(key: string, fields: UniversalConfigField[]): UniversalConfigCategory {
  return {
    key,
    label: key,
    fields,
  };
}

test("export runtime gate fails closed when modules.slug is missing", () => {
  const categories: UniversalConfigCategory[] = [
    makeCategory("Identity & Lifecycle", [makeField("title"), makeField("slug")]),
  ];

  const payload: Record<string, unknown> = {
    moduleId: "11111111-1111-4111-8111-111111111111",
    "Identity & Lifecycle": {
      title: "Module title",
      slug: "",
    },
  };

  assert.throws(
    () => assertExportRuntimeGate("modules", categories, payload, "Module export"),
    /missing required runtime fields: slug/i
  );
});

test("export runtime gate fails closed when ACT-009 propsJson.correctAnswer is missing", () => {
  const categories: UniversalConfigCategory[] = [
    makeCategory("Identity & Lifecycle", [
      makeField("activityId"),
      makeField("type"),
      makeField("orderIndex", "number"),
    ]),
    makeCategory("Activities & Interaction", [makeField("propsJson", "json")]),
  ];

  const payload: Record<string, unknown> = {
    slideId: "55555555-5555-4555-8555-555555555555",
    groupId: "33333333-3333-4333-8333-333333333333",
    "Identity & Lifecycle": {
      activityId: "ACT-009",
      type: "activity",
      orderIndex: 7,
    },
    "Activities & Interaction": {
      propsJson: {
        runtimeContractV1: {
          contractVersion: "v1",
          interaction: {
            activity_row_tool: "AudioChoiceSelector",
            command_row_controls: ["play"],
            status: "active",
          },
        },
        choiceElements: [{ label: "A" }, { label: "B" }],
        audioPrompt: { mode: "tts", text: "Prompt text" },
      },
    },
  };

  assert.throws(
    () => assertExportRuntimeGate("activity_slides", categories, payload, "Activity slide export"),
    /missing required runtime propsJson fields for ACT-009: correctAnswer/i
  );
});

test("export runtime gate fails closed when ACT-005 propsJson one-of recorder source is missing", () => {
  const categories: UniversalConfigCategory[] = [
    makeCategory("Identity & Lifecycle", [
      makeField("activityId"),
      makeField("type"),
      makeField("orderIndex", "number"),
    ]),
    makeCategory("Activities & Interaction", [makeField("propsJson", "json")]),
  ];

  const payload: Record<string, unknown> = {
    slideId: "66666666-6666-4666-8666-666666666666",
    groupId: "33333333-3333-4333-8333-333333333333",
    "Identity & Lifecycle": {
      activityId: "ACT-005",
      type: "activity",
      orderIndex: 6,
    },
    "Activities & Interaction": {
      propsJson: {
        runtimeContractV1: {
          contractVersion: "v1",
          interaction: {
            activity_row_tool: "SequentialRecorder",
            command_row_controls: ["play", "pause"],
            status: "active",
          },
        },
      },
    },
  };

  assert.throws(
    () => assertExportRuntimeGate("activity_slides", categories, payload, "Activity slide export"),
    /missing required one-of propsJson groups for ACT-005/i
  );
});

test("export runtime gate accepts valid ACT-009 runtime payload", () => {
  const categories: UniversalConfigCategory[] = [
    makeCategory("Identity & Lifecycle", [
      makeField("activityId"),
      makeField("type"),
      makeField("orderIndex", "number"),
    ]),
    makeCategory("Activities & Interaction", [makeField("propsJson", "json")]),
  ];

  const payload: Record<string, unknown> = {
    slideId: "77777777-7777-4777-8777-777777777777",
    groupId: "33333333-3333-4333-8333-333333333333",
    "Identity & Lifecycle": {
      activityId: "ACT-009",
      type: "activity",
      orderIndex: 7,
    },
    "Activities & Interaction": {
      propsJson: {
        runtimeContractV1: {
          contractVersion: "v1",
          interaction: {
            activity_row_tool: "AudioChoiceSelector",
            command_row_controls: ["play"],
            status: "active",
          },
        },
        choiceElements: [{ label: "A" }, { label: "B" }],
        correctAnswer: "A",
        audioPrompt: { mode: "tts", text: "Prompt text" },
      },
    },
  };

  assert.doesNotThrow(() =>
    assertExportRuntimeGate("activity_slides", categories, payload, "Activity slide export")
  );
});
