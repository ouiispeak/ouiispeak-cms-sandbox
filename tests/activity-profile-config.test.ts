import test from "node:test";
import assert from "node:assert/strict";
import {
  filterActivitySlideCategoriesForProfile,
  resolveActivityProfile,
  resolveConcreteActivityProfile,
  resolveConcreteActivityProfileFromActivityId,
} from "@/lib/activityProfiles";
import type { UniversalConfigCategory } from "@/lib/universalConfigs";

const SAMPLE_ACTIVITY_CATEGORY: UniversalConfigCategory = {
  key: "Activities & Interaction",
  label: "Activities & Interaction",
  fields: [
    {
      key: "lines",
      label: "Lines",
      inputType: "audio_lines_mapper",
      options: [],
      selectSource: null,
      isReadOnly: false,
      descriptor: "audio_lines_mapper field",
      isRequired: false,
    },
    {
      key: "audioPrompt",
      label: "Audio Prompt",
      inputType: "audio_prompt",
      options: [],
      selectSource: null,
      isReadOnly: false,
      descriptor: "audio_prompt field",
      isRequired: false,
    },
    {
      key: "choiceElements",
      label: "Choice Elements",
      inputType: "choice_elements_mapper",
      options: [],
      selectSource: null,
      isReadOnly: false,
      descriptor: "choice_elements_mapper field",
      isRequired: false,
    },
    {
      key: "promptMode",
      label: "Prompt Mode",
      inputType: "select",
      options: ["same_different", "select_word"],
      selectSource: null,
      isReadOnly: false,
      descriptor: "select field",
      isRequired: false,
    },
    {
      key: "correctStressIndex",
      label: "Correct Stress Index",
      inputType: "number",
      options: [],
      selectSource: null,
      isReadOnly: false,
      descriptor: "number field",
      isRequired: false,
    },
    {
      key: "syllableBreakdown",
      label: "Syllable Breakdown",
      inputType: "textarea",
      options: [],
      selectSource: null,
      isReadOnly: false,
      descriptor: "textarea field",
      isRequired: false,
    },
    {
      key: "runtimeContractV1",
      label: "Runtime Contract V1",
      inputType: "json",
      options: [],
      selectSource: null,
      isReadOnly: false,
      descriptor: "json field",
      isRequired: false,
    },
    {
      key: "intonationOptions",
      label: "Intonation Options",
      inputType: "textarea",
      options: [],
      selectSource: null,
      isReadOnly: false,
      descriptor: "textarea field",
      isRequired: false,
    },
    {
      key: "correctCurveId",
      label: "Correct Curve Id",
      inputType: "select",
      options: ["rising", "falling", "fall-rise"],
      selectSource: null,
      isReadOnly: false,
      descriptor: "select field",
      isRequired: false,
    },
  ],
};

test("activity profile resolvers are deterministic", () => {
  assert.equal(resolveActivityProfile("act-005"), "act-005");
  assert.equal(resolveActivityProfile("act-009"), "act-009");
  assert.equal(resolveActivityProfile("act-010"), "act-010");
  assert.equal(resolveActivityProfile("act-026"), "act-026");
  assert.equal(resolveActivityProfile("act-004"), "act-004");
  assert.equal(resolveActivityProfile("act-003"), "act-003");
  assert.equal(resolveActivityProfile("unknown"), "default");
  assert.equal(resolveConcreteActivityProfile("default"), "act-001");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-002"), "act-002");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-003"), "act-003");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-004"), "act-004");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-005"), "act-005");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-009"), "act-009");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-010"), "act-010");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-011"), "act-011");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-012"), "act-012");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-013"), "act-013");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-014"), "act-014");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-015"), "act-015");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-016"), "act-016");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-017"), "act-017");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-018"), "act-018");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-019"), "act-019");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-020"), "act-020");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-021"), "act-021");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-022"), "act-022");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-023"), "act-023");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-024"), "act-024");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-025"), "act-025");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-026"), "act-026");
  assert.equal(resolveConcreteActivityProfileFromActivityId("ACT-001"), "act-001");
});

test("ACT-001 exposes lines and hides ACT-002/003 only fields", () => {
  const filtered = filterActivitySlideCategoriesForProfile([SAMPLE_ACTIVITY_CATEGORY], "act-001");
  const fieldKeys = new Set(filtered[0]?.fields.map((field) => field.key) ?? []);

  assert.equal(fieldKeys.has("lines"), true);
  assert.equal(fieldKeys.has("audioPrompt"), false);
  assert.equal(fieldKeys.has("choiceElements"), false);
  assert.equal(fieldKeys.has("promptMode"), false);
});

test("ACT-002 exposes stress/audio prompt fields and hides lines", () => {
  const filtered = filterActivitySlideCategoriesForProfile([SAMPLE_ACTIVITY_CATEGORY], "act-002");
  const fieldKeys = new Set(filtered[0]?.fields.map((field) => field.key) ?? []);

  assert.equal(fieldKeys.has("audioPrompt"), true);
  assert.equal(fieldKeys.has("correctStressIndex"), true);
  assert.equal(fieldKeys.has("syllableBreakdown"), true);
  assert.equal(fieldKeys.has("lines"), false);
});

test("ACT-003 exposes minimal-pair fields and hides lines", () => {
  const filtered = filterActivitySlideCategoriesForProfile([SAMPLE_ACTIVITY_CATEGORY], "act-003");
  const fieldKeys = new Set(filtered[0]?.fields.map((field) => field.key) ?? []);

  assert.equal(fieldKeys.has("choiceElements"), true);
  assert.equal(fieldKeys.has("promptMode"), true);
  assert.equal(fieldKeys.has("lines"), false);
});

test("ACT-004 exposes intonation curve fields and hides lines/ACT-003 fields", () => {
  const filtered = filterActivitySlideCategoriesForProfile([SAMPLE_ACTIVITY_CATEGORY], "act-004");
  const fieldKeys = new Set(filtered[0]?.fields.map((field) => field.key) ?? []);

  assert.equal(fieldKeys.has("audioPrompt"), true);
  assert.equal(fieldKeys.has("intonationOptions"), true);
  assert.equal(fieldKeys.has("correctCurveId"), true);
  assert.equal(fieldKeys.has("lines"), false);
  assert.equal(fieldKeys.has("choiceElements"), false);
  assert.equal(fieldKeys.has("promptMode"), false);
});

test("ACT-005 exposes recorder source fields and hides ACT-003/004 fields", () => {
  const filtered = filterActivitySlideCategoriesForProfile([SAMPLE_ACTIVITY_CATEGORY], "act-005");
  const fieldKeys = new Set(filtered[0]?.fields.map((field) => field.key) ?? []);

  assert.equal(fieldKeys.has("lines"), true);
  assert.equal(fieldKeys.has("choiceElements"), false);
  assert.equal(fieldKeys.has("promptMode"), false);
  assert.equal(fieldKeys.has("intonationOptions"), false);
  assert.equal(fieldKeys.has("correctCurveId"), false);
});

test("default activity profile hides ACT-specific interaction fields", () => {
  const filtered = filterActivitySlideCategoriesForProfile([SAMPLE_ACTIVITY_CATEGORY], "default");
  const fieldKeys = new Set(filtered[0]?.fields.map((field) => field.key) ?? []);

  assert.equal(fieldKeys.has("lines"), false);
  assert.equal(fieldKeys.has("audioPrompt"), false);
  assert.equal(fieldKeys.has("choiceElements"), false);
  assert.equal(fieldKeys.has("promptMode"), false);
  assert.equal(fieldKeys.has("correctStressIndex"), false);
  assert.equal(fieldKeys.has("intonationOptions"), false);
  assert.equal(fieldKeys.has("correctCurveId"), false);
  assert.equal(fieldKeys.has("runtimeContractV1"), true);
});
