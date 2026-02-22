/**
 * Hook for saving slide form data
 * 
 * Handles validation, building props_json, and saving to database.
 */

import { useState } from "react";
import { updateSlide } from "../../data/slides";
import { getAudioFileUrl } from "../../storage/audioFiles";
import { logger } from "../../utils/logger";
import {
  SLIDE_TYPES,
  type SlideProps,
  type ButtonConfig,
  type CmsLanguage,
  type AISpeakStudentRepeatSlideProps,
  type SpeechMatchSlideProps,
  type SpeechChoiceVerifySlideProps,
  type LessonEndSlideProps,
  type AISpeakRepeatSlideProps,
  type TextSlideProps,
  type TitleSlideProps,
  type ChoiceElement,
  type LineCell,
} from "../../types/slideProps";
import { mapCmsLanguageToPlayer } from "../../constants/slideConstants";
import type { SlideFormState } from "./useSlideFormState";

export interface SaveResult {
  success: boolean;
  error: string | null;
}

/**
 * Hook for saving slide form data to the database.
 * 
 * This hook handles the complete save flow:
 * 1. Validates the form data (validation must be done externally)
 * 2. Parses JSON fields (buttons, actions)
 * 3. Builds the props_json object based on slide type
 * 4. Handles slide-type-specific data transformations
 * 5. Saves to database via `updateSlide`
 * 
 * @returns An object containing:
 *   - `save`: Async function to save the form data
 *   - `saving`: Boolean indicating if save is in progress
 *   - `message`: Success or error message
 *   - `setMessage`: Function to manually set the message
 * 
 * @example
 * ```tsx
 * const { save, saving, message } = useSlideFormSave();
 * 
 * const handleSave = async () => {
 *   const validation = validateForm(state);
 *   const result = await save(
 *     slideId,
 *     slideType,
 *     state,
 *     isActivity,
 *     originalElements,
 *     elementsTouched,
 *     validation
 *   );
 *   
 *   if (result.success) {
 *     // Handle success
 *   }
 * };
 * ```
 * 
 * @remarks
 * - Validation must be performed before calling `save` - the hook expects a validation result
 * - For speech-match slides, preserves original elements if empty and user hasn't touched them
 * - Automatically handles language format conversion (CMS format → Player format)
 * - Converts storage paths to public URLs for audio files
 * - Auto-adjusts `minAttemptsBeforeSkip` if it exceeds `maxAttempts`
 */
export function useSlideFormSave() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * Saves slide form data to the database.
   * 
   * @param slideId - The ID of the slide to update
   * @param slideType - The type of slide (e.g., "text-slide", "speech-match")
   * @param state - Current form state values
   * @param isActivity - Whether this slide is marked as an activity
   * @param originalSpeechMatchElements - Original speech-match elements (for preservation logic)
   * @param speechMatchElementsTouched - Whether user has modified speech-match elements
   * @param validationResult - Result from form validation (must be valid to proceed)
   * 
   * @returns Promise resolving to a SaveResult indicating success or failure
   * 
   * @throws Does not throw - errors are returned in the SaveResult
   */
  const save = async (
    slideId: string,
    slideType: string,
    state: SlideFormState,
    isActivity: boolean,
    originalSpeechMatchElements: ChoiceElement[] | null,
    speechMatchElementsTouched: boolean,
    validationResult: { valid: boolean; error: string | null }
  ): Promise<SaveResult> => {
    // Validate first
    if (!validationResult.valid) {
      setMessage(`Error: ${validationResult.error}`);
      return { success: false, error: validationResult.error };
    }

    setSaving(true);
    setMessage(null);

    try {
      // Parse buttons if provided
      let buttonsValue: unknown = null;
      if (state.buttons.trim()) {
        try {
          buttonsValue = JSON.parse(state.buttons);
        } catch (parseError) {
          setMessage("Error: Invalid JSON in Buttons field");
          setSaving(false);
          return { success: false, error: "Invalid JSON in Buttons field" };
        }
      }

      // Parse actions if provided (for lesson-end slides)
      let actionsValue: unknown = null;
      if (slideType === SLIDE_TYPES.LESSON_END && state.lessonEndActions.trim()) {
        try {
          actionsValue = JSON.parse(state.lessonEndActions);
        } catch (parseError) {
          setMessage("Error: Invalid JSON in Actions field");
          setSaving(false);
          return { success: false, error: "Invalid JSON in Actions field" };
        }
      }

      // Build updated props_json with type safety
      const updatedProps: Partial<SlideProps> = {
        label: state.label.trim() || undefined,
        title: state.title.trim() || undefined,
        body: state.body.trim() || undefined,
        buttons: buttonsValue ? (buttonsValue as ButtonConfig[]) : undefined,
        defaultLang: (state.defaultLang.trim() || undefined) as CmsLanguage | undefined,
        audioId: state.audioId.trim() || undefined,
      };

      // For lesson-end slides, use message instead of subtitle
      if (slideType === SLIDE_TYPES.LESSON_END) {
        (updatedProps as Partial<LessonEndSlideProps>).message =
          state.lessonEndMessage.trim() || undefined;
        (updatedProps as Partial<LessonEndSlideProps>).actions =
          (actionsValue as LessonEndSlideProps["actions"]) || undefined;
      } else {
        (
          updatedProps as Partial<
            TextSlideProps | TitleSlideProps | AISpeakRepeatSlideProps | AISpeakStudentRepeatSlideProps | SpeechMatchSlideProps
          >
        ).subtitle = state.subtitle.trim() || undefined;
      }

      // Add boolean flags (always include them, even if false)
      updatedProps.isInteractive = state.isInteractive;
      updatedProps.allowSkip = state.allowSkip;
      updatedProps.allowRetry = state.allowRetry;

      // Add numeric attempt fields (only if set)
      if (state.maxAttempts.trim() !== "") {
        const maxAttemptsValue = Math.max(0, Math.floor(Number(state.maxAttempts)));
        updatedProps.maxAttempts = maxAttemptsValue;
      }
      if (state.minAttemptsBeforeSkip.trim() !== "") {
        const minAttemptsValue = Math.max(0, Math.floor(Number(state.minAttemptsBeforeSkip)));
        // Auto-adjust if it exceeds maxAttempts
        if (state.maxAttempts.trim() !== "" && minAttemptsValue > Number(state.maxAttempts)) {
          updatedProps.minAttemptsBeforeSkip = Math.max(0, Math.floor(Number(state.maxAttempts)));
        } else {
          updatedProps.minAttemptsBeforeSkip = minAttemptsValue;
        }
      }

      // Handle slide type-specific data structures
      if (slideType === SLIDE_TYPES.AI_SPEAK_STUDENT_REPEAT) {
        const studentRepeatProps = updatedProps as Partial<AISpeakStudentRepeatSlideProps>;
        // For ai-speak-student-repeat: save elements array
        if (state.elements.length > 0) {
          studentRepeatProps.elements = state.elements
            .filter((el) => el.samplePrompt.trim() !== "") // Only include elements with samplePrompt
            .map((el) => {
              const samplePrompt = el.samplePrompt.trim();
              const referenceText = el.referenceText.trim() || samplePrompt; // Default to samplePrompt if not provided

              const element: AISpeakStudentRepeatSlideProps["elements"][0] = {
                samplePrompt,
                referenceText, // Always include referenceText for pronunciation assessment
              };

              // Add speech if audio is provided
              if (el.audioPath.trim()) {
                const audioUrl = getAudioFileUrl("lesson-audio", el.audioPath.trim());
                element.speech = {
                  mode: "file" as const,
                  fileUrl: audioUrl,
                };
              } else if (referenceText || samplePrompt) {
                // Use TTS if no audio file but we have text
                // Map CMS language format to player format
                const mappedLang = mapCmsLanguageToPlayer((state.defaultLang || "en") as CmsLanguage) as "en" | "fr";
                element.speech = {
                  mode: "tts" as const,
                  lang: mappedLang,
                  text: referenceText || samplePrompt,
                };
              }

              return element;
            });
        }

        // Add ai-speak-student-repeat specific fields
        if (state.instructions.trim()) {
          studentRepeatProps.instructions = state.instructions.trim();
        }
        if (state.promptLabel.trim()) {
          studentRepeatProps.promptLabel = state.promptLabel.trim();
        }
        if (state.onCompleteAtIndex.trim() !== "") {
          const indexValue = Math.max(0, Math.floor(Number(state.onCompleteAtIndex)));
          studentRepeatProps.onCompleteAtIndex = indexValue;
        }
      } else if (slideType === SLIDE_TYPES.SPEECH_MATCH) {
        const speechMatchProps = updatedProps as Partial<SpeechMatchSlideProps>;
        // For speech-match: save choiceElements as elements array
        // Guard: preserve originals only if empty, originals existed, and user hasn't touched elements
        if (state.choiceElements.length > 0) {
          speechMatchProps.elements = state.choiceElements
            .filter((el) => {
              // Only include elements with label
              if (!el.label.trim()) return false;
              // If file mode, must have fileUrl
              if (el.speech.mode === "file" && !el.speech.fileUrl?.trim()) return false;
              // If TTS mode, must have text or label
              if (el.speech.mode === "tts" && !el.speech.text?.trim() && !el.label.trim())
                return false;
              return true;
            })
            .map((el) => {
              const element: SpeechMatchSlideProps["elements"][0] = {
                label: el.label.trim(),
                speech: {
                  mode: el.speech.mode,
                },
              };

              if (el.speech.mode === "file") {
                // Convert storage path to public URL if it's not already a URL
                const filePath = el.speech.fileUrl!.trim();
                if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
                  // Already a full URL, use as-is
                  element.speech.fileUrl = filePath;
                } else {
                  // Storage path, convert to public URL
                  element.speech.fileUrl = getAudioFileUrl("lesson-audio", filePath);
                }
              } else {
                // TTS mode
                const mappedLang = mapCmsLanguageToPlayer((state.defaultLang || "en") as CmsLanguage) as "en" | "fr";
                element.speech.lang = (el.speech.lang || mappedLang) as "en" | "fr" | undefined;
                element.speech.text = el.speech.text?.trim() || el.label.trim();
              }

              return element;
            });
        } else if (
          state.choiceElements.length === 0 &&
          originalSpeechMatchElements &&
          originalSpeechMatchElements.length > 0 &&
          speechMatchElementsTouched === false
        ) {
          // Preserve original elements only if empty, originals existed, and user hasn't touched elements
          speechMatchProps.elements = originalSpeechMatchElements as SpeechMatchSlideProps["elements"];
        }

        // Add speech-match specific fields (SpeechMatchSlideProps has subtitle, note, elements only)
        if (state.note.trim()) {
          speechMatchProps.note = state.note.trim();
        }
      } else if (slideType === SLIDE_TYPES.SPEECH_CHOICE_VERIFY) {
        const speechChoiceVerifyProps = updatedProps as Partial<SpeechChoiceVerifySlideProps>;
        // For speech-choice-verify: save choiceElements as elements array with referenceText
        if (state.choiceElements.length > 0) {
          speechChoiceVerifyProps.elements = state.choiceElements
            .filter((el) => {
              // Only include elements with label and referenceText
              if (!el.label.trim()) return false;
              if (!el.referenceText?.trim()) return false;
              // If file mode, must have fileUrl
              if (el.speech.mode === "file" && !el.speech.fileUrl?.trim()) return false;
              // If TTS mode, must have text or label
              if (el.speech.mode === "tts" && !el.speech.text?.trim() && !el.label.trim())
                return false;
              return true;
            })
            .map((el) => {
              const element: SpeechChoiceVerifySlideProps["elements"][0] = {
                label: el.label.trim(),
                referenceText: el.referenceText!.trim(),
                speech: {
                  mode: el.speech.mode,
                },
              };

              if (el.speech.mode === "file") {
                // Convert storage path to public URL if it's not already a URL
                const filePath = el.speech.fileUrl!.trim();
                if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
                  // Already a full URL, use as-is
                  element.speech.fileUrl = filePath;
                } else {
                  // Storage path, convert to public URL
                  element.speech.fileUrl = getAudioFileUrl("lesson-audio", filePath);
                }
              } else {
                // TTS mode
                const mappedLang = mapCmsLanguageToPlayer((state.defaultLang || "en") as CmsLanguage) as "en" | "fr";
                element.speech.lang = (el.speech.lang || mappedLang) as "en" | "fr" | undefined;
                element.speech.text = el.speech.text?.trim() || el.label.trim();
              }

              return element;
            });
        }

        // Add speech-choice-verify specific fields
        if (state.note.trim()) {
          speechChoiceVerifyProps.note = state.note.trim();
        }
      } else {
        // For ai-speak-repeat: use lines array directly
        const aiSpeakRepeatProps = updatedProps as Partial<AISpeakRepeatSlideProps>;
        if (state.lines && Array.isArray(state.lines) && state.lines.length > 0) {
          // Map CMS language format to player format for each cell
          const mappedDefaultLang = mapCmsLanguageToPlayer((state.defaultLang || "en") as CmsLanguage) as "en" | "fr";
          aiSpeakRepeatProps.lines = state.lines.map((row) =>
            row
              .map((cell) => {
                const cellLabel = cell.label?.trim() || "";
                if (!cellLabel) {
                  // Skip cells without labels
                  return null;
                }

                const cellData: LineCell = {
                  label: cellLabel,
                  speech: {
                    mode: cell.speech.mode || "tts",
                  },
                };

                if (cell.speech.mode === "file") {
                  // Convert storage path to public URL if it's not already a URL
                  const filePath = cell.speech.fileUrl?.trim();
                  if (filePath) {
                    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
                      // Already a full URL, use as-is
                      cellData.speech.fileUrl = filePath;
                    } else {
                      // Storage path, convert to public URL
                      cellData.speech.fileUrl = getAudioFileUrl("lesson-audio", filePath);
                    }
                  } else {
                    // File mode but no fileUrl - fallback to TTS mode
                    cellData.speech.mode = "tts";
                    cellData.speech.lang = (cell.speech.lang || mappedDefaultLang) as "en" | "fr" | undefined;
                    cellData.speech.text = cell.speech.text?.trim() || cellLabel;
                  }
                } else {
                  // TTS mode
                  cellData.speech.lang = (cell.speech.lang || mappedDefaultLang) as "en" | "fr" | undefined;
                  const ttsText = cell.speech.text?.trim() || cellLabel;
                  if (!ttsText) {
                    // No text available - skip this cell
                    return null;
                  }
                  cellData.speech.text = ttsText;
                }

                return cellData;
              })
              .filter((cell): cell is NonNullable<typeof cell> => cell !== null)
          ).filter((row) => row.length > 0); // Remove empty rows
        } else if (state.phrases.trim()) {
          // Fallback: convert phrases textarea to lines array (backwards compatibility)
          const phraseList = state.phrases
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

          if (phraseList.length > 0) {
            const mappedLang = mapCmsLanguageToPlayer((state.defaultLang || "en") as CmsLanguage) as "en" | "fr";
            aiSpeakRepeatProps.lines = [
              phraseList.map((label) => ({
                label,
                speech: {
                  mode: "tts" as const,
                  lang: mappedLang,
                  text: label,
                },
              })),
            ];
          }
        }

        // AISpeakRepeatSlideProps has lines/phrases, subtitle, note - no instructions
      }

      // Remove undefined values (but keep false values for booleans)
      Object.keys(updatedProps).forEach((key) => {
        const propsRecord = updatedProps as Record<string, unknown>;
        if (propsRecord[key] === undefined) {
          delete propsRecord[key];
        }
      });

      // Build updated meta_json
      const updatedMeta: { activityName?: string } = {};
      if (state.activityName.trim()) {
        updatedMeta.activityName = state.activityName.trim();
      }

      // Debug logging
      logger.debug("[Save] About to save to database:");
      logger.debug("[Save] slideId:", slideId);
      logger.debug("[Save] props_json:", JSON.stringify(updatedProps, null, 2));
      logger.debug("[Save] meta_json:", JSON.stringify(updatedMeta, null, 2));
      logger.debug("[Save] is_activity:", isActivity);

      const { error, data: savedData } = await updateSlide(slideId, {
        props_json: updatedProps,
        meta_json: Object.keys(updatedMeta).length > 0 ? updatedMeta : undefined,
        is_activity: isActivity,
      });

      // Debug logging
      if (error) {
        logger.error("[Save] Error saving:", error);
      } else {
        logger.debug("[Save] Success! Saved data:", savedData);
        logger.debug("[Save] Saved props_json:", savedData?.propsJson);
      }

      if (error) {
        setMessage(`Error: ${error}`);
        setSaving(false);
        return { success: false, error };
      } else {
        setMessage("Changes saved successfully!");
        setSaving(false);
        return { success: true, error: null };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
      setMessage(`Error: ${errorMessage}`);
      setSaving(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    save,
    saving,
    message,
    setMessage,
  };
}

