import test from "node:test";
import assert from "node:assert/strict";
import { importModulesFromJsonPayload, importModuleUpdatesFromJsonPayload } from "../lib/modules";

const MODULE_1_UUID = "11111111-1111-4111-8111-111111111111";
const MODULE_2_UUID = "22222222-2222-4222-8222-222222222222";
const MODULE_3_UUID = "33333333-3333-4333-8333-333333333333";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

type RpcCreateRow = {
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type RpcUpdateRow = {
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

function valuesToMap(rows: Array<{ field_name: string; field_value: string | null }>): Map<string, string | null> {
  return new Map(rows.map((row) => [row.field_name, row.field_value]));
}

function mockModuleConfigRows() {
  return [
    {
      category_name: "Identity & Lifecycle",
      field_name: "title",
      input_type: "text",
      field_order: 1,
    },
    {
      category_name: "Identity & Lifecycle",
      field_name: "slug",
      input_type: "text",
      field_order: 2,
    },
    {
      category_name: "Identity & Lifecycle",
      field_name: "version",
      input_type: "text",
      field_order: 3,
    },
    {
      category_name: "Identity & Lifecycle",
      field_name: "sourceVersion",
      input_type: "text",
      field_order: 4,
    },
  ];
}

function mockRequiredRuleRows() {
  return [
    { field_key: "title" },
    { field_key: "slug" },
    { field_key: "version" },
    { field_key: "sourceVersion" },
  ];
}

test("module create import auto-generates unique slug and enforces source/version policy", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse(mockModuleConfigRows());
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse(mockRequiredRuleRows());
    }

    if (
      url.includes(
        "/rest/v1/module_field_values?select=module_id,field_value&component_name=eq.modules&field_name=eq.slug"
      )
    ) {
      if (url.includes("field_value=eq.hello-world-2")) {
        return jsonResponse([{ module_id: MODULE_2_UUID, field_value: "hello-world-2" }]);
      }
      if (url.includes("field_value=eq.hello-world-3")) {
        return jsonResponse([{ module_id: MODULE_3_UUID, field_value: "hello-world-3" }]);
      }
      return jsonResponse([{ module_id: MODULE_1_UUID, field_value: "hello-world" }]);
    }

    if (
      url.includes(
        "/rest/v1/module_field_values?select=module_id&component_name=eq.modules&field_name=eq.slug"
      )
    ) {
      if (url.includes("field_value=eq.hello-world-2")) {
        return jsonResponse([{ module_id: MODULE_2_UUID }]);
      }
      if (url.includes("field_value=eq.hello-world-3")) {
        return jsonResponse([{ module_id: MODULE_3_UUID }]);
      }
      return jsonResponse([{ module_id: MODULE_1_UUID }]);
    }

    if (url.includes(`/rest/v1/modules?select=id&id=eq.${MODULE_2_UUID}&limit=1`)) {
      return jsonResponse([{ id: MODULE_2_UUID }]);
    }

    if (url.includes(`/rest/v1/modules?select=id&id=eq.${MODULE_3_UUID}&limit=1`)) {
      return jsonResponse([{ id: MODULE_3_UUID }]);
    }

    if (
      url.includes(
        `/rest/v1/module_field_values?select=module_id,component_name,category_name,field_name,field_value&module_id=eq.${MODULE_2_UUID}&component_name=eq.modules`
      )
    ) {
      return jsonResponse([
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "title",
          field_value: "Hello World",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "slug",
          field_value: "hello-world-2",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "version",
          field_value: "1",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "sourceVersion",
          field_value: "v1",
        },
      ]);
    }

    if (
      url.includes(
        `/rest/v1/module_field_values?select=module_id,component_name,category_name,field_name,field_value&module_id=eq.${MODULE_3_UUID}&component_name=eq.modules`
      )
    ) {
      return jsonResponse([
        {
          module_id: MODULE_3_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "title",
          field_value: "Hello World",
        },
        {
          module_id: MODULE_3_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "slug",
          field_value: "hello-world-3",
        },
        {
          module_id: MODULE_3_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "version",
          field_value: "1",
        },
        {
          module_id: MODULE_3_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "sourceVersion",
          field_value: "v1",
        },
      ]);
    }

    if (url.includes("/rest/v1/rpc/import_modules_create_atomic")) {
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: RpcCreateRow[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 2);

      const firstMap = valuesToMap(body.p_rows?.[0]?.values ?? []);
      const secondMap = valuesToMap(body.p_rows?.[1]?.values ?? []);

      assert.equal(firstMap.get("slug"), "hello-world-2");
      assert.equal(secondMap.get("slug"), "hello-world-3");
      assert.equal(firstMap.get("version"), "1");
      assert.equal(secondMap.get("version"), "1");
      assert.equal(firstMap.get("sourceVersion"), "v1");
      assert.equal(secondMap.get("sourceVersion"), "v1");

      return jsonResponse(2);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importModulesFromJsonPayload([
      { "Identity & Lifecycle": { title: "Hello World" } },
      { "Identity & Lifecycle": { title: "Hello World" } },
    ]);
    assert.equal(count, 2);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});

test("module update import freezes slug, increments version, and normalizes sourceVersion", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse(mockModuleConfigRows());
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse(mockRequiredRuleRows());
    }

    if (
      url.includes(
        `/rest/v1/module_field_values?select=module_id,component_name,category_name,field_name,field_value&module_id=eq.${MODULE_2_UUID}`
      )
    ) {
      return jsonResponse([
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "title",
          field_value: "Renamed Module Title",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "slug",
          field_value: "frozen-slug",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "version",
          field_value: "3",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "sourceVersion",
          field_value: "v1",
        },
      ]);
    }

    if (
      url.includes(
        "/rest/v1/module_field_values?select=module_id,field_value&component_name=eq.modules&field_name=eq.slug"
      )
    ) {
      return jsonResponse([{ module_id: MODULE_2_UUID, field_value: "frozen-slug" }]);
    }

    if (url.includes("/rest/v1/rpc/import_modules_update_atomic")) {
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: RpcUpdateRow[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 1);

      const map = valuesToMap(body.p_rows?.[0]?.values ?? []);
      assert.equal(map.get("slug"), "frozen-slug");
      assert.equal(map.get("version"), "4");
      assert.equal(map.get("sourceVersion"), "v1");

      return jsonResponse(1);
    }

    if (url.includes(`/rest/v1/modules?select=id&id=eq.${MODULE_2_UUID}&limit=1`)) {
      return jsonResponse([{ id: MODULE_2_UUID }]);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    const count = await importModuleUpdatesFromJsonPayload([
      {
        moduleId: MODULE_2_UUID,
        "Identity & Lifecycle": {
          title: "Renamed Module Title",
          sourceVersion: "v999",
        },
      },
    ]);
    assert.equal(count, 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});

test("module create import fails closed when post-write DB required field is missing", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/rest/v1/config_component_fields")) {
      return jsonResponse(mockModuleConfigRows());
    }

    if (url.includes("/rest/v1/field_dictionary_component_rules")) {
      return jsonResponse(mockRequiredRuleRows());
    }

    if (
      url.includes(
        "/rest/v1/module_field_values?select=module_id,field_value&component_name=eq.modules&field_name=eq.slug"
      )
    ) {
      return jsonResponse([]);
    }

    if (url.includes("/rest/v1/rpc/import_modules_create_atomic")) {
      const body = JSON.parse(String(init?.body ?? "{}")) as { p_rows?: RpcCreateRow[] };
      assert.equal(Array.isArray(body.p_rows), true);
      assert.equal(body.p_rows?.length, 1);
      return jsonResponse(1);
    }

    if (
      url.includes(
        "/rest/v1/module_field_values?select=module_id&component_name=eq.modules&field_name=eq.slug&field_value=eq.missing-version-check"
      )
    ) {
      return jsonResponse([{ module_id: MODULE_2_UUID }]);
    }

    if (url.includes(`/rest/v1/modules?select=id&id=eq.${MODULE_2_UUID}&limit=1`)) {
      return jsonResponse([{ id: MODULE_2_UUID }]);
    }

    if (
      url.includes(
        `/rest/v1/module_field_values?select=module_id,component_name,category_name,field_name,field_value&module_id=eq.${MODULE_2_UUID}&component_name=eq.modules`
      )
    ) {
      return jsonResponse([
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "title",
          field_value: "Missing Version Check",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "slug",
          field_value: "missing-version-check",
        },
        {
          module_id: MODULE_2_UUID,
          component_name: "modules",
          category_name: "Identity & Lifecycle",
          field_name: "sourceVersion",
          field_value: "v1",
        },
      ]);
    }

    return new Response("Unexpected URL in test", { status: 500 });
  }) as typeof fetch;

  try {
    await assert.rejects(
      async () =>
        importModulesFromJsonPayload([{ "Identity & Lifecycle": { title: "Missing Version Check" } }]),
      /post-write DB validation failed; missing required persisted module fields: version/i
    );
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  }
});
