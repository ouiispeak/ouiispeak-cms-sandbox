/**
 * Domain model for Group
 * Uses camelCase field names for UI consumption
 */
export type Group = {
  id: string;
  lessonId: string | null;
  label: string | null;
  title: string | null;
  orderIndex: number | null;
  groupCode: string | null;
  shortSummary: string | null;
  groupType: string | null;
  groupSummary: string | null;
  extractabilityTier: string | null;
  purposeRelationshipTag: string | null;
  targetNodeKeys: string[] | null;
  groupGoal: string | null;
  prerequisites: string | null;
  isRequiredToPass: boolean | null;
  passingScoreType: string | null;
  passingScoreValue: number | null;
  maxScoreValue: number | null;
  extraPracticeNotes: string | null;
  l1L2: string | null;
  mediaUsedIds: string | null;
  groupSlidesPlan: unknown | null;
};

/**
 * Minimal group data for dropdowns/lists
 */
export type GroupMinimal = {
  id: string;
  lessonId: string | null;
  orderIndex: number | null;
  label: string | null;
  title: string | null;
};

