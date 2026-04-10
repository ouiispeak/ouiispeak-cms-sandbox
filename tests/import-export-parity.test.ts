import test from "node:test";
import assert from "node:assert/strict";
import type { UniversalConfigField } from "../lib/universalConfigs";
import { importModulesFromJsonPayload } from "../lib/modules";
import { importLessonsFromJsonPayload } from "../lib/lessons";
import { importGroupsFromJsonPayload } from "../lib/groups";
import { importSlidesFromJsonPayload } from "../lib/slides";
import { importActivitySlidesFromJsonPayload } from "../lib/activitySlides";
import { importTitleSlidesFromJsonPayload } from "../lib/titleSlides";
import { importLessonEndsFromJsonPayload } from "../lib/lessonEnds";
import { buildActivityDefaultsById } from "../lib/activityRuntimeDefaults";
import { normalizeActivityPropsJson } from "../lib/activityPayloadNormalization";
import { GET as exportModuleJson } from "../app/api/modules/[moduleId]/export-json/route";
import { GET as exportLessonJson } from "../app/api/lessons/[lessonId]/export-json/route";
import { GET as exportGroupJson } from "../app/api/groups/[groupId]/export-json/route";
import { GET as exportSlideJson } from "../app/api/slides/[slideId]/export-json/route";
import { GET as exportActivitySlideJson } from "../app/api/activity-slides/[activitySlideId]/export-json/route";
import { GET as exportTitleSlideJson } from "../app/api/title-slides/[titleSlideId]/export-json/route";
import { GET as exportLessonEndJson } from "../app/api/lesson-ends/[lessonEndId]/export-json/route";

type ComponentName =
  | "modules"
  | "lessons"
  | "groups"
  | "slides"
  | "activity_slides"
  | "title_slides"
  | "lesson_ends";

type ConfigRow = {
  category_order: number;
  category_name: string;
  field_name: string;
  input_type: UniversalConfigField["inputType"];
  field_order: number;
  select_options_json: unknown;
  select_source: string | null;
  is_read_only: boolean;
};

type DynamicValueRow = {
  category_name: string;
  field_name: string;
  field_value: string | null;
};

type RpcCreateRow = {
  values: DynamicValueRow[];
  core?: Record<string, unknown>;
  moduleId?: string;
  lessonId?: string;
  groupId?: string;
};

const SUPABASE_URL = "http://localhost:54321";
const ANON_KEY = "anon-test-key";
const SERVICE_KEY = "service-test-key";

const MODULE_ID = "11111111-1111-4111-8111-111111111111";
const LESSON_ID = "22222222-2222-4222-8222-222222222222";
const GROUP_ID = "33333333-3333-4333-8333-333333333333";
const SLIDE_ID = "44444444-4444-4444-8444-444444444444";
const ACTIVITY_SLIDE_ID = "55555555-5555-4555-8555-555555555555";
const TITLE_SLIDE_ID = "66666666-6666-4666-8666-666666666666";
const LESSON_END_ID = "77777777-7777-4777-8777-777777777777";

const categoryOrderByName: Record<string, number> = {
  "Identity & Lifecycle": 1,
  "Content & Media": 2,
  "Instructions & Flow": 3,
  "Activities & Interaction": 4,
  "Operations, Provenance & Governance": 5,
  "Scope, Prerequisites & Targeting": 6,
};

const configByComponent: Record<ComponentName, Array<{ category: string; field: string; type: UniversalConfigField["inputType"] }>> = {
  modules: [
    { category: "Identity & Lifecycle", field: "title", type: "text" },
    { category: "Content & Media", field: "text", type: "textarea" },
    { category: "Scope, Prerequisites & Targeting", field: "level", type: "number" },
  ],
  lessons: [
    { category: "Identity & Lifecycle", field: "title", type: "text" },
    { category: "Content & Media", field: "text", type: "textarea" },
    { category: "Content & Media", field: "subtitle", type: "text" },
  ],
  groups: [
    { category: "Identity & Lifecycle", field: "title", type: "text" },
    { category: "Content & Media", field: "text", type: "textarea" },
    { category: "Content & Media", field: "subtitle", type: "text" },
  ],
  slides: [
    { category: "Identity & Lifecycle", field: "type", type: "text" },
    { category: "Identity & Lifecycle", field: "title", type: "text" },
    { category: "Content & Media", field: "body", type: "textarea" },
  ],
  activity_slides: [
    { category: "Identity & Lifecycle", field: "type", type: "text" },
    { category: "Identity & Lifecycle", field: "activityId", type: "text" },
    { category: "Identity & Lifecycle", field: "orderIndex", type: "number" },
    { category: "Identity & Lifecycle", field: "title", type: "text" },
    { category: "Instructions & Flow", field: "instructions", type: "textarea" },
    { category: "Activities & Interaction", field: "propsJson", type: "json" },
    { category: "Operations, Provenance & Governance", field: "runtimeContractV1", type: "json" },
  ],
  title_slides: [
    { category: "Identity & Lifecycle", field: "type", type: "text" },
    { category: "Identity & Lifecycle", field: "title", type: "text" },
    { category: "Content & Media", field: "subtitle", type: "text" },
  ],
  lesson_ends: [
    { category: "Identity & Lifecycle", field: "title", type: "text" },
    { category: "Content & Media", field: "lessonEndMessage", type: "textarea" },
    { category: "Content & Media", field: "lessonEndActions", type: "json" },
  ],
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function buildConfigRows(component: ComponentName): ConfigRow[] {
  const byCategoryFieldOrder = new Map<string, number>();
  const rows: ConfigRow[] = [];

  for (const fieldSpec of configByComponent[component]) {
    const categoryKey = fieldSpec.category;
    const nextFieldOrder = (byCategoryFieldOrder.get(categoryKey) ?? 0) + 1;
    byCategoryFieldOrder.set(categoryKey, nextFieldOrder);

    rows.push({
      category_order: categoryOrderByName[categoryKey] ?? 999,
      category_name: categoryKey,
      field_name: fieldSpec.field,
      input_type: fieldSpec.type,
      field_order: nextFieldOrder,
      select_options_json: [],
      select_source: null,
      is_read_only: false,
    });
  }

  return rows;
}

function parseEq(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return decodeURIComponent(value).replace(/^eq\./, "");
}

function parseComponentNameFromQuery(value: string | null): ComponentName | null {
  const parsed = parseEq(value);
  if (
    parsed === "modules" ||
    parsed === "lessons" ||
    parsed === "groups" ||
    parsed === "slides" ||
    parsed === "activity_slides" ||
    parsed === "title_slides" ||
    parsed === "lesson_ends"
  ) {
    return parsed;
  }
  return null;
}

function parseRpcRows(init: RequestInit | undefined): RpcCreateRow[] {
  const parsedBody = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: unknown };
  if (!Array.isArray(parsedBody.p_rows)) {
    throw new Error("Missing p_rows array in RPC body.");
  }
  return parsedBody.p_rows as RpcCreateRow[];
}

function normalizeQueryTable(pathname: string): string {
  return pathname.replace(/^\/rest\/v1\//, "");
}

type MockHarness = ReturnType<typeof createMockHarness>;

function createMockHarness() {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;

  const createdIds: Partial<Record<ComponentName, string>> = {};

  const coreRows = {
    modules: new Map<string, { id: string; title: string | null; text: string | null; level_number: number | null }>(),
    lessons: new Map<string, { id: string; module_id: string; title: string | null; text: string | null; subtitle: string | null }>(),
    groups: new Map<string, { id: string; lesson_id: string; title: string | null; text: string | null; subtitle: string | null }>(),
    slides: new Map<string, { id: string; group_id: string }>(),
    activity_slides: new Map<string, { id: string; group_id: string }>(),
    title_slides: new Map<string, { id: string; lesson_id: string }>(),
    lesson_ends: new Map<string, { id: string; lesson_id: string }>(),
  };

  const valueRows = {
    module_field_values: new Map<string, DynamicValueRow[]>(),
    lesson_field_values: new Map<string, DynamicValueRow[]>(),
    group_field_values: new Map<string, DynamicValueRow[]>(),
    slide_field_values: new Map<string, DynamicValueRow[]>(),
    activity_slide_field_values: new Map<string, DynamicValueRow[]>(),
    title_slide_field_values: new Map<string, DynamicValueRow[]>(),
    lesson_end_field_values: new Map<string, DynamicValueRow[]>(),
  };

  function storeValues(
    tableName: keyof typeof valueRows,
    rowId: string,
    rows: DynamicValueRow[] | undefined
  ): void {
    valueRows[tableName].set(rowId, rows ? [...rows] : []);
  }

  function handleRpcCreate(component: ComponentName, rows: RpcCreateRow[]): number {
    for (const row of rows) {
      const id =
        component === "modules"
          ? MODULE_ID
          : component === "lessons"
            ? LESSON_ID
            : component === "groups"
              ? GROUP_ID
              : component === "slides"
                ? SLIDE_ID
                : component === "activity_slides"
                  ? ACTIVITY_SLIDE_ID
                  : component === "title_slides"
                    ? TITLE_SLIDE_ID
                    : LESSON_END_ID;

      createdIds[component] = id;

      if (component === "modules") {
        const core = row.core ?? {};
        coreRows.modules.set(id, {
          id,
          title: (core.title as string | null | undefined) ?? null,
          text: (core.text as string | null | undefined) ?? null,
          level_number:
            typeof core.level_number === "number" ? core.level_number : core.level_number === null ? null : null,
        });
        storeValues("module_field_values", id, row.values);
        continue;
      }

      if (component === "lessons") {
        const core = row.core ?? {};
        coreRows.lessons.set(id, {
          id,
          module_id: row.moduleId ?? MODULE_ID,
          title: (core.title as string | null | undefined) ?? null,
          text: (core.text as string | null | undefined) ?? null,
          subtitle: (core.subtitle as string | null | undefined) ?? null,
        });
        storeValues("lesson_field_values", id, row.values);
        continue;
      }

      if (component === "groups") {
        const core = row.core ?? {};
        coreRows.groups.set(id, {
          id,
          lesson_id: row.lessonId ?? LESSON_ID,
          title: (core.title as string | null | undefined) ?? null,
          text: (core.text as string | null | undefined) ?? null,
          subtitle: (core.subtitle as string | null | undefined) ?? null,
        });
        storeValues("group_field_values", id, row.values);
        continue;
      }

      if (component === "slides") {
        coreRows.slides.set(id, { id, group_id: row.groupId ?? GROUP_ID });
        storeValues("slide_field_values", id, row.values);
        continue;
      }

      if (component === "activity_slides") {
        coreRows.activity_slides.set(id, { id, group_id: row.groupId ?? GROUP_ID });
        storeValues("activity_slide_field_values", id, row.values);
        continue;
      }

      if (component === "title_slides") {
        coreRows.title_slides.set(id, { id, lesson_id: row.lessonId ?? LESSON_ID });
        storeValues("title_slide_field_values", id, row.values);
        continue;
      }

      coreRows.lesson_ends.set(id, { id, lesson_id: row.lessonId ?? LESSON_ID });
      storeValues("lesson_end_field_values", id, row.values);
    }

    return rows.length;
  }

  function getFieldRowsById(tableName: keyof typeof valueRows, id: string): DynamicValueRow[] {
    return valueRows[tableName].get(id) ?? [];
  }

  function install(): void {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const rawUrl = typeof input === "string" ? input : input.toString();
      const url = new URL(rawUrl);
      const tableOrAction = normalizeQueryTable(url.pathname);

      if (tableOrAction === "config_component_fields") {
        const component = parseComponentNameFromQuery(url.searchParams.get("component_name"));
        if (!component) {
          return jsonResponse([]);
        }
        return jsonResponse(buildConfigRows(component));
      }

      if (tableOrAction === "field_dictionary_component_rules") {
        return jsonResponse([]);
      }

      if (tableOrAction === "rpc/import_modules_create_atomic") {
        return jsonResponse(handleRpcCreate("modules", parseRpcRows(init)));
      }
      if (tableOrAction === "rpc/import_lessons_create_atomic") {
        return jsonResponse(handleRpcCreate("lessons", parseRpcRows(init)));
      }
      if (tableOrAction === "rpc/import_groups_create_atomic") {
        return jsonResponse(handleRpcCreate("groups", parseRpcRows(init)));
      }
      if (tableOrAction === "rpc/import_slides_create_atomic") {
        return jsonResponse(handleRpcCreate("slides", parseRpcRows(init)));
      }
      if (tableOrAction === "rpc/import_activity_slides_create_atomic") {
        return jsonResponse(handleRpcCreate("activity_slides", parseRpcRows(init)));
      }
      if (tableOrAction === "rpc/import_title_slides_create_atomic") {
        return jsonResponse(handleRpcCreate("title_slides", parseRpcRows(init)));
      }
      if (tableOrAction === "rpc/import_lesson_ends_create_atomic") {
        return jsonResponse(handleRpcCreate("lesson_ends", parseRpcRows(init)));
      }

      if (tableOrAction === "modules") {
        const id = parseEq(url.searchParams.get("id"));
        return jsonResponse(id && coreRows.modules.has(id) ? [coreRows.modules.get(id)] : []);
      }
      if (tableOrAction === "lessons") {
        const id = parseEq(url.searchParams.get("id"));
        return jsonResponse(id && coreRows.lessons.has(id) ? [coreRows.lessons.get(id)] : []);
      }
      if (tableOrAction === "groups") {
        const id = parseEq(url.searchParams.get("id"));
        return jsonResponse(id && coreRows.groups.has(id) ? [coreRows.groups.get(id)] : []);
      }
      if (tableOrAction === "slides") {
        const id = parseEq(url.searchParams.get("id"));
        return jsonResponse(id && coreRows.slides.has(id) ? [coreRows.slides.get(id)] : []);
      }
      if (tableOrAction === "activity_slides") {
        const id = parseEq(url.searchParams.get("id"));
        return jsonResponse(id && coreRows.activity_slides.has(id) ? [coreRows.activity_slides.get(id)] : []);
      }
      if (tableOrAction === "title_slides") {
        const id = parseEq(url.searchParams.get("id"));
        return jsonResponse(id && coreRows.title_slides.has(id) ? [coreRows.title_slides.get(id)] : []);
      }
      if (tableOrAction === "lesson_ends") {
        const id = parseEq(url.searchParams.get("id"));
        return jsonResponse(id && coreRows.lesson_ends.has(id) ? [coreRows.lesson_ends.get(id)] : []);
      }

      if (tableOrAction === "module_field_values") {
        const id = parseEq(url.searchParams.get("module_id"));
        return jsonResponse(id ? getFieldRowsById("module_field_values", id) : []);
      }
      if (tableOrAction === "lesson_field_values") {
        const id = parseEq(url.searchParams.get("lesson_id"));
        return jsonResponse(id ? getFieldRowsById("lesson_field_values", id) : []);
      }
      if (tableOrAction === "group_field_values") {
        const id = parseEq(url.searchParams.get("group_id"));
        return jsonResponse(id ? getFieldRowsById("group_field_values", id) : []);
      }
      if (tableOrAction === "slide_field_values") {
        const id = parseEq(url.searchParams.get("slide_id"));
        return jsonResponse(id ? getFieldRowsById("slide_field_values", id) : []);
      }
      if (tableOrAction === "activity_slide_field_values") {
        const id = parseEq(url.searchParams.get("activity_slide_id"));
        return jsonResponse(id ? getFieldRowsById("activity_slide_field_values", id) : []);
      }
      if (tableOrAction === "title_slide_field_values") {
        const id = parseEq(url.searchParams.get("title_slide_id"));
        return jsonResponse(id ? getFieldRowsById("title_slide_field_values", id) : []);
      }
      if (tableOrAction === "lesson_end_field_values") {
        const id = parseEq(url.searchParams.get("lesson_end_id"));
        if (id) {
          return jsonResponse(getFieldRowsById("lesson_end_field_values", id));
        }

        const lessonId = parseEq(url.searchParams.get("lesson_ends.lesson_id"));
        if (!lessonId) {
          return jsonResponse([]);
        }

        const result: Array<{ lesson_end_id: string; field_value: string | null }> = [];
        for (const [lessonEndId, core] of coreRows.lesson_ends.entries()) {
          if (core.lesson_id !== lessonId) {
            continue;
          }
          const rows = getFieldRowsById("lesson_end_field_values", lessonEndId);
          for (const row of rows) {
            if (row.field_name === "orderIndex") {
              result.push({ lesson_end_id: lessonEndId, field_value: row.field_value });
            }
          }
        }

        return jsonResponse(result);
      }

      return new Response(`Unexpected URL in parity test: ${rawUrl}`, { status: 500 });
    }) as typeof fetch;
  }

  function restore(): void {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }

  function getCreatedId(component: ComponentName): string {
    const id = createdIds[component];
    assert.ok(id, `Missing created id for ${component}.`);
    return id;
  }

  return {
    install,
    restore,
    getCreatedId,
  };
}

async function parseExportResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.text();
  assert.equal(response.status, 200, body);
  return JSON.parse(body) as Record<string, unknown>;
}

async function runDeterministicExportTwice(
  exportCall: () => Promise<Response>
): Promise<Record<string, unknown>> {
  const first = await parseExportResponse(await exportCall());
  const second = await parseExportResponse(await exportCall());
  assert.deepEqual(second, first);
  return first;
}

const ACTIVE_ACT_IDS = [
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
] as const;

type ActiveActId = (typeof ACTIVE_ACT_IDS)[number];

function buildSamplePropsJson(actId: ActiveActId, runtimeContract: Record<string, unknown>): Record<string, unknown> {
  switch (actId) {
    case "ACT-001":
      return {
        runtimeContractV1: runtimeContract,
        lines: [
          [
            {
              label: "I can map fields.",
              speech: { mode: "tts", text: "I can map fields." },
            },
          ],
        ],
      };
    case "ACT-002":
      return {
        runtimeContractV1: runtimeContract,
        syllableBreakdown: "com-pu-ter",
        correctStressIndex: 2,
      };
    case "ACT-003":
      return {
        runtimeContractV1: runtimeContract,
        promptMode: "same_different",
        choiceElements: [
          { label: "same", speech: { mode: "tts", text: "same" } },
          { label: "different", speech: { mode: "tts", text: "different" } },
        ],
      };
    case "ACT-004":
      return {
        runtimeContractV1: runtimeContract,
        intonationOptions: ["question", "descending"],
        correctCurveId: "question",
        audioPrompt: {
          speech: { mode: "tts", text: "Choose the contour." },
        },
      };
    case "ACT-005":
      return {
        runtimeContractV1: runtimeContract,
        targetText: "I can hear the difference.",
      };
    case "ACT-009":
      return {
        runtimeContractV1: runtimeContract,
        choiceElements: [{ label: "A" }, { label: "B" }],
        correctAnswer: "A",
        audioPrompt: {
          speech: { mode: "tts", text: "Pick the right answer." },
        },
      };
    case "ACT-010":
      return {
        runtimeContractV1: runtimeContract,
        choiceElements: [{ label: "walk" }, { label: "walks" }],
        correctAnswer: "2",
        promptText: "Select the correct form.",
      };
    case "ACT-011":
      return {
        runtimeContractV1: runtimeContract,
        statement: "This sentence is correct.",
        correctAnswer: "yes",
      };
    case "ACT-012":
      return {
        runtimeContractV1: runtimeContract,
        choiceElements: [{ label: "cat" }, { label: "cats" }, { label: "book" }],
        correctOddIndex: 3,
      };
    case "ACT-013":
      return {
        runtimeContractV1: runtimeContract,
        matchPairs: [
          { left: "hello", right: "bonjour" },
          { left: "bye", right: "au revoir" },
        ],
      };
    case "ACT-014":
      return {
        runtimeContractV1: runtimeContract,
        categoryLabels: ["Nouns", "Verbs"],
        wordBank: ["cat", "run", "teacher", "walk"],
      };
    case "ACT-015":
      return {
        runtimeContractV1: runtimeContract,
        sentenceTokens: ["I", "can", "map", "this"],
        correctOrderWords: ["I", "can", "map", "this"],
      };
    case "ACT-016":
      return {
        runtimeContractV1: runtimeContract,
        tenseBins: [
          { id: "present", label: "Present" },
          { id: "past", label: "Past" },
        ],
        sentenceCards: [
          { sentence: "I walk to school.", correct_tense: "present" },
          { sentence: "I walked to school.", correct_tense: "past" },
        ],
      };
    case "ACT-017":
      return {
        runtimeContractV1: runtimeContract,
        sentenceWithGaps: "I walk to school every day.",
        blanks: [{ correctGapIndex: 2, acceptedAlternatives: ["walk", "go"] }],
      };
    case "ACT-018":
      return {
        runtimeContractV1: runtimeContract,
        wordBank: ["have", "had", "will have", "eat"],
        sentenceWithGaps: [
          {
            sentence: "I have a cat.",
            gaps: [
              {
                position: 2,
                accepted_answers: ["have", "had", "will have"],
              },
            ],
          },
        ],
      };
    case "ACT-019":
      return {
        runtimeContractV1: runtimeContract,
        incorrectSentence: "I has a cat.",
        errorIndex: 2,
        acceptedCorrections: ["have"],
      };
    case "ACT-020":
      return {
        runtimeContractV1: runtimeContract,
        promptText: "Say the sentence aloud.",
        targetText: "I can speak clearly.",
      };
    case "ACT-021":
      return {
        runtimeContractV1: runtimeContract,
        choiceElements: [{ label: "cat" }, { label: "cut" }],
        correctAnswer: 1,
      };
    case "ACT-022":
      return {
        runtimeContractV1: runtimeContract,
        promptText: "Say a sentence with this keyword.",
        targetKeywords: ["schedule", "meeting"],
      };
    case "ACT-023":
      return {
        runtimeContractV1: runtimeContract,
        avatarDialogues: [
          {
            avatarLine: "How are you today?",
            audioFile: "https://cdn.example.com/audio/act-023-line-1.mp3",
            correctResponses: ["I am fine", "I'm fine"],
          },
        ],
      };
    case "ACT-024":
      return {
        runtimeContractV1: runtimeContract,
        word: "cat",
        letterUnits: ["c", "a", "t"],
      };
    case "ACT-025":
      return {
        runtimeContractV1: runtimeContract,
        audioClips: ["clip-1", "clip-2", "clip-3"],
        correctOrderClips: ["clip-2", "clip-1", "clip-3"],
      };
    case "ACT-026":
      return {
        runtimeContractV1: runtimeContract,
        promptText: "Record the phrase.",
        targetText: "I can map the runtime contract.",
      };
  }
}

test("module import/export parity is deterministic", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const payload = {
      "Identity & Lifecycle": { title: "Module parity" },
      "Content & Media": { text: "Module body" },
      "Scope, Prerequisites & Targeting": { level: 3 },
    };
    const importedCount = await importModulesFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const moduleId = harness.getCreatedId("modules");
    const exported = await runDeterministicExportTwice(() =>
      exportModuleJson(new Request("http://localhost"), { params: Promise.resolve({ moduleId }) })
    );

    assert.equal(exported.moduleId, moduleId);
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).title, "Module parity");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).text, "Module body");
    assert.equal((exported["Scope, Prerequisites & Targeting"] as Record<string, unknown>).level, 3);
  } finally {
    harness.restore();
  }
});

test("lesson import/export parity is deterministic", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const payload = {
      moduleId: MODULE_ID,
      "Identity & Lifecycle": { title: "Lesson parity" },
      "Content & Media": { text: "Lesson body", subtitle: "Lesson subtitle" },
    };
    const importedCount = await importLessonsFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const lessonId = harness.getCreatedId("lessons");
    const exported = await runDeterministicExportTwice(() =>
      exportLessonJson(new Request("http://localhost"), { params: Promise.resolve({ lessonId }) })
    );

    assert.equal(exported.lessonId, lessonId);
    assert.equal(exported.moduleId, MODULE_ID);
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).title, "Lesson parity");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).text, "Lesson body");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).subtitle, "Lesson subtitle");
  } finally {
    harness.restore();
  }
});

test("group import/export parity is deterministic", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const payload = {
      lessonId: LESSON_ID,
      "Identity & Lifecycle": { title: "Group parity" },
      "Content & Media": { text: "Group body", subtitle: "Group subtitle" },
    };
    const importedCount = await importGroupsFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const groupId = harness.getCreatedId("groups");
    const exported = await runDeterministicExportTwice(() =>
      exportGroupJson(new Request("http://localhost"), { params: Promise.resolve({ groupId }) })
    );

    assert.equal(exported.groupId, groupId);
    assert.equal(exported.lessonId, LESSON_ID);
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).title, "Group parity");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).text, "Group body");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).subtitle, "Group subtitle");
  } finally {
    harness.restore();
  }
});

test("slide import/export parity is deterministic", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const payload = {
      groupId: GROUP_ID,
      "Identity & Lifecycle": { type: "text", title: "Slide parity" },
      "Content & Media": { body: "Slide body" },
    };
    const importedCount = await importSlidesFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const slideId = harness.getCreatedId("slides");
    const exported = await runDeterministicExportTwice(() =>
      exportSlideJson(new Request("http://localhost"), { params: Promise.resolve({ slideId }) })
    );

    assert.equal(exported.slideId, slideId);
    assert.equal(exported.groupId, GROUP_ID);
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).type, "text");
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).title, "Slide parity");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).body, "Slide body");
  } finally {
    harness.restore();
  }
});

test("activity slide import/export parity is deterministic (ACT-009)", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const runtimeContract = {
      contractVersion: "v1",
      interaction: {
        activity_row_tool: "AudioChoiceSelector",
        command_row_controls: ["play"],
        status: "active",
      },
    };

    const propsJson = {
      runtimeContractV1: runtimeContract,
      choiceElements: [
        { label: "oui", speech: { mode: "tts", text: "oui" } },
        { label: "non", speech: { mode: "tts", text: "non" } },
      ],
      correctAnswer: "oui",
      audioPrompt: {
        speech: { mode: "tts", text: "Choisis la bonne reponse" },
      },
    };

    const payload = {
      groupId: GROUP_ID,
      "Identity & Lifecycle": {
        type: "activity",
        activityId: "ACT-009",
        orderIndex: 7,
        title: "ACT-009 parity",
      },
      "Instructions & Flow": {
        instructions: "Listen and select the correct answer.",
      },
      "Activities & Interaction": {
        propsJson,
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: runtimeContract,
      },
    };

    const importedCount = await importActivitySlidesFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const activitySlideId = harness.getCreatedId("activity_slides");
    const exported = await runDeterministicExportTwice(() =>
      exportActivitySlideJson(new Request("http://localhost"), {
        params: Promise.resolve({ activitySlideId }),
      })
    );

    assert.equal(exported.slideId, activitySlideId);
    assert.equal(exported.groupId, GROUP_ID);
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).activityId, "ACT-009");
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).orderIndex, 7);
    assert.equal((exported["Instructions & Flow"] as Record<string, unknown>).instructions, payload["Instructions & Flow"].instructions);
    const exportedPropsJson = (exported["Activities & Interaction"] as Record<string, unknown>)
      .propsJson as Record<string, unknown>;
    assert.ok(exportedPropsJson);
    assert.deepEqual(exportedPropsJson.runtimeContractV1, propsJson.runtimeContractV1);
    assert.deepEqual(exportedPropsJson.choiceElements, propsJson.choiceElements);
    assert.equal(exportedPropsJson.correctAnswer, propsJson.correctAnswer);
    assert.deepEqual(exportedPropsJson.audioPrompt, propsJson.audioPrompt);
    assert.deepEqual(exportedPropsJson.audio, {
      speech: { mode: "tts", text: "Choisis la bonne reponse" },
    });
    assert.deepEqual(
      (exported["Operations, Provenance & Governance"] as Record<string, unknown>).runtimeContractV1,
      runtimeContract
    );
  } finally {
    harness.restore();
  }
});

test("activity slide import/export canonicalizes ACT-004 aliases and synonyms", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const runtimeContract = {
      contractVersion: "v1",
      interaction: {
        activity_row_tool: "ChipSelector",
        command_row_controls: ["play"],
        status: "active",
      },
    };

    const payload = {
      groupId: GROUP_ID,
      "Identity & Lifecycle": {
        type: "activity",
        activityId: "ACT-004",
        orderIndex: 9,
        title: "ACT-004 canonicalization",
      },
      "Activities & Interaction": {
        propsJson: {
          runtimeContractV1: runtimeContract,
          intonationOptions: ["Question", "descending"],
          correctCurveId: "question",
          audioPrompt: {
            speech: { mode: "tts", text: "Choose contour" },
          },
        },
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: runtimeContract,
      },
    };

    const importedCount = await importActivitySlidesFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const activitySlideId = harness.getCreatedId("activity_slides");
    const exported = await runDeterministicExportTwice(() =>
      exportActivitySlideJson(new Request("http://localhost"), {
        params: Promise.resolve({ activitySlideId }),
      })
    );

    const exportedPropsJson = (exported["Activities & Interaction"] as Record<string, unknown>)
      .propsJson as Record<string, unknown>;
    assert.ok(exportedPropsJson);
    assert.deepEqual(exportedPropsJson.intonationOptions, ["rising", "falling"]);
    assert.equal(exportedPropsJson.correctCurveId, "rising");
    assert.deepEqual(exportedPropsJson.audio, {
      speech: { mode: "tts", text: "Choose contour" },
    });
  } finally {
    harness.restore();
  }
});

test("activity slide import/export parity is deterministic (ACT-018 canonical gap objects)", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const runtimeContract = {
      contractVersion: "v1",
      interaction: {
        activity_row_tool: "WordBankInput",
        command_row_controls: [],
        status: "active",
      },
    };

    const propsJson = {
      runtimeContractV1: runtimeContract,
      wordBank: ["have", "had", "will have", "eat"],
      sentenceWithGaps: [
        {
          sentence: "I have a cat.",
          gaps: [
            {
              position: 2,
              accepted_answers: ["have", "had", "will have"],
            },
          ],
        },
      ],
    };

    const payload = {
      groupId: GROUP_ID,
      "Identity & Lifecycle": {
        type: "activity",
        activityId: "ACT-018",
        orderIndex: 16,
        title: "ACT-018 parity",
      },
      "Instructions & Flow": {
        instructions: "Fill the gap with the best word.",
      },
      "Activities & Interaction": {
        propsJson,
      },
      "Operations, Provenance & Governance": {
        runtimeContractV1: runtimeContract,
      },
    };

    const importedCount = await importActivitySlidesFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const activitySlideId = harness.getCreatedId("activity_slides");
    const exported = await runDeterministicExportTwice(() =>
      exportActivitySlideJson(new Request("http://localhost"), {
        params: Promise.resolve({ activitySlideId }),
      })
    );

    const exportedPropsJson = (exported["Activities & Interaction"] as Record<string, unknown>)
      .propsJson as Record<string, unknown>;
    assert.ok(exportedPropsJson);
    assert.deepEqual(exportedPropsJson.runtimeContractV1, runtimeContract);
    assert.deepEqual(exportedPropsJson.wordBank, propsJson.wordBank);
    assert.deepEqual(exportedPropsJson.sentenceWithGaps, propsJson.sentenceWithGaps);
  } finally {
    harness.restore();
  }
});

test("title slide import/export parity is deterministic", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const payload = {
      lessonId: LESSON_ID,
      "Identity & Lifecycle": { type: "title", title: "Title slide parity" },
      "Content & Media": { subtitle: "Title subtitle" },
    };
    const importedCount = await importTitleSlidesFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const titleSlideId = harness.getCreatedId("title_slides");
    const exported = await runDeterministicExportTwice(() =>
      exportTitleSlideJson(new Request("http://localhost"), { params: Promise.resolve({ titleSlideId }) })
    );

    assert.equal(exported.slideId, titleSlideId);
    assert.equal(exported.lessonId, LESSON_ID);
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).type, "title");
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).title, "Title slide parity");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).subtitle, "Title subtitle");
  } finally {
    harness.restore();
  }
});

test("lesson_ends import/export parity is deterministic", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  try {
    const payload = {
      lessonId: LESSON_ID,
      "Identity & Lifecycle": { title: "Lesson end parity" },
      "Content & Media": {
        lessonEndMessage: "Great job!",
        lessonEndActions: {
          primary: "continue",
        },
      },
    };
    const importedCount = await importLessonEndsFromJsonPayload(payload);
    assert.equal(importedCount, 1);
    const lessonEndId = harness.getCreatedId("lesson_ends");
    const exported = await runDeterministicExportTwice(() =>
      exportLessonEndJson(new Request("http://localhost"), { params: Promise.resolve({ lessonEndId }) })
    );

    assert.equal(exported.slideId, lessonEndId);
    assert.equal(exported.lessonId, LESSON_ID);
    assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).title, "Lesson end parity");
    assert.equal((exported["Content & Media"] as Record<string, unknown>).lessonEndMessage, "Great job!");
    assert.deepEqual((exported["Content & Media"] as Record<string, unknown>).lessonEndActions, { primary: "continue" });
  } finally {
    harness.restore();
  }
});

test("activity slide import/export parity is deterministic across active ACT lanes", async () => {
  const harness: MockHarness = createMockHarness();
  harness.install();
  const defaultsById = buildActivityDefaultsById();

  try {
    let orderIndex = 1;
    for (const actId of ACTIVE_ACT_IDS) {
      const defaults = defaultsById[actId];
      assert.ok(defaults, `Missing runtime defaults for ${actId}.`);

      const runtimeContract = {
        contractVersion: "v1",
        interaction: {
          activity_row_tool: defaults.activityRowTool,
          command_row_controls: defaults.commandRowControls,
          status: "active",
        },
      };

      const propsJson = buildSamplePropsJson(actId, runtimeContract);
      const payload = {
        groupId: GROUP_ID,
        "Identity & Lifecycle": {
          type: "activity",
          activityId: actId,
          orderIndex: orderIndex,
          title: `${actId} parity`,
        },
        "Instructions & Flow": {
          instructions: `Run parity for ${actId}.`,
        },
        "Activities & Interaction": {
          propsJson,
        },
        "Operations, Provenance & Governance": {
          runtimeContractV1: runtimeContract,
        },
      };

      const importedCount = await importActivitySlidesFromJsonPayload(payload);
      assert.equal(importedCount, 1, `Import count mismatch for ${actId}.`);

      const activitySlideId = harness.getCreatedId("activity_slides");
      const exported = await runDeterministicExportTwice(() =>
        exportActivitySlideJson(new Request("http://localhost"), {
          params: Promise.resolve({ activitySlideId }),
        })
      );

      assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).activityId, actId);
      assert.equal((exported["Identity & Lifecycle"] as Record<string, unknown>).orderIndex, orderIndex);

      const exportedPropsJson = (exported["Activities & Interaction"] as Record<string, unknown>)
        .propsJson as Record<string, unknown>;
      assert.ok(exportedPropsJson, `Missing exported propsJson for ${actId}.`);

      const expectedPropsJson = normalizeActivityPropsJson(
        actId,
        structuredClone(propsJson) as Record<string, unknown>
      );
      assert.deepEqual(exportedPropsJson, expectedPropsJson, `propsJson parity mismatch for ${actId}.`);

      orderIndex += 1;
    }
  } finally {
    harness.restore();
  }
});
