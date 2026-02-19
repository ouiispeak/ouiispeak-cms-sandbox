"use client";

import { useState, FormEvent, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import CmsPageShell from "../../../components/cms/CmsPageShell";
import CmsOutlineView from "../../../components/cms/CmsOutlineView";
import CmsSection from "../../../components/ui/CmsSection";
import FormField from "../../../components/ui/FormField";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Textarea from "../../../components/ui/Textarea";
import { uiTokens } from "../../../lib/uiTokens";
import BreadcrumbTrail from "../../../components/cms/BreadcrumbTrail";
import SaveChangesButton from "../../../components/ui/SaveChangesButton";
import PreviewInPlayerButton from "../../../components/ui/PreviewInPlayerButton";
import LinkButton from "../../../components/ui/LinkButton";
import StatusMessage from "../../../components/ui/StatusMessage";
import { loadModuleById, updateModule } from "../../../lib/data/modules";
import type { Module } from "../../../lib/domain/module";
import { updateModuleSchema } from "../../../lib/schemas/moduleSchema";
import { useUnsavedChangesWarning } from "../../../lib/hooks/cms/useUnsavedChangesWarning";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      module: Module;
    };

export default function EditModulePage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId;

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [level, setLevel] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [visibility, setVisibility] = useState<"private" | "beta" | "public">("private");
  const [moduleGoal, setModuleGoal] = useState("");
  const [coreTopics, setCoreTopics] = useState("");
  const [authorNotes, setAuthorNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const initialDataRef = useRef<{
    label: string;
    title: string;
    slug: string;
    level: string;
    orderIndex: number;
    description: string;
    status: "draft" | "published" | "archived";
    visibility: "private" | "beta" | "public";
    moduleGoal: string;
    coreTopics: string;
    authorNotes: string;
  } | null>(null);

  // Check if form has unsaved changes
  const hasUnsavedChanges = (() => {
    if (!initialDataRef.current) return false;
    const initial = initialDataRef.current;
    return (
      label !== initial.label ||
      title !== initial.title ||
      slug !== initial.slug ||
      level !== initial.level ||
      orderIndex !== initial.orderIndex ||
      description !== initial.description ||
      status !== initial.status ||
      visibility !== initial.visibility ||
      moduleGoal !== initial.moduleGoal ||
      coreTopics !== initial.coreTopics ||
      authorNotes !== initial.authorNotes
    );
  })();

  // Warn before navigation
  useUnsavedChangesWarning(hasUnsavedChanges);

  useEffect(() => {
    if (!moduleId) {
      setLoadState({ status: "error", message: "No moduleId provided in URL." });
      return;
    }

    async function load() {
      setLoadState({ status: "loading" });

      const { data, error } = await loadModuleById(moduleId);

      if (error) {
        setLoadState({ status: "error", message: error });
        return;
      }

      if (!data) {
        setLoadState({ status: "error", message: `No module found with id "${moduleId}"` });
        return;
      }

      setLabel(data.label ?? "");
      setTitle(data.title ?? "");
      setSlug(data.slug);
      setLevel(data.level || "");
      setOrderIndex(data.orderIndex ?? 1);
      setDescription(data.description || "");
      setStatus((data.status as "draft" | "published" | "archived") || "draft");
      setVisibility((data.visibility as "private" | "beta" | "public") || "private");
      setModuleGoal(data.moduleGoal || "");
      setCoreTopics(data.coreTopics || "");
      setAuthorNotes(data.authorNotes || "");

      // Store initial values for comparison
      initialDataRef.current = {
        label: data.label ?? "",
        title: data.title ?? "",
        slug: data.slug,
        level: data.level || "",
        orderIndex: data.orderIndex ?? 1,
        description: data.description || "",
        status: (data.status as "draft" | "published" | "archived") || "draft",
        visibility: (data.visibility as "private" | "beta" | "public") || "private",
        moduleGoal: data.moduleGoal || "",
        coreTopics: data.coreTopics || "",
        authorNotes: data.authorNotes || "",
      };

      setLoadState({ status: "ready", module: data });
    }

    load();
  }, [moduleId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Validate required fields (label is required for new modules)
    const isNewModule = !moduleId;
    if (isNewModule && !label.trim()) {
      setMessage("Module label is required for CMS navigation.");
      return;
    }

    // Validate using schema
    const result = updateModuleSchema.safeParse({
      label: label.trim() || null,
      title: title.trim() || undefined,
      slug,
      level,
      order_index: orderIndex,
      description: description || null,
      status: status || null,
      visibility: visibility || null,
      module_goal: moduleGoal || null,
      core_topics: coreTopics || null,
      author_notes: authorNotes || null,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setMessage(firstError.message);
      return;
    }

    setSaving(true);
    try {
      const { data: updatedModule, error } = await updateModule(moduleId, result.data);

      if (error) {
        setMessage(error);
        return;
      }

      if (!updatedModule) {
        setMessage("Update succeeded but no data returned.");
        return;
      }

      setMessage("Module updated successfully!");
      
      // Reload module data from server to ensure we have the latest
      const { data: reloadedData, error: reloadError } = await loadModuleById(moduleId);
      
      if (reloadError || !reloadedData) {
        // If reload fails, use the updated module data we got back
        setLabel(updatedModule.label ?? "");
        setTitle(updatedModule.title ?? "");
        setSlug(updatedModule.slug);
        setLevel(updatedModule.level || "");
        setOrderIndex(updatedModule.orderIndex ?? 1);
        setDescription(updatedModule.description || "");
        setStatus((updatedModule.status as "draft" | "published" | "archived") || "draft");
        setVisibility((updatedModule.visibility as "private" | "beta" | "public") || "private");
        setModuleGoal(updatedModule.moduleGoal || "");
        setCoreTopics(updatedModule.coreTopics || "");
        setAuthorNotes(updatedModule.authorNotes || "");
      } else {
        // Use reloaded data
        setLabel(reloadedData.label ?? "");
        setTitle(reloadedData.title ?? "");
        setSlug(reloadedData.slug);
        setLevel(reloadedData.level || "");
        setOrderIndex(reloadedData.orderIndex ?? 1);
        setDescription(reloadedData.description || "");
        setStatus((reloadedData.status as "draft" | "published" | "archived") || "draft");
        setVisibility((reloadedData.visibility as "private" | "beta" | "public") || "private");
        setModuleGoal(reloadedData.moduleGoal || "");
        setCoreTopics(reloadedData.coreTopics || "");
        setAuthorNotes(reloadedData.authorNotes || "");
      }
      
      // Update initial data ref after successful save
      if (initialDataRef.current) {
        initialDataRef.current = {
          label: reloadedData?.label ?? updatedModule.label ?? "",
          title: reloadedData?.title ?? updatedModule.title ?? "",
          slug: reloadedData?.slug ?? updatedModule.slug,
          level: reloadedData?.level ?? updatedModule.level ?? "",
          orderIndex: reloadedData?.orderIndex ?? updatedModule.orderIndex ?? 1,
          description: reloadedData?.description ?? updatedModule.description ?? "",
          status: (reloadedData?.status ?? updatedModule.status) as "draft" | "published" | "archived" || "draft",
          visibility: (reloadedData?.visibility ?? updatedModule.visibility) as "private" | "beta" | "public" || "private",
          moduleGoal: reloadedData?.moduleGoal ?? updatedModule.moduleGoal ?? "",
          coreTopics: reloadedData?.coreTopics ?? updatedModule.coreTopics ?? "",
          authorNotes: reloadedData?.authorNotes ?? updatedModule.authorNotes ?? "",
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
      title="Edit module"
    >
      {loadState.status === "loading" && <p>Loading module…</p>}

      {loadState.status === "error" && (
        <CmsSection title="Error" description={loadState.message}>
          <p style={{ color: uiTokens.color.danger }}>{loadState.message}</p>
        </CmsSection>
      )}

      {loadState.status === "ready" && (
        <div style={{ display: "flex", gap: uiTokens.space.lg, width: "100%", minHeight: "100vh" }}>
          {/* Left column - outline view */}
          <div style={{ flex: "0 0 25%", backgroundColor: "transparent", border: "1px solid #6aabab", borderRadius: uiTokens.radius.lg, overflow: "auto" }}>
            <CmsOutlineView currentModuleId={moduleId} hasUnsavedChanges={hasUnsavedChanges} />
          </div>
          
          {/* Right column - form */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: uiTokens.space.md, gap: uiTokens.space.sm }}>
              {moduleId && (
                <LinkButton href={`/module-lessons/${moduleId}`} size="sm">
                  Manage lessons & groups
                </LinkButton>
              )}
              <div style={{ display: "flex", gap: uiTokens.space.sm, alignItems: "center" }}>
                <PreviewInPlayerButton href={moduleId ? `/module-lessons/${moduleId}` : undefined} />
                <SaveChangesButton
                  onClick={handleSaveButtonClick}
                  hasUnsavedChanges={hasUnsavedChanges}
                  saving={saving}
                />
              </div>
            </div>
            <BreadcrumbTrail moduleId={moduleId} />
            <CmsSection title="Module Details" backgroundColor="#9cc7c7" borderColor="#6aabab">
              <form ref={formRef} onSubmit={handleSave}>
            <FormField label="Module ID" borderColor="#6aabab">
              <Input value={moduleId || ""} disabled readOnly />
            </FormField>

            <FormField 
              label="Label" 
              required
              borderColor="#6aabab"
              infoTooltip="Internal name for this module used in the CMS and navigation. Not shown to learners."
            >
              <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </FormField>

            {moduleId && !label.trim() && (
              <div
                style={{
                  padding: uiTokens.space.md,
                  backgroundColor: "#fff3cd",
                  border: `1px solid #ffc107`,
                  borderRadius: uiTokens.radius.md,
                  color: "#856404",
                }}
              >
                <strong>Missing label:</strong> This module is missing a label. Please add one for proper CMS navigation.
              </div>
            )}

            <FormField 
              label="Title (optional - for student-facing content)" 
              borderColor="#6aabab"
              infoTooltip="Student-facing title. Only shown to learners if provided. Leave empty if not needed."
            >
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>

            <FormField label="Slug" required borderColor="#6aabab">
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </FormField>

            <FormField label="Level" required borderColor="#6aabab">
              <Input value={level} onChange={(e) => setLevel(e.target.value)} />
            </FormField>

            <FormField label="Order index" required borderColor="#6aabab">
              <Input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
              />
            </FormField>

            <FormField label="Description (optional)" borderColor="#6aabab">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </FormField>

            <FormField label="Status" required borderColor="#6aabab">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </Select>
            </FormField>

            <FormField label="Visibility" required borderColor="#6aabab">
              <Select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "private" | "beta" | "public")}
              >
                <option value="private">private</option>
                <option value="beta">beta</option>
                <option value="public">public</option>
              </Select>
            </FormField>

            <FormField label="Module goal (optional)" borderColor="#6aabab">
              <Textarea
                value={moduleGoal}
                onChange={(e) => setModuleGoal(e.target.value)}
                rows={4}
              />
            </FormField>

            <FormField label="Core topics (optional)" helper="Comma-separated list of topics" borderColor="#6aabab">
              <Input
                value={coreTopics}
                onChange={(e) => setCoreTopics(e.target.value)}
                placeholder="e.g., grammar, vocabulary, pronunciation"
              />
            </FormField>

            <FormField label="Author notes (optional)" borderColor="#6aabab">
              <Textarea
                value={authorNotes}
                onChange={(e) => setAuthorNotes(e.target.value)}
                rows={4}
              />
            </FormField>
              </form>
            </CmsSection>
          </div>
        </div>
      )}

      {message && (
        <StatusMessage variant={message.includes("error") ? "error" : "success"}>
          {message}
        </StatusMessage>
      )}
    </CmsPageShell>
  );
}
