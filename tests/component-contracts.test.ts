import test from "node:test";
import assert from "node:assert/strict";
import { assertRequiredFieldValues, parseFieldInputsFromPayloadEntry, type FieldInputMap } from "../lib/componentCore";
import type { UniversalConfigField } from "../lib/universalConfigs";

test("required-field gate rejects missing required values", () => {
  const categories = [
    {
      key: "Identity & Lifecycle",
      label: "Identity & Lifecycle",
      fields: [
        {
          key: "title",
          label: "Title",
          inputType: "text" as const,
          options: [],
          selectSource: null,
          isReadOnly: false,
          descriptor: "text field",
          isRequired: true,
        },
      ],
    },
  ];

  const values: FieldInputMap = new Map();

  assert.throws(() => {
    assertRequiredFieldValues(values, categories, new Set(["id"]), "Create/import", "module");
  }, /requires non-empty module fields: title/i);
});

test("system-controlled id is blocked in imported category payloads", () => {
  const allowedFields = new Set(["Identity & Lifecycle.moduleId", "Identity & Lifecycle.title"]);
  const entry = {
    "Identity & Lifecycle": {
      moduleId: "123",
      title: "Example",
    },
  };

  assert.throws(() => {
    parseFieldInputsFromPayloadEntry({
      entry,
      allowedFields,
      componentLabel: "module",
      ignoredTopLevelKeys: new Set(["moduleId"]),
      systemControlledFieldNames: new Set(["moduleId"]),
    });
  }, /system-controlled "moduleId" and cannot be imported/i);
});

test("group import accepts canonical field keys", () => {
  const allowedFields = new Set(["Identity & Lifecycle.title"]);
  const entry = {
    "Identity & Lifecycle": {
      title: "Unscoped",
    },
  };

  const values = parseFieldInputsFromPayloadEntry({
    entry,
    allowedFields,
    componentLabel: "group",
    ignoredTopLevelKeys: new Set(["groupId", "lessonId"]),
    systemControlledFieldNames: new Set(["groupId"]),
  });

  assert.equal(values.get("Identity & Lifecycle.title"), "Unscoped");
});

test("parent linkage key is blocked inside category payloads", () => {
  const allowedFields = new Set(["Identity & Lifecycle.moduleId", "Identity & Lifecycle.title"]);
  const entry = {
    "Identity & Lifecycle": {
      moduleId: "1fb68633-d9f7-43e3-8dcd-3f6ea82e8adb",
      title: "Example",
    },
  };

  assert.throws(() => {
    parseFieldInputsFromPayloadEntry({
      entry,
      allowedFields,
      componentLabel: "lesson",
      ignoredTopLevelKeys: new Set(["lessonId", "moduleId"]),
      systemControlledFieldNames: new Set(["lessonId"]),
      topLevelOnlyFieldNames: new Set(["moduleId"]),
    });
  }, /top-level-only "moduleId" and cannot be imported in category payloads/i);
});

test("structured json/list field payloads are accepted and serialized", () => {
  const allowedFields = new Set(["Content & Media.buttons", "Activities & Interaction.wordBank"]);
  const fieldInputTypes: Map<string, UniversalConfigField["inputType"]> = new Map([
    ["Content & Media.buttons", "json"],
    ["Activities & Interaction.wordBank", "list"],
  ]);
  const entry = {
    "Content & Media": {
      buttons: { label: "Start", action: "begin" },
    },
    "Activities & Interaction": {
      wordBank: ["hello", "world"],
    },
  };

  const values = parseFieldInputsFromPayloadEntry({
    entry,
    allowedFields,
    fieldInputTypes,
    componentLabel: "lesson",
    ignoredTopLevelKeys: new Set(["lessonId", "moduleId"]),
    systemControlledFieldNames: new Set(["lessonId"]),
  });

  assert.equal(values.get("Content & Media.buttons"), JSON.stringify({ label: "Start", action: "begin" }));
  assert.equal(values.get("Activities & Interaction.wordBank"), JSON.stringify(["hello", "world"]));
});

test("object payload on text field is rejected", () => {
  const allowedFields = new Set(["Identity & Lifecycle.title"]);
  const fieldInputTypes: Map<string, UniversalConfigField["inputType"]> = new Map([
    ["Identity & Lifecycle.title", "text"],
  ]);
  const entry = {
    "Identity & Lifecycle": {
      title: { value: "Wrong shape" },
    },
  };

  assert.throws(() => {
    parseFieldInputsFromPayloadEntry({
      entry,
      allowedFields,
      fieldInputTypes,
      componentLabel: "module",
      ignoredTopLevelKeys: new Set(["moduleId"]),
      systemControlledFieldNames: new Set(["moduleId"]),
    });
  }, /must be a string, number, boolean, or null/i);
});
