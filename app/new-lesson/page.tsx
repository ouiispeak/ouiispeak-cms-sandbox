"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CmsPageShell from "../../components/cms/CmsPageShell";
import CmsSection from "../../components/ui/CmsSection";
import FormField from "../../components/ui/FormField";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import { Button } from "../../components/Button";
import { uiTokens } from "../../lib/uiTokens";
import { slugify, nullIfEmpty } from "../../lib/utils/string";
import StatusMessage from "../../components/ui/StatusMessage";
import { createLesson } from "../../lib/data/lessons";
import { loadModules } from "../../lib/data/modules";
import type { Module } from "../../lib/domain/module";
import { createLessonSchema } from "../../lib/schemas/lessonSchema";

type CreatedLesson = {
  id: string;
  module_id: string;
  slug: string;
  label: string | null;
  title: string | null;
  order_index: number;
};

function NewLessonForm() {
  const searchParams = useSearchParams();
  const moduleIdParam = searchParams?.get("module_id");
  
  const [modules, setModules] = useState<Module[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [moduleId, setModuleId] = useState(moduleIdParam || "");
  const [lessonSlugPart, setLessonSlugPart] = useState(""); // e.g. "lesson-1"
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [shortSummaryStudent, setShortSummaryStudent] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [notesForTeacherOrAI, setNotesForTeacherOrAI] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdLesson, setCreatedLesson] = useState<CreatedLesson | null>(null);

  useEffect(() => {
    async function loadModulesData() {
      setLoadError(null);

      const { data, error } = await loadModules();

      if (error) {
        setLoadError(`Error loading modules: ${error}`);
        return;
      }

      setModules(data ?? []);
    }

    loadModulesData();
  }, []);

  useEffect(() => {
    if (moduleIdParam) {
      setModuleId(moduleIdParam);
    }
  }, [moduleIdParam]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreatedLesson(null);

    const selectedModule = modules.find((m) => m.id === moduleId);
    if (!selectedModule) {
      setMessage("Selected module not found. Refresh and try again.");
      return;
    }

    const fullSlug = `${selectedModule.slug}/${slugify(lessonSlugPart)}`;

    // Validate using schema
    const result = createLessonSchema.safeParse({
      module_id: moduleId,
      slug: fullSlug,
      label: label.trim(),
      title: title || null,
      order_index: orderIndex,
      estimated_minutes: estimatedMinutes || null,
      required_score: null,
      content: null,
      short_summary_student: shortSummaryStudent || null,
      learning_objectives: learningObjectives || null,
      notes_for_teacher_or_ai: notesForTeacherOrAI || null,
      short_summary_admin: null,
      course_organization_group: null,
      slide_contents: null,
      activity_types: null,
      activity_description: null,
      signature_metaphors: null,
      main_grammar_topics: null,
      pronunciation_focus: null,
      vocabulary_theme: null,
      l1_l2_issues: null,
      prerequisites: null,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setMessage(firstError.message);
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await createLesson({
        module_id: result.data.module_id,
        slug: result.data.slug,
        label: result.data.label,
        title: result.data.title ?? undefined,
        order_index: result.data.order_index,
        estimated_minutes: result.data.estimated_minutes,
        required_score: result.data.required_score,
        content: result.data.content,
        short_summary_student: result.data.short_summary_student,
        learning_objectives: result.data.learning_objectives,
        notes_for_teacher_or_ai: result.data.notes_for_teacher_or_ai,
        short_summary_admin: result.data.short_summary_admin,
        course_organization_group: result.data.course_organization_group,
        slide_contents: result.data.slide_contents,
        activity_types: Array.isArray(result.data.activity_types) 
          ? result.data.activity_types.join(",") 
          : result.data.activity_types,
        activity_description: result.data.activity_description,
        signature_metaphors: result.data.signature_metaphors,
        main_grammar_topics: result.data.main_grammar_topics,
        pronunciation_focus: result.data.pronunciation_focus,
        vocabulary_theme: result.data.vocabulary_theme,
        l1_l2_issues: result.data.l1_l2_issues,
        prerequisites: result.data.prerequisites,
      });

      if (error) {
        setMessage(error);
        return;
      }

      if (!data) {
        setMessage("Insert succeeded but no data returned.");
        return;
      }

      // Map LessonDataMinimal to CreatedLesson
      setCreatedLesson({
        id: data.id,
        module_id: moduleId,
        slug: data.slug ?? "",
        label: data.label ?? null,
        title: data.title ?? null,
        order_index: orderIndex,
      });
      setMessage("Lesson created successfully.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CmsPageShell title="Create new lesson" maxWidth="md">
      {loadError && (
        <p style={{ color: "red", marginTop: uiTokens.space.sm }}>
          {loadError}
        </p>
      )}

      <CmsSection>
        <form onSubmit={handleSubmit}>
          <FormField label="Module" required>
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
            infoTooltip="Internal name for this lesson used in the CMS and navigation. Not shown to learners."
          >
            <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
          </FormField>

          <FormField 
            label="Title (optional - for student-facing content)" 
            infoTooltip="Student-facing title. Only shown to learners if provided. Leave empty if not needed."
          >
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>

          <FormField label="Order index" required>
            <Input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
            />
          </FormField>

          <FormField label="Estimated Minutes">
            <Input
              type="number"
              value={estimatedMinutes ?? ""}
              onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : null)}
              placeholder="Optional"
            />
          </FormField>

          <FormField label="Short Summary (Student)">
            <Textarea
              value={shortSummaryStudent}
              onChange={(e) => setShortSummaryStudent(e.target.value)}
              rows={3}
            />
          </FormField>

          <FormField label="Learning Objectives">
            <Textarea
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              rows={3}
            />
          </FormField>

          <FormField label="Notes for Teacher or AI">
            <Textarea
              value={notesForTeacherOrAI}
              onChange={(e) => setNotesForTeacherOrAI(e.target.value)}
              rows={4}
            />
          </FormField>

          <div style={{ marginTop: uiTokens.space.lg, display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create lesson"}
            </Button>
          </div>
        </form>
      </CmsSection>

      {message && (
        <StatusMessage
          variant={message.toLowerCase().includes("error") ? "error" : "success"}
        >
          {message}
        </StatusMessage>
      )}

      {createdLesson && (
        <CmsSection title="Created lesson">
          <pre className="codeText" style={{ fontSize: uiTokens.font.code.size }}>
            {JSON.stringify(createdLesson, null, 2)}
          </pre>
        </CmsSection>
      )}
    </CmsPageShell>
  );
}

export default function NewLessonPage() {
  return (
    <Suspense fallback={<CmsPageShell title="Create new lesson" maxWidth="md"><p>Loading...</p></CmsPageShell>}>
      <NewLessonForm />
    </Suspense>
  );
}
