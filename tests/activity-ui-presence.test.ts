import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");

test("activity create page includes ACT-009..ACT-026 create actions", () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, "app/activity-slides/page.tsx"), "utf8");

  for (const actId of [
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
  ]) {
    assert.match(source, new RegExp(`"${actId}"`), `Missing create action seed for ${actId}`);
  }
});

test("activity config tabs include ACT-009..ACT-026 profiles", () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, "app/configs/[[...scope]]/page.tsx"), "utf8");

  for (const profile of [
    "act-009",
    "act-010",
    "act-011",
    "act-012",
    "act-013",
    "act-014",
    "act-015",
    "act-016",
    "act-017",
    "act-018",
    "act-019",
    "act-020",
    "act-021",
    "act-022",
    "act-023",
    "act-024",
    "act-025",
    "act-026",
  ]) {
    assert.match(source, new RegExp(`"${profile}"`), `Missing config tab profile ${profile}`);
  }
});
