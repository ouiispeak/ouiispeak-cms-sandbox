import { buildActivityDefaultsById } from "@/lib/activityRuntimeDefaults";

type ActivityFieldRow = {
  activity_slide_id: string;
  category_name: string;
  field_name: string;
  field_value: string | null;
};

type PropsBackfillUpdate = {
  activitySlideId: string;
  categoryName: string;
  propsJson: Record<string, unknown>;
};

const DEFAULT_PROPS_CATEGORY_NAME = "Activities & Interaction";
const STRUCTURED_DUPLICATE_GUARD_KEYS = [
  "lines",
  "targetText",
  "body",
  "choiceElements",
  "audio",
  "buttons",
  "promptMode",
  "intonationOptions",
  "correctCurveId",
  "audioPrompt",
  "syllableBreakdown",
  "correctStressIndex",
] as const;

const FETCH_FIELD_KEYS = [
  "activityId",
  "propsJson",
  "runtimeContractV1",
  ...STRUCTURED_DUPLICATE_GUARD_KEYS,
] as const;

function hasMeaningfulValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function parseObjectLikeJson(value: string | null | undefined): Record<string, unknown> | null {
  if (!hasMeaningfulValue(value)) {
    return null;
  }

  try {
    const parsed = JSON.parse(value as string);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRuntimeContractV1(activityId: string): Record<string, unknown> | null {
  const defaultsByActivityId = buildActivityDefaultsById();
  const defaults = defaultsByActivityId[activityId];
  if (!defaults) {
    return null;
  }

  return {
    contractVersion: "v1",
    interaction: {
      activity_row_tool: defaults.activityRowTool,
      command_row_controls: defaults.commandRowControls,
      status: "active",
    },
  };
}

function toSupabaseConfig(): { supabaseUrl: string; serviceRoleKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { supabaseUrl, serviceRoleKey };
}

async function fetchRows(resourcePath: string): Promise<ActivityFieldRow[]> {
  const { supabaseUrl, serviceRoleKey } = toSupabaseConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/${resourcePath}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch rows (${response.status}): ${body}`);
  }

  return (await response.json()) as ActivityFieldRow[];
}

async function deleteStructuredDuplicateRows(activitySlideId: string, fieldNames: string[]): Promise<void> {
  if (fieldNames.length === 0) {
    return;
  }

  const { supabaseUrl, serviceRoleKey } = toSupabaseConfig();
  const encodedFieldNames = fieldNames.map((fieldName) => encodeURIComponent(fieldName)).join(",");
  const resourcePath =
    `activity_slide_field_values` +
    `?component_name=eq.activity_slides` +
    `&activity_slide_id=eq.${encodeURIComponent(activitySlideId)}` +
    `&field_name=in.(${encodedFieldNames})`;
  const response = await fetch(`${supabaseUrl}/rest/v1/${resourcePath}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to delete structured duplicate rows for ${activitySlideId} (${response.status}): ${body}`
    );
  }
}

async function upsertPropsJsonRow(update: PropsBackfillUpdate): Promise<void> {
  const { supabaseUrl, serviceRoleKey } = toSupabaseConfig();
  const fieldValue = JSON.stringify(update.propsJson);
  const patchPath =
    `activity_slide_field_values` +
    `?component_name=eq.activity_slides` +
    `&activity_slide_id=eq.${encodeURIComponent(update.activitySlideId)}` +
    `&field_name=eq.propsJson`;

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
    throw new Error(
      `Failed to patch propsJson row for ${update.activitySlideId} (${patchResponse.status}): ${body}`
    );
  }

  const patchedRows = (await patchResponse.json()) as Array<{ activity_slide_id?: string }>;
  if (patchedRows.length > 0) {
    return;
  }

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/activity_slide_field_values`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      activity_slide_id: update.activitySlideId,
      component_name: "activity_slides",
      category_name: update.categoryName,
      field_name: "propsJson",
      field_value: fieldValue,
    }),
    cache: "no-store",
  });

  if (!insertResponse.ok) {
    const body = await insertResponse.text();
    throw new Error(
      `Failed to insert propsJson row for ${update.activitySlideId} (${insertResponse.status}): ${body}`
    );
  }
}

async function loadCandidateRows(): Promise<ActivityFieldRow[]> {
  const fieldList = FETCH_FIELD_KEYS.map((field) => encodeURIComponent(field)).join(",");
  const rows: ActivityFieldRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const resourcePath =
      `activity_slide_field_values` +
      `?select=activity_slide_id,category_name,field_name,field_value` +
      `&component_name=eq.activity_slides` +
      `&field_name=in.(${fieldList})` +
      `&order=activity_slide_id.asc,field_name.asc` +
      `&limit=${pageSize}&offset=${offset}`;
    const page = await fetchRows(resourcePath);
    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return rows;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const rows = await loadCandidateRows();
  const bySlide = new Map<string, ActivityFieldRow[]>();

  for (const row of rows) {
    const bucket = bySlide.get(row.activity_slide_id);
    if (bucket) {
      bucket.push(row);
    } else {
      bySlide.set(row.activity_slide_id, [row]);
    }
  }

  const duplicateDeletes = new Map<string, string[]>();
  const propsBackfills: PropsBackfillUpdate[] = [];
  let unresolvedRuntimeBackfills = 0;

  for (const [activitySlideId, slideRows] of bySlide.entries()) {
    const rowsByField = new Map<string, ActivityFieldRow[]>();
    for (const row of slideRows) {
      const bucket = rowsByField.get(row.field_name);
      if (bucket) {
        bucket.push(row);
      } else {
        rowsByField.set(row.field_name, [row]);
      }
    }

    const propsRow = rowsByField.get("propsJson")?.[0];
    const propsJson = parseObjectLikeJson(propsRow?.field_value);
    if (!propsJson) {
      continue;
    }

    const duplicateFieldNames: string[] = [];
    for (const fieldName of STRUCTURED_DUPLICATE_GUARD_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(propsJson, fieldName)) {
        continue;
      }

      const topLevelRows = rowsByField.get(fieldName) ?? [];
      if (topLevelRows.some((row) => hasMeaningfulValue(row.field_value))) {
        duplicateFieldNames.push(fieldName);
      }
    }

    if (duplicateFieldNames.length > 0) {
      duplicateDeletes.set(activitySlideId, duplicateFieldNames);
    }

    const runtimeFromProps = parseObjectLikeJson(JSON.stringify(propsJson.runtimeContractV1 ?? null));
    if (runtimeFromProps) {
      continue;
    }

    let runtimeContractV1 = parseObjectLikeJson(rowsByField.get("runtimeContractV1")?.[0]?.field_value);
    if (!runtimeContractV1) {
      const activityId = asTrimmedString(rowsByField.get("activityId")?.[0]?.field_value);
      if (activityId) {
        runtimeContractV1 = toRuntimeContractV1(activityId);
      }
    }

    if (!runtimeContractV1) {
      unresolvedRuntimeBackfills += 1;
      continue;
    }

    const nextProps = { ...propsJson, runtimeContractV1 };
    propsBackfills.push({
      activitySlideId,
      categoryName: propsRow?.category_name ?? DEFAULT_PROPS_CATEGORY_NAME,
      propsJson: nextProps,
    });
  }

  const duplicateDeleteCount = [...duplicateDeletes.values()].reduce((sum, fields) => sum + fields.length, 0);
  console.log(`Activity slides scanned: ${bySlide.size}`);
  console.log(`Structured duplicate rows to delete: ${duplicateDeleteCount}`);
  console.log(`propsJson runtimeContractV1 backfills: ${propsBackfills.length}`);
  console.log(`Unresolved runtimeContractV1 backfills: ${unresolvedRuntimeBackfills}`);

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to execute.");
    return;
  }

  for (const [activitySlideId, fieldNames] of duplicateDeletes.entries()) {
    await deleteStructuredDuplicateRows(activitySlideId, fieldNames);
  }

  for (const backfill of propsBackfills) {
    await upsertPropsJsonRow(backfill);
  }

  console.log("Cleanup applied successfully.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
