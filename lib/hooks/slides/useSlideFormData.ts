/**
 * Hook for loading slide form data
 * 
 * Handles loading slide and group data, extracting props, and initializing form state.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { loadSlideById } from "../../data/slides";
import { loadGroupById } from "../../data/groups";
import { logger } from "../../utils/logger";
import {
  getTypedSlideProps,
  SLIDE_TYPES,
  type SlideType,
  type SlideProps,
  type CmsLanguage,
  isAISpeakStudentRepeatSlideProps,
  isSpeechMatchSlideProps,
  isSpeechChoiceVerifySlideProps,
  isLessonEndSlideProps,
  isAISpeakRepeatSlideProps,
  type SpeechChoiceVerifyElement,
} from "../../types/slideProps";
import { mapCmsLanguageToPlayer } from "../../constants/slideConstants";
import type { Slide } from "../../domain/slide";
import type { Group } from "../../domain/group";

export type SlideFormLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

export interface SlideFormData {
  slide: Slide;
  group: Group | null;
  props: SlideProps;
  meta: { activityName?: string };
}

/**
 * Extract path from Supabase Storage URL
 */
function extractPathFromUrl(url: string): string {
  if (url.includes("/storage/v1/object/public/")) {
    const parts = url.split("/storage/v1/object/public/");
    if (parts[1]) {
      const pathParts = parts[1].split("/");
      return pathParts.slice(1).join("/"); // Skip bucket name
    }
  }
  return url;
}

/**
 * Hook to load slide form data
 */
export function useSlideFormData(slideId: string | undefined) {
  const [loadState, setLoadState] = useState<SlideFormLoadState>({ status: "loading" });
  const [data, setData] = useState<SlideFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    if (!slideId) {
      setLoadState({ status: "error", message: "No slideId provided in URL." });
      setError("No slideId provided in URL.");
      return;
    }

    async function load() {
      setLoadState({ status: "loading" });
      setError(null);

      // Load slide
      const { data: slide, error: slideError } = await loadSlideById(slideId!);

      if (slideError || !slide) {
        const errorMessage = slideError || `No slide found with id "${slideId}"`;
        setLoadState({ status: "error", message: errorMessage });
        setError(errorMessage);
        return;
      }

      logger.debug("[Load] Slide loaded:", {
        slideId: slide.id,
        slideGroupId: slide.groupId,
        slideLabel: (slide.propsJson as { label?: string })?.label
      });

      // Extract props with type safety
      const typedProps = getTypedSlideProps(slide.type as SlideType, slide.propsJson);
      const props = typedProps || ({} as SlideProps);
      
      // Debug logging
      logger.debug("[Load] propsJson from database:", slide.propsJson);
      logger.debug("[Load] slide.type:", slide.type);
      logger.debug("[Load] typedProps after getTypedSlideProps:", typedProps);
      logger.debug("[Load] props.title:", props.title);
      
      // Extract metaJson
      const meta = (slide.metaJson as { activityName?: string }) || {};

      // Load group to get group name
      let group: Group | null = null;
      if (slide.groupId) {
        logger.debug("[Load] Loading group for slide:", {
          slideId: slide.id,
          groupId: slide.groupId
        });
        const { data: groupData, error: groupError } = await loadGroupById(slide.groupId);
        if (groupData) {
          logger.debug("[Load] Group loaded:", {
            groupId: groupData.id,
            groupLabel: groupData.label,
            groupTitle: groupData.title
          });
          group = groupData;
        } else if (groupError) {
          logger.error("Error loading group:", groupError);
          // Don't fail the whole load if group fails, just log it
        } else {
          logger.warn("[Load] No group data returned for groupId:", slide.groupId);
        }
      } else {
        logger.debug("[Load] Slide has no groupId:", slide.id);
      }

      setData({
        slide,
        group,
        props,
        meta,
      });
      setLoadState({ status: "ready" });
    }

    load();
  }, [slideId, reloadTrigger]);

  // Function to trigger a reload (useful after saving)
  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return {
    loadState,
    data,
    error,
    reload,
  };
}

/**
 * Extract initial form values from loaded slide data
 */
export function extractInitialFormValues(
  slide: Slide,
  props: SlideProps,
  meta: { activityName?: string },
  group: Group | null = null
) {
  // Handle phrases - legacy support (for backwards compatibility)
  let initialPhrases = "";
  if (isAISpeakRepeatSlideProps(props) && props.phrases) {
    initialPhrases = typeof props.phrases === "string" ? props.phrases : JSON.stringify(props.phrases);
  }

  // Handle lines - extract from props for ai-speak-repeat slides
  let initialLines: Array<Array<{
    label: string;
    speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
  }>> = [];
  if (isAISpeakRepeatSlideProps(props) && props.lines && Array.isArray(props.lines)) {
    initialLines = props.lines.map((row) =>
      row.map((cell) => ({
        label: cell.label || "",
        speech: {
          mode: (cell.speech.mode || "tts") as "tts" | "file",
          lang: cell.speech.lang as "en" | "fr" | undefined,
          text: cell.speech.text || "",
          fileUrl: cell.speech.fileUrl || "",
        },
      }))
    );
  }

  // Build initial choiceElements for speech-match and speech-choice-verify
  let initialChoiceElements: Array<{
    label: string;
    referenceText?: string;
    speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
  }> = [];
  if (
    (slide.type === SLIDE_TYPES.SPEECH_MATCH || slide.type === SLIDE_TYPES.SPEECH_CHOICE_VERIFY) &&
    (isSpeechMatchSlideProps(props) || isSpeechChoiceVerifySlideProps(props)) &&
    props.elements &&
    Array.isArray(props.elements)
  ) {
    const defaultLangValue = (props.defaultLang || "") as CmsLanguage;
    const mappedLang = mapCmsLanguageToPlayer(defaultLangValue) as "en" | "fr";
    initialChoiceElements = props.elements.map((el) => {
      const choiceElement: {
        label: string;
        referenceText?: string;
        speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
      } = {
        label: el.label || "",
        speech: {
          mode: (el.speech.mode || "tts") as "tts" | "file",
          lang: (el.speech.lang || mappedLang) as "en" | "fr" | undefined,
          text: el.speech.text || el.label || "",
          fileUrl: el.speech.fileUrl || "",
        },
      };
      // Add referenceText for speech-choice-verify
      if (slide.type === SLIDE_TYPES.SPEECH_CHOICE_VERIFY && isSpeechChoiceVerifySlideProps(props)) {
        const verifyElement = el as SpeechChoiceVerifyElement;
        choiceElement.referenceText = verifyElement.referenceText || verifyElement.label || "";
      }
      return choiceElement;
    });
  }

  // Extract initial elements for ai-speak-student-repeat
  let initialElements: Array<{
    samplePrompt: string;
    referenceText: string;
    audioPath: string;
  }> = [];
  if (
    isAISpeakStudentRepeatSlideProps(props) &&
    props.elements &&
    Array.isArray(props.elements) &&
    slide.type !== SLIDE_TYPES.SPEECH_MATCH
  ) {
    initialElements = props.elements.map((el) => ({
      samplePrompt: el.samplePrompt || "",
      referenceText: el.referenceText || "",
      audioPath: el.speech?.fileUrl ? extractPathFromUrl(el.speech.fileUrl) : "",
    }));
  }

  const initialValues = {
    slideId: slide.id,
    slideType: slide.type || "",
    groupId: slide.groupId || "",
    groupName: group?.title || group?.label || "", // Use group title (student-facing) if available, fallback to label (CMS name)
    lessonId: slide.lessonId,
    orderIndex: slide.orderIndex ?? 0,
    label: props.label || "",
    title: props.title || "",
    subtitle:
      slide.type === SLIDE_TYPES.LESSON_END
        ? ""
        : ((props as { subtitle?: string }).subtitle || ""),
    lessonEndMessage:
      slide.type === SLIDE_TYPES.LESSON_END && isLessonEndSlideProps(props)
        ? props.message || ""
        : "",
    lessonEndActions:
      slide.type === SLIDE_TYPES.LESSON_END && isLessonEndSlideProps(props)
        ? props.actions
          ? JSON.stringify(props.actions, null, 2)
          : ""
        : "",
    body: (props as { body?: string }).body || "",
    buttons: (props as { buttons?: unknown }).buttons
      ? JSON.stringify((props as { buttons?: unknown }).buttons, null, 2)
      : "",
    defaultLang: props.defaultLang || "",
    audioId: props.audioId || "",
    activityName: meta.activityName || "",
    phrases: initialPhrases,
    lines: initialLines,
    instructions: (isAISpeakStudentRepeatSlideProps(props) || isAISpeakRepeatSlideProps(props)) ? props.instructions || "" : "",
    promptLabel: isAISpeakStudentRepeatSlideProps(props) ? props.promptLabel || "" : "",
    onCompleteAtIndex:
      isAISpeakStudentRepeatSlideProps(props) &&
      props.onCompleteAtIndex !== undefined &&
      props.onCompleteAtIndex !== null
        ? String(props.onCompleteAtIndex)
        : "",
    elements: initialElements,
    choiceElements: initialChoiceElements,
    note: isSpeechMatchSlideProps(props) ? props.note || "" : "",
    isInteractive: props.isInteractive || false,
    allowSkip: props.allowSkip || false,
    allowRetry: props.allowRetry || false,
    isActivity: slide.isActivity || false,
    maxAttempts:
      props.maxAttempts !== undefined && props.maxAttempts !== null
        ? String(props.maxAttempts)
        : "",
    minAttemptsBeforeSkip:
      props.minAttemptsBeforeSkip !== undefined && props.minAttemptsBeforeSkip !== null
        ? String(props.minAttemptsBeforeSkip)
        : "",
  };

  // Debug logging
  logger.debug("[Load] extractInitialFormValues - title:", initialValues.title);
  logger.debug("[Load] extractInitialFormValues - props.title:", props.title);

  return initialValues;
}

