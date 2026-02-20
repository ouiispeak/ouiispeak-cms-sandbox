"use client";

import { useState, FormEvent, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import CmsPageShell from "../../../components/cms/CmsPageShell";
import CmsOutlineView from "../../../components/cms/CmsOutlineView";
import CmsSection from "../../../components/ui/CmsSection";
import FormField from "../../../components/ui/FormField";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";
import Select from "../../../components/ui/Select";
import { uiTokens } from "../../../lib/uiTokens";
import BreadcrumbTrail from "../../../components/cms/BreadcrumbTrail";
import SaveChangesButton from "../../../components/ui/SaveChangesButton";
import PreviewInPlayerButton from "../../../components/ui/PreviewInPlayerButton";
import { nullIfEmpty } from "../../../lib/utils/string";
import StatusMessage from "../../../components/ui/StatusMessage";
import { updateGroupSchema } from "../../../lib/schemas/groupSchema";
import { loadGroupById, updateGroup } from "../../../lib/data/groups";
import type { Group } from "../../../lib/domain/group";
import type { LessonMinimal } from "../../../lib/domain/lesson";
import { loadLessons, loadLessonById } from "../../../lib/data/lessons";
import { useUnsavedChangesWarning } from "../../../lib/hooks/cms/useUnsavedChangesWarning";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      group: Group;
    };

export default function EditGroupPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId;
  const playerBaseUrl = process.env.NEXT_PUBLIC_PLAYER_BASE_URL || "";

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [lessons, setLessons] = useState<LessonMinimal[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");

  // New fields
  const [groupCode, setGroupCode] = useState("");
  const [shortSummary, setShortSummary] = useState("");
  const [groupType, setGroupType] = useState("");
  const [groupSummary, setGroupSummary] = useState("");
  const [groupGoal, setGroupGoal] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [isRequiredToPass, setIsRequiredToPass] = useState(false);
  const [passingScoreType, setPassingScoreType] = useState("");
  const [passingScoreValue, setPassingScoreValue] = useState<number | null>(null);
  const [maxScoreValue, setMaxScoreValue] = useState<number | null>(null);
  const [extraPracticeNotes, setExtraPracticeNotes] = useState("");
  const [l1L2, setL1L2] = useState("");
  const [mediaUsedIds, setMediaUsedIds] = useState("");
  const [groupSlidesPlan, setGroupSlidesPlan] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const initialDataRef = useRef<{
    lessonId: string;
    orderIndex: number;
    label: string;
    title: string;
    groupCode: string;
    shortSummary: string;
    groupType: string;
    groupSummary: string;
    groupGoal: string;
    prerequisites: string;
    isRequiredToPass: boolean;
    passingScoreType: string;
    passingScoreValue: number | null;
    maxScoreValue: number | null;
    extraPracticeNotes: string;
    l1L2: string;
    mediaUsedIds: string;
    groupSlidesPlan: string;
  } | null>(null);

  // Check if form has unsaved changes
  const hasUnsavedChanges = (() => {
    if (!initialDataRef.current) return false;
    const initial = initialDataRef.current;
    return (
      lessonId !== initial.lessonId ||
      orderIndex !== initial.orderIndex ||
      label !== initial.label ||
      title !== initial.title ||
      groupCode !== initial.groupCode ||
      shortSummary !== initial.shortSummary ||
      groupType !== initial.groupType ||
      groupSummary !== initial.groupSummary ||
      groupGoal !== initial.groupGoal ||
      prerequisites !== initial.prerequisites ||
      isRequiredToPass !== initial.isRequiredToPass ||
      passingScoreType !== initial.passingScoreType ||
      passingScoreValue !== initial.passingScoreValue ||
      maxScoreValue !== initial.maxScoreValue ||
      extraPracticeNotes !== initial.extraPracticeNotes ||
      l1L2 !== initial.l1L2 ||
      mediaUsedIds !== initial.mediaUsedIds ||
      groupSlidesPlan !== initial.groupSlidesPlan
    );
  })();

  // Warn before navigation
  useUnsavedChangesWarning(hasUnsavedChanges);

  useEffect(() => {
    async function loadLessonsData() {
      const { data, error } = await loadLessons();

      if (error) {
        setLoadState({ status: "error", message: `Error loading lessons: ${error}` });
        return;
      }

      setLessons(data ?? []);
    }

    loadLessonsData();
  }, []);

  useEffect(() => {
    if (!groupId) {
      setLoadState({ status: "error", message: "No groupId provided in URL." });
      return;
    }

    async function load() {
      setLoadState({ status: "loading" });

      const { data, error } = await loadGroupById(groupId);

      if (error) {
        setLoadState({ status: "error", message: error });
        return;
      }

      if (!data) {
        setLoadState({ status: "error", message: `No group found with id "${groupId}"` });
        return;
      }

      setLessonId(data.lessonId ?? "");
      // Ensure the group's lesson appears in the dropdown when it's missing (e.g. queued lessons excluded from loadLessons)
      if (data.lessonId && !lessons.some((l) => l.id === data.lessonId)) {
        const { data: lessonData } = await loadLessonById(data.lessonId);
        if (lessonData) {
          setLessons((prev) => {
            if (prev.some((l) => l.id === lessonData.id)) return prev;
            return [...prev, { id: lessonData.id, slug: lessonData.slug, label: lessonData.label, title: lessonData.title }];
          });
        }
      }
      setOrderIndex(data.orderIndex ?? 1);
      setLabel(data.label ?? "");
      setTitle(data.title ?? "");

      // New fields
      setGroupCode(data.groupCode ?? "");
      setShortSummary(data.shortSummary ?? "");
      setGroupType(data.groupType ?? "");
      setGroupSummary(data.groupSummary ?? "");
      setGroupGoal(data.groupGoal ?? "");
      setPrerequisites(data.prerequisites ?? "");
      setIsRequiredToPass(data.isRequiredToPass ?? false);
      setPassingScoreType(data.passingScoreType ?? "");
      setPassingScoreValue(data.passingScoreValue ?? null);
      setMaxScoreValue(data.maxScoreValue ?? null);
      setExtraPracticeNotes(data.extraPracticeNotes ?? "");
      setL1L2(data.l1L2 ?? "");
      setMediaUsedIds(data.mediaUsedIds ?? "");
      const groupSlidesPlanStr = data.groupSlidesPlan
        ? JSON.stringify(data.groupSlidesPlan, null, 2)
        : "";
      setGroupSlidesPlan(groupSlidesPlanStr);

      // Store initial values for comparison
      initialDataRef.current = {
        lessonId: data.lessonId ?? "",
        orderIndex: data.orderIndex ?? 1,
        label: data.label ?? "",
        title: data.title ?? "",
        groupCode: data.groupCode ?? "",
        shortSummary: data.shortSummary ?? "",
        groupType: data.groupType ?? "",
        groupSummary: data.groupSummary ?? "",
        groupGoal: data.groupGoal ?? "",
        prerequisites: data.prerequisites ?? "",
        isRequiredToPass: data.isRequiredToPass ?? false,
        passingScoreType: data.passingScoreType ?? "",
        passingScoreValue: data.passingScoreValue ?? null,
        maxScoreValue: data.maxScoreValue ?? null,
        extraPracticeNotes: data.extraPracticeNotes ?? "",
        l1L2: data.l1L2 ?? "",
        mediaUsedIds: data.mediaUsedIds ?? "",
        groupSlidesPlan: groupSlidesPlanStr,
      };

      setLoadState({ status: "ready", group: data });
    }

    if (lessons.length > 0) {
      load();
    }
  }, [groupId, lessons]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Validate required fields (label is required for new groups)
    const isNewGroup = !groupId;
    if (isNewGroup && !label.trim()) {
      setMessage("Group label is required for CMS navigation.");
      return;
    }

    // Validate using schema
    const result = updateGroupSchema.safeParse({
      lesson_id: lessonId,
      label: label.trim() || null,
      title: title.trim() || undefined,
      order_index: orderIndex,
      group_code: groupCode || null,
      short_summary: shortSummary || null,
      group_type: groupType || null,
      group_summary: groupSummary || null,
      group_goal: groupGoal || null,
      prerequisites: prerequisites || null,
      is_required_to_pass: isRequiredToPass,
      passing_score_type: passingScoreType || null,
      passing_score_value: passingScoreValue,
      max_score_value: maxScoreValue,
      extra_practice_notes: extraPracticeNotes || null,
      l1_l2: l1L2 || null,
      media_used_ids: mediaUsedIds || null,
      group_slides_plan: groupSlidesPlan || null,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setMessage(firstError.message);
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateGroup(groupId, {
        lesson_id: result.data.lesson_id,
        order_index: result.data.order_index,
        label: result.data.label,
        title: result.data.title ?? undefined,
        group_code: result.data.group_code,
        short_summary: result.data.short_summary,
        group_type: result.data.group_type,
        group_summary: result.data.group_summary,
        group_goal: result.data.group_goal,
        prerequisites: result.data.prerequisites,
        is_required_to_pass: result.data.is_required_to_pass,
        passing_score_type: result.data.passing_score_type,
        passing_score_value: result.data.passing_score_value,
        max_score_value: result.data.max_score_value,
        extra_practice_notes: result.data.extra_practice_notes,
        l1_l2: result.data.l1_l2,
        media_used_ids: result.data.media_used_ids,
        group_slides_plan: result.data.group_slides_plan,
      });

      if (error) {
        setMessage(`Error: ${error}`);
        return;
      }

      setMessage("Group updated successfully!");
      
      // Update initial data ref after successful save
      if (initialDataRef.current) {
        initialDataRef.current = {
          lessonId,
          orderIndex,
          label,
          title,
          groupCode,
          shortSummary,
          groupType,
          groupSummary,
          groupGoal,
          prerequisites,
          isRequiredToPass,
          passingScoreType,
          passingScoreValue,
          maxScoreValue,
          extraPracticeNotes,
          l1L2,
          mediaUsedIds,
          groupSlidesPlan,
        };
      }
    } finally {
      setSaving(false);
    }
  }

  const handleSaveButtonClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <CmsPageShell
      title="Edit group"
    >
      {loadState.status === "loading" && <p>Loading group…</p>}

      {loadState.status === "error" && (
        <CmsSection title="Error" description={loadState.message}>
          <p style={{ color: uiTokens.color.danger }}>{loadState.message}</p>
        </CmsSection>
      )}

      {loadState.status === "ready" && (
        <div style={{ display: "flex", gap: uiTokens.space.lg, width: "100%", minHeight: "100vh" }}>
          {/* Left column - outline view */}
          <div style={{ flex: "0 0 25%", backgroundColor: "transparent", border: "1px solid #9cc7c7", borderRadius: uiTokens.radius.lg, overflow: "auto" }}>
          <CmsOutlineView currentGroupId={groupId} hasUnsavedChanges={hasUnsavedChanges} />
        </div>
        
        {/* Right column - form */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: uiTokens.space.md, gap: uiTokens.space.sm }}>
            <PreviewInPlayerButton
              href={
                playerBaseUrl && loadState.status === "ready" && loadState.group.lessonId
                  ? `${playerBaseUrl}/lecons/db/${loadState.group.lessonId}`
                  : undefined
              }
            />
            <SaveChangesButton
              onClick={handleSaveButtonClick}
              hasUnsavedChanges={hasUnsavedChanges}
              saving={saving}
            />
            </div>
          <BreadcrumbTrail groupId={groupId} />
            <form ref={formRef} onSubmit={handleSave}>
          <CmsSection title="Group Details" backgroundColor="#cde3e3" borderColor="#9cc7c7">
            <FormField label="Group ID" borderColor="#9cc7c7">
              <Input value={groupId || ""} disabled readOnly />
            </FormField>

            <FormField label="Lesson" required borderColor="#9cc7c7">
              <Select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
                <option value="">Select a lesson…</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.slug})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Order index" required borderColor="#9cc7c7">
              <Input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
              />
            </FormField>

            <FormField 
              label="Label" 
              required
              borderColor="#9cc7c7"
              infoTooltip="Internal name for this group used in the CMS and navigation. Not shown to learners."
            >
              <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </FormField>

            {groupId && !label.trim() && (
              <div
                style={{
                  padding: uiTokens.space.md,
                  backgroundColor: "#fff3cd",
                  border: `1px solid #ffc107`,
                  borderRadius: uiTokens.radius.md,
                  color: "#856404",
                }}
              >
                <strong>Missing label:</strong> This group is missing a label. Please add one for proper CMS navigation.
              </div>
            )}

            <FormField 
              label="Title (optional - for student-facing content)" 
              borderColor="#9cc7c7"
              infoTooltip="Student-facing title. Only shown to learners if provided. Leave empty if not needed."
            >
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>

            <FormField label="Group code" borderColor="#9cc7c7">
              <Input value={groupCode} onChange={(e) => setGroupCode(e.target.value)} />
            </FormField>

            <FormField label="Short summary" borderColor="#9cc7c7">
              <Textarea
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Group summary" borderColor="#9cc7c7">
              <Textarea
                value={groupSummary}
                onChange={(e) => setGroupSummary(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Group goal" borderColor="#9cc7c7">
              <Textarea
                value={groupGoal}
                onChange={(e) => setGroupGoal(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Prerequisites" borderColor="#9cc7c7">
              <Textarea
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                rows={2}
              />
            </FormField>

            <h2
              style={{
                fontSize: uiTokens.font.sectionTitle.size,
                fontWeight: uiTokens.font.sectionTitle.weight,
                marginTop: uiTokens.space.lg,
                marginBottom: uiTokens.space.md,
                marginLeft: 0,
                marginRight: 0,
                color: uiTokens.color.text,
              }}
            >
              Group structure
            </h2>

            <FormField label="Group type" borderColor="#9cc7c7">
              <Select value={groupType} onChange={(e) => setGroupType(e.target.value)}>
                <option value="">Select a type…</option>
                <option value="title">Title</option>
                <option value="intro">Intro</option>
                <option value="practice">Practice</option>
                <option value="test">Test</option>
                <option value="wrap-up">Wrap-up</option>
                <option value="finale">Finale</option>
              </Select>
            </FormField>

            <FormField label="Is required to pass" borderColor="#9cc7c7">
              <label style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
                <input
                  type="checkbox"
                  checked={isRequiredToPass}
                  onChange={(e) => setIsRequiredToPass(e.target.checked)}
                  style={{ width: "auto" }}
                />
                <span>Required to pass</span>
              </label>
            </FormField>

            <FormField label="Passing score type" borderColor="#9cc7c7">
              <Select value={passingScoreType} onChange={(e) => setPassingScoreType(e.target.value)}>
                <option value="">Select a type…</option>
                <option value="percent">percent</option>
                <option value="raw">raw</option>
                <option value="none">none</option>
              </Select>
            </FormField>

            <FormField label="Passing score value" borderColor="#9cc7c7">
              <Input
                type="number"
                value={passingScoreValue ?? ""}
                onChange={(e) => setPassingScoreValue(e.target.value ? Number(e.target.value) : null)}
              />
            </FormField>

            <FormField label="Max score value" borderColor="#9cc7c7">
              <Input
                type="number"
                value={maxScoreValue ?? ""}
                onChange={(e) => setMaxScoreValue(e.target.value ? Number(e.target.value) : null)}
              />
            </FormField>

            <FormField
              label="Planned slide sequence (structure only)"
              borderColor="#9cc7c7"
              helper='This is the intended slide structure for this group. It is used for planning and validation. Actual slides are created separately. For example: ["title-slide", "text-slide", "ai-speak-repeat"]'
            >
              <Textarea
                value={groupSlidesPlan}
                onChange={(e) => setGroupSlidesPlan(e.target.value)}
                rows={4}
              />
            </FormField>

            <FormField label="Extra practice notes" borderColor="#9cc7c7">
              <Textarea
                value={extraPracticeNotes}
                onChange={(e) => setExtraPracticeNotes(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="L1 > L2 issues" borderColor="#9cc7c7">
              <Textarea
                value={l1L2}
                onChange={(e) => setL1L2(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField
              label="Media used ids"
              borderColor="#9cc7c7"
              helper="Comma-separated IDs or paths"
            >
              <Input
                value={mediaUsedIds}
                onChange={(e) => setMediaUsedIds(e.target.value)}
              />
            </FormField>
          </CmsSection>
            </form>
          </div>
        </div>
      )}

      {message && (
        <StatusMessage
          variant={message.toLowerCase().includes("error") ? "error" : "success"}
        >
          {message}
        </StatusMessage>
      )}
    </CmsPageShell>
  );
}
