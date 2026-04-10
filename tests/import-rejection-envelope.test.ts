import test from "node:test";
import assert from "node:assert/strict";
import {
  buildImportRejectionEnvelope,
  IMPORT_REJECTION_CONTRACT_VERSION,
} from "../lib/importGate";

test("generic import rejection envelope deterministically classifies required-field failures", () => {
  const payload = [
    {
      slideId: "12121212-1212-4121-8121-121212121212",
      "Identity & Lifecycle": {
        type: "activity",
      },
    },
  ];

  const first = buildImportRejectionEnvelope({
    component: "slides",
    mode: "create",
    stage: "import",
    payload,
    error: new Error("Create import entry 1: Slide create import entry 1 requires non-empty slide fields: title, type."),
  });
  const second = buildImportRejectionEnvelope({
    component: "slides",
    mode: "create",
    stage: "import",
    payload,
    error: new Error("Create import entry 1: Slide create import entry 1 requires non-empty slide fields: title, type."),
  });

  assert.equal(first.code, "IMPORT_REQUIRED_FIELD_MISSING");
  assert.equal(first.field, "title");
  assert.equal(first.code, second.code);
  assert.equal(first.field, second.field);
  assert.equal(first.slideId, "12121212-1212-4121-8121-121212121212");
  assert.equal(first.contractVersion, IMPORT_REJECTION_CONTRACT_VERSION);
  assert.match(first.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("generic import rejection envelope normalizes import-stage RPC failures", () => {
  const envelope = buildImportRejectionEnvelope({
    component: "lesson_ends",
    mode: "update",
    stage: "import",
    payload: [
      {
        slideId: "34343434-3434-4343-8343-343434343434",
      },
    ],
    error: new Error('new row violates check constraint "lesson_end_field_values_no_system_slide_id_check"'),
  });

  assert.equal(envelope.code, "IMPORT_RPC_FAILURE");
  assert.equal(envelope.field, null);
  assert.equal(envelope.operation, "import_update");
  assert.equal(envelope.slideId, "34343434-3434-4343-8343-343434343434");
});

test("generic import rejection envelope classifies missing upload file deterministically", () => {
  const first = buildImportRejectionEnvelope({
    component: "modules",
    mode: "create",
    stage: "form_data",
    payload: undefined,
    error: new Error('Missing uploaded file field "file".'),
  });
  const second = buildImportRejectionEnvelope({
    component: "modules",
    mode: "create",
    stage: "form_data",
    payload: undefined,
    error: new Error('Missing uploaded file field "file".'),
  });

  assert.equal(first.code, "IMPORT_MISSING_FILE");
  assert.equal(first.field, "file");
  assert.equal(first.code, second.code);
  assert.equal(first.field, second.field);
  assert.equal(first.activityId, null);
  assert.equal(first.slideId, null);
});
