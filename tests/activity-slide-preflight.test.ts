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

test("activity preflight accepts ACT-004 payload using audioPrompt alias and canonicalizes intonation synonyms", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-004",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("ChipSelector"),
          intonationOptions: ["Question", "descending"],
          correctCurveId: "question",
          audioPrompt: {
            speech: { mode: "tts", text: "Select the contour." },
          },
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("ChipSelector"),
      },
    },
  ];

  assert.doesNotThrow(() => validateActivitySlideImportPayloadPreflight(payload, "create"));
});

test("activity preflight accepts ACT-009 payload with 1-based numeric correctAnswer", () => {
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
          correctAnswer: 2,
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

test("activity preflight rejects ACT-017 payload missing sentenceWithGaps", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-017",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("InlineGapTextInput"),
          blanks: [{ correctGapIndex: 1, acceptedAlternatives: ["bonjour"] }],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("InlineGapTextInput"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /ACT-017 requires non-empty propsJson\.sentenceWithGaps/
  );
});

test("activity preflight rejects ACT-021 payload missing correctAnswer", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-021",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("ChipAudioMatcher"),
          choiceElements: [{ label: "A" }, { label: "B" }],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("ChipAudioMatcher"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /ACT-021 requires non-empty propsJson\.correctAnswer/
  );
});

test("activity preflight rejects ACT-026 payload missing required promptText\/targetText", () => {
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
          body: " ",
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("FreeRecorder"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /ACT-026 requires non-empty propsJson\.promptText/
  );
});

test("activity preflight accepts ACT-026 payload with promptText and targetText", () => {
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
          promptText: "Describe your day.",
          targetText: "Use at least three key words.",
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("FreeRecorder"),
      },
    },
  ];

  assert.doesNotThrow(() => validateActivitySlideImportPayloadPreflight(payload, "create"));
});

test("activity preflight rejects ACT-015 payload with sentence token/order mismatch", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-015",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("ChipSequenceBuilder"),
          sentenceTokens: ["I", "am", "ready"],
          correctOrderWords: ["ready", "I"],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("ChipSequenceBuilder"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /sentenceTokens and correctOrderWords to have equal lengths/
  );
});

test("activity preflight rejects ACT-017 payload with out-of-range blank index", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-017",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("InlineGapTextInput"),
          sentenceWithGaps: "She eats an apple",
          blanks: [{ correctGapIndex: 6, acceptedAlternatives: ["eats"] }],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("InlineGapTextInput"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /correctGapIndex must be within sentenceWithGaps token bounds/
  );
});

test("activity preflight rejects ACT-018 payload with accepted_answers outside wordBank", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-018",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("WordBankInput"),
          wordBank: ["apple", "banana"],
          sentenceWithGaps: [
            {
              sentence: "She eats an apple",
              gaps: [
                {
                  position: 4,
                  accepted_answers: ["pear"],
                },
              ],
            },
          ],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("WordBankInput"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /accepted_answers must reference values present in wordBank/
  );
});

test("activity preflight accepts ACT-018 payload with canonical gap objects", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-018",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("WordBankInput"),
          wordBank: ["have", "had", "will have", "eat"],
          sentenceWithGaps: [
            {
              sentence: "I have a cat.",
              gaps: [
                {
                  position: 2,
                  accepted_answers: ["have", "had", "will have"],
                },
              ],
            },
          ],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("WordBankInput"),
      },
    },
  ];

  assert.doesNotThrow(() => validateActivitySlideImportPayloadPreflight(payload, "create"));
});

test("activity preflight rejects ACT-023 payload with empty turn responses", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-023",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("AvatarDialoguePlayer"),
          avatarDialogues: [
            {
              id: "turn-1",
              avatarLine: "Hello",
              audio: {
                speech: { mode: "tts", text: "Hello" },
              },
              correctResponses: [],
            },
          ],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("AvatarDialoguePlayer"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /requires each turn to include at least one correctResponses entry/
  );
});

test("activity preflight rejects ACT-023 payload missing avatarLine", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-023",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("AvatarDialoguePlayer"),
          avatarDialogues: [
            {
              id: "turn-1",
              audioFile: "https://example.com/hello.mp3",
              correctResponses: ["hello"],
            },
          ],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("AvatarDialoguePlayer"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /ACT-023 requires each turn to include non-empty avatarLine/
  );
});

test("activity preflight rejects ACT-023 payload missing turn audio", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-023",
        type: "activity",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: validRuntimeContract("AvatarDialoguePlayer"),
          avatarDialogues: [
            {
              id: "turn-1",
              avatarLine: "Hello there",
              correctResponses: ["hello there"],
            },
          ],
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: validRuntimeContract("AvatarDialoguePlayer"),
      },
    },
  ];

  assert.throws(
    () => validateActivitySlideImportPayloadPreflight(payload, "create"),
    /ACT-023 requires each turn to include audioFile or audio\.speech/
  );
});
