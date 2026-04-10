import { getTopLevelOnlyFieldKeys, type HierarchyComponentName } from "@/lib/canonicalFieldMap";
import type { UniversalConfigCategory } from "@/lib/universalConfigs";
import {
  buildActivityPropsRuntimeRuleMapFromRequirednessMatrix,
  buildCategoryPayloadRuntimeRuleFromRequirednessMatrix,
} from "@/lib/requirednessMatrix";

type RuntimeRule = {
  requiredAll: string[];
  requiredOneOf?: string[][];
};

const ACTIVITY_PROPS_RUNTIME_RULES = buildActivityPropsRuntimeRuleMapFromRequirednessMatrix();

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseObjectLikeJson(value: unknown): Record<string, unknown> | null {
  if (isObjectRecord(value)) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isObjectRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isMissingRuntimeValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isObjectRecord(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}

function activeFieldNamesFromCategories(categories: UniversalConfigCategory[]): Set<string> {
  const activeFieldNames = new Set<string>();
  for (const category of categories) {
    for (const field of category.fields) {
      activeFieldNames.add(field.key);
    }
  }
  return activeFieldNames;
}

function getRuntimeRuleForComponent(componentName: HierarchyComponentName): RuntimeRule {
  return buildCategoryPayloadRuntimeRuleFromRequirednessMatrix(componentName);
}

function getCategoryPayloadFieldValue(
  payload: Record<string, unknown>,
  categories: UniversalConfigCategory[],
  fieldName: string,
  topLevelOnlyFields: Set<string>
): unknown {
  if (topLevelOnlyFields.has(fieldName)) {
    return payload[fieldName];
  }

  for (const category of categories) {
    const categoryPayload = payload[category.key];
    if (!isObjectRecord(categoryPayload)) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(categoryPayload, fieldName)) {
      return categoryPayload[fieldName];
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, fieldName)) {
    return payload[fieldName];
  }

  return undefined;
}

function assertCategoryPayloadRuntimeRequirements(
  componentName: HierarchyComponentName,
  categories: UniversalConfigCategory[],
  payload: Record<string, unknown>,
  contextLabel: string
): void {
  const runtimeRule = getRuntimeRuleForComponent(componentName);
  const activeFieldNames = activeFieldNamesFromCategories(categories);
  const topLevelOnlyFields = getTopLevelOnlyFieldKeys(componentName);

  const requiredFieldNames = runtimeRule.requiredAll.filter((fieldName) => activeFieldNames.has(fieldName));
  const requiredOneOfGroups = (runtimeRule.requiredOneOf ?? [])
    .map((group) => group.filter((fieldName) => activeFieldNames.has(fieldName)))
    .filter((group) => group.length > 0);

  const missingFields = requiredFieldNames.filter((fieldName) =>
    isMissingRuntimeValue(getCategoryPayloadFieldValue(payload, categories, fieldName, topLevelOnlyFields))
  );

  if (missingFields.length > 0) {
    throw new Error(
      `${contextLabel} runtime export gate failed: missing required runtime fields: ${missingFields.join(", ")}.`
    );
  }

  const missingOneOfGroups: string[][] = [];
  for (const group of requiredOneOfGroups) {
    const hasAny = group.some(
      (fieldName) =>
        !isMissingRuntimeValue(getCategoryPayloadFieldValue(payload, categories, fieldName, topLevelOnlyFields))
    );
    if (!hasAny) {
      missingOneOfGroups.push(group);
    }
  }

  if (missingOneOfGroups.length > 0) {
    const groupsText = missingOneOfGroups.map((group) => `[${group.join(" | ")}]`).join(", ");
    throw new Error(
      `${contextLabel} runtime export gate failed: missing required one-of runtime groups: ${groupsText}.`
    );
  }
}

function assertActivityPropsRuntimeRequirements(
  payload: Record<string, unknown>,
  categories: UniversalConfigCategory[],
  contextLabel: string
): void {
  const topLevelOnlyFields = getTopLevelOnlyFieldKeys("activity_slides");
  const activityIdRaw = getCategoryPayloadFieldValue(payload, categories, "activityId", topLevelOnlyFields);
  const activityId = typeof activityIdRaw === "string" ? activityIdRaw.trim() : "";
  if (activityId.length === 0) {
    return;
  }

  const propsJsonRaw = getCategoryPayloadFieldValue(payload, categories, "propsJson", topLevelOnlyFields);
  const propsJson = parseObjectLikeJson(propsJsonRaw);
  if (!propsJson) {
    throw new Error(
      `${contextLabel} runtime export gate failed: missing required runtime object "propsJson" for ${activityId}.`
    );
  }

  const activityRule = ACTIVITY_PROPS_RUNTIME_RULES[activityId];
  if (!activityRule) {
    throw new Error(
      `${contextLabel} runtime export gate failed: unsupported activityId "${activityId}" has no runtime rule.`
    );
  }

  const requiredFieldNames = activityRule.requiredAll.filter((fieldName) => fieldName !== "propsJson");
  const missingFields = requiredFieldNames.filter((fieldName) =>
    isMissingRuntimeValue(propsJson[fieldName])
  );
  if (missingFields.length > 0) {
    throw new Error(
      `${contextLabel} runtime export gate failed: missing required runtime propsJson fields for ${activityId}: ${missingFields.join(
        ", "
      )}.`
    );
  }

  const missingOneOfGroups: string[][] = [];
  for (const group of activityRule.requiredOneOf ?? []) {
    const hasAny = group.some((fieldName) => !isMissingRuntimeValue(propsJson[fieldName]));
    if (!hasAny) {
      missingOneOfGroups.push(group);
    }
  }

  if (missingOneOfGroups.length > 0) {
    const groupsText = missingOneOfGroups.map((group) => `[${group.join(" | ")}]`).join(", ");
    throw new Error(
      `${contextLabel} runtime export gate failed: missing required one-of propsJson groups for ${activityId}: ${groupsText}.`
    );
  }
}

export function assertExportRuntimeGate(
  componentName: HierarchyComponentName,
  categories: UniversalConfigCategory[],
  payload: Record<string, unknown>,
  contextLabel: string
): void {
  assertCategoryPayloadRuntimeRequirements(componentName, categories, payload, contextLabel);

  if (componentName === "activity_slides") {
    assertActivityPropsRuntimeRequirements(payload, categories, contextLabel);
  }
}
