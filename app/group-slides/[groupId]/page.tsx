"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import CmsPageShell from "../../../components/cms/CmsPageShell";
import CmsOutlineView from "../../../components/cms/CmsOutlineView";
import CmsSection from "../../../components/ui/CmsSection";
import FormField from "../../../components/ui/FormField";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import SaveChangesButton from "../../../components/ui/SaveChangesButton";
import StatusMessage from "../../../components/ui/StatusMessage";
import LinkButton from "../../../components/ui/LinkButton";
import { uiTokens } from "../../../lib/uiTokens";
import { loadGroupById } from "../../../lib/data/groups";
import { loadSlidesByGroup, createSlide, loadSlideById } from "../../../lib/data/slides";
import type { Group } from "../../../lib/domain/group";
import { supabase } from "../../../lib/supabase";

type SlideForDisplay = {
  id: string;
  lessonId: string | null;
  groupId: string | null;
  orderIndex: number | null;
  type: string;
  propsJson?: unknown;
};

export default function GroupSlidesPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId;

  const [group, setGroup] = useState<Group | null>(null);
  const [slides, setSlides] = useState<SlideForDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [slideType, setSlideType] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [duplicatingSlideId, setDuplicatingSlideId] = useState<string | null>(null);
  const [reorderingSlideId, setReorderingSlideId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const sortedSlides = useMemo(() => {
    return [...slides].sort((a, b) => {
      const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }, [slides]);

  const nextOrderIndex = useMemo(() => {
    return (
      sortedSlides.reduce((max, s) => {
        const value = s.orderIndex ?? 0;
        return value > max ? value : max;
      }, 0) + 1
    );
  }, [sortedSlides]);

  const hasUnsavedChanges = useMemo(
    () =>
      Boolean(
        slideType ||
        orderIndex !== (nextOrderIndex || 0)
      ),
    [slideType, orderIndex, nextOrderIndex]
  );

  useEffect(() => {
    if (!groupId) {
      setError("No groupId provided in URL.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      // Load group to get lesson_id
      const { data: groupData, error: groupError } = await loadGroupById(groupId);
      if (groupError) {
        setError(groupError);
        setLoading(false);
        return;
      }

      if (!groupData) {
        setError("Group not found");
        setLoading(false);
        return;
      }

      setGroup(groupData);

      // Load slides with props_json for display
      const { data: slidesData, error: slidesError } = await supabase
        .from("slides")
        .select("id, lesson_id, group_id, order_index, type, props_json")
        .eq("group_id", groupId)
        .order("order_index", { ascending: true });

      if (slidesError) {
        setError(slidesError.message);
        setLoading(false);
        return;
      }

      setSlides((slidesData ?? []).map((s: any) => ({
        id: s.id,
        lessonId: s.lesson_id,
        groupId: s.group_id,
        orderIndex: s.order_index,
        type: s.type,
        propsJson: s.props_json,
      })));
      setLoading(false);
    }

    load();
  }, [groupId]);

  useEffect(() => {
    setOrderIndex(nextOrderIndex);
  }, [nextOrderIndex]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!groupId || !group) {
      setMessage("No group selected.");
      return;
    }

    if (!slideType) {
      setMessage("Please select a slide type.");
      return;
    }

    if (!group.lessonId) {
      setMessage("Group must have a lesson ID.");
      return;
    }

    const parsedOrderIndex = Number(orderIndex);

    setSaving(true);

    try {
      // Step 1: Increment order_index for all slides at or after the insertion position
      // This makes room for the new slide
      const slidesToUpdate = sortedSlides.filter(
        (slide) => slide.orderIndex !== null && slide.orderIndex >= parsedOrderIndex
      );

      if (slidesToUpdate.length > 0) {
        // Update each slide's order_index (increment by 1)
        const updatePromises = slidesToUpdate.map((slide) =>
          supabase
            .from("slides")
            .update({ order_index: slide.orderIndex! + 1 })
            .eq("id", slide.id)
        );

        const updateResults = await Promise.all(updatePromises);
        const updateErrors = updateResults.filter((result) => result.error);
        
        if (updateErrors.length > 0) {
          setMessage(`Error reordering slides: ${updateErrors[0].error?.message || "Unknown error"}`);
          setSaving(false);
          return;
        }
      }

      // Step 2: Create the new slide at the insertion position
    const { error: insertError } = await createSlide({
      lesson_id: group.lessonId,
      group_id: groupId,
      type: slideType,
      order_index: parsedOrderIndex,
    });

    if (insertError) {
        setMessage(`Error creating slide: ${insertError}`);
        setSaving(false);
        return;
      }

      setMessage("Slide created and inserted successfully!");
      setSlideType("");
      
      // Reload slides to show updated order
      const { data: slidesData, error: slidesError } = await supabase
        .from("slides")
        .select("id, lesson_id, group_id, order_index, type, props_json")
        .eq("group_id", groupId)
        .order("order_index", { ascending: true });

      if (slidesError) {
        setError(slidesError.message);
      } else {
        setSlides((slidesData ?? []).map((s: any) => ({
          id: s.id,
          lessonId: s.lesson_id,
          groupId: s.group_id,
          orderIndex: s.order_index,
          type: s.type,
          propsJson: s.props_json,
        })));
      }
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveButtonClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleDuplicate = async (slideId: string) => {
    if (!groupId || !group) {
      setMessage("No group selected.");
      return;
    }

    if (!group.lessonId) {
      setMessage("Group must have a lesson ID.");
      return;
    }

    setDuplicatingSlideId(slideId);
    setMessage(null);
    setError(null);

    try {
      // Load the full slide data
      const { data: slideData, error: loadError } = await loadSlideById(slideId);
      
      if (loadError || !slideData) {
        setMessage(`Error loading slide: ${loadError || "Slide not found"}`);
        return;
      }

      // Create duplicate with same data but new order_index
      const { error: insertError } = await createSlide({
        lesson_id: group.lessonId,
        group_id: groupId,
        type: slideData.type,
        order_index: nextOrderIndex,
        props_json: slideData.propsJson,
        meta_json: slideData.metaJson,
        aid_hook: slideData.aidHook ?? null,
        code: slideData.code ?? null,
        is_activity: slideData.isActivity ?? null,
        score_type: slideData.scoreType ?? null,
        passing_score_value: slideData.passingScoreValue ?? null,
        max_score_value: slideData.maxScoreValue ?? null,
        pass_required_for_next: slideData.passRequiredForNext ?? null,
      });

      if (insertError) {
        setMessage(`Error duplicating slide: ${insertError}`);
        return;
      }

      setMessage("Slide duplicated successfully!");
    
    // Reload slides to include new record
    const { data: slidesData, error: slidesError } = await supabase
      .from("slides")
      .select("id, lesson_id, group_id, order_index, type, props_json")
      .eq("group_id", groupId)
      .order("order_index", { ascending: true });

    if (slidesError) {
      setError(slidesError.message);
    } else {
      setSlides((slidesData ?? []).map((s: any) => ({
        id: s.id,
        lessonId: s.lesson_id,
        groupId: s.group_id,
        orderIndex: s.order_index,
        type: s.type,
        propsJson: s.props_json,
      })));
    }
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDuplicatingSlideId(null);
    }
  };

  const handleMoveSlide = async (slideId: string, direction: 'up' | 'down') => {
    if (!groupId) {
      setMessage("No group selected.");
      return;
    }

    const slide = sortedSlides.find((s) => s.id === slideId);
    if (!slide || slide.orderIndex === null) {
      setMessage("Slide not found or has no order index.");
      return;
    }

    const currentIndex = slide.orderIndex;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Validate bounds
    if (targetIndex < 0) {
      setMessage("Slide is already at the top.");
      return;
    }

    const maxIndex = sortedSlides.reduce((max, s) => {
      const idx = s.orderIndex ?? 0;
      return idx > max ? idx : max;
    }, 0);

    if (targetIndex > maxIndex) {
      setMessage("Slide is already at the bottom.");
      return;
    }

    setReorderingSlideId(slideId);
    setMessage(null);
    setError(null);

    try {
      // Find the slide that's currently at the target position
      const targetSlide = sortedSlides.find((s) => s.orderIndex === targetIndex);

      if (!targetSlide) {
        setMessage("Target position not found.");
        return;
      }

      // Swap the order_index values
      // First, set the current slide to a temporary value to avoid conflicts
      const tempIndex = maxIndex + 1000; // Use a high temporary value

      // Step 1: Move current slide to temp position
      const { error: tempError } = await supabase
        .from("slides")
        .update({ order_index: tempIndex })
        .eq("id", slideId);

      if (tempError) {
        setMessage(`Error: ${tempError.message}`);
        return;
      }

      // Step 2: Move target slide to current slide's position
      const { error: targetError } = await supabase
        .from("slides")
        .update({ order_index: currentIndex })
        .eq("id", targetSlide.id);

      if (targetError) {
        // Try to restore on error
        await supabase
          .from("slides")
          .update({ order_index: currentIndex })
          .eq("id", slideId);
        setMessage(`Error: ${targetError.message}`);
        return;
      }

      // Step 3: Move current slide to target position
      const { error: finalError } = await supabase
        .from("slides")
        .update({ order_index: targetIndex })
        .eq("id", slideId);

      if (finalError) {
        // Try to restore on error
        await supabase
          .from("slides")
          .update({ order_index: currentIndex })
          .eq("id", slideId);
        await supabase
          .from("slides")
          .update({ order_index: targetIndex })
          .eq("id", targetSlide.id);
        setMessage(`Error: ${finalError.message}`);
        return;
      }

      setMessage("Slide order updated successfully!");

      // Reload slides to show updated order
      const { data: slidesData, error: slidesError } = await supabase
        .from("slides")
        .select("id, lesson_id, group_id, order_index, type, props_json")
        .eq("group_id", groupId)
        .order("order_index", { ascending: true });

      if (slidesError) {
        setError(slidesError.message);
      } else {
        setSlides((slidesData ?? []).map((s: any) => ({
          id: s.id,
          lessonId: s.lesson_id,
          groupId: s.group_id,
          orderIndex: s.order_index,
          type: s.type,
          propsJson: s.props_json,
        })));
      }
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setReorderingSlideId(null);
    }
  };

  // Simple slide type options (can be expanded later)
  const slideTypeOptions = [
    { value: "text-slide", label: "Text Slide" },
    { value: "title-slide", label: "Title Slide" },
    { value: "lesson-end", label: "Lesson End" },
    { value: "ai-speak-repeat", label: "AI Speak Repeat" },
    { value: "ai-speak-student-repeat", label: "AI Speak Student Repeat" },
    { value: "speech-match", label: "Speech Match" },
    { value: "speech-choice-verify", label: "Speech Choice Verify" },
  ];

  return (
    <CmsPageShell title="Manage Group">
      <div style={{ display: "flex", gap: uiTokens.space.lg, width: "100%", minHeight: "100vh" }}>
        {/* Left column - outline view */}
        <div style={{ flex: "0 0 25%", backgroundColor: "transparent", border: "1px solid #9cc7c7", borderRadius: uiTokens.radius.lg, overflow: "auto" }}>
          <CmsOutlineView currentGroupId={groupId} />
        </div>
        
        {/* Right column - content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: uiTokens.space.md }}>
          <CmsSection
            title="Add slide"
            backgroundColor="#cde3e3"
            borderColor="#9cc7c7"
            description="Create a slide for this group."
          >
            <form ref={formRef} onSubmit={handleCreate}>
              <FormField label="Slide type" required>
                  <Select value={slideType} onChange={(e) => setSlideType(e.target.value)}>
                    <option value="">Select a slide type…</option>
                  {slideTypeOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
              </FormField>

              <FormField 
                label="Order index" 
                required
                infoTooltip="Position where the slide will be inserted. Slides at or after this position will automatically shift down by 1."
              >
                <Input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  min="0"
                />
                <div className="metaText" style={{ marginTop: uiTokens.space.xs, fontSize: uiTokens.font.meta.size, color: "#999" }}>
                  {(() => {
                    const insertPos = Math.max(0, Math.floor(orderIndex));
                    const slidesToShift = sortedSlides.filter(s => (s.orderIndex ?? 0) >= insertPos).length;
                    
                    if (sortedSlides.length === 0) {
                      return "This will be the first slide (position 0).";
                    } else if (insertPos < nextOrderIndex) {
                      return (
                        <span style={{ color: uiTokens.color.primary }}>
                          This will insert the slide at position {insertPos} and shift {slidesToShift} slide{slidesToShift !== 1 ? 's' : ''} down.
                        </span>
                      );
                    } else {
                      return "This will add the slide at the end.";
                    }
                  })()}
                </div>
              </FormField>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: uiTokens.space.md }}>
                <SaveChangesButton
                  onClick={handleSaveButtonClick}
                  hasUnsavedChanges={hasUnsavedChanges}
                  saving={saving}
                  label="Create slide"
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
            title="Slides"
            backgroundColor="#cde3e3"
            borderColor="#9cc7c7"
            description={groupId ? `Showing slides for this group` : undefined}
          >
            {loading && <p>Loading slides…</p>}
            {error && <p style={{ color: uiTokens.color.danger }}>{error}</p>}

            {!loading && sortedSlides.length === 0 && <p>No slides yet.</p>}

            {!loading && sortedSlides.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: `1px solid ${uiTokens.color.border}` }}>
                    <th style={{ padding: uiTokens.space.xs }}>Label</th>
                    <th style={{ padding: uiTokens.space.xs }}>Type</th>
                    <th style={{ padding: uiTokens.space.xs }}>Order</th>
                    <th style={{ padding: uiTokens.space.xs }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSlides.map((slide) => (
                    <tr key={slide.id} style={{ borderBottom: `1px solid ${uiTokens.color.border}` }}>
                      <td style={{ padding: uiTokens.space.xs }}>
                        {(slide.propsJson as { label?: string })?.label || slide.id.slice(0, 8)}
                      </td>
                      <td style={{ padding: uiTokens.space.xs }}><code className="codeText">{slide.type}</code></td>
                      <td style={{ padding: uiTokens.space.xs }}>{slide.orderIndex ?? "—"}</td>
                      <td style={{ padding: uiTokens.space.xs }}>
                        <div style={{ display: "flex", gap: uiTokens.space.xs, alignItems: "center" }}>
                          {/* Move Up/Down buttons */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <button
                              onClick={() => handleMoveSlide(slide.id, 'up')}
                              disabled={reorderingSlideId === slide.id || slide.orderIndex === 0}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: (reorderingSlideId === slide.id || slide.orderIndex === 0) ? "not-allowed" : "pointer",
                                padding: 2,
                                display: "flex",
                                alignItems: "center",
                                opacity: (reorderingSlideId === slide.id || slide.orderIndex === 0) ? 0.3 : 1,
                              }}
                              title="Move up"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleMoveSlide(slide.id, 'down')}
                              disabled={(() => {
                                const maxIndex = sortedSlides.reduce((max, s) => Math.max(max, s.orderIndex ?? 0), 0);
                                return reorderingSlideId === slide.id || slide.orderIndex === maxIndex;
                              })()}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: (() => {
                                  const maxIndex = sortedSlides.reduce((max, s) => Math.max(max, s.orderIndex ?? 0), 0);
                                  return (reorderingSlideId === slide.id || slide.orderIndex === maxIndex) ? "not-allowed" : "pointer";
                                })(),
                                padding: 2,
                                display: "flex",
                                alignItems: "center",
                                opacity: (() => {
                                  const maxIndex = sortedSlides.reduce((max, s) => Math.max(max, s.orderIndex ?? 0), 0);
                                  return (reorderingSlideId === slide.id || slide.orderIndex === maxIndex) ? 0.3 : 1;
                                })(),
                              }}
                              title="Move down"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                          </div>
                          <LinkButton href={`/edit-slide/${slide.id}`} size="sm" title="Edit slide">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </LinkButton>
                          <button
                            onClick={() => handleDuplicate(slide.id)}
                            disabled={duplicatingSlideId === slide.id}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: duplicatingSlideId === slide.id ? "not-allowed" : "pointer",
                              padding: uiTokens.space.xs,
                              display: "flex",
                              alignItems: "center",
                              opacity: duplicatingSlideId === slide.id ? 0.5 : 1,
                            }}
                            title="Duplicate slide"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125v3.75m0 0-3-3m3 3 3-3m-12.75 0v9.375c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V11.25c0-4.556-3.694-8.25-8.25-8.25S3.75 6.694 3.75 11.25v.375" />
                            </svg>
                          </button>
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
