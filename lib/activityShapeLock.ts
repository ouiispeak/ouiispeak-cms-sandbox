import { buildActivityShapeLockMapFromRequirednessMatrix } from "@/lib/requirednessMatrix";

export type ActivityShapeLockSpec = {
  requiredAll: readonly string[];
  requiredOneOf?: readonly (readonly string[])[];
};

export const ACTIVE_ACTIVITY_SHAPE_LOCK_MAP: Record<string, ActivityShapeLockSpec> =
  buildActivityShapeLockMapFromRequirednessMatrix();

export function listActiveActivityShapeLockFieldKeys(): string[] {
  const keys = new Set<string>();

  for (const spec of Object.values(ACTIVE_ACTIVITY_SHAPE_LOCK_MAP)) {
    for (const key of spec.requiredAll) {
      keys.add(key);
    }

    for (const group of spec.requiredOneOf ?? []) {
      for (const key of group) {
        keys.add(key);
      }
    }
  }

  return [...keys].sort();
}
