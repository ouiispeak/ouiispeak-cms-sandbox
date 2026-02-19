"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import CmsPageShell from "../../../components/cms/CmsPageShell";
import CmsOutlineView from "../../../components/cms/CmsOutlineView";
import CmsSection from "../../../components/ui/CmsSection";
import FormField from "../../../components/ui/FormField";
import Input from "../../../components/ui/Input";
import SaveChangesButton from "../../../components/ui/SaveChangesButton";
import StatusMessage from "../../../components/ui/StatusMessage";
import LinkButton from "../../../components/ui/LinkButton";
import { uiTokens } from "../../../lib/uiTokens";
import { loadGroupsByLesson, createGroup } from "../../../lib/data/groups";
import { createGroupSchema } from "../../../lib/schemas/groupSchema";
import { getGroupDisplayName } from "../../../lib/utils/displayName";
import type { GroupMinimal } from "../../../lib/domain/group";

export default function LessonSlidesPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId;

  const [groups, setGroups] = useState<GroupMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }, [groups]);

  const nextOrderIndex = useMemo(() => {
    return (
      sortedGroups.reduce((max, g) => {
        const value = g.orderIndex ?? 0;
        return value > max ? value : max;
      }, 0) + 1
    );
  }, [sortedGroups]);

  const hasUnsavedChanges = useMemo(
    () =>
      Boolean(
        label ||
        title ||
        orderIndex !== (nextOrderIndex || 0)
      ),
    [label, title, orderIndex, nextOrderIndex]
  );

  useEffect(() => {
    if (!lessonId) {
      setError("No lessonId provided in URL.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: loadError } = await loadGroupsByLesson(lessonId);

      if (loadError) {
        setError(loadError);
        setLoading(false);
        return;
      }

      setGroups(data ?? []);
      setLoading(false);
    }

    load();
  }, [lessonId]);

  useEffect(() => {
    setOrderIndex(nextOrderIndex || 0);
  }, [nextOrderIndex]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!lessonId) {
      setMessage("No lesson selected.");
      return;
    }

    const parsedOrderIndex = Number(orderIndex);

    const validation = createGroupSchema.safeParse({
      lesson_id: lessonId,
      label,
      title: title || null,
      order_index: parsedOrderIndex,
    });

    if (!validation.success) {
      setMessage(validation.error.issues[0]?.message || "Validation error");
      return;
    }

    setSaving(true);
    const { error: insertError } = await createGroup({
      lesson_id: lessonId,
      label: validation.data.label,
      title: validation.data.title ?? undefined,
      order_index: validation.data.order_index,
    });
    setSaving(false);

    if (insertError) {
      setMessage(insertError);
      return;
    }

    setMessage("Group created!");
    setLabel("");
    setTitle("");
    
    // Reload groups to include new record
    const { data: refreshed, error: refreshError } = await loadGroupsByLesson(lessonId);
    if (refreshError) {
      setError(refreshError);
    } else {
      setGroups(refreshed ?? []);
    }
  };

  const handleSaveButtonClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <CmsPageShell title="Manage Lesson">
      <div style={{ display: "flex", gap: uiTokens.space.lg, width: "100%", minHeight: "100vh" }}>
        {/* Left column - outline view */}
        <div style={{ flex: "0 0 25%", backgroundColor: "transparent", border: "1px solid #6aabab", borderRadius: uiTokens.radius.lg, overflow: "auto" }}>
          <CmsOutlineView currentLessonId={lessonId} />
        </div>
        
        {/* Right column - content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: uiTokens.space.md }}>
          <CmsSection
            title="Add group"
            backgroundColor="#b5d5d5"
            borderColor="#6aabab"
            description="Create a group for this lesson."
          >
            <form ref={formRef} onSubmit={handleCreate}>
              <FormField 
                label="Label" 
                required
                infoTooltip="Internal name for this group used in the CMS and navigation. Not shown to learners."
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

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: uiTokens.space.md }}>
                <SaveChangesButton
                  onClick={handleSaveButtonClick}
                  hasUnsavedChanges={hasUnsavedChanges}
                  saving={saving}
                  label="Create group"
                />
              </div>
            </form>
            {message && (
              <StatusMessage variant={message.toLowerCase().includes("error") ? "error" : "success"}>
                {message}
              </StatusMessage>
            )}
          </CmsSection>

          <CmsSection
            title="Groups"
            backgroundColor="#b5d5d5"
            borderColor="#6aabab"
            description={lessonId ? `Showing groups for this lesson` : undefined}
          >
            {loading && <p>Loading groups…</p>}
            {error && <p style={{ color: uiTokens.color.danger }}>{error}</p>}

            {!loading && sortedGroups.length === 0 && <p>No groups yet.</p>}

            {!loading && sortedGroups.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: `1px solid ${uiTokens.color.border}` }}>
                    <th style={{ padding: uiTokens.space.xs }}>Label</th>
                    <th style={{ padding: uiTokens.space.xs }}>Title</th>
                    <th style={{ padding: uiTokens.space.xs }}>Order</th>
                    <th style={{ padding: uiTokens.space.xs }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroups.map((group) => (
                    <tr key={group.id} style={{ borderBottom: `1px solid ${uiTokens.color.border}` }}>
                      <td style={{ padding: uiTokens.space.xs }}>{getGroupDisplayName(group)}</td>
                      <td style={{ padding: uiTokens.space.xs }}>{group.title || "—"}</td>
                      <td style={{ padding: uiTokens.space.xs }}>{group.orderIndex ?? "—"}</td>
                      <td style={{ padding: uiTokens.space.xs }}>
                        <div style={{ display: "flex", gap: uiTokens.space.xs, alignItems: "center" }}>
                          <LinkButton href={`/group-slides/${group.id}`} size="sm" style={{ color: "#b5d5d5", border: "1px solid #6aabab" }}>
                            Edit slides
                          </LinkButton>
                          <LinkButton href={`/edit-group/${group.id}`} size="sm" style={{ color: "#b5d5d5", border: "1px solid #6aabab" }}>
                            Edit group
                          </LinkButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CmsSection>
        </div>
      </div>
    </CmsPageShell>
  );
}
