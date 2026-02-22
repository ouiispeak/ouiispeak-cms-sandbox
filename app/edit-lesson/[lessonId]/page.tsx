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
import LinkButton from "../../../components/ui/LinkButton";
import { slugify, nullIfEmpty } from "../../../lib/utils/string";
import StatusMessage from "../../../components/ui/StatusMessage";
import { updateLessonSchema } from "../../../lib/schemas/lessonSchema";
import { updateLesson, loadLessonById } from "../../../lib/data/lessons";
import { pushToRagFromLessonMetadata } from "../../../lib/data/pedagogicalAppendices";
import { loadModules } from "../../../lib/data/modules";
import type { Module } from "../../../lib/domain/module";
import type { Lesson } from "../../../lib/domain/lesson";
import { useUnsavedChangesWarning } from "../../../lib/hooks/cms/useUnsavedChangesWarning";
import { logger } from "../../../lib/utils/logger";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; lesson: Lesson };

export default function EditLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId;
  const playerBaseUrl = process.env.NEXT_PUBLIC_PLAYER_BASE_URL || "";
  const playerHref = playerBaseUrl && lessonId ? `${playerBaseUrl}/lecons/db/${lessonId}` : undefined;

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [lessonSlugPart, setLessonSlugPart] = useState("");
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [lessonStatus, setLessonStatus] = useState<"draft" | "waiting_review" | "published">("draft");

  // Summaries
  const [shortSummaryAdmin, setShortSummaryAdmin] = useState("");
  const [shortSummaryStudent, setShortSummaryStudent] = useState("");

  // Lesson structure
  const [courseOrganizationGroup, setCourseOrganizationGroup] = useState("");
  const [slideContents, setSlideContents] = useState("");
  const [groupingStrategySummary, setGroupingStrategySummary] = useState("");

  // Activities
  const [activityTypes, setActivityTypes] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  // Pedagogy
  const [signatureMetaphors, setSignatureMetaphors] = useState("");
  const [mainGrammarTopics, setMainGrammarTopics] = useState("");
  const [pronunciationFocus, setPronunciationFocus] = useState("");
  const [vocabularyTheme, setVocabularyTheme] = useState("");
  const [l1L2Issues, setL1L2Issues] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [notesForTeacherOrAI, setNotesForTeacherOrAI] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const initialDataRef = useRef<{
    moduleId: string;
    lessonSlugPart: string;
    label: string;
    title: string;
    orderIndex: number;
    lessonStatus: "draft" | "waiting_review" | "published";
    shortSummaryAdmin: string;
    shortSummaryStudent: string;
    courseOrganizationGroup: string;
    slideContents: string;
    groupingStrategySummary: string;
    activityTypes: string;
    activityDescription: string;
    signatureMetaphors: string;
    mainGrammarTopics: string;
    pronunciationFocus: string;
    vocabularyTheme: string;
    l1L2Issues: string;
    prerequisites: string;
    learningObjectives: string;
    notesForTeacherOrAI: string;
  } | null>(null);

  // Check if form has unsaved changes
  const hasUnsavedChanges = (() => {
    if (!initialDataRef.current) return false;
    const initial = initialDataRef.current;
    return (
      moduleId !== initial.moduleId ||
      lessonSlugPart !== initial.lessonSlugPart ||
      label !== initial.label ||
      title !== initial.title ||
      orderIndex !== initial.orderIndex ||
      lessonStatus !== initial.lessonStatus ||
      shortSummaryAdmin !== initial.shortSummaryAdmin ||
      shortSummaryStudent !== initial.shortSummaryStudent ||
      courseOrganizationGroup !== initial.courseOrganizationGroup ||
      slideContents !== initial.slideContents ||
      groupingStrategySummary !== initial.groupingStrategySummary ||
      activityTypes !== initial.activityTypes ||
      activityDescription !== initial.activityDescription ||
      signatureMetaphors !== initial.signatureMetaphors ||
      mainGrammarTopics !== initial.mainGrammarTopics ||
      pronunciationFocus !== initial.pronunciationFocus ||
      vocabularyTheme !== initial.vocabularyTheme ||
      l1L2Issues !== initial.l1L2Issues ||
      prerequisites !== initial.prerequisites ||
      learningObjectives !== initial.learningObjectives ||
      notesForTeacherOrAI !== initial.notesForTeacherOrAI
    );
  })();

  // Warn before navigation
  useUnsavedChangesWarning(hasUnsavedChanges);

  useEffect(() => {
    async function loadModulesData() {
      const { data, error } = await loadModules();

      if (error) {
        setLoadState({ status: "error", message: `Error loading modules: ${error}` });
        return;
      }

      setModules(data ?? []);
    }

    loadModulesData();
  }, []);

  useEffect(() => {
    if (!lessonId) {
      setLoadState({ status: "error", message: "No lessonId provided in URL." });
      return;
    }

    async function load() {
      setLoadState({ status: "loading" });

      const { data, error } = await loadLessonById(lessonId);

      if (error) {
        setLoadState({ status: "error", message: `Error: ${error}` });
        return;
      }

      if (!data) {
        setLoadState({ status: "error", message: `No lesson found with id "${lessonId}"` });
        return;
      }

      setModuleId(data.moduleId ?? "");
      const selectedModule = modules.find((m) => m.id === data.moduleId);
      const slugPart = selectedModule && data.slug
        ? data.slug.replace(`${selectedModule.slug}/`, "")
        : data.slug ?? "";
      setLessonSlugPart(slugPart);
      setLabel(data.label ?? "");
      setTitle(data.title ?? "");
      setOrderIndex(data.orderIndex ?? 1);
      setLessonStatus((data.status as "draft" | "waiting_review" | "published") || "draft");

      // Summaries
      setShortSummaryAdmin(data.shortSummaryAdmin ?? "");
      setShortSummaryStudent(data.shortSummaryStudent ?? "");

      // Lesson structure
      setCourseOrganizationGroup(data.courseOrganizationGroup ?? "");
      setSlideContents(data.slideContents ?? "");
      setGroupingStrategySummary(data.groupingStrategySummary ?? "");

      // Activities - activityTypes is a string (comma-separated) in domain model
      setActivityTypes(data.activityTypes ?? "");
      setActivityDescription(data.activityDescription ?? "");

      // Pedagogy
      setSignatureMetaphors(data.signatureMetaphors ?? "");
      setMainGrammarTopics(data.mainGrammarTopics ?? "");
      setPronunciationFocus(data.pronunciationFocus ?? "");
      setVocabularyTheme(data.vocabularyTheme ?? "");
      setL1L2Issues(data.l1L2Issues ?? "");
      setPrerequisites(data.prerequisites ?? "");
      setLearningObjectives(data.learningObjectives ?? "");
      setNotesForTeacherOrAI(data.notesForTeacherOrAI ?? "");

      // Store initial values for comparison
      
      initialDataRef.current = {
        moduleId: data.moduleId ?? "",
        lessonSlugPart: slugPart,
        label: data.label ?? "",
        title: data.title ?? "",
        orderIndex: data.orderIndex ?? 1,
        lessonStatus: (data.status as "draft" | "waiting_review" | "published") || "draft",
        shortSummaryAdmin: data.shortSummaryAdmin ?? "",
        shortSummaryStudent: data.shortSummaryStudent ?? "",
        courseOrganizationGroup: data.courseOrganizationGroup ?? "",
        slideContents: data.slideContents ?? "",
        groupingStrategySummary: data.groupingStrategySummary ?? "",
        activityTypes: data.activityTypes ?? "",
        activityDescription: data.activityDescription ?? "",
        signatureMetaphors: data.signatureMetaphors ?? "",
        mainGrammarTopics: data.mainGrammarTopics ?? "",
        pronunciationFocus: data.pronunciationFocus ?? "",
        vocabularyTheme: data.vocabularyTheme ?? "",
        l1L2Issues: data.l1L2Issues ?? "",
        prerequisites: data.prerequisites ?? "",
        learningObjectives: data.learningObjectives ?? "",
        notesForTeacherOrAI: data.notesForTeacherOrAI ?? "",
      };

      setLoadState({ status: "ready", lesson: data });
    }

    if (modules.length > 0) {
      load();
    }
  }, [lessonId, modules]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const selectedModule = modules.find((m) => m.id === moduleId);
    if (!selectedModule) {
      setMessage("Selected module not found.");
      return;
    }

    const fullSlug = `${selectedModule.slug}/${slugify(lessonSlugPart)}`;

    // Validate required fields (label is required for new lessons)
    const isNewLesson = !lessonId;
    if (isNewLesson && !label.trim()) {
      setMessage("Lesson label is required for CMS navigation.");
      return;
    }

    // Validate using schema
    const result = updateLessonSchema.safeParse({
      module_id: moduleId,
      slug: fullSlug,
      label: label.trim() || null,
      title: title.trim() || undefined,
      order_index: orderIndex,
      status: lessonStatus,
      short_summary_admin: shortSummaryAdmin || null,
      short_summary_student: shortSummaryStudent || null,
      course_organization_group: courseOrganizationGroup || null,
      slide_contents: slideContents || null,
      grouping_strategy_summary: groupingStrategySummary || null,
      activity_types: activityTypes || null,
      activity_description: activityDescription || null,
      signature_metaphors: signatureMetaphors || null,
      main_grammar_topics: mainGrammarTopics || null,
      pronunciation_focus: pronunciationFocus || null,
      vocabulary_theme: vocabularyTheme || null,
      l1_l2_issues: l1L2Issues || null,
      prerequisites: prerequisites || null,
      learning_objectives: learningObjectives || null,
      notes_for_teacher_or_ai: notesForTeacherOrAI || null,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setMessage(firstError.message);
      return;
    }

    setSaving(true);
    try {
      // Convert activity_types array back to comma-separated string for data layer
      const activityTypesStr = Array.isArray(result.data.activity_types)
        ? result.data.activity_types.join(",")
        : result.data.activity_types;

      const updateResult = await updateLesson(lessonId, {
        module_id: result.data.module_id,
        slug: result.data.slug,
        label: result.data.label,
        title: result.data.title ?? undefined,
        order_index: result.data.order_index,
        status: result.data.status,
        short_summary_admin: result.data.short_summary_admin,
        short_summary_student: result.data.short_summary_student,
        course_organization_group: result.data.course_organization_group,
        slide_contents: result.data.slide_contents,
        grouping_strategy_summary: result.data.grouping_strategy_summary,
        activity_types: activityTypesStr ?? null,
        activity_description: result.data.activity_description,
        signature_metaphors: result.data.signature_metaphors,
        main_grammar_topics: result.data.main_grammar_topics,
        pronunciation_focus: result.data.pronunciation_focus,
        vocabulary_theme: result.data.vocabulary_theme,
        l1_l2_issues: result.data.l1_l2_issues,
        prerequisites: result.data.prerequisites,
        learning_objectives: result.data.learning_objectives,
        notes_for_teacher_or_ai: result.data.notes_for_teacher_or_ai,
      });

      if (updateResult.error) {
        const errorMessage = `Error saving lesson: ${updateResult.error}`;
        logger.error("[lesson save UI error]", errorMessage);
        setMessage(errorMessage);
        return;
      }

      if (!updateResult.data) {
        const errorMessage = "Error: Lesson update returned no data";
        logger.error("[lesson save UI error]", errorMessage);
        setMessage(errorMessage);
        return;
      }

      setMessage("Lesson updated successfully!");

      // Push to RAG when signature_metaphors or notes_for_teacher_or_ai changed and have content
      const initial = initialDataRef.current;
      const sigChanged = initial && signatureMetaphors.trim() !== (initial.signatureMetaphors ?? "");
      const notesChanged = initial && notesForTeacherOrAI.trim() !== (initial.notesForTeacherOrAI ?? "");
      if ((sigChanged && signatureMetaphors.trim()) || (notesChanged && notesForTeacherOrAI.trim())) {
        const metadata = loadState.status === "ready" ? loadState.lesson?.metadata : null;
        const ragResult = await pushToRagFromLessonMetadata({
          metadata: metadata as { canonical_node_key?: unknown; targetSliceRef?: string } | null,
          signatureMetaphors: sigChanged ? signatureMetaphors?.trim() || null : null,
          notesForTeacherOrAI: notesChanged ? notesForTeacherOrAI?.trim() || null : null,
        });
        if (ragResult.added > 0) {
          setMessage(`Lesson updated! ${ragResult.added} note(s) added to reference library for future lessons.`);
        }
        if (ragResult.errors.length > 0) {
          logger.warn("[RAG push]", ragResult.errors);
        }
      }

      // Reload lesson data from server to ensure we have the latest values
      const { data: reloadedData, error: reloadError } = await loadLessonById(lessonId);
      
      if (reloadError || !reloadedData) {
        // If reload fails, use the current form state
      if (initialDataRef.current) {
        initialDataRef.current = {
          moduleId,
          lessonSlugPart,
          label,
          title,
          orderIndex,
          lessonStatus,
            shortSummaryAdmin,
            shortSummaryStudent,
            courseOrganizationGroup,
            slideContents,
            groupingStrategySummary,
            activityTypes,
            activityDescription,
            signatureMetaphors,
            mainGrammarTopics,
            pronunciationFocus,
            vocabularyTheme,
            l1L2Issues,
            prerequisites,
            learningObjectives,
            notesForTeacherOrAI,
          };
        }
      } else {
        // Use reloaded data to update form fields
        const selectedModule = modules.find((m) => m.id === reloadedData.moduleId);
        const slugPart = selectedModule && reloadedData.slug
          ? reloadedData.slug.replace(`${selectedModule.slug}/`, "")
          : reloadedData.slug ?? "";
        
        setModuleId(reloadedData.moduleId ?? "");
        setLessonSlugPart(slugPart);
        setLabel(reloadedData.label ?? "");
        setTitle(reloadedData.title ?? "");
        setOrderIndex(reloadedData.orderIndex ?? 1);
        setLessonStatus((reloadedData.status as "draft" | "waiting_review" | "published") || "draft");
        setShortSummaryAdmin(reloadedData.shortSummaryAdmin ?? "");
        setShortSummaryStudent(reloadedData.shortSummaryStudent ?? "");
        setCourseOrganizationGroup(reloadedData.courseOrganizationGroup ?? "");
        setSlideContents(reloadedData.slideContents ?? "");
        setGroupingStrategySummary(reloadedData.groupingStrategySummary ?? "");
        setActivityTypes(reloadedData.activityTypes ?? "");
        setActivityDescription(reloadedData.activityDescription ?? "");
        setSignatureMetaphors(reloadedData.signatureMetaphors ?? "");
        setMainGrammarTopics(reloadedData.mainGrammarTopics ?? "");
        setPronunciationFocus(reloadedData.pronunciationFocus ?? "");
        setVocabularyTheme(reloadedData.vocabularyTheme ?? "");
        setL1L2Issues(reloadedData.l1L2Issues ?? "");
        setPrerequisites(reloadedData.prerequisites ?? "");
        setLearningObjectives(reloadedData.learningObjectives ?? "");
        setNotesForTeacherOrAI(reloadedData.notesForTeacherOrAI ?? "");
        
        // Update initial data ref with reloaded data
        if (initialDataRef.current) {
          initialDataRef.current = {
            moduleId: reloadedData.moduleId ?? "",
            lessonSlugPart: slugPart,
            label: reloadedData.label ?? "",
            title: reloadedData.title ?? "",
            orderIndex: reloadedData.orderIndex ?? 1,
            lessonStatus: (reloadedData.status as "draft" | "waiting_review" | "published") || "draft",
            shortSummaryAdmin: reloadedData.shortSummaryAdmin ?? "",
            shortSummaryStudent: reloadedData.shortSummaryStudent ?? "",
            courseOrganizationGroup: reloadedData.courseOrganizationGroup ?? "",
            slideContents: reloadedData.slideContents ?? "",
            groupingStrategySummary: reloadedData.groupingStrategySummary ?? "",
            activityTypes: reloadedData.activityTypes ?? "",
            activityDescription: reloadedData.activityDescription ?? "",
            signatureMetaphors: reloadedData.signatureMetaphors ?? "",
            mainGrammarTopics: reloadedData.mainGrammarTopics ?? "",
            pronunciationFocus: reloadedData.pronunciationFocus ?? "",
            vocabularyTheme: reloadedData.vocabularyTheme ?? "",
            l1L2Issues: reloadedData.l1L2Issues ?? "",
            prerequisites: reloadedData.prerequisites ?? "",
            learningObjectives: reloadedData.learningObjectives ?? "",
            notesForTeacherOrAI: reloadedData.notesForTeacherOrAI ?? "",
          };
        }
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
      title="Edit lesson"
    >
      {loadState.status === "loading" && <p>Loading lesson…</p>}

      {loadState.status === "error" && (
        <CmsSection title="Error" description={loadState.message} backgroundColor="#b5d5d5" borderColor="#6aabab">
          <p style={{ color: uiTokens.color.danger }}>{loadState.message}</p>
        </CmsSection>
      )}

      {loadState.status === "ready" && (
        <div style={{ display: "flex", gap: uiTokens.space.lg, width: "100%", minHeight: "100vh" }}>
          {/* Left column - outline view */}
          <div style={{ flex: "0 0 25%", backgroundColor: "transparent", border: "1px solid #6aabab", borderRadius: uiTokens.radius.lg, overflow: "auto" }}>
          <CmsOutlineView currentLessonId={lessonId} hasUnsavedChanges={hasUnsavedChanges} />
        </div>
        
        {/* Right column - form */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: uiTokens.space.md, gap: uiTokens.space.sm }}>
              <div style={{ display: "flex", gap: uiTokens.space.sm, alignItems: "center" }}>
                {lessonId && (
                  <LinkButton href={`/lesson-slides/${lessonId}`} size="sm">
                    Edit groups
                  </LinkButton>
                )}
              </div>
              <div style={{ display: "flex", gap: uiTokens.space.sm, alignItems: "center" }}>
                <PreviewInPlayerButton href={playerHref} />
                  <SaveChangesButton
                  onClick={handleSaveButtonClick}
                  hasUnsavedChanges={hasUnsavedChanges}
                  saving={saving}
                />
              </div>
            </div>
            <BreadcrumbTrail lessonId={lessonId} />
          <form ref={formRef} onSubmit={handleSave}>
          <CmsSection title="Lesson Details" backgroundColor="#b5d5d5" borderColor="#6aabab">
            <FormField label="Lesson ID" borderColor="#6aabab">
              <Input value={lessonId || ""} disabled readOnly />
            </FormField>

            <FormField
              label="Status"
              borderColor="#6aabab"
              infoTooltip="draft: editable, visible in dashboard. published: live for learners. waiting_review: queued (from LaDy ingest)."
            >
              <Select
                value={lessonStatus}
                onChange={(e) => setLessonStatus(e.target.value as "draft" | "waiting_review" | "published")}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="waiting_review">waiting_review</option>
              </Select>
            </FormField>

            <FormField label="Module" required borderColor="#6aabab">
              <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
                <option value="">Select a module…</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.slug})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Lesson slug (just the lesson part)"
              required
              borderColor="#6aabab"
              helper={
                <>
                  Full slug will become:{" "}
                  <code className="codeText">
                    {moduleId
                      ? `${modules.find((m) => m.id === moduleId)?.slug ?? "module"}/${slugify(lessonSlugPart || "lesson-1")}`
                      : `module/lesson-1`}
                  </code>
                </>
              }
            >
              <Input
                value={lessonSlugPart}
                onChange={(e) => setLessonSlugPart(e.target.value)}
                placeholder="lesson-1"
              />
            </FormField>

            <FormField 
              label="Label" 
              required
              borderColor="#6aabab"
              infoTooltip="Internal name for this lesson used in the CMS and navigation. Not shown to learners."
            >
              <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </FormField>

            {lessonId && !label.trim() && (
              <div
                style={{
                  padding: uiTokens.space.md,
                  backgroundColor: "#fff3cd",
                  border: `1px solid #ffc107`,
                  borderRadius: uiTokens.radius.md,
                  color: "#856404",
                }}
              >
                <strong>Missing label:</strong> This lesson is missing a label. Please add one for proper CMS navigation.
              </div>
            )}

            <FormField 
              label="Title (optional - for student-facing content)" 
              borderColor="#6aabab"
              infoTooltip="Student-facing title. Only shown to learners if provided. Leave empty if not needed."
            >
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>

            <FormField label="Order index" required borderColor="#6aabab">
              <Input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
              />
            </FormField>
          </CmsSection>

          <CmsSection title="Summaries" backgroundColor="#b5d5d5" borderColor="#6aabab">
            <FormField label="Short Summary (Admin)" borderColor="#6aabab">
              <Textarea
                value={shortSummaryAdmin}
                onChange={(e) => setShortSummaryAdmin(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Short Summary (Student)" borderColor="#6aabab">
              <Textarea
                value={shortSummaryStudent}
                onChange={(e) => setShortSummaryStudent(e.target.value)}
                rows={3}
              />
            </FormField>
          </CmsSection>

          <CmsSection title="Lesson Structure" backgroundColor="#b5d5d5" borderColor="#6aabab">
            <FormField label="Course Organization Group" borderColor="#6aabab">
              <Input
                value={courseOrganizationGroup}
                onChange={(e) => setCourseOrganizationGroup(e.target.value)}
                placeholder="e.g. 6 Groups"
              />
            </FormField>

            <FormField
              label="Slide Contents"
              borderColor="#6aabab"
              helper="Use semicolons. Example: Intro; 3 Text; …"
            >
              <Textarea
                value={slideContents}
                onChange={(e) => setSlideContents(e.target.value)}
                rows={2}
              />
            </FormField>

            <FormField label="Grouping Strategy Summary" borderColor="#6aabab">
              <Textarea
                value={groupingStrategySummary}
                onChange={(e) => setGroupingStrategySummary(e.target.value)}
                rows={3}
              />
            </FormField>
          </CmsSection>

          <CmsSection title="Activities" backgroundColor="#b5d5d5" borderColor="#6aabab">
            <FormField
              label="Activity Types"
              borderColor="#6aabab"
              helper="Example: AISpeak, AISpeakStudentRepeat, AISpeakStudentChoose"
            >
              <Input
                value={activityTypes}
                onChange={(e) => setActivityTypes(e.target.value)}
                placeholder="Comma-separated list"
              />
            </FormField>

            <FormField label="Activity Description" borderColor="#6aabab">
              <Textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                rows={3}
              />
            </FormField>
          </CmsSection>

          <CmsSection title="Pedagogy" backgroundColor="#b5d5d5" borderColor="#6aabab">
            <FormField
              label="Signature Metaphors"
              borderColor="#6aabab"
              infoTooltip="Metaphors that work for this topic. When you save, this is added to the reference library for future LaDy generations."
            >
              <Textarea
                value={signatureMetaphors}
                onChange={(e) => setSignatureMetaphors(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Main Grammar Topics" borderColor="#6aabab">
              <Textarea
                value={mainGrammarTopics}
                onChange={(e) => setMainGrammarTopics(e.target.value)}
                rows={2}
              />
            </FormField>

            <FormField label="Pronunciation Focus" borderColor="#6aabab">
              <Textarea
                value={pronunciationFocus}
                onChange={(e) => setPronunciationFocus(e.target.value)}
                rows={2}
              />
            </FormField>

            <FormField label="Vocabulary Theme" borderColor="#6aabab">
              <Input
                value={vocabularyTheme}
                onChange={(e) => setVocabularyTheme(e.target.value)}
              />
            </FormField>

            <FormField label="L1>L2 Issues" borderColor="#6aabab">
              <Textarea
                value={l1L2Issues}
                onChange={(e) => setL1L2Issues(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Prerequisites" borderColor="#6aabab">
              <Textarea
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Learning Objectives" borderColor="#6aabab">
              <Textarea
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField
              label="Notes for Teacher or AI"
              borderColor="#6aabab"
              infoTooltip="Extra tips for teacher or AI. When you save, this is added to the reference library for future LaDy generations."
            >
              <Textarea
                value={notesForTeacherOrAI}
                onChange={(e) => setNotesForTeacherOrAI(e.target.value)}
                rows={4}
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
