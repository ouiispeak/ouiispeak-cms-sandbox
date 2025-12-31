"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import CmsPageShell from "../../../components/cms/CmsPageShell";
import CmsOutlineView from "../../../components/cms/CmsOutlineView";
import { uiTokens } from "../../../lib/uiTokens";
import { DynamicSlideForm } from "../../../components/slide-editor/DynamicSlideForm";
import { createFormChangeHandler } from "../../../lib/utils/formStateMapper";
import { SLIDE_TYPES, type ChoiceElement, isSpeechMatchSlideProps } from "../../../lib/types/slideProps";
import { getSlideDisplayName } from "../../../lib/utils/displayName";
import { useSlideFormData, extractInitialFormValues } from "../../../lib/hooks/slides/useSlideFormData";
import { useSlideFormState } from "../../../lib/hooks/slides/useSlideFormState";
import { useSlideFormValidation } from "../../../lib/hooks/slides/useSlideFormValidation";
import { useSlideFormSave } from "../../../lib/hooks/slides/useSlideFormSave";
import { SlideFormLoader } from "../../../components/slide-editor/SlideFormLoader";
import { SlideFormActions } from "../../../components/slide-editor/SlideFormActions";
import { logger } from "../../../lib/utils/logger";

/**
 * Edit Slide Page
 * 
 * Refactored to use custom hooks for data loading, state management, validation, and saving.
 * This significantly reduces the page size and improves maintainability.
 */
export default function EditSlidePage() {
  const params = useParams<{ slideId: string }>();
  const slideId = params?.slideId as string | undefined;

  // Load slide data
  const { loadState, data, reload } = useSlideFormData(slideId);

  // Extract initial values when data loads (memoized to prevent infinite loops)
  const initialValues = useMemo(() => {
    if (!data) return null;
    return extractInitialFormValues(data.slide, data.props, data.meta, data.group);
  }, [data?.slide.id, data?.slide.propsJson, data?.slide.metaJson, data?.group?.id, data?.group?.label]);

  // Manage form state
  const {
    state,
    setters,
    originalSpeechMatchElementsRef,
    speechMatchElementsTouchedRef,
    hasUnsavedChanges,
    updateInitialValues,
  } = useSlideFormState(initialValues);

  // Validation hook
  const { validate } = useSlideFormValidation();

  // Save hook
  const { save, saving, message, setMessage } = useSlideFormSave();

  // Player preview URL
  const playerBaseUrl = process.env.NEXT_PUBLIC_PLAYER_BASE_URL || "";
  const playerHref =
    playerBaseUrl && state.lessonId
      ? `${playerBaseUrl}/lecons/db/${state.lessonId}`
      : undefined;

  // Store original speech-match elements when data loads
  useEffect(() => {
    if (
      data &&
      data.slide.type === SLIDE_TYPES.SPEECH_MATCH &&
      isSpeechMatchSlideProps(data.props) &&
      data.props.elements &&
      Array.isArray(data.props.elements)
    ) {
      originalSpeechMatchElementsRef.current = data.props.elements as ChoiceElement[];
      speechMatchElementsTouchedRef.current = false;
    } else {
      originalSpeechMatchElementsRef.current = null;
    }
  }, [data, originalSpeechMatchElementsRef, speechMatchElementsTouchedRef]);

  // Track when data reloads after save to update initial values
  const prevDataRef = useRef(data);
  useEffect(() => {
    // If data changed and we're not in a loading state, update initial values
    // This handles the case where reload() completes and new data is loaded
    if (
      data &&
      prevDataRef.current !== data &&
      loadState.status === "ready" &&
      data.slide.id === slideId
    ) {
      // Update initial values after reload completes to reset unsaved changes flag
      // Use setTimeout to ensure state has been updated from initialValues first
      setTimeout(() => {
        updateInitialValues();
      }, 0);
      prevDataRef.current = data;
    }
  }, [data, loadState.status, slideId, updateInitialValues]);

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideId || !data) return;

    // Debug: Log state before save
    logger.debug("[handleSave] State before save:", {
      title: state.title,
      label: state.label,
      subtitle: state.subtitle,
      body: state.body,
    });

    // Validate first
    const validationResult = validate(
      data.slide.type,
      {
        phrases: state.phrases,
        lines: state.lines,
        elements: state.elements,
        choiceElements: state.choiceElements,
      },
      originalSpeechMatchElementsRef.current,
      speechMatchElementsTouchedRef.current
    );

    if (!validationResult.valid) {
      setMessage(validationResult.error);
      return;
    }

    // Save
    const result = await save(
      slideId,
      data.slide.type,
      state,
      state.isActivity,
      originalSpeechMatchElementsRef.current,
      speechMatchElementsTouchedRef.current,
      validationResult
    );

    if (result.success) {
      // Reload data from database to get the latest saved data
      // This ensures we have the exact data that was saved
      // The useEffect watching for data changes will call updateInitialValues() when reload completes
      reload();
    }
  };

  // Get slide display name for title
  const slideDisplayName =
    loadState.status === "ready" && state.slideId
      ? getSlideDisplayName({ propsJson: { label: state.label } })
      : "";

  return (
    <CmsPageShell title={slideDisplayName ? `Edit Slide: ${slideDisplayName}` : "Edit Slide"}>
      <div style={{ display: "flex", gap: uiTokens.space.lg, width: "100%", minHeight: "100vh" }}>
        {/* Left column - outline view */}
        <div
          style={{
            flex: "0 0 25%",
            backgroundColor: "transparent",
            border: "1px solid #9cc7c7",
            borderRadius: uiTokens.radius.lg,
            overflow: "auto",
          }}
        >
          <CmsOutlineView currentSlideId={slideId} />
        </div>

        {/* Right column - content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: uiTokens.space.md }}>
          {/* Top actions bar */}
          <SlideFormActions
            message={message}
            playerHref={playerHref}
            hasUnsavedChanges={hasUnsavedChanges}
            saving={saving}
            onSave={() => {
              const form = document.querySelector("form");
              if (form) {
                form.requestSubmit();
              }
            }}
          />

          {/* Loading and error states */}
          <SlideFormLoader loadState={loadState} />

          {loadState.status === "ready" && data && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: uiTokens.space.lg }}>
              {/* Dynamic Form - Always used, configs are required */}
              <DynamicSlideForm
                slideType={data.slide.type}
                values={state}
                onChange={createFormChangeHandler(setters)}
                defaultLang={state.defaultLang}
              />
            </form>
          )}
        </div>
      </div>
    </CmsPageShell>
  );
}
