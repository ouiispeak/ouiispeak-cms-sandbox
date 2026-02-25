import type { GroupData, GroupDataMinimal } from "../data/groups";
import type { Group, GroupMinimal } from "../domain/group";
import { createMapper, withDefault } from "../utils/mapper";

/**
 * Mapper for full Group domain model
 */
const groupMapper = createMapper<Group, GroupData>({
  fieldMappings: {
    id: "id",
    lessonId: "lesson_id",
    label: "label",
    title: withDefault("title", ""),
    orderIndex: "order_index",
    groupCode: "group_code",
    shortSummary: "short_summary",
    groupType: "group_type",
    groupSummary: "group_summary",
    extractabilityTier: "extractability_tier",
    purposeRelationshipTag: "purpose_relationship_tag",
    targetNodeKeys: "target_node_keys",
    groupGoal: "group_goal",
    prerequisites: "prerequisites",
    isRequiredToPass: "is_required_to_pass",
    passingScoreType: "passing_score_type",
    passingScoreValue: "passing_score_value",
    maxScoreValue: "max_score_value",
    extraPracticeNotes: "extra_practice_notes",
    l1L2: "l1_l2",
    mediaUsedIds: "media_used_ids",
    groupSlidesPlan: "group_slides_plan",
  },
});

/**
 * Mapper for minimal Group domain model
 */
const groupMinimalMapper = createMapper<GroupMinimal, GroupDataMinimal>({
  fieldMappings: {
    id: "id",
    lessonId: "lesson_id",
    orderIndex: "order_index",
    label: "label",
    title: withDefault("title", ""),
  },
});

/**
 * Convert database row to domain model
 */
export function toGroup(row: GroupData): Group {
  return groupMapper.toDomain(row);
}

/**
 * Convert minimal database row to minimal domain model
 */
export function toGroupMinimal(row: GroupDataMinimal): GroupMinimal {
  return groupMinimalMapper.toDomain(row);
}

/**
 * Convert domain model to database row update shape
 */
export function toGroupRowUpdate(input: Partial<Group>): Partial<GroupData> {
  return groupMapper.toRowUpdate(input);
}

