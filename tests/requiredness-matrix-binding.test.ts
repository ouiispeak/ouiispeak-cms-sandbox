import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVE_ACTIVITY_SHAPE_LOCK_MAP } from "@/lib/activityShapeLock";
import {
  buildActivityShapeLockMapFromRequirednessMatrix,
  buildCategoryPayloadRequirednessRuleFromRequirednessMatrix,
  loadRequirednessMatrixRows,
} from "@/lib/requirednessMatrix";

test("requiredness matrix has no unknown ingest/runtime flags", () => {
  const rows = loadRequirednessMatrixRows();
  const unknownRows = rows.filter((row) => {
    const ingest = row.required_at_ingest.toLowerCase();
    const runtime = row.required_for_runtime.toLowerCase();
    return ingest === "unknown" || runtime === "unknown";
  });

  assert.equal(unknownRows.length, 0, "Requiredness matrix contains UNKNOWN ingest/runtime rows.");
});

test("activity shape-lock map is derived from requiredness matrix", () => {
  const matrixDrivenMap = buildActivityShapeLockMapFromRequirednessMatrix();
  assert.deepEqual(ACTIVE_ACTIVITY_SHAPE_LOCK_MAP, matrixDrivenMap);
});

test("matrix-driven activity shape-lock includes active ACT-001..005 and ACT-009..ACT-026", () => {
  const actIds = Object.keys(ACTIVE_ACTIVITY_SHAPE_LOCK_MAP).sort();
  const expectedActIds = [
    "ACT-001",
    "ACT-002",
    "ACT-003",
    "ACT-004",
    "ACT-005",
    "ACT-009",
    "ACT-010",
    "ACT-011",
    "ACT-012",
    "ACT-013",
    "ACT-014",
    "ACT-015",
    "ACT-016",
    "ACT-017",
    "ACT-018",
    "ACT-019",
    "ACT-020",
    "ACT-021",
    "ACT-022",
    "ACT-023",
    "ACT-024",
    "ACT-025",
    "ACT-026",
  ];

  assert.deepEqual(actIds, expectedActIds);
});

test("matrix-driven category payload requiredness exists for non-activity components", () => {
  for (const componentName of ["modules", "lessons", "groups", "slides", "title_slides", "lesson_ends"]) {
    const rule = buildCategoryPayloadRequirednessRuleFromRequirednessMatrix(componentName);
    assert.ok(rule.requiredAll.length > 0, `${componentName} should have at least one required_at_ingest field.`);
  }
});
