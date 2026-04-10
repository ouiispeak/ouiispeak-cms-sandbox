import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ACTIVE_ACTIVITY_SHAPE_LOCK_MAP, listActiveActivityShapeLockFieldKeys } from "../lib/activityShapeLock";
import { loadRequirednessMatrixRows } from "../lib/requirednessMatrix";

const REPO_ROOT = process.cwd();
const RUNTIME_DIRS = ["app", "lib"] as const;
const SQL_CONTRACT_FILES = ["supabase/manual/009_uuid_identity_reset.sql"] as const;

const FORBIDDEN_LEGACY_KEYS = [
  /\bexternalId\b/,
  /\bmoduleExternalId\b/,
  /\blessonExternalId\b/,
  /\bslideUuid\b/,
  /\blevel#\b/,
];

const FORBIDDEN_SCOPED_KEYS = [/\b(id|title|subtitle|text|level)(Module|Lesson|Group)\b/];
const FORBIDDEN_NAMING_DRIFT_PATTERNS = [
  /\blesson_ends_id\b/,
  /\blesson_ends_field_values\b/,
  /\/api\/lesson_ends\b/,
  /\/edit-lesson_ends\b/,
  /\[lesson_ends_id\]/,
  /\/configs\/lesson_ends\b/,
];

function listSourceFiles(dir: string): string[] {
  const absoluteDir = path.join(REPO_ROOT, dir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(path.join(dir, entry.name)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!/\.(ts|tsx|sql|md)$/.test(entry.name)) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function findMatches(filePath: string, patterns: RegExp[]): string[] {
  const contents = fs.readFileSync(filePath, "utf8");
  const hits: string[] = [];

  for (const pattern of patterns) {
    const match = contents.match(pattern);
    if (match) {
      hits.push(match[0]);
    }
  }

  return hits;
}

function parseActivationRuleRows(sql: string): Array<{
  fieldKey: string;
  componentName: string;
  isPresent: boolean;
  isRequired: boolean;
}> {
  const rows: Array<{
    fieldKey: string;
    componentName: string;
    isPresent: boolean;
    isRequired: boolean;
  }> = [];

  const tupleRegex = /\('([^']+)',\s*'([^']+)',\s*(true|false),\s*(true|false)\)/g;
  let match: RegExpExecArray | null = tupleRegex.exec(sql);
  while (match) {
    rows.push({
      fieldKey: match[1] ?? "",
      componentName: match[2] ?? "",
      isPresent: match[3] === "true",
      isRequired: match[4] === "true",
    });
    match = tupleRegex.exec(sql);
  }

  return rows;
}

function parseMarkdownSummaryNumber(source: string, labelRegex: RegExp): number {
  const match = source.match(labelRegex);
  assert.ok(match, `Missing summary metric for pattern: ${labelRegex}`);
  const raw = match?.[1] ?? "";
  const parsed = Number.parseInt(raw, 10);
  assert.equal(Number.isFinite(parsed), true, `Invalid numeric summary value for pattern: ${labelRegex}`);
  return parsed;
}

test("runtime contract files reject legacy and scoped key patterns", () => {
  const files = [
    ...RUNTIME_DIRS.flatMap((dir) => listSourceFiles(dir)),
    ...SQL_CONTRACT_FILES.map((file) => path.join(REPO_ROOT, file)),
  ];

  const violations: string[] = [];

  for (const file of files) {
    const legacyHits = findMatches(file, FORBIDDEN_LEGACY_KEYS);
    const scopedHits = findMatches(file, FORBIDDEN_SCOPED_KEYS);
    for (const hit of [...legacyHits, ...scopedHits]) {
      violations.push(`${path.relative(REPO_ROOT, file)} -> ${hit}`);
    }
  }

  assert.equal(
    violations.length,
    0,
    `Legacy/scoped key contract violations found:\n${violations.join("\n")}`
  );
});

test("constitution encodes naming layer zero-exception policy", () => {
  const constitutionPath = path.join(REPO_ROOT, "central/CONSTITUTION.md");
  const constitution = JSON.parse(fs.readFileSync(constitutionPath, "utf8")) as {
    naming_decisions?: Record<string, unknown>;
  };

  assert.ok(constitution.naming_decisions, "CONSTITUTION is missing naming_decisions.");
  const namingDecisions = constitution.naming_decisions ?? {};
  const namingLayerDecision = namingDecisions["NAMING-LAYER-001"] as
    | {
        status?: string;
        zero_exceptions?: boolean;
        rules?: string[];
      }
    | undefined;

  assert.ok(namingLayerDecision, "Missing naming decision NAMING-LAYER-001.");
  assert.equal(namingLayerDecision.status, "closed");
  assert.equal(namingLayerDecision.zero_exceptions, true);

  const rules = new Set(namingLayerDecision.rules ?? []);
  assert.equal(rules.has("Contract/component tokens use plural snake_case."), true);
  assert.equal(rules.has("Route params and JSON entity IDs use singular camelCase + Id."), true);
  assert.equal(rules.has("DB FK columns and row-identity columns use singular snake_case + _id."), true);
});

test("constitution locks slideId identity and forbids slideUuid", () => {
  const constitutionPath = path.join(REPO_ROOT, "central/CONSTITUTION.md");
  const constitution = JSON.parse(fs.readFileSync(constitutionPath, "utf8")) as {
    hard_facts?: Record<string, string>;
    naming_decisions?: Record<string, unknown>;
  };

  const hardFacts = constitution.hard_facts ?? {};
  assert.equal(
    hardFacts["HF-IDENTITY-001"],
    "slideId is the only legal slide-family identity key in CMS sandbox contracts, ingest/export payloads, and runtime surfaces."
  );
  assert.equal(hardFacts["HF-IDENTITY-001_forbidden"], "slideUuid is forbidden.");

  const namingDecisions = constitution.naming_decisions ?? {};
  const actNaming = namingDecisions["ACT-NAMING-001"] as
    | {
        status?: string;
        final_choice?: string;
        forbidden_legacy_key?: string;
      }
    | undefined;

  assert.ok(actNaming, "Missing ACT-NAMING-001 decision.");
  assert.equal(actNaming.status, "closed");
  assert.equal(actNaming.final_choice, "slideId is the canonical update identity key.");
  assert.equal(actNaming.forbidden_legacy_key, "slideUuid");
});

test("constitution encodes field-addition law with required authority files", () => {
  const constitutionPath = path.join(REPO_ROOT, "central/CONSTITUTION.md");
  const constitution = JSON.parse(fs.readFileSync(constitutionPath, "utf8")) as {
    field_addition_law?: {
      id?: string;
      field_key_regex?: string;
      four_naming_conventions?: Record<string, string>;
      required_file_updates?: {
        always?: string[];
      };
    };
  };

  const fieldLaw = constitution.field_addition_law;
  assert.ok(fieldLaw, "Missing field_addition_law in CONSTITUTION.");
  assert.equal(fieldLaw.id, "FIELD-ADDING-LAW-001");
  assert.equal(fieldLaw.field_key_regex, "^[a-z][A-Za-z0-9]*$");
  assert.equal(fieldLaw.four_naming_conventions?.component_tokens, "plural snake_case");
  assert.equal(
    fieldLaw.four_naming_conventions?.route_params_and_json_entity_ids,
    "singular camelCase + Id"
  );

  const alwaysFiles = new Set(fieldLaw.required_file_updates?.always ?? []);
  assert.equal(alwaysFiles.has("supabase/manual/010_field_dictionary_catalog_seed.sql"), true);
  assert.equal(alwaysFiles.has("supabase/manual/012_component_activation_seed.sql"), true);
  assert.equal(alwaysFiles.has("central/SOT/universal_configs.md"), true);
});

test("constitution encodes one canonical source per artifact type", () => {
  const constitutionPath = path.join(REPO_ROOT, "central/CONSTITUTION.md");
  const constitution = JSON.parse(fs.readFileSync(constitutionPath, "utf8")) as {
    authority_registry?: {
      no_duplicate_authority?: boolean;
      downstream_constitution_reference_required?: boolean;
      documentation_token_policy?: {
        canonical_component_tokens?: string[];
        forbidden_non_canonical_component_labels?: string[];
      };
      artifact_types?: Record<
        string,
        {
          canonical_source?: string;
          allowed_non_canonical_artifacts?: string[];
        }
      >;
    };
  };

  const registry = constitution.authority_registry;
  assert.ok(registry, "Missing authority_registry in CONSTITUTION.");
  assert.equal(registry.no_duplicate_authority, true);
  assert.equal(registry.downstream_constitution_reference_required, true);

  const tokenPolicy = registry.documentation_token_policy;
  assert.ok(tokenPolicy, "Missing documentation_token_policy in authority_registry.");
  const canonicalTokens = new Set(tokenPolicy?.canonical_component_tokens ?? []);
  assert.equal(canonicalTokens.has("activity_slides"), true);
  assert.equal(canonicalTokens.has("title_slides"), true);
  assert.equal(canonicalTokens.has("lesson_ends"), true);
  const forbiddenLabels = new Set(tokenPolicy?.forbidden_non_canonical_component_labels ?? []);
  assert.equal(forbiddenLabels.has("activity slide"), true);
  assert.equal(forbiddenLabels.has("title slides"), true);

  const artifactTypes = registry.artifact_types ?? {};
  const artifactTypeNames = Object.keys(artifactTypes);
  assert.ok(artifactTypeNames.length > 0, "authority_registry.artifact_types must not be empty.");

  for (const artifactTypeName of artifactTypeNames) {
    const entry = artifactTypes[artifactTypeName];
    assert.ok(entry?.canonical_source, `Artifact type "${artifactTypeName}" is missing canonical_source.`);

    const canonicalSource = entry.canonical_source ?? "";
    if (!canonicalSource.startsWith("public.") && !canonicalSource.includes(" + ")) {
      assert.equal(
        fs.existsSync(path.join(REPO_ROOT, canonicalSource)),
        true,
        `Canonical source path does not exist for "${artifactTypeName}": ${canonicalSource}`
      );
    }

    for (const docPath of entry.allowed_non_canonical_artifacts ?? []) {
      assert.equal(
        fs.existsSync(path.join(REPO_ROOT, docPath)),
        true,
        `Non-canonical artifact path does not exist for "${artifactTypeName}": ${docPath}`
      );
    }
  }
});

test("markdown docs declare authority role and canonical source metadata", () => {
  const markdownFiles = [
    path.join(REPO_ROOT, "README.md"),
    ...listSourceFiles("central"),
    ...listSourceFiles("docs"),
  ].filter((filePath) => filePath.endsWith(".md") && !filePath.endsWith(path.join("central", "CONSTITUTION.md")));

  const allowedRoles = new Set(["canonical", "mirror", "guide", "audit", "draft"]);

  for (const filePath of markdownFiles) {
    const contents = fs.readFileSync(filePath, "utf8");
    const roleMatch = contents.match(/^Authority Role:\s*(.+)\s*$/m);
    const artifactTypeMatch = contents.match(/^Artifact Type:\s*(.+)\s*$/m);
    const canonicalSourceMatch = contents.match(/^Canonical Source:\s*(.+)\s*$/m);
    const constitutionReferenceMatch = contents.match(/^Constitution Reference:\s*(.+)\s*$/m);

    assert.ok(roleMatch, `Missing Authority Role metadata in ${path.relative(REPO_ROOT, filePath)}`);
    assert.ok(artifactTypeMatch, `Missing Artifact Type metadata in ${path.relative(REPO_ROOT, filePath)}`);
    assert.ok(
      canonicalSourceMatch,
      `Missing Canonical Source metadata in ${path.relative(REPO_ROOT, filePath)}`
    );
    assert.ok(
      constitutionReferenceMatch,
      `Missing Constitution Reference metadata in ${path.relative(REPO_ROOT, filePath)}`
    );

    const role = roleMatch?.[1]?.trim() ?? "";
    assert.equal(
      allowedRoles.has(role),
      true,
      `Invalid Authority Role "${role}" in ${path.relative(REPO_ROOT, filePath)}`
    );
    assert.equal(
      constitutionReferenceMatch?.[1]?.trim(),
      "central/CONSTITUTION.md",
      `Invalid Constitution Reference in ${path.relative(REPO_ROOT, filePath)}`
    );
  }
});

test("downstream docs use canonical component tokens and avoid prose aliases", () => {
  const markdownFiles = [
    path.join(REPO_ROOT, "README.md"),
    ...listSourceFiles("central"),
    ...listSourceFiles("docs"),
  ].filter(
    (filePath) =>
      filePath.endsWith(".md") &&
      !filePath.endsWith(path.join("central", "CONSTITUTION.md")) &&
      !filePath.endsWith(path.join("central", "LV2_JSON_CONTRACT_LAW.md"))
  );

  const forbiddenPatterns = [
    /\bactivity\s+slide\b/i,
    /\bactivity\s+slides\b/i,
    /\btitle\s+slide\b/i,
    /\btitle\s+slides\b/i,
    /\blesson\s+end\b/i,
    /\blesson\s+ends\b/i,
  ];

  const violations: string[] = [];
  for (const filePath of markdownFiles) {
    const hits = findMatches(filePath, forbiddenPatterns);
    for (const hit of hits) {
      violations.push(`${path.relative(REPO_ROOT, filePath)} -> ${hit}`);
    }
  }

  assert.equal(
    violations.length,
    0,
    `Downstream docs contain non-canonical component labels:\n${violations.join("\n")}`
  );
});

test("zero-exception naming drift patterns are blocked", () => {
  const files = [
    path.join(REPO_ROOT, "README.md"),
    ...listSourceFiles("app"),
    ...listSourceFiles("lib"),
    ...listSourceFiles("supabase/manual"),
    ...listSourceFiles("central"),
  ];
  const violations: string[] = [];

  for (const file of files) {
    const hits = findMatches(file, FORBIDDEN_NAMING_DRIFT_PATTERNS);
    for (const hit of hits) {
      violations.push(`${path.relative(REPO_ROOT, file)} -> ${hit}`);
    }
  }

  assert.equal(violations.length, 0, `Naming drift violations found:\n${violations.join("\n")}`);
});

test("single canonical mapping boundary exists and is used by hierarchy components", () => {
  const canonicalMapPath = path.join(REPO_ROOT, "lib/canonicalFieldMap.ts");
  assert.equal(fs.existsSync(canonicalMapPath), true, "Missing lib/canonicalFieldMap.ts");

  const modulesSource = fs.readFileSync(path.join(REPO_ROOT, "lib/modules.ts"), "utf8");
  const lessonsSource = fs.readFileSync(path.join(REPO_ROOT, "lib/lessons.ts"), "utf8");
  const groupsSource = fs.readFileSync(path.join(REPO_ROOT, "lib/groups.ts"), "utf8");
  const slidesSource = fs.readFileSync(path.join(REPO_ROOT, "lib/slides.ts"), "utf8");
  const activitySlidesSource = fs.readFileSync(path.join(REPO_ROOT, "lib/activitySlides.ts"), "utf8");
  const titleSlidesSource = fs.readFileSync(path.join(REPO_ROOT, "lib/titleSlides.ts"), "utf8");
  const lessonEndsSource = fs.readFileSync(path.join(REPO_ROOT, "lib/lessonEnds.ts"), "utf8");

  assert.match(modulesSource, /CANONICAL_COMPONENT_FIELD_MAP\.modules/);
  assert.match(lessonsSource, /CANONICAL_COMPONENT_FIELD_MAP\.lessons/);
  assert.match(groupsSource, /CANONICAL_COMPONENT_FIELD_MAP\.groups/);
  assert.match(slidesSource, /CANONICAL_COMPONENT_FIELD_MAP\.slides/);
  assert.match(activitySlidesSource, /CANONICAL_COMPONENT_FIELD_MAP\.activity_slides/);
  assert.match(titleSlidesSource, /CANONICAL_COMPONENT_FIELD_MAP\.title_slides/);
  assert.match(lessonEndsSource, /CANONICAL_COMPONENT_FIELD_MAP\.lesson_ends/);
});

test("slug is seeded and required for modules/lessons/groups/slides/activity_slides/title_slides", () => {
  const dictionarySeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/010_field_dictionary_catalog_seed.sql"),
    "utf8"
  );
  const activationSeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/012_component_activation_seed.sql"),
    "utf8"
  );

  assert.match(
    dictionarySeed,
    /\('slug', 'Identity & Lifecycle', 'text',\s*\d+,\s*'active', NULL\)/
  );

  assert.match(activationSeed, /\('slug', 'modules', true, true\)/);
  assert.match(activationSeed, /\('slug', 'lessons', true, true\)/);
  assert.match(activationSeed, /\('slug', 'groups', true, true\)/);
  assert.match(activationSeed, /\('slug', 'slides', true, true\)/);
  assert.match(activationSeed, /activity_slide_default_fields[\s\S]*'slug'/);
  assert.match(
    activationSeed,
    /SELECT[\s\S]*'activity_slides'[\s\S]*FROM activity_slide_default_fields/
  );
  assert.match(activationSeed, /\('slug', 'title_slides', true, true\)/);
});

test("lesson_ends shape-lock seed matches approved field set and excludes titleModule", () => {
  const activationSeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/012_component_activation_seed.sql"),
    "utf8"
  );

  const requiredBaseline = [
    "lessonId",
    "moduleId",
    "slideId",
    "slug",
    "orderIndex",
  ];

  const expectedOptional = [
    "version",
    "visibility",
    "ownerTeam",
    "lastUpdatedBy",
    "lastUpdatedAt",
    "buttons",
    "lessonEndMessage",
    "lessonEndActions",
    "recommendedNextStep",
    "defaultLang",
    "audioId",
    "targetLanguage",
    "telemetryTags",
    "ingestSource",
    "ingestPayload",
    "sourceVersion",
    "diffLog",
    "metadata",
    "extraPracticeNotes",
    "activityId",
    "groupId",
    "groupName",
  ];

  for (const fieldName of requiredBaseline) {
    assert.match(
      activationSeed,
      new RegExp(`\\('${fieldName}', 'lesson_ends', true, true\\)`),
      `Missing required lesson_ends field "${fieldName}" in activation seed`
    );
  }

  for (const fieldName of expectedOptional) {
    assert.match(
      activationSeed,
      new RegExp(`\\('${fieldName}', 'lesson_ends', true, false\\)`),
      `Missing optional lesson_ends field "${fieldName}" in activation seed`
    );
  }

  assert.doesNotMatch(activationSeed, /\('titleModule', 'lesson_ends', true, (true|false)\)/);
  assert.doesNotMatch(activationSeed, /\('type', 'lesson_ends', true, (true|false)\)/);
});

test("type activation is limited to slides and activity_slides", () => {
  const activationSeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/012_component_activation_seed.sql"),
    "utf8"
  );

  assert.match(activationSeed, /\('type', 'slides', true, false\)/);
  assert.match(activationSeed, /activity_slide_default_fields[\s\S]*'type'/);
  assert.doesNotMatch(activationSeed, /\('type', 'groups', true, (true|false)\)/);
  assert.doesNotMatch(activationSeed, /\('type', 'lessons', true, (true|false)\)/);
  assert.doesNotMatch(activationSeed, /\('type', 'modules', true, (true|false)\)/);
  assert.doesNotMatch(activationSeed, /\('type', 'title_slides', true, (true|false)\)/);
  assert.doesNotMatch(activationSeed, /\('type', 'lesson_ends', true, (true|false)\)/);
});

test("activity slide shared/profile keys are seeded in dictionary and activity slide activation", () => {
  const dictionarySeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/010_field_dictionary_catalog_seed.sql"),
    "utf8"
  );
  const activationSeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/012_component_activation_seed.sql"),
    "utf8"
  );

  assert.match(
    dictionarySeed,
    /\('propsJson', 'Activities & Interaction', 'json',\s*\d+,\s*'active', NULL\)/
  );
  assert.match(activationSeed, /WITH activity_slide_default_fields/);
  assert.match(activationSeed, /activity_slide_default_fields[\s\S]*'activityId'/);
  assert.match(activationSeed, /activity_slide_default_fields[\s\S]*'propsJson'/);
  assert.match(activationSeed, /activity_slide_default_fields[\s\S]*'intonationOptions'/);
  assert.match(activationSeed, /activity_slide_default_fields[\s\S]*'correctCurveId'/);
  assert.match(activationSeed, /SELECT[\s\S]*'activity_slides'/);
  assert.doesNotMatch(
    activationSeed,
    /SELECT[\s\S]*'slides'[\s\S]*FROM activity_slide_default_fields/
  );
});

test("active ACT shape-lock keys are present in activity_slides activation seed", () => {
  const activationSeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/012_component_activation_seed.sql"),
    "utf8"
  );

  const activityDefaultFieldsBlockMatch = activationSeed.match(
    /WITH activity_slide_default_fields\(field_key\) AS \([\s\S]*?ARRAY\[(?<fields>[\s\S]*?)\]\s*\)\s*\)\s*INSERT/s
  );
  assert.ok(activityDefaultFieldsBlockMatch?.groups?.fields, "Missing activity_slide_default_fields seed block.");

  const seededFieldKeys = new Set<string>();
  const fieldMatches = activityDefaultFieldsBlockMatch.groups.fields.matchAll(/'([^']+)'/g);
  for (const match of fieldMatches) {
    if (match[1]) {
      seededFieldKeys.add(match[1]);
    }
  }

  const shapeLockFieldKeys = listActiveActivityShapeLockFieldKeys();
  const missingKeys = shapeLockFieldKeys.filter((fieldKey) => !seededFieldKeys.has(fieldKey));

  assert.deepEqual(
    missingKeys,
    [],
    `activity_slides activation seed is missing shape-lock keys: ${missingKeys.join(", ")}`
  );
});

test("requiredness matrix ingest required fields align with activation required flags for non-activity components", () => {
  const activationSeed = fs.readFileSync(
    path.join(REPO_ROOT, "supabase/manual/012_component_activation_seed.sql"),
    "utf8"
  );
  const activationRows = parseActivationRuleRows(activationSeed);
  const activationByComponentField = new Map<string, { isPresent: boolean; isRequired: boolean }>();
  for (const row of activationRows) {
    activationByComponentField.set(`${row.componentName}.${row.fieldKey}`, {
      isPresent: row.isPresent,
      isRequired: row.isRequired,
    });
  }

  const matrixRows = loadRequirednessMatrixRows().filter(
    (row) =>
      row.decision_status === "locked" &&
      row.operation === "category_payload" &&
      (!row.act_id || row.act_id.trim().length === 0) &&
      row.component_name !== "activity_slides"
  );
  const requiredRows = matrixRows.filter((row) => row.required_at_ingest === "true");
  const matrixRequiredByComponentField = new Set(requiredRows.map((row) => `${row.component_name}.${row.field_key}`));

  const missing: string[] = [];
  for (const row of requiredRows) {
    const key = `${row.component_name}.${row.field_key}`;
    const activation = activationByComponentField.get(key);
    if (!activation) {
      missing.push(`${key} (missing in activation seed)`);
      continue;
    }
    if (!activation.isPresent) {
      missing.push(`${key} (activation is_present=false)`);
    }
  }

  const extraActivationRequired: string[] = [];
  for (const row of activationRows) {
    if (row.componentName === "activity_slides") {
      continue;
    }
    if (!row.isRequired) {
      continue;
    }
    const key = `${row.componentName}.${row.fieldKey}`;
    if (!matrixRequiredByComponentField.has(key)) {
      extraActivationRequired.push(`${key} (activation required, matrix required_at_ingest!=true)`);
    }
  }

  assert.deepEqual(
    missing,
    [],
    `Matrix/activation presence drift found for required_at_ingest fields:\n${missing.join("\n")}`
  );
  assert.deepEqual(
    extraActivationRequired,
    [],
    `Activation-required drift found against matrix required_at_ingest:\n${extraActivationRequired.join("\n")}`
  );
});

test("activity ingest validator is wired to shape-lock map and preflight boundaries", () => {
  const preflightSource = fs.readFileSync(path.join(REPO_ROOT, "lib/activitySlidePreflight.ts"), "utf8");
  const activitySlidesSource = fs.readFileSync(path.join(REPO_ROOT, "lib/activitySlides.ts"), "utf8");

  assert.match(preflightSource, /ACTIVE_ACTIVITY_SHAPE_LOCK_MAP/);
  assert.match(preflightSource, /for \(const requiredKey of shapeLockSpec\.requiredAll\)/);
  assert.match(preflightSource, /for \(const oneOfGroup of shapeLockSpec\.requiredOneOf \?\? \[\]\)/);

  assert.match(activitySlidesSource, /validateActivitySlideFormDataPreflight\(formData, "create"\)/);
  assert.match(activitySlidesSource, /validateActivitySlideFormDataPreflight\(formData, "update"\)/);
  assert.match(activitySlidesSource, /validateActivitySlideImportPayloadPreflight\(payload, "create"\)/);
  assert.match(activitySlidesSource, /validateActivitySlideImportPayloadPreflight\(payload, "update"\)/);
});

test("ACTIVITY_PROFILES status matrix matches active/inactive ACT domain", () => {
  const profilesDoc = fs.readFileSync(path.join(REPO_ROOT, "central/ACTIVITY_PROFILES.md"), "utf8");
  const rows = profilesDoc
    .split("\n")
    .filter((line) => /^\|\s*ACT-\d{3}\s*\|/i.test(line))
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= 4)
    .map((parts) => ({
      actId: parts[1] ?? "",
      status: (parts[2] ?? "").toLowerCase(),
    }));

  const statusByAct = new Map<string, string>(rows.map((row) => [row.actId, row.status]));
  const activeActIds = Object.keys(ACTIVE_ACTIVITY_SHAPE_LOCK_MAP).sort();

  for (const actId of activeActIds) {
    assert.equal(
      statusByAct.get(actId),
      "active",
      `ACTIVITY_PROFILES drift: ${actId} should be marked active in ACT matrix table.`
    );
  }

  for (const inactiveActId of ["ACT-006", "ACT-007", "ACT-008"]) {
    assert.equal(
      statusByAct.get(inactiveActId),
      "inactive",
      `ACTIVITY_PROFILES drift: ${inactiveActId} should be marked inactive in ACT matrix table.`
    );
  }
});

test("FIELD_DICTIONARY summary metrics stay aligned with machine companion", () => {
  const dictionaryDoc = fs.readFileSync(path.join(REPO_ROOT, "central/FIELD_DICTIONARY.md"), "utf8");
  const rows = loadCsvRows(path.join(REPO_ROOT, "central/FIELD_DICTIONARY.csv"));

  const activeCount = rows.length;
  const uncategorizedCount = rows.filter((row) => !String(row.category_name ?? "").trim()).length;
  const populatedDefinitionCount = rows.filter((row) => String(row.definition ?? "").trim().length > 0).length;
  const missingDefinitionCount = rows.filter((row) => String(row.definition ?? "").trim().length === 0).length;
  const lessonSourcedCount = rows.filter(
    (row) => !String(row.requiredness_lesson_player_supabase ?? "").includes("not_specified_in_repo")
  ).length;
  const lv2SourcedCount = rows.filter((row) => !String(row.requiredness_lv2 ?? "").includes("not_specified_in_repo"))
    .length;

  assert.equal(
    parseMarkdownSummaryNumber(dictionaryDoc, /Active fields covered from public\.field_dictionary:\s*(\d+)/),
    activeCount
  );
  assert.equal(parseMarkdownSummaryNumber(dictionaryDoc, /Uncategorized active fields:\s*(\d+)/), uncategorizedCount);
  assert.equal(
    parseMarkdownSummaryNumber(dictionaryDoc, /Definitions populated in machine companion:\s*(\d+)/),
    populatedDefinitionCount
  );
  assert.equal(
    parseMarkdownSummaryNumber(dictionaryDoc, /Definitions requiring source input:\s*(\d+)/),
    missingDefinitionCount
  );
  assert.equal(
    parseMarkdownSummaryNumber(dictionaryDoc, /Lesson Player requiredness explicitly sourced in repo:\s*(\d+)/),
    lessonSourcedCount
  );
  assert.equal(
    parseMarkdownSummaryNumber(dictionaryDoc, /LV2 requiredness explicitly sourced in repo:\s*(\d+)/),
    lv2SourcedCount
  );
});

test("INGEST_CONTRACT reflects canonical config source and rejection envelope behavior", () => {
  const ingestContract = fs.readFileSync(path.join(REPO_ROOT, "central/INGEST_CONTRACT.md"), "utf8");

  assert.match(ingestContract, /public\.config_component_fields/);
  assert.doesNotMatch(ingestContract, /public\.component_config_fields/);

  assert.match(ingestContract, /Deterministic Rejection Envelope \(JSON clients\)/);
  assert.match(
    ingestContract,
    /`code`, `component`, `operation`, `activityId`, `slideId`, `field`, `message`, `contractVersion`, `timestamp`/
  );
  assert.match(ingestContract, /generic import codes \(`IMPORT_\*`\)/);
  assert.match(ingestContract, /ACT-specific rejection codes \(`ACTIVITY_\*`\)/);
  assert.match(ingestContract, /Hard Fact \(HF-IDENTITY-001\)/);
  assert.match(ingestContract, /`slideUuid` is forbidden/);
});

test("ACTIVITY_PROFILES structured payload policy tracks code-derived collision guard", () => {
  const profilesDoc = fs.readFileSync(path.join(REPO_ROOT, "central/ACTIVITY_PROFILES.md"), "utf8");
  assert.match(profilesDoc, /deriveActivityStructuredPayloadFieldKeys\(\)/);
});

type CsvRow = Record<string, string>;

function loadCsvRows(csvPath: string): CsvRow[] {
  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  const text = csvText.startsWith("\uFEFF") ? csvText.slice(1) : csvText;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.length > 1 || currentRow[0]?.trim().length) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  assert.ok(rows.length >= 2, `CSV file ${path.relative(REPO_ROOT, csvPath)} is missing rows.`);
  const headers = rows[0] ?? [];
  return rows.slice(1).map((values) => {
    const row: CsvRow = {};
    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index] ?? `col_${index}`;
      row[header] = values[index] ?? "";
    }
    return row;
  });
}
