import test from "node:test";
import assert from "node:assert/strict";
import { importModulesFromJsonPayload } from "../lib/modules";
import { importLessonsFromJsonPayload } from "../lib/lessons";
import { importGroupUpdatesFromJsonPayload, importGroupsFromJsonPayload } from "../lib/groups";
import { importSlideUpdatesFromJsonPayload, importSlidesFromJsonPayload } from "../lib/slides";

const MODULE_1_UUID = "11111111-1111-4111-8111-111111111111";
const LESSON_1_UUID = "33333333-3333-4333-8333-333333333333";
const LESSON_2_UUID = "44444444-4444-4444-8444-444444444444";
const GROUP_1_UUID = "55555555-5555-4555-8555-555555555555";
const GROUP_2_UUID = "66666666-6666-4666-8666-666666666666";
const SLIDE_1_UUID = "77777777-7777-4777-8777-777777777777";
const SLIDE_2_UUID = "88888888-8888-4888-8888-888888888888";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

test("module create import uses one atomic RPC call for multi-entry payload", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  let rpcCalls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse([
        {
          category_name: "Identity and Hiearchy",
          field_name: "title",
          input_type: "text",
          field_order: 1,
        },
      ]);
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse([]);
    }

    if (url.includes("/rest/v1/rpc/import_modules_create_atomic")) {
      rpcCalls += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: unknown[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 2);
      return jsonResponse(2);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importModulesFromJsonPayload([
      { "Identity and Hiearchy": { title: "M1" } },
      { "Identity and Hiearchy": { title: "M2" } },
    ]);

    assert.equal(count, 2);
    assert.equal(rpcCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});

test("lesson create import uses one atomic RPC call for multi-entry payload", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  let rpcCalls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse([
        {
          category_name: "Identity and Hiearchy",
          field_name: "title",
          input_type: "text",
          field_order: 1,
        },
      ]);
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse([]);
    }

    if (url.includes("/rest/v1/rpc/import_lessons_create_atomic")) {
      rpcCalls += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: unknown[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 2);
      return jsonResponse(2);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importLessonsFromJsonPayload([
      { moduleId: MODULE_1_UUID, "Identity and Hiearchy": { title: "L1" } },
      { moduleId: MODULE_1_UUID, "Identity and Hiearchy": { title: "L2" } },
    ]);

    assert.equal(count, 2);
    assert.equal(rpcCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});

test("group create import uses one atomic RPC call for multi-entry payload", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  let rpcCalls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse([
        {
          category_name: "Identity and Hiearchy",
          field_name: "title",
          input_type: "text",
          field_order: 1,
        },
      ]);
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse([]);
    }

    if (url.includes("/rest/v1/rpc/import_groups_create_atomic")) {
      rpcCalls += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: unknown[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 2);
      return jsonResponse(2);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importGroupsFromJsonPayload([
      { lessonId: LESSON_1_UUID, "Identity and Hiearchy": { title: "G1" } },
      { lessonId: LESSON_1_UUID, "Identity and Hiearchy": { title: "G2" } },
    ]);

    assert.equal(count, 2);
    assert.equal(rpcCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});

test("group update import uses one atomic RPC call for multi-entry payload", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  let rpcCalls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse([
        {
          category_name: "Identity and Hiearchy",
          field_name: "title",
          input_type: "text",
          field_order: 1,
        },
      ]);
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse([]);
    }

    if (url.includes("/rest/v1/rpc/import_groups_update_atomic")) {
      rpcCalls += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: unknown[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 2);
      return jsonResponse(2);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importGroupUpdatesFromJsonPayload([
      { groupId: GROUP_1_UUID, lessonId: LESSON_2_UUID, "Identity and Hiearchy": { title: "G1-updated" } },
      { groupId: GROUP_2_UUID, "Identity and Hiearchy": { title: "G2-updated" } },
    ]);

    assert.equal(count, 2);
    assert.equal(rpcCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});

test("slide create import uses one atomic RPC call for multi-entry payload", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  let rpcCalls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse([
        {
          category_name: "Identity and Hiearchy",
          field_name: "slideId",
          input_type: "text",
          field_order: 1,
        },
      ]);
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse([]);
    }

    if (url.includes("/rest/v1/rpc/import_slides_create_atomic")) {
      rpcCalls += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: unknown[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 2);
      return jsonResponse(2);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importSlidesFromJsonPayload([
      { groupId: GROUP_1_UUID, "Identity and Hiearchy": {} },
      { groupId: GROUP_2_UUID, "Identity and Hiearchy": {} },
    ]);

    assert.equal(count, 2);
    assert.equal(rpcCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});

test("slide update import uses one atomic RPC call for multi-entry payload", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  let rpcCalls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse([
        {
          category_name: "Identity and Hiearchy",
          field_name: "slideId",
          input_type: "text",
          field_order: 1,
        },
      ]);
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse([]);
    }

    if (url.includes("/rest/v1/rpc/import_slides_update_atomic")) {
      rpcCalls += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: unknown[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 2);
      return jsonResponse(2);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importSlideUpdatesFromJsonPayload([
      { slideId: SLIDE_1_UUID, groupId: GROUP_2_UUID, "Identity and Hiearchy": {} },
      { slideId: SLIDE_2_UUID, "Identity and Hiearchy": {} },
    ]);

    assert.equal(count, 2);
    assert.equal(rpcCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});
