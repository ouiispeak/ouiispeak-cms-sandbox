/**
 * Core Content Section Component
 * 
 * Displays main content fields based on slide type
 */

import React from "react";
import CmsSection from "../ui/CmsSection";
import FormField from "../ui/FormField";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { uiTokens } from "../../lib/uiTokens";
import { SLIDE_TYPES } from "../../lib/types/slideProps";

interface CoreContentSectionProps {
  slideType: string;
  title: string;
  subtitle: string;
  body: string;
  lessonEndMessage: string;
  lessonEndActions: string;
  buttons: string;
  instructions: string;
  promptLabel: string;
  note: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onLessonEndMessageChange: (value: string) => void;
  onLessonEndActionsChange: (value: string) => void;
  onButtonsChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  onPromptLabelChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}

export function CoreContentSection({
  slideType,
  title,
  subtitle,
  body,
  lessonEndMessage,
  lessonEndActions,
  buttons,
  instructions,
  promptLabel,
  note,
  onTitleChange,
  onSubtitleChange,
  onBodyChange,
  onLessonEndMessageChange,
  onLessonEndActionsChange,
  onButtonsChange,
  onInstructionsChange,
  onPromptLabelChange,
  onNoteChange,
}: CoreContentSectionProps) {
  // Don't render for AI_SPEAK_REPEAT, AI_SPEAK_STUDENT_REPEAT, or SPEECH_MATCH
  // These have their own content sections
  if (
    slideType === SLIDE_TYPES.AI_SPEAK_REPEAT ||
    slideType === SLIDE_TYPES.AI_SPEAK_STUDENT_REPEAT ||
    slideType === SLIDE_TYPES.SPEECH_MATCH
  ) {
    return null;
  }

  return (
    <CmsSection
      title="Core Content"
      backgroundColor="#e6f1f1"
      borderColor="#b4d5d5"
      description="Main content shown to learners"
    >
      <FormField
        label="Title"
        infoTooltip="Primary heading for the slide. This is shown to learners as the main title of the slide."
      >
        <Input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter slide title"
        />
        <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
          [title]
        </div>
      </FormField>

      {slideType === SLIDE_TYPES.LESSON_END ? (
        <>
          <FormField
            label="Message"
            infoTooltip="Message text shown to learners below the title. This is the main content for lesson-end slides."
          >
            <Textarea
              value={lessonEndMessage}
              onChange={(e) => onLessonEndMessageChange(e.target.value)}
              placeholder="Enter lesson end message"
              rows={4}
            />
            <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
              [lesson-end]
            </div>
          </FormField>

          <FormField
            label="Actions"
            infoTooltip='Action buttons displayed at the bottom of the slide. Enter as JSON array, e.g., [{"type": "restart", "label": "Recommencer la leçon"}, {"type": "progress", "label": "Voir ma progression"}]'
          >
            <Textarea
              value={lessonEndActions}
              onChange={(e) => onLessonEndActionsChange(e.target.value)}
              placeholder='[{"type": "restart", "label": "Recommencer la leçon"}, {"type": "progress", "label": "Voir ma progression"}]'
              rows={4}
            />
            <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
              [lesson-end] Enter as JSON array
            </div>
          </FormField>
        </>
      ) : (
        <FormField
          label="Subtitle"
          infoTooltip="Secondary heading or subtopic. Shown to learners below the main title."
        >
          <Input
            type="text"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Enter slide subtitle"
          />
          <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
            [title]
          </div>
        </FormField>
      )}

      {slideType !== SLIDE_TYPES.TITLE && slideType !== SLIDE_TYPES.LESSON_END && (
        <FormField
          label="Body"
          infoTooltip="Main slide copy shown to learners. This is the primary content text displayed on the slide. For finale slides, uses the same font style as text slides and appears below the subtitle (or title if no subtitle)."
        >
          <Textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder="Enter slide body text"
            rows={6}
          />
          <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
            [text]
          </div>
        </FormField>
      )}

      {slideType !== SLIDE_TYPES.LESSON_END && (
        <FormField
          label="Buttons"
          infoTooltip="Interactive buttons displayed on the slide. Used for navigation, actions, or choices. Enter as JSON."
        >
          <Textarea
            value={buttons}
            onChange={(e) => onButtonsChange(e.target.value)}
            placeholder='Enter button configuration as JSON, e.g., [{"label": "Next", "action": "next"}]'
            rows={4}
          />
          <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
            [title, text, ai-speak]
          </div>
        </FormField>
      )}
    </CmsSection>
  );
}

