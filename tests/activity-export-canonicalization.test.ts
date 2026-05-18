import test from "node:test";
import assert from "node:assert/strict";
import {
  buildActivityPropsJsonTemplate,
  canonicalizeActivityExportTemplate,
} from "../lib/activityExportCanonicalization";
import { listActivityProfileExtraFieldKeys } from "../lib/activityProfiles";

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

test("buildActivityPropsJsonTemplate derives ACT scaffold from profile, shape-lock, and runtime defaults", () => {
  const act009 = buildActivityPropsJsonTemplate(
    "ACT-009",
    listActivityProfileExtraFieldKeys("act-009")
  );
  const act018 = buildActivityPropsJsonTemplate(
    "ACT-018",
    listActivityProfileExtraFieldKeys("act-018")
  );

  assert.deepEqual(act009.runtimeContractV1, {
    contractVersion: "v1",
    interaction: {
      activity_row_tool: "AudioChoiceSelector",
      command_row_controls: ["play"],
      status: "active",
    },
  });
  assert.deepEqual(act009.choiceElements, [{ label: "" }, { label: "" }]);
  assert.equal(act009.correctAnswer, "");
  assert.deepEqual(act009.audioPrompt, {
    speech: {
      mode: "tts",
      text: "",
    },
  });
  assert.deepEqual(act009.audio, {
    speech: {
      mode: "tts",
      text: "",
    },
  });

  assert.deepEqual(act018.runtimeContractV1, {
    contractVersion: "v1",
    interaction: {
      activity_row_tool: "WordBankInput",
      command_row_controls: [],
      status: "active",
    },
  });
  assert.deepEqual(act018.wordBank, []);
  assert.deepEqual(act018.sentenceWithGaps, [
    {
      sentence: "",
      gaps: [
        {
          position: 0,
          accepted_answers: [],
        },
      ],
    },
  ]);
  assert.notDeepEqual(act018, act009);
});
