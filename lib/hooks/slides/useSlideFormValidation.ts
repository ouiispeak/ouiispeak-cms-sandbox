/**
 * Hook for slide form validation
 * 
 * Provides validation logic for different slide types.
 */

import { SLIDE_TYPES, type ChoiceElement } from "../../types/slideProps";

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Hook for validating slide form before save
 */
export function useSlideFormValidation() {
  const validate = (
    slideType: string,
    state: {
      phrases: string;
      lines: Array<Array<{
        label: string;
        speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
      }>>;
      elements: Array<{ samplePrompt: string; referenceText: string; audioPath: string }>;
      choiceElements: Array<{
        label: string;
        speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
      }>;
    },
    originalSpeechMatchElements: ChoiceElement[] | null,
    speechMatchElementsTouched: boolean
  ): ValidationResult => {
    // Pre-save validation for interactive slide types
    if (slideType === SLIDE_TYPES.AI_SPEAK_REPEAT) {
      // Require at least one row with at least one cell in lines array
      if (!state.lines || !Array.isArray(state.lines) || state.lines.length === 0) {
        return {
          valid: false,
          error: "AI Speak Repeat: add at least 1 row with at least 1 element before saving.",
        };
      }
      // Check that at least one row has at least one cell with a label
      const hasValidRow = state.lines.some((row) => {
        if (!Array.isArray(row) || row.length === 0) {
          return false;
        }
        // Check that at least one cell has a non-empty label
        return row.some((cell) => cell.label && cell.label.trim() !== "");
      });
      if (!hasValidRow) {
        return {
          valid: false,
          error: "AI Speak Repeat: add at least 1 row with at least 1 element before saving.",
        };
      }
    } else if (slideType === SLIDE_TYPES.AI_SPEAK_STUDENT_REPEAT) {
      // Require at least 1 element with non-empty samplePrompt
      if (state.elements.length === 0) {
        return {
          valid: false,
          error: "Student Repeat: add at least 1 element before saving.",
        };
      }
      const hasValidElement = state.elements.some(
        (el) => el.samplePrompt && el.samplePrompt.trim() !== ""
      );
      if (!hasValidElement) {
        return {
          valid: false,
          error: "Student Repeat: each element needs a sample prompt.",
        };
      }
    } else if (slideType === SLIDE_TYPES.SPEECH_MATCH) {
      // Require at least 1 choice element with non-empty label and either TTS text or audio file
      if (state.choiceElements.length === 0) {
        // Check if we're preserving originals (which would be valid)
        if (
          !originalSpeechMatchElements ||
          originalSpeechMatchElements.length === 0 ||
          speechMatchElementsTouched
        ) {
          return {
            valid: false,
            error: "Speech Match: add at least 1 choice with a label and TTS text or audio.",
          };
        }
      } else {
        // Validate each choice element
        const hasValidChoice = state.choiceElements.some((el) => {
          if (!el.label || el.label.trim() === "") {
            return false;
          }
          // Must have either TTS text or audio file
          if (el.speech.mode === "tts") {
            return el.speech.text && el.speech.text.trim() !== "";
          } else if (el.speech.mode === "file") {
            return el.speech.fileUrl && el.speech.fileUrl.trim() !== "";
          }
          return false;
        });
        if (!hasValidChoice) {
          return {
            valid: false,
            error: "Speech Match: add at least 1 choice with a label and TTS text or audio.",
          };
        }
      }
    }

    return { valid: true, error: null };
  };

  return { validate };
}

