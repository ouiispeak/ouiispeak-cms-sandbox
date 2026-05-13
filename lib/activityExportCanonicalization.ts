import { deriveActivityStructuredPayloadFieldKeys, normalizeActivityPropsJson } from "@/lib/activityPayloadNormalization";

type CategoryPayload = Record<string, unknown>;
type ActivityExportTemplate = Record<string, CategoryPayload>;

const STRUCTURED_ACTIVITY_FIELD_KEYS = new Set(
  deriveActivityStructuredPayloadFieldKeys().filter((fieldName) => fieldName !== "propsJson")
);

function parseObjectLikePropsJson(value: unknown): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function stripStructuredTopLevelFields(payload: CategoryPayload): CategoryPayload {
  const nextPayload = { ...payload };
  for (const fieldName of STRUCTURED_ACTIVITY_FIELD_KEYS) {
    if (Object.prototype.hasOwnProperty.call(nextPayload, fieldName)) {
      delete nextPayload[fieldName];
    }
  }
  return nextPayload;
}

export function canonicalizeActivityExportTemplate(
  template: ActivityExportTemplate,
  activityId: string | null | undefined
): ActivityExportTemplate {
  const nextTemplate: ActivityExportTemplate = { ...template };

  for (const [categoryKey, categoryPayload] of Object.entries(template)) {
    const normalizedCategoryPayload: CategoryPayload = stripStructuredTopLevelFields(categoryPayload);
    const propsJson = parseObjectLikePropsJson(normalizedCategoryPayload.propsJson);
    if (propsJson) {
      normalizedCategoryPayload.propsJson = normalizeActivityPropsJson(activityId, propsJson);
    }

    nextTemplate[categoryKey] = normalizedCategoryPayload;
  }

  return nextTemplate;
}
