import CustomFieldInput from "@/components/CustomFieldInput";
import { isCustomComplexInputType, loadActivitySlideConfigCategories } from "@/lib/universalConfigs";
import {
  filterActivitySlideCategoriesForProfile,
  resolveConcreteActivityProfile,
  resolveConcreteActivityProfileFromActivityId,
  type ConcreteActivityProfile,
} from "@/lib/activityProfiles";
import {
  createActivitySlideFromFormData,
  loadActivitySlideById,
  updateActivitySlideFromFormData,
} from "@/lib/activitySlides";
import { loadGroups } from "@/lib/groups";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CompositeLeaderFieldKey =
  | "syllableBreakdown"
  | "intonationOptions"
  | "categoryLabels"
  | "sentenceTokens"
  | "tenseBins"
  | "incorrectSentence"
  | "promptText"
  | "word"
  | "audioClips";

const COMPOSITE_FIELD_GROUPS: Record<CompositeLeaderFieldKey, readonly string[]> = {
  syllableBreakdown: ["correctStressIndex"],
  intonationOptions: ["correctCurveId"],
  categoryLabels: ["wordBank"],
  sentenceTokens: ["correctOrderWords"],
  tenseBins: ["sentenceCards"],
  incorrectSentence: ["errorIndex", "acceptedCorrections"],
  promptText: ["targetKeywords", "keywordThreshold", "minWordCount", "maxWordCount"],
  word: ["letterUnits"],
  audioClips: ["correctOrderClips"],
};

const COMPOSITE_LEADER_FIELD_KEYS = new Set<string>(Object.keys(COMPOSITE_FIELD_GROUPS));
const COMPOSITE_FOLLOWER_TO_LEADER_MAP = new Map<string, CompositeLeaderFieldKey>(
  Object.entries(COMPOSITE_FIELD_GROUPS).flatMap(([leaderKey, followerKeys]) =>
    followerKeys.map((followerKey) => [followerKey, leaderKey as CompositeLeaderFieldKey] as const)
  )
);

function isCompositeLeaderFieldKey(fieldKey: string): fieldKey is CompositeLeaderFieldKey {
  return COMPOSITE_LEADER_FIELD_KEYS.has(fieldKey);
}

const ACTIVITY_PROFILE_DEFAULTS: Record<
  ConcreteActivityProfile,
  {
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
  }
> = {
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

async function createActivitySlideAction(formData: FormData) {
  "use server";

  const activitySlideId = await createActivitySlideFromFormData(formData);
  redirect(`/edit-activity-slide/${activitySlideId}`);
}

async function updateActivitySlideAction(activitySlideId: string, formData: FormData) {
  "use server";

  await updateActivitySlideFromFormData(activitySlideId, formData);
  redirect(`/edit-activity-slide/${activitySlideId}`);
}

export default async function EditActivitySlidePage({
  params,
  searchParams,
}: {
  params: Promise<{ activitySlideId: string }>;
  searchParams?: Promise<{ profile?: string | string[] }> | { profile?: string | string[] };
}) {
  const { activitySlideId } = await params;
  const isNewActivitySlideRoute = activitySlideId === "new";
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activityProfile = resolveConcreteActivityProfile(resolvedSearchParams.profile);
  const pageTitle = isNewActivitySlideRoute ? "New Activity Slide" : "Edit Activity Slide";

  try {
    const [categories, activitySlideRecord, groups] = await Promise.all([
      loadActivitySlideConfigCategories(),
      isNewActivitySlideRoute ? Promise.resolve(null) : loadActivitySlideById(activitySlideId),
      loadGroups(),
    ]);

    if (!isNewActivitySlideRoute && !activitySlideRecord) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-activity-slide/[activitySlideId]</p>
          <p className="meta">Activity slide not found in Supabase.</p>
        </section>
      );
    }

    if (groups.length === 0) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-activity-slide/[activitySlideId]</p>
          <p className="meta">No groups exist yet. Create a group first.</p>
        </section>
      );
    }

    const defaultGroupId = activitySlideRecord?.group_id ?? groups[0].id;
    const savedActivityId =
      activitySlideRecord?.values?.["Identity & Lifecycle"]?.activityId ?? activitySlideRecord?.values?.Identity?.activityId;
    const selectedProfile = isNewActivitySlideRoute
      ? activityProfile
      : resolveConcreteActivityProfileFromActivityId(savedActivityId);
    const profileDefaults = ACTIVITY_PROFILE_DEFAULTS[selectedProfile];
    const profileCategories = filterActivitySlideCategoriesForProfile(categories, selectedProfile);
    const profileFieldKeySet = new Set(
      profileCategories.flatMap((category) => category.fields.map((field) => field.key))
    );

    const getFieldDefaultValue = (categoryKey: string, fieldKey: string): string | undefined => {
      if (isNewActivitySlideRoute) {
        if (fieldKey === "slideId") {
          return "Auto-assigned";
        }
        if (fieldKey === "type") {
          return "activity";
        }
        if (fieldKey === "activityId") {
          return profileDefaults.activityId;
        }
        if (fieldKey === "runtimeContractV1") {
          return JSON.stringify(
            {
              contractVersion: "v1",
              interaction: {
                activity_row_tool: profileDefaults.activityRowTool,
                command_row_controls: profileDefaults.commandRowControls,
                status: "active",
              },
            },
            null,
            2
          );
        }
        return undefined;
      }

      if (!activitySlideRecord) {
        return undefined;
      }

      if (fieldKey === "slideId") {
        return String(activitySlideRecord.id);
      }

      const categoryValues = activitySlideRecord.values[categoryKey];
      if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
        return categoryValues[fieldKey] ?? undefined;
      }

      return undefined;
    };

    const categoriesMarkup = (
      <div className="configCategoryList">
        {profileCategories.map((category) => (
          <section key={category.key} className="configCategory">
            <h3 className="configCategoryTitle">{category.label}</h3>
            {category.fields.length === 0 ? (
              <p className="meta">No fields in this category.</p>
            ) : (
              <div className="configForm">
                {category.fields.map((field) => (
                  (() => {
                    const leaderFieldKey = COMPOSITE_FOLLOWER_TO_LEADER_MAP.get(field.key);
                    if (
                      leaderFieldKey &&
                      profileFieldKeySet.has(leaderFieldKey) &&
                      COMPOSITE_LEADER_FIELD_KEYS.has(leaderFieldKey)
                    ) {
                      return null;
                    }

                    return (
                      <div key={`${category.key}-${field.key}`} className="configField">
                    <label htmlFor={`edit-activity-slide-${category.key}-${field.key}`}>{field.label}</label>
                    {(() => {
                      const fieldDefaultValue = getFieldDefaultValue(category.key, field.key);
                      const isLockedField = field.isReadOnly || field.key === "slideId";
                      const hasCurrentValue =
                        fieldDefaultValue !== undefined && fieldDefaultValue !== null && fieldDefaultValue !== "";
                      const currentInOptions =
                        hasCurrentValue && field.options.includes(String(fieldDefaultValue));

                      if (isCustomComplexInputType(field.inputType) || isCompositeLeaderFieldKey(field.key)) {
                        const compositeFollowerKeys = isCompositeLeaderFieldKey(field.key)
                          ? COMPOSITE_FIELD_GROUPS[field.key].filter((followerKey) => profileFieldKeySet.has(followerKey))
                          : [];

                        const compositeFields = compositeFollowerKeys.map((followerKey) => ({
                          key: followerKey,
                          name: `${category.key}.${followerKey}`,
                          defaultValue: getFieldDefaultValue(category.key, followerKey),
                        }));

                        return (
                          <CustomFieldInput
                            id={`edit-activity-slide-${category.key}-${field.key}`}
                            name={`${category.key}.${field.key}`}
                            inputType={field.inputType}
                            fieldKey={field.key}
                            defaultValue={fieldDefaultValue}
                            compositeFields={compositeFields}
                            readOnly={isLockedField}
                          />
                        );
                      }

                      if (field.inputType === "textarea" || field.inputType === "json" || field.inputType === "list") {
                        return (
                          <textarea
                            id={`edit-activity-slide-${category.key}-${field.key}`}
                            name={`${category.key}.${field.key}`}
                            defaultValue={fieldDefaultValue}
                            readOnly={isLockedField}
                            disabled={isLockedField}
                            required={field.isRequired && !isLockedField}
                          />
                        );
                      }

                      if (field.inputType === "checkbox") {
                        const checkboxChecked = String(fieldDefaultValue ?? "").toLowerCase() === "true";
                        if (isLockedField) {
                          return (
                            <input
                              id={`edit-activity-slide-${category.key}-${field.key}`}
                              type="checkbox"
                              defaultChecked={checkboxChecked}
                              disabled
                              aria-readonly="true"
                            />
                          );
                        }
                        return (
                          <>
                            <input type="hidden" name={`${category.key}.${field.key}`} value="false" />
                            <input
                              id={`edit-activity-slide-${category.key}-${field.key}`}
                              name={`${category.key}.${field.key}`}
                              type="checkbox"
                              value="true"
                              defaultChecked={checkboxChecked}
                            />
                          </>
                        );
                      }

                      if (field.inputType === "select") {
                        return (
                          <select
                            id={`edit-activity-slide-${category.key}-${field.key}`}
                            name={`${category.key}.${field.key}`}
                            defaultValue={fieldDefaultValue ?? ""}
                            disabled={isLockedField}
                            required={field.isRequired && !isLockedField}
                          >
                            {!field.isRequired && <option value="">—</option>}
                            {field.options.length === 0 && (
                              <option value="">
                                {field.selectSource
                                  ? `Dynamic (${field.selectSource})`
                                  : "No options configured"}
                              </option>
                            )}
                            {hasCurrentValue && !currentInOptions && (
                              <option value={String(fieldDefaultValue)}>{String(fieldDefaultValue)}</option>
                            )}
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        );
                      }

                      return (
                        <input
                          id={`edit-activity-slide-${category.key}-${field.key}`}
                          name={`${category.key}.${field.key}`}
                          type={field.inputType}
                          defaultValue={fieldDefaultValue}
                          readOnly={isLockedField}
                          disabled={isLockedField}
                          required={field.isRequired && !isLockedField}
                        />
                      );
                    })()}
                  </div>
                    );
                  })()
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    );

    const groupSelector = (
      <section className="configCategory">
        <h3 className="configCategoryTitle">Hierarchy</h3>
        <div className="configForm">
          <div className="configField">
            <label htmlFor="activity-slide-group-id">Group</label>
            <select id="activity-slide-group-id" name="groupId" defaultValue={String(defaultGroupId)} required>
              {groups.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.title ?? `Group ${group.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    );

    if (isNewActivitySlideRoute) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-activity-slide/[activitySlideId]</p>
          <p className="meta">
            Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
            (activity_slides)
          </p>
          <p className="meta">Config profile: {profileDefaults.activityId}</p>
          {profileCategories.length === 0 ? (
            <p className="meta">No activity slide categories defined.</p>
          ) : (
            <form action={createActivitySlideAction}>
              {groupSelector}
              {categoriesMarkup}
              <button type="submit">Add {profileDefaults.activityId} Activity Slide</button>
            </form>
          )}
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="panelHeader">
          <h2>{pageTitle}</h2>
          <div className="panelActions">
            <form action={`/api/activity-slides/${activitySlideId}/export-json`} method="get">
              <button type="submit">Export JSON File</button>
            </form>
            {profileCategories.length > 0 ? (
              <button type="submit" form="edit-activity-slide-form">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
        <p className="meta">Route: /edit-activity-slide/[activitySlideId]</p>
        <p className="meta">
          Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
          (activity_slides)
        </p>
        <p className="meta">Config profile: {profileDefaults.activityId}</p>
        {profileCategories.length === 0 ? (
          <p className="meta">No activity slide categories defined.</p>
        ) : (
          <form id="edit-activity-slide-form" action={updateActivitySlideAction.bind(null, activitySlideId)}>
            {groupSelector}
            {categoriesMarkup}
          </form>
        )}
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="panel">
        <h2>{pageTitle}</h2>
        <p className="meta">Could not load activity slide config SOT from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
