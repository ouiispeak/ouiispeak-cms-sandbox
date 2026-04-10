import type { ConcreteActivityProfile } from "@/lib/activityProfiles";

export type ActivityRuntimeDefault = {
  activityId:
    | "ACT-001"
    | "ACT-002"
    | "ACT-003"
    | "ACT-004"
    | "ACT-005"
    | "ACT-009"
    | "ACT-010"
    | "ACT-011"
    | "ACT-012"
    | "ACT-013"
    | "ACT-014"
    | "ACT-015"
    | "ACT-016"
    | "ACT-017"
    | "ACT-018"
    | "ACT-019"
    | "ACT-020"
    | "ACT-021"
    | "ACT-022"
    | "ACT-023"
    | "ACT-024"
    | "ACT-025"
    | "ACT-026";
  activityRowTool: string;
  commandRowControls: string[];
};

export const ACTIVITY_PROFILE_DEFAULTS: Record<ConcreteActivityProfile, ActivityRuntimeDefault> = {
  "act-001": {
    activityId: "ACT-001",
    activityRowTool: "ChipSequencePlayer",
    commandRowControls: ["play"],
  },
  "act-002": {
    activityId: "ACT-002",
    activityRowTool: "ChipSelector",
    commandRowControls: ["play", "pause"],
  },
  "act-003": {
    activityId: "ACT-003",
    activityRowTool: "MinimalPairSelector",
    commandRowControls: ["play"],
  },
  "act-004": {
    activityId: "ACT-004",
    activityRowTool: "ChipSelector",
    commandRowControls: ["play"],
  },
  "act-005": {
    activityId: "ACT-005",
    activityRowTool: "SequentialRecorder",
    commandRowControls: ["play", "pause"],
  },
  "act-009": {
    activityId: "ACT-009",
    activityRowTool: "AudioChoiceSelector",
    commandRowControls: ["play"],
  },
  "act-010": {
    activityId: "ACT-010",
    activityRowTool: "AudioChoiceSelector",
    commandRowControls: [],
  },
  "act-011": {
    activityId: "ACT-011",
    activityRowTool: "ChipSelector",
    commandRowControls: [],
  },
  "act-012": {
    activityId: "ACT-012",
    activityRowTool: "ChipSelector",
    commandRowControls: [],
  },
  "act-013": {
    activityId: "ACT-013",
    activityRowTool: "ChipMatchPairs",
    commandRowControls: [],
  },
  "act-014": {
    activityId: "ACT-014",
    activityRowTool: "ChipWordSort",
    commandRowControls: [],
  },
  "act-015": {
    activityId: "ACT-015",
    activityRowTool: "ChipSequenceBuilder",
    commandRowControls: [],
  },
  "act-016": {
    activityId: "ACT-016",
    activityRowTool: "ChipWordSort",
    commandRowControls: [],
  },
  "act-017": {
    activityId: "ACT-017",
    activityRowTool: "InlineGapTextInput",
    commandRowControls: [],
  },
  "act-018": {
    activityId: "ACT-018",
    activityRowTool: "WordBankInput",
    commandRowControls: [],
  },
  "act-019": {
    activityId: "ACT-019",
    activityRowTool: "ChipRetypeCorrection",
    commandRowControls: [],
  },
  "act-020": {
    activityId: "ACT-020",
    activityRowTool: "FreeRecorder",
    commandRowControls: [],
  },
  "act-021": {
    activityId: "ACT-021",
    activityRowTool: "ChipAudioMatcher",
    commandRowControls: ["play", "pause"],
  },
  "act-022": {
    activityId: "ACT-022",
    activityRowTool: "FreeRecorder",
    commandRowControls: [],
  },
  "act-023": {
    activityId: "ACT-023",
    activityRowTool: "AvatarDialoguePlayer",
    commandRowControls: ["play"],
  },
  "act-024": {
    activityId: "ACT-024",
    activityRowTool: "SpeechComparer",
    commandRowControls: [],
  },
  "act-025": {
    activityId: "ACT-025",
    activityRowTool: "ReorderList",
    commandRowControls: [],
  },
  "act-026": {
    activityId: "ACT-026",
    activityRowTool: "FreeRecorder",
    commandRowControls: [],
  },
};

export function buildActivityDefaultsById(): Record<string, ActivityRuntimeDefault> {
  const byId: Record<string, ActivityRuntimeDefault> = {};
  for (const entry of Object.values(ACTIVITY_PROFILE_DEFAULTS)) {
    byId[entry.activityId] = entry;
  }
  return byId;
}
