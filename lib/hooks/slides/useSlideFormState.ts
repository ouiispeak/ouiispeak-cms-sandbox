/**
 * Hook for managing slide form state
 * 
 * Centralizes all form state management and unsaved changes tracking.
 */

import { useState, useRef, useEffect } from "react";
import { useUnsavedChangesWarning } from "../cms/useUnsavedChangesWarning";
import { logger } from "../../utils/logger";
import { SLIDE_TYPES, type ChoiceElement } from "../../types/slideProps";

export interface SlideFormState {
  // Identity fields
  slideId: string;
  slideType: string;
  groupId: string;
  groupName: string;
  lessonId: string | null;
  orderIndex: number;

  // Content fields
  label: string;
  title: string;
  subtitle: string;
  lessonEndMessage: string;
  lessonEndActions: string;
  body: string;
  buttons: string;
  defaultLang: string;
  audioId: string;
  activityName: string;

  // Speech fields
  phrases: string;
  lines: Array<Array<{
    label: string;
    speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
  }>>;
  instructions: string;
  promptLabel: string;
  note: string;
  onCompleteAtIndex: string;
  elements: Array<{ samplePrompt: string; referenceText: string; audioPath: string }>;
  choiceElements: Array<{
    label: string;
    referenceText?: string; // Required for speech-choice-verify, optional for speech-match
    speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
  }>;

  // Interaction fields
  isInteractive: boolean;
  allowSkip: boolean;
  allowRetry: boolean;
  isActivity: boolean;
  maxAttempts: string;
  minAttemptsBeforeSkip: string;
}

export interface SlideFormStateSetters {
  setSlideId: (value: string) => void;
  setSlideType: (value: string) => void;
  setGroupId: (value: string) => void;
  setGroupName: (value: string) => void;
  setLessonId: (value: string | null) => void;
  setOrderIndex: (value: number) => void;
  setLabel: (value: string) => void;
  setTitle: (value: string) => void;
  setSubtitle: (value: string) => void;
  setLessonEndMessage: (value: string) => void;
  setLessonEndActions: (value: string) => void;
  setBody: (value: string) => void;
  setButtons: (value: string) => void;
  setDefaultLang: (value: string) => void;
  setAudioId: (value: string) => void;
  setActivityName: (value: string) => void;
  setPhrases: (value: string) => void;
  setLines: (value: Array<Array<{
    label: string;
    speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
  }>>) => void;
  setInstructions: (value: string) => void;
  setPromptLabel: (value: string) => void;
  setNote: (value: string) => void;
  setOnCompleteAtIndex: (value: string) => void;
  setElements: (
    value: Array<{ samplePrompt: string; referenceText: string; audioPath: string }>
  ) => void;
  setChoiceElements: (
    value: Array<{
      label: string;
      speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
    }>
  ) => void;
  setIsInteractive: (value: boolean) => void;
  setAllowSkip: (value: boolean) => void;
  setAllowRetry: (value: boolean) => void;
  setIsActivity: (value: boolean) => void;
  setMaxAttempts: (value: string) => void;
  setMinAttemptsBeforeSkip: (value: string) => void;
}

/**
 * Hook to manage slide form state and track unsaved changes.
 * 
 * This hook centralizes all form state management for the slide editor, including:
 * - Managing all form field values (title, subtitle, body, etc.)
 * - Tracking unsaved changes by comparing current state to initial values
 * - Handling special cases like speech-match element preservation
 * - Providing setters for all form fields
 * 
 * @param initialValues - Initial form values loaded from the database. When this changes
 *                        (e.g., after loading a new slide), the hook updates all state
 *                        variables and resets the unsaved changes flag.
 * 
 * @returns An object containing:
 *   - `state`: Current form state values (all fields)
 *   - `setters`: Functions to update each field
 *   - `originalSpeechMatchElementsRef`: Ref to original speech-match elements (for preservation logic)
 *   - `speechMatchElementsTouchedRef`: Ref tracking if user has modified speech-match elements
 *   - `hasUnsavedChanges`: Boolean indicating if form has been modified
 *   - `updateInitialValues`: Function to update initial values after successful save
 * 
 * @example
 * ```tsx
 * const { state, setters, hasUnsavedChanges, updateInitialValues } = useSlideFormState(initialValues);
 * 
 * // Update a field
 * setters.setTitle("New Title");
 * 
 * // Check if there are unsaved changes
 * if (hasUnsavedChanges) {
 *   // Show warning before navigation
 * }
 * 
 * // After successful save, update initial values
 * updateInitialValues();
 * ```
 * 
 * @remarks
 * - The hook uses `useRef` to store initial values for comparison, preventing unnecessary re-renders
 * - Special handling for speech-match slides: preserves original elements if user hasn't touched them
 * - Automatically warns user before navigation if there are unsaved changes (via `useUnsavedChangesWarning`)
 * - Prevents infinite loops by tracking the last initialized slide ID
 */
export function useSlideFormState(initialValues: Partial<SlideFormState> | null) {
  // Identity state
  const [slideId, setSlideId] = useState(initialValues?.slideId || "");
  const [slideType, setSlideType] = useState(initialValues?.slideType || "");
  const [groupId, setGroupId] = useState(initialValues?.groupId || "");
  const [groupName, setGroupName] = useState(initialValues?.groupName || "");
  const [lessonId, setLessonId] = useState<string | null>(initialValues?.lessonId || null);
  const [orderIndex, setOrderIndex] = useState(initialValues?.orderIndex || 0);

  // Content state
  const [label, setLabel] = useState(initialValues?.label || "");
  const [title, setTitle] = useState(initialValues?.title || "");
  const [subtitle, setSubtitle] = useState(initialValues?.subtitle || "");
  const [lessonEndMessage, setLessonEndMessage] = useState(
    initialValues?.lessonEndMessage || ""
  );
  const [lessonEndActions, setLessonEndActions] = useState(
    initialValues?.lessonEndActions || ""
  );
  const [body, setBody] = useState(initialValues?.body || "");
  const [buttons, setButtons] = useState(initialValues?.buttons || "");
  const [defaultLang, setDefaultLang] = useState(initialValues?.defaultLang || "");
  const [audioId, setAudioId] = useState(initialValues?.audioId || "");
  const [activityName, setActivityName] = useState(initialValues?.activityName || "");

  // Speech state
  const [phrases, setPhrases] = useState(initialValues?.phrases || "");
  const [lines, setLines] = useState(
    initialValues?.lines || []
  );
  const [instructions, setInstructions] = useState(initialValues?.instructions || "");
  const [promptLabel, setPromptLabel] = useState(initialValues?.promptLabel || "");
  const [note, setNote] = useState(initialValues?.note || "");
  const [onCompleteAtIndex, setOnCompleteAtIndex] = useState(
    initialValues?.onCompleteAtIndex || ""
  );
  const [elements, setElements] = useState(
    initialValues?.elements || [
      { samplePrompt: "", referenceText: "", audioPath: "" },
    ]
  );
  const [choiceElements, setChoiceElements] = useState(
    initialValues?.choiceElements || []
  );

  // Interaction state
  const [isInteractive, setIsInteractive] = useState(initialValues?.isInteractive || false);
  const [allowSkip, setAllowSkip] = useState(initialValues?.allowSkip || false);
  const [allowRetry, setAllowRetry] = useState(initialValues?.allowRetry || false);
  const [isActivity, setIsActivity] = useState(initialValues?.isActivity || false);
  const [maxAttempts, setMaxAttempts] = useState(initialValues?.maxAttempts || "");
  const [minAttemptsBeforeSkip, setMinAttemptsBeforeSkip] = useState(
    initialValues?.minAttemptsBeforeSkip || ""
  );

  // Track initial values for unsaved changes detection
  const initialValuesRef = useRef<SlideFormState | null>(null);

  // Store original props.elements for speech-match to preserve if needed
  const originalSpeechMatchElementsRef = useRef<ChoiceElement[] | null>(null);
  // Track if user has intentionally modified speech-match elements
  const speechMatchElementsTouchedRef = useRef<boolean>(false);

  // Track the last slideId we initialized to avoid re-initializing unnecessarily
  const lastInitializedSlideIdRef = useRef<string | null>(null);
  
  // Update state and initial values when data loads
  useEffect(() => {
    if (initialValues) {
      // Only update if this is a different slide or if we haven't initialized yet
      const currentSlideId = initialValues.slideId || "";
      const lastSlideId = lastInitializedSlideIdRef.current;
      
      // Check if values actually changed by comparing key fields
      const valuesChanged = 
        lastSlideId !== currentSlideId ||
        !initialValuesRef.current ||
        initialValuesRef.current.slideId !== currentSlideId ||
        initialValuesRef.current.title !== (initialValues.title || "") ||
        initialValuesRef.current.label !== (initialValues.label || "");
      
      if (!valuesChanged && lastSlideId === currentSlideId) {
        // Values haven't changed, skip update to avoid infinite loop
        return;
      }
      
      // Debug logging
      logger.debug("[Load] useSlideFormState - initialValues.title:", initialValues.title);
      
      // Update all state variables with new initial values
      setSlideId(initialValues.slideId || "");
      setSlideType(initialValues.slideType || "");
      setGroupId(initialValues.groupId || "");
      setGroupName(initialValues.groupName || "");
      setLessonId(initialValues.lessonId || null);
      setOrderIndex(initialValues.orderIndex || 0);
      setLabel(initialValues.label || "");
      setTitle(initialValues.title || "");
      setSubtitle(initialValues.subtitle || "");
      setLessonEndMessage(initialValues.lessonEndMessage || "");
      setLessonEndActions(initialValues.lessonEndActions || "");
      setBody(initialValues.body || "");
      setButtons(initialValues.buttons || "");
      setDefaultLang(initialValues.defaultLang || "");
      setAudioId(initialValues.audioId || "");
      setActivityName(initialValues.activityName || "");
      setPhrases(initialValues.phrases || "");
      setLines(initialValues.lines || []);
      setInstructions(initialValues.instructions || "");
      setPromptLabel(initialValues.promptLabel || "");
      setNote(initialValues.note || "");
      setOnCompleteAtIndex(initialValues.onCompleteAtIndex || "");
      setElements(initialValues.elements || []);
      setChoiceElements(initialValues.choiceElements || []);
      setIsInteractive(initialValues.isInteractive || false);
      setAllowSkip(initialValues.allowSkip || false);
      setAllowRetry(initialValues.allowRetry || false);
      setIsActivity(initialValues.isActivity || false);
      setMaxAttempts(initialValues.maxAttempts || "");
      setMinAttemptsBeforeSkip(initialValues.minAttemptsBeforeSkip || "");
      
      // Also update the ref for unsaved changes tracking
      initialValuesRef.current = {
        slideId: initialValues.slideId || "",
        slideType: initialValues.slideType || "",
        groupId: initialValues.groupId || "",
        groupName: initialValues.groupName || "",
        lessonId: initialValues.lessonId || null,
        orderIndex: initialValues.orderIndex || 0,
        label: initialValues.label || "",
        title: initialValues.title || "",
        subtitle: initialValues.subtitle || "",
        lessonEndMessage: initialValues.lessonEndMessage || "",
        lessonEndActions: initialValues.lessonEndActions || "",
        body: initialValues.body || "",
        buttons: initialValues.buttons || "",
        defaultLang: initialValues.defaultLang || "",
        audioId: initialValues.audioId || "",
        activityName: initialValues.activityName || "",
        phrases: initialValues.phrases || "",
        lines: initialValues.lines ? initialValues.lines.map(row => row.map(cell => ({ ...cell, speech: { ...cell.speech } }))) : [],
        instructions: initialValues.instructions || "",
        promptLabel: initialValues.promptLabel || "",
        note: initialValues.note || "",
        onCompleteAtIndex: initialValues.onCompleteAtIndex || "",
        elements: initialValues.elements || [],
        choiceElements: initialValues.choiceElements || [],
        isInteractive: initialValues.isInteractive || false,
        allowSkip: initialValues.allowSkip || false,
        allowRetry: initialValues.allowRetry || false,
        isActivity: initialValues.isActivity || false,
        maxAttempts: initialValues.maxAttempts || "",
        minAttemptsBeforeSkip: initialValues.minAttemptsBeforeSkip || "",
      };
      
      // Track that we've initialized this slide
      lastInitializedSlideIdRef.current = currentSlideId;
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Reset speech-match touched flag
      if (initialValues.slideType === SLIDE_TYPES.SPEECH_MATCH) {
        speechMatchElementsTouchedRef.current = false;
      }
    }
  }, [initialValues]);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!initialValuesRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges =
      label !== initialValuesRef.current.label ||
      title !== initialValuesRef.current.title ||
      subtitle !== initialValuesRef.current.subtitle ||
      lessonEndMessage !== initialValuesRef.current.lessonEndMessage ||
      lessonEndActions !== initialValuesRef.current.lessonEndActions ||
      body !== initialValuesRef.current.body ||
      buttons !== initialValuesRef.current.buttons ||
      defaultLang !== initialValuesRef.current.defaultLang ||
      audioId !== initialValuesRef.current.audioId ||
      activityName !== initialValuesRef.current.activityName ||
      phrases !== initialValuesRef.current.phrases ||
      JSON.stringify(lines) !== JSON.stringify(initialValuesRef.current.lines) ||
      instructions !== initialValuesRef.current.instructions ||
      promptLabel !== initialValuesRef.current.promptLabel ||
      onCompleteAtIndex !== initialValuesRef.current.onCompleteAtIndex ||
      JSON.stringify(elements) !== JSON.stringify(initialValuesRef.current.elements) ||
      JSON.stringify(choiceElements) !== JSON.stringify(initialValuesRef.current.choiceElements) ||
      isInteractive !== initialValuesRef.current.isInteractive ||
      allowSkip !== initialValuesRef.current.allowSkip ||
      allowRetry !== initialValuesRef.current.allowRetry ||
      isActivity !== initialValuesRef.current.isActivity ||
      maxAttempts !== initialValuesRef.current.maxAttempts ||
      minAttemptsBeforeSkip !== initialValuesRef.current.minAttemptsBeforeSkip;

    setHasUnsavedChanges(hasChanges);
  }, [
    label,
    title,
    subtitle,
    lessonEndMessage,
    lessonEndActions,
    body,
    buttons,
    defaultLang,
    audioId,
    activityName,
    phrases,
    lines,
    instructions,
    promptLabel,
    onCompleteAtIndex,
    elements,
    choiceElements,
    isInteractive,
    allowSkip,
    allowRetry,
    isActivity,
    maxAttempts,
    minAttemptsBeforeSkip,
  ]);

  // Warn before navigating away with unsaved changes
  useUnsavedChangesWarning(hasUnsavedChanges);

  // Wrapper for setChoiceElements that tracks user interaction for speech-match
  const handleChoiceElementsChange = (
    newElements: Array<{
      label: string;
      speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
    }>
  ) => {
    if (slideType === SLIDE_TYPES.SPEECH_MATCH) {
      speechMatchElementsTouchedRef.current = true;
    }
    setChoiceElements(newElements);
  };

  // Update initial values after successful save
  const updateInitialValues = () => {
    // Always update initialValuesRef, even if it was null before
    initialValuesRef.current = {
      slideId,
      slideType,
      groupId,
      groupName,
      lessonId,
      orderIndex,
      label,
      title,
      subtitle: slideType === SLIDE_TYPES.LESSON_END ? "" : subtitle,
      lessonEndMessage: slideType === SLIDE_TYPES.LESSON_END ? lessonEndMessage : "",
      lessonEndActions: slideType === SLIDE_TYPES.LESSON_END ? lessonEndActions : "",
      body,
      buttons,
      defaultLang,
      audioId,
      activityName,
      phrases,
      lines: lines.map(row => row.map(cell => ({ ...cell, speech: { ...cell.speech } }))),
      instructions,
      promptLabel,
      note,
      onCompleteAtIndex,
      elements,
      choiceElements: [...choiceElements],
      isInteractive,
      allowSkip,
      allowRetry,
      isActivity,
      maxAttempts,
      minAttemptsBeforeSkip,
    };
    
    // Also update originalSpeechMatchElementsRef for speech-match slides
    if (slideType === SLIDE_TYPES.SPEECH_MATCH && choiceElements.length > 0) {
      // Convert choiceElements to ChoiceElement format
      originalSpeechMatchElementsRef.current = choiceElements.map((el) => ({
        label: el.label,
        speech: {
          mode: el.speech.mode,
          lang: el.speech.lang,
          text: el.speech.text,
          fileUrl: el.speech.fileUrl,
        },
      }));
    } else if (slideType === SLIDE_TYPES.SPEECH_MATCH) {
      // If empty, set to empty array (not null) to indicate intentional deletion
      originalSpeechMatchElementsRef.current = [];
    }
    
    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
  };

  return {
    // State
    state: {
      slideId,
      slideType,
      groupId,
      groupName,
      lessonId,
      orderIndex,
      label,
      title,
      subtitle,
      lessonEndMessage,
      lessonEndActions,
      body,
      buttons,
      defaultLang,
      audioId,
      activityName,
      phrases,
      lines,
      instructions,
      promptLabel,
      note,
      onCompleteAtIndex,
      elements,
      choiceElements,
      isInteractive,
      allowSkip,
      allowRetry,
      isActivity,
      maxAttempts,
      minAttemptsBeforeSkip,
    } as SlideFormState,

    // Setters
    setters: {
      setSlideId,
      setSlideType,
      setGroupId,
      setGroupName,
      setLessonId,
      setOrderIndex,
      setLabel,
      setTitle,
      setSubtitle,
      setLessonEndMessage,
      setLessonEndActions,
      setBody,
      setButtons,
      setDefaultLang,
      setAudioId,
      setActivityName,
      setPhrases,
      setLines,
      setInstructions,
      setPromptLabel,
      setNote,
      setOnCompleteAtIndex,
      setElements,
      setChoiceElements: handleChoiceElementsChange,
      setIsInteractive,
      setAllowSkip,
      setAllowRetry,
      setIsActivity,
      setMaxAttempts,
      setMinAttemptsBeforeSkip,
    } as SlideFormStateSetters,

    // Refs for special handling
    originalSpeechMatchElementsRef,
    speechMatchElementsTouchedRef,

    // Computed
    hasUnsavedChanges,
    updateInitialValues,
  };
}

