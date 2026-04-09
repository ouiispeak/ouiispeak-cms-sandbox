import test from "node:test";
import assert from "node:assert/strict";
import { buildActivityImportRejectionEnvelope } from "../lib/activityIngestRejection";

const DUPLICATE_LINES_ERROR =
  'Create import entry 1: Activity slide create import entry 1 must keep structured payload in propsJson only. Remove top-level duplicate fields: lines, buttons.';

test("activity ingest rejection envelope is deterministic for duplicate structured fields", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-001",
        slideId: "12121212-1212-4121-8121-121212121212",
      },
    },
  ];

  const first = buildActivityImportRejectionEnvelope({
    mode: "create",
    stage: "import",
    payload,
    error: new Error(DUPLICATE_LINES_ERROR),
  });
  const second = buildActivityImportRejectionEnvelope({
    mode: "create",
    stage: "import",
    payload,
    error: new Error(DUPLICATE_LINES_ERROR),
  });

  assert.equal(first.code, "ACTIVITY_IMPORT_STRUCTURED_OVERRIDE_CONFLICT");
  assert.equal(first.field, "lines");
  assert.equal(first.code, second.code);
  assert.equal(first.field, second.field);
});

test("activity ingest rejection envelope maps missing runtime contract to deterministic code+field", () => {
  const payload = [
    {
      groupId: "376913db-4f97-46f5-b5fa-b854b849f436",
      "Identity & Lifecycle": {
        activityId: "ACT-005",
      },
    },
  ];

  const first = buildActivityImportRejectionEnvelope({
    mode: "create",
    stage: "import",
    payload,
    error: new Error("Create import entry 1: Activity slide create import entry 1 requires non-empty runtimeContractV1."),
  });
  const second = buildActivityImportRejectionEnvelope({
    mode: "create",
    stage: "import",
    payload,
    error: new Error("Create import entry 1: Activity slide create import entry 1 requires non-empty runtimeContractV1."),
  });

  assert.equal(first.code, "ACTIVITY_IMPORT_RUNTIME_CONTRACT_INVALID");
  assert.equal(first.field, "runtimeContractV1");
  assert.equal(first.code, second.code);
  assert.equal(first.field, second.field);
});

test("activity ingest rejection envelope normalizes import-stage RPC failures", () => {
  const envelope = buildActivityImportRejectionEnvelope({
    mode: "update",
    stage: "import",
    payload: [
      {
        slideId: "12121212-1212-4121-8121-121212121212",
        "Identity & Lifecycle": {
          activityId: "ACT-009",
        },
      },
    ],
    error: new Error("new row violates check constraint \"activity_slide_field_values_no_system_slide_id_check\""),
  });

  assert.equal(envelope.code, "ACTIVITY_RPC_FAILURE");
  assert.equal(envelope.field, null);
  assert.equal(envelope.operation, "import_update");
  assert.equal(envelope.activityId, "ACT-009");
  assert.equal(envelope.slideId, "12121212-1212-4121-8121-121212121212");
});
