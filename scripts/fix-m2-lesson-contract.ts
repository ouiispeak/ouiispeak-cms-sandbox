import fs from "node:fs";
import path from "node:path";
import { collectOrderIndexPatchesFromNestedLesson } from "@/lib/groupSlidesPlanOrderIndex";

const M2_LESSON_ID = "0ee100b3-2a47-4fcd-8a2b-8f804f293d6c";
const M2_LESSON_END_ID = "ff2605c0-ec33-4e11-b9d2-fb963b6053f4";
const M2_ACT017_SLIDE_ID = "4423017f-b30c-4ad5-9655-dbaf8dbc35a1";
const LESSON_END_ORDER_INDEX = 6;

type CliOptions = {
  apply: boolean;
  envFile: string;
  payloadPath: string;
};

function loadEnvFile(envFilePath: string): void {
  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Env file not found: ${envFilePath}`);
  }

  const content = fs.readFileSync(envFilePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function toSupabaseConfig(): { supabaseUrl: string; serviceRoleKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { supabaseUrl, serviceRoleKey };
}

async function patchFieldValue(
  table: "slide_field_values" | "activity_slide_field_values" | "lesson_end_field_values",
  idColumn: "slide_id" | "activity_slide_id" | "lesson_end_id",
  entityId: string,
  fieldName: string,
  fieldValue: string,
  categoryName: string,
  componentName: string
): Promise<void> {
  const { supabaseUrl, serviceRoleKey } = toSupabaseConfig();
  const patchPath =
    `${table}` +
    `?component_name=eq.${encodeURIComponent(componentName)}` +
    `&${idColumn}=eq.${encodeURIComponent(entityId)}` +
    `&field_name=eq.${encodeURIComponent(fieldName)}`;

  const patchResponse = await fetch(`${supabaseUrl}/rest/v1/${patchPath}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ field_value: fieldValue }),
    cache: "no-store",
  });

  if (!patchResponse.ok) {
    const body = await patchResponse.text();
    throw new Error(`PATCH ${table}.${fieldName} for ${entityId} failed (${patchResponse.status}): ${body}`);
  }

  const patchedRows = (await patchResponse.json()) as unknown[];
  if (patchedRows.length > 0) {
    return;
  }

  const insertBody: Record<string, string> = {
    [idColumn]: entityId,
    component_name: componentName,
    category_name: categoryName,
    field_name: fieldName,
    field_value: fieldValue,
  };

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(insertBody),
    cache: "no-store",
  });

  if (!insertResponse.ok) {
    const body = await insertResponse.text();
    throw new Error(`INSERT ${table}.${fieldName} for ${entityId} failed (${insertResponse.status}): ${body}`);
  }
}

function normalizeAct017PropsJson(propsJson: Record<string, unknown>): Record<string, unknown> {
  const nextProps: Record<string, unknown> = { ...propsJson };
  const blanksRaw = nextProps.blanks;
  if (!Array.isArray(blanksRaw)) {
    return nextProps;
  }

  nextProps.blanks = blanksRaw.map((blank) => {
    if (!blank || typeof blank !== "object" || Array.isArray(blank)) {
      return blank;
    }
    const nextBlank = { ...(blank as Record<string, unknown>) };
    if (!Array.isArray(nextBlank.acceptedAlternatives)) {
      const fromAcceptedAnswers = Array.isArray(nextBlank.acceptedAnswers)
        ? nextBlank.acceptedAnswers.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];
      nextBlank.acceptedAlternatives = fromAcceptedAnswers.length > 0 ? fromAcceptedAnswers : [];
    }
    return nextBlank;
  });

  return nextProps;
}

async function fetchActivityPropsJson(activitySlideId: string): Promise<{
  propsJson: Record<string, unknown>;
  categoryName: string;
} | null> {
  const { supabaseUrl, serviceRoleKey } = toSupabaseConfig();
  const resourcePath =
    `activity_slide_field_values` +
    `?select=category_name,field_value` +
    `&component_name=eq.activity_slides` +
    `&activity_slide_id=eq.${encodeURIComponent(activitySlideId)}` +
    `&field_name=eq.propsJson`;

  const response = await fetch(`${supabaseUrl}/rest/v1/${resourcePath}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch propsJson for ${activitySlideId} (${response.status}): ${body}`);
  }

  const rows = (await response.json()) as Array<{ category_name?: string; field_value?: string }>;
  const row = rows.at(0);
  if (!row?.field_value) {
    return null;
  }

  try {
    const parsed = JSON.parse(row.field_value) as Record<string, unknown>;
    return {
      propsJson: parsed,
      categoryName: row.category_name ?? "Activities & Interaction",
    };
  } catch {
    throw new Error(`Invalid propsJson stored for activity slide ${activitySlideId}.`);
  }
}

function parseCliArgs(argv: string[]): CliOptions {
  const apply = argv.includes("--apply");
  const envFileArgIndex = argv.indexOf("--env-file");
  const payloadArgIndex = argv.indexOf("--payload");

  const defaultPayload = path.resolve(
    "/Users/raycheljohnson/Desktop/LV3-Unicorn/central/specs/wave3-stage-evidence/closed-loop-proof/2026-05-18-loopclose-phase0/ls180526Milestone2/source/s7/nested_payload_enriched.json"
  );

  return {
    apply,
    envFile:
      envFileArgIndex >= 0 && argv[envFileArgIndex + 1]
        ? path.resolve(argv[envFileArgIndex + 1])
        : path.resolve(process.cwd(), ".env.local"),
    payloadPath:
      payloadArgIndex >= 0 && argv[payloadArgIndex + 1]
        ? path.resolve(argv[payloadArgIndex + 1])
        : defaultPayload,
  };
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  loadEnvFile(options.envFile);

  const payload = JSON.parse(fs.readFileSync(options.payloadPath, "utf8")) as Record<string, unknown>;
  const orderIndexPatches = collectOrderIndexPatchesFromNestedLesson(payload);
  const act017Props = await fetchActivityPropsJson(M2_ACT017_SLIDE_ID);
  const normalizedAct017Props = act017Props ? normalizeAct017PropsJson(act017Props.propsJson) : null;

  console.log(`M2 lesson contract repair (${options.apply ? "apply" : "dry-run"})`);
  console.log(`Payload: ${options.payloadPath}`);
  console.log(`orderIndex patches: ${orderIndexPatches.length}`);
  for (const patch of orderIndexPatches) {
    console.log(`  ${patch.table} ${patch.slideId} -> orderIndex ${patch.orderIndex}`);
  }
  console.log(`lesson_end ${M2_LESSON_END_ID} -> orderIndex ${LESSON_END_ORDER_INDEX}`);
  if (normalizedAct017Props) {
    const blanks = normalizedAct017Props.blanks;
    console.log(`ACT-017 ${M2_ACT017_SLIDE_ID} propsJson.blanks: ${JSON.stringify(blanks)}`);
  } else {
    console.log(`ACT-017 ${M2_ACT017_SLIDE_ID}: propsJson row not found (will skip props patch)`);
  }

  if (!options.apply) {
    console.log("Dry run only. Re-run with --apply to execute.");
    return;
  }

  for (const patch of orderIndexPatches) {
    if (patch.table === "slides") {
      await patchFieldValue(
        "slide_field_values",
        "slide_id",
        patch.slideId,
        "orderIndex",
        String(patch.orderIndex),
        "Structure & Sequencing",
        "slides"
      );
      continue;
    }

    await patchFieldValue(
      "activity_slide_field_values",
      "activity_slide_id",
      patch.slideId,
      "orderIndex",
      String(patch.orderIndex),
      "Structure & Sequencing",
      "activity_slides"
    );
  }

  await patchFieldValue(
    "lesson_end_field_values",
    "lesson_end_id",
    M2_LESSON_END_ID,
    "orderIndex",
    String(LESSON_END_ORDER_INDEX),
    "Structure & Sequencing",
    "lesson_ends"
  );

  if (normalizedAct017Props && act017Props) {
    await patchFieldValue(
      "activity_slide_field_values",
      "activity_slide_id",
      M2_ACT017_SLIDE_ID,
      "propsJson",
      JSON.stringify(normalizedAct017Props),
      act017Props.categoryName,
      "activity_slides"
    );
  }

  console.log("M2 lesson contract repair applied.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
