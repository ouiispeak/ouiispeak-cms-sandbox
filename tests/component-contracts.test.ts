import test from "node:test";
import assert from "node:assert/strict";
import { assertRequiredFieldValues, parseFieldInputsFromPayloadEntry, type FieldInputMap } from "../lib/componentCore";

test("required-field gate rejects missing required values", () => {
  const categories = [
    {
      key: "Identity and Hiearchy",
      label: "Identity and Hiearchy",
      fields: [
        {
          key: "title",
          label: "Title",
          inputType: "text" as const,
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
  const allowedFields = new Set(["Identity and Hiearchy.moduleId", "Identity and Hiearchy.title"]);
  const entry = {
    "Identity and Hiearchy": {
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
  const allowedFields = new Set(["Identity and Hiearchy.title"]);
  const entry = {
    "Identity and Hiearchy": {
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

  assert.equal(values.get("Identity and Hiearchy.title"), "Unscoped");
});
