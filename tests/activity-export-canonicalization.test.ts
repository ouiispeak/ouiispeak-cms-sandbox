import test from "node:test";
import assert from "node:assert/strict";
import { canonicalizeActivityExportTemplate } from "../lib/activityExportCanonicalization";

test("canonicalizeActivityExportTemplate keeps structured ACT payload in propsJson only", () => {
  const template = {
    "Identity & Lifecycle": {
      type: "activity",
      activityId: "ACT-009",
      orderIndex: 2,
    },
    "Content & Media": {
      body: "legacy top-level body",
      subtitle: "keep me",
    },
    "Activities & Interaction": {
      lines: [],
      runtimeContractV1: {
        contractVersion: "v1",
        interaction: {
          activity_row_tool: "AudioChoiceSelector",
          command_row_controls: ["play"],
          status: "active",
        },
      },
      choiceElements: [],
      correctAnswer: "",
      promptText: "",
      propsJson: {
        runtimeContractV1: {
          contractVersion: "v1",
          interaction: {
            activity_row_tool: "AudioChoiceSelector",
            command_row_controls: ["play"],
            status: "active",
          },
        },
        choiceElements: [
          { label: "oui", speech: { mode: "tts", text: "oui" } },
          { label: "non", speech: { mode: "tts", text: "non" } },
        ],
        correctAnswer: "oui",
        audioPrompt: {
          speech: { mode: "tts", text: "Choisis la bonne reponse" },
        },
      },
    },
  };

  const canonical = canonicalizeActivityExportTemplate(template, "ACT-009");
  const activityPayload = canonical["Activities & Interaction"] as Record<string, unknown>;
  const contentPayload = canonical["Content & Media"] as Record<string, unknown>;

  assert.equal(Object.prototype.hasOwnProperty.call(activityPayload, "lines"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(activityPayload, "runtimeContractV1"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(activityPayload, "choiceElements"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(activityPayload, "correctAnswer"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(activityPayload, "promptText"), false);

  assert.equal(Object.prototype.hasOwnProperty.call(contentPayload, "body"), false);
  assert.equal(contentPayload.subtitle, "keep me");

  const propsJson = activityPayload.propsJson as Record<string, unknown>;
  assert.ok(propsJson);
  assert.deepEqual(propsJson.audio, {
    speech: { mode: "tts", text: "Choisis la bonne reponse" },
  });
  assert.deepEqual(propsJson.choiceElements, [
    { label: "oui", speech: { mode: "tts", text: "oui" } },
    { label: "non", speech: { mode: "tts", text: "non" } },
  ]);
  assert.equal(propsJson.correctAnswer, "oui");
});

test("canonicalizeActivityExportTemplate parses string propsJson and still strips top-level structured keys", () => {
  const template = {
    "Activities & Interaction": {
      lines: [],
      propsJson: JSON.stringify({
        runtimeContractV1: {
          contractVersion: "v1",
          interaction: {
            activity_row_tool: "ChipSequencePlayer",
            command_row_controls: ["play"],
            status: "active",
          },
        },
        lines: [
          [
            {
              label: "Bonjour",
              speech: {
                mode: "tts",
                text: "Bonjour",
              },
            },
          ],
        ],
      }),
    },
  };

  const canonical = canonicalizeActivityExportTemplate(template, "ACT-001");
  const activityPayload = canonical["Activities & Interaction"] as Record<string, unknown>;

  assert.equal(Object.prototype.hasOwnProperty.call(activityPayload, "lines"), false);
  assert.equal(typeof activityPayload.propsJson, "object");
  assert.deepEqual(
    (activityPayload.propsJson as Record<string, unknown>).lines,
    [
      [
        {
          label: "Bonjour",
          speech: {
            mode: "tts",
            text: "Bonjour",
          },
        },
      ],
    ]
  );
});
