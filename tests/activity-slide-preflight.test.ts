import test from "node:test";
import assert from "node:assert/strict";
import {
  validateActivitySlideFormDataPreflight,
  validateActivitySlideImportPayloadPreflight,
} from "../lib/activitySlidePreflight";

function validRuntimeContract(toolName: string): Record<string, unknown> {
  return {
    contractVersion: "v1",
    interaction: {
      activity_row_tool: toolName,
      command_row_controls: ["play", "pause"],
      status: "active",
    },
  };
}

test("activity preflight rejects propsJson/top-level duplicate structured fields", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-001",
        type: "activity",
      },
      "Activities & Interaction": {
        lines: [[{ label: "Duplicate", speech: { mode: "file", fileUrl: "https://example.com/a.mp3" } }]],
        propsJson: {
          runtimeContractV1: validRuntimeContract("ChipSequencePlayer"),
          lines: [[{ label: "Canonical", speech: { mode: "file", fileUrl: "https://example.com/b.mp3" } }]],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("ChipSequencePlayer"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /Remove top-level duplicate fields: lines/
  );
});

test("activity preflight rejects missing runtime contract for create", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-005",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          targetText: "I can hear the difference.",
        },
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /requires non-empty runtimeContractV1/
  );
});

test("activity preflight accepts valid ACT-005 create payload", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-005",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("SequentialRecorder"),
          targetText: "I can hear the difference.",
          lines: [
            [{ label: "I can hear the difference.", speech: { mode: "file", fileUrl: "https://example.com/a.mp3" } }],
          ],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("SequentialRecorder"),
      },
    },
  ];

  assert.doesNotThrow(() => validateActivitySlideImportPayloadPreflight(payload, "create"));
});

test("activity preflight allows update payload that only changes metadata", () => {
  const payload = [
    {
      slideId: "a24d1e1c-b422-4e08-8e4f-5dd3aae7da57",
      "Teacher Guidance": {
        teacherNotes: "Adjusted teacher note only.",
      },
    },
  ];

  assert.doesNotThrow(() => validateActivitySlideImportPayloadPreflight(payload, "update"));
});

test("activity form preflight rejects runtime mismatch between top-level and propsJson", () => {
  const formData = new FormData();
  formData.append("Identity & Lifecycle.activityId", "ACT-001");
  formData.append("Identity & Lifecycle.type", "activity");
  formData.append(
    "Activities & Interaction.propsJson",
    JSON.stringify({
      runtimeContractV1: validRuntimeContract("ChipSequencePlayer"),
      lines: [[{ label: "Bonjour", speech: { mode: "file", fileUrl: "https://example.com/a.mp3" } }]],
    })
  );
  formData.append(
    "Operations, Provenance & Governance.runtimeContractV1",
    JSON.stringify(validRuntimeContract("SequentialRecorder"))
  );

  assert.throws(
    () => validateActivitySlideFormDataPreflight(formData, "create"),
    /mismatched runtimeContractV1/
  );
});

test("activity preflight rejects inactive ACT ids", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-006",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("SequentialRecorder"),
          lines: [[{ label: "Bonjour", speech: { mode: "file", fileUrl: "https://example.com/a.mp3" } }]],
        },
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /ACT-006 is inactive/
  );
});

test("activity preflight rejects unsupported ACT ids", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-099",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("ChipSelector"),
          body: "Unsupported activity test",
        },
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /unsupported activityId "ACT-099"/
  );
});

test("activity preflight accepts valid ACT-009 payload using shape-lock rules", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-009",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("AudioChoiceSelector"),
          choiceElements: [{ label: "A" }, { label: "B" }],
          correctAnswer: "A",
          audioPrompt: {
            speech: { mode: "tts", text: "Select the right option" },
          },
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("AudioChoiceSelector"),
      },
    },
  ];

  assert.doesNotThrow(() => validateActivitySlideImportPayloadPreflight(payload, "create"));
});

test("activity preflight rejects ACT-026 payload missing required audioPrompt", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-026",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("FreeRecorder"),
          body: "Talk about your day.",
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("FreeRecorder"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /ACT-026 requires non-empty propsJson\.audioPrompt/
  );
});
