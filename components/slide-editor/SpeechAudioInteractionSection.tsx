/**
 * Speech & Audio Interaction Section Component
 * 
 * Displays speech/audio interaction fields based on slide type
 */

import React from "react";
import CmsSection from "../ui/CmsSection";
import FormField from "../ui/FormField";
import Textarea from "../ui/Textarea";
import StudentRepeatElementMapper from "../ui/StudentRepeatElementMapper";
import ChoiceElementMapper from "../ui/ChoiceElementMapper";
import AiSpeakRepeatLinesMapper from "../ui/AiSpeakRepeatLinesMapper";
import { uiTokens } from "../../lib/uiTokens";
import { SLIDE_TYPES, type ChoiceElement } from "../../lib/types/slideProps";
import type { StudentRepeatFormElement } from "../../components/ui/StudentRepeatElementMapper";
import type { AiSpeakRepeatFormLines } from "../../components/ui/AiSpeakRepeatLinesMapper";

interface SpeechAudioInteractionSectionProps {
  slideType: string;
  phrases: string;
  elements: StudentRepeatFormElement[];
  choiceElements: ChoiceElement[];
  lines: AiSpeakRepeatFormLines;
  defaultLang: string;
  onPhrasesChange: (value: string) => void;
  onElementsChange: (elements: StudentRepeatFormElement[]) => void;
  onChoiceElementsChange: (elements: ChoiceElement[]) => void;
  onLinesChange: (lines: AiSpeakRepeatFormLines) => void;
}

export function SpeechAudioInteractionSection({
  slideType,
  phrases,
  elements,
  choiceElements,
  lines,
  defaultLang,
  onPhrasesChange,
  onElementsChange,
  onChoiceElementsChange,
  onLinesChange,
}: SpeechAudioInteractionSectionProps) {
  // Don't render for title, text, or lesson-end slides
  if (
    slideType === SLIDE_TYPES.TITLE ||
    slideType === SLIDE_TYPES.TEXT ||
    slideType === SLIDE_TYPES.LESSON_END
  ) {
    return null;
  }

  // AI_SPEAK_STUDENT_REPEAT - Practice Elements
  if (slideType === SLIDE_TYPES.AI_SPEAK_STUDENT_REPEAT) {
    return (
      <CmsSection
        title="Practice Elements"
        backgroundColor="#e6f1f1"
        borderColor="#b4d5d5"
        description="Practice elements for student pronunciation drills"
      >
        <FormField
          label="Elements"
          infoTooltip="Practice elements that students will hear and repeat. Each element has a sample prompt (display text), optional reference text (for pronunciation matching), and optional audio file."
        >
          <StudentRepeatElementMapper
            elements={elements}
            onElementsChange={onElementsChange}
            bucketName="lesson-audio"
            defaultLang={defaultLang || "en"}
          />
          <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
            [ai-speak-student-repeat] Each element represents a practice item. Students hear the sample prompt and repeat it.
          </div>
        </FormField>
      </CmsSection>
    );
  }

  // SPEECH_MATCH - Choice Elements
  if (slideType === SLIDE_TYPES.SPEECH_MATCH) {
    return (
      <CmsSection
        title="Choice Elements"
        backgroundColor="#e6f1f1"
        borderColor="#b4d5d5"
        description="Choice options for student selection"
      >
        <FormField
          label="Elements"
          infoTooltip="Choice elements that students can select. Each element has a label (display text) and speech (audio to play). Students hear the audio and click on the matching label."
        >
          <ChoiceElementMapper
            elements={choiceElements}
            onElementsChange={onChoiceElementsChange}
            bucketName="lesson-audio"
            defaultLang={defaultLang || "en"}
          />
          <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
            [speech-match] Each element represents a choice option. Students hear the audio and click on the matching label.
          </div>
        </FormField>
      </CmsSection>
    );
  }

  // AI_SPEAK_REPEAT - Lines Editor
  if (slideType === SLIDE_TYPES.AI_SPEAK_REPEAT) {
    return (
      <CmsSection
        title="Elements & Audio Configuration"
        backgroundColor="#e6f1f1"
        borderColor="#b4d5d5"
        description="Configure elements organized in rows. Each element has a label and audio configuration (TTS or uploaded file)."
      >
        <FormField
          label="Lines"
          infoTooltip="Elements organized in rows. Each element has a label (display text) and audio configuration. Students can click any element to hear it, or use the play button to hear all elements in sequence."
        >
          <AiSpeakRepeatLinesMapper
            lines={lines || []}
            onLinesChange={onLinesChange}
            bucketName="lesson-audio"
            defaultLang={defaultLang || "en"}
          />
          <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
            [ai-speak-repeat] Configure elements in rows. Each element can use TTS or an uploaded audio file.
          </div>
        </FormField>
      </CmsSection>
    );
  }

  // Fallback for other slide types - Phrases (legacy)
  return (
    <CmsSection
      title="Speech & Audio Interaction"
      backgroundColor="#e6f1f1"
      borderColor="#b4d5d5"
      description="Speech and audio interaction content"
    >
      <FormField
        label="Phrases"
        infoTooltip="Phrases for speech recognition and audio interaction. Enter one phrase per line."
      >
        <Textarea
          value={phrases}
          onChange={(e) => onPhrasesChange(e.target.value)}
          placeholder="Enter phrases, one per line"
          rows={6}
        />
        <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
          [ai-speak]
        </div>
      </FormField>
    </CmsSection>
  );
}

