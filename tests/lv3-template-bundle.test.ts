import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL_COMPONENT_FIELD_MAP,
  getTopLevelOnlyFieldKeys,
  type HierarchyComponentName,
} from "../lib/canonicalFieldMap";

type ManifestFile = {
  component: string;
  route: string;
  file: string;
  sha256: string;
};

type Manifest = {
  artifact: string;
  contract: string;
  sourceCommit: string;
  configSource: string;
  files: ManifestFile[];
};

const REPO_ROOT = process.cwd();
const BUNDLE_DIR = path.join(REPO_ROOT, "tests/fixtures/lv3-cms-export-template-bundle");
const MANIFEST_PATH = path.join(BUNDLE_DIR, "manifest.json");

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readManifest(): Manifest {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

function toComponentName(component: string): HierarchyComponentName {
  const baseComponent = component.split(":")[0];
  if (baseComponent in CANONICAL_COMPONENT_FIELD_MAP) {
    return baseComponent as HierarchyComponentName;
  }
  throw new Error(`Unknown fixture component "${component}".`);
}

test("LV3 CMS template bundle manifest freezes exported route artifacts", () => {
  const manifest = readManifest();

  assert.equal(manifest.artifact, "lv3-cms-export-template-bundle");
  assert.match(manifest.contract, /CMS export templates are the source of truth/);
  assert.match(manifest.contract, /rejects target component identity\/direct parent keys inside category buckets/);
  assert.match(manifest.sourceCommit, /^[0-9a-f]{40}$/);
  assert.equal(manifest.configSource, "public.config_component_fields via CMS export-json route handlers");
  assert.equal(manifest.files.length, 30);

  for (const fileEntry of manifest.files) {
    const filePath = path.join(BUNDLE_DIR, fileEntry.file);
    const fileText = fs.readFileSync(filePath, "utf8");
    assert.equal(sha256(fileText), fileEntry.sha256, `${fileEntry.file} hash drifted from manifest`);
    assert.match(fileEntry.route, /^\/api\//);
  }
});

test("LV3 CMS template bundle keeps target identity and direct parent keys out of category buckets", () => {
  const manifest = readManifest();

  for (const fileEntry of manifest.files) {
    const componentName = toComponentName(fileEntry.component);
    const componentMap = CANONICAL_COMPONENT_FIELD_MAP[componentName];
    const topLevelOnlyKeys = getTopLevelOnlyFieldKeys(componentName);
    const payload = JSON.parse(
      fs.readFileSync(path.join(BUNDLE_DIR, fileEntry.file), "utf8")
    ) as Record<string, unknown>;

    assert.ok(
      Object.prototype.hasOwnProperty.call(payload, componentMap.identityFieldKey),
      `${fileEntry.file} must include top-level ${componentMap.identityFieldKey}`
    );
    if (componentMap.parentFieldKey) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(payload, componentMap.parentFieldKey),
        `${fileEntry.file} must include top-level ${componentMap.parentFieldKey}`
      );
    }

    for (const [categoryName, categoryPayload] of Object.entries(payload)) {
      if (!isObjectRecord(categoryPayload)) {
        continue;
      }

      for (const fieldKey of topLevelOnlyKeys) {
        assert.equal(
          Object.prototype.hasOwnProperty.call(categoryPayload, fieldKey),
          false,
          `${fileEntry.file} category "${categoryName}" must not include top-level-only ${fieldKey}`
        );
      }
    }
  }
});

test("LV3 CMS template bundle excludes CMS-owned ingest audit payloads", () => {
  const manifest = readManifest();

  for (const fileEntry of manifest.files) {
    const payload = JSON.parse(
      fs.readFileSync(path.join(BUNDLE_DIR, fileEntry.file), "utf8")
    ) as Record<string, unknown>;

    for (const [categoryName, categoryPayload] of Object.entries(payload)) {
      if (!isObjectRecord(categoryPayload)) {
        continue;
      }

      assert.equal(
        Object.prototype.hasOwnProperty.call(categoryPayload, "ingestPayload"),
        false,
        `${fileEntry.file} category "${categoryName}" must not export CMS-owned ingestPayload`
      );
    }
  }
});

test("LV3 CMS activity templates are ACT-specific", () => {
  const manifest = readManifest();
  const activityFiles = manifest.files.filter((fileEntry) => fileEntry.component.startsWith("activity_slides:"));
  const activityHashes = new Set(activityFiles.map((fileEntry) => fileEntry.sha256));

  assert.ok(activityHashes.size > 1, "activity slide template exports must not all be the same generic template");

  const act009Entry = activityFiles.find((fileEntry) => fileEntry.component === "activity_slides:act-009");
  const act018Entry = activityFiles.find((fileEntry) => fileEntry.component === "activity_slides:act-018");
  assert.ok(act009Entry);
  assert.ok(act018Entry);

  const act009Payload = JSON.parse(
    fs.readFileSync(path.join(BUNDLE_DIR, act009Entry.file), "utf8")
  ) as Record<string, unknown>;
  const act018Payload = JSON.parse(
    fs.readFileSync(path.join(BUNDLE_DIR, act018Entry.file), "utf8")
  ) as Record<string, unknown>;
  const act009Identity = act009Payload["Identity & Lifecycle"] as Record<string, unknown>;
  const act018Identity = act018Payload["Identity & Lifecycle"] as Record<string, unknown>;
  const act009Activity = act009Payload["Activities & Interaction"] as Record<string, unknown>;
  const act018Activity = act018Payload["Activities & Interaction"] as Record<string, unknown>;
  const act009PropsJson = act009Activity.propsJson as Record<string, unknown>;
  const act018PropsJson = act018Activity.propsJson as Record<string, unknown>;

  assert.equal(act009Identity.activityId, "ACT-009");
  assert.equal(act018Identity.activityId, "ACT-018");
  assert.equal(act009Identity.type, "activity");
  assert.equal(act018Identity.type, "activity");
  assert.deepEqual((act009PropsJson.runtimeContractV1 as Record<string, unknown>).interaction, {
    activity_row_tool: "AudioChoiceSelector",
    command_row_controls: ["play"],
    status: "active",
  });
  assert.deepEqual((act018PropsJson.runtimeContractV1 as Record<string, unknown>).interaction, {
    activity_row_tool: "WordBankInput",
    command_row_controls: [],
    status: "active",
  });
  assert.deepEqual(act009PropsJson.choiceElements, [{ label: "" }, { label: "" }]);
  assert.equal(act009PropsJson.correctAnswer, "");
  assert.deepEqual(act018PropsJson.wordBank, []);
  assert.deepEqual(act018PropsJson.sentenceWithGaps, [
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
});
