/**
 * Interaction/Flow Section Component
 * 
 * Displays attempt limits and skip behavior controls
 */

import React from "react";
import CmsSection from "../ui/CmsSection";
import FormField from "../ui/FormField";
import Input from "../ui/Input";
import { uiTokens } from "../../lib/uiTokens";
import { SLIDE_TYPES } from "../../lib/types/slideProps";

interface InteractionFlowSectionProps {
  slideType: string;
  maxAttempts: string;
  minAttemptsBeforeSkip: string;
  onCompleteAtIndex: string;
  onMaxAttemptsChange: (value: string) => void;
  onMinAttemptsBeforeSkipChange: (value: string) => void;
  onOnCompleteAtIndexChange: (value: string) => void;
}

export function InteractionFlowSection({
  slideType,
  maxAttempts,
  minAttemptsBeforeSkip,
  onCompleteAtIndex,
  onMaxAttemptsChange,
  onMinAttemptsBeforeSkipChange,
  onOnCompleteAtIndexChange,
}: InteractionFlowSectionProps) {
  // Don't render for title, text, or lesson-end slides
  if (
    slideType === SLIDE_TYPES.TITLE ||
    slideType === SLIDE_TYPES.TEXT ||
    slideType === SLIDE_TYPES.LESSON_END
  ) {
    return null;
  }

  return (
    <CmsSection
      title="Interaction/Flow"
      backgroundColor="#e6f1f1"
      borderColor="#b4d5d5"
      description="Attempt limits and skip behavior"
    >
      {slideType === SLIDE_TYPES.AI_SPEAK_STUDENT_REPEAT && (
        <FormField
          label="On Complete At Index"
          infoTooltip="Trigger completion callback at this element index (0-based). Leave empty if not needed."
        >
          <Input
            type="number"
            value={onCompleteAtIndex}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                onOnCompleteAtIndexChange(value);
              }
            }}
            placeholder="Leave empty if not needed"
            min="0"
            step="1"
          />
          <div className="metaText" style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: "#999" }}>
            [ai-speak-student-repeat]
          </div>
        </FormField>
      )}

      <FormField
        label="Max attempts"
        infoTooltip="Maximum number of attempts allowed for this slide. Leave empty for unlimited."
      >
        <Input
          type="number"
          value={maxAttempts}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
              onMaxAttemptsChange(value);
            }
          }}
          placeholder="Leave empty for unlimited"
          min="0"
          step="1"
        />
      </FormField>

      <FormField
        label="Min attempts before skip"
        infoTooltip="Minimum number of attempts required before skip is allowed. Leave empty if skip is always allowed (when allow skip is enabled)."
      >
        <Input
          type="number"
          value={minAttemptsBeforeSkip}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
              onMinAttemptsBeforeSkipChange(value);
            }
          }}
          placeholder="Leave empty if no minimum"
          min="0"
          step="1"
        />
        {minAttemptsBeforeSkip !== "" &&
          maxAttempts !== "" &&
          Number(minAttemptsBeforeSkip) > Number(maxAttempts) && (
            <div style={{ marginTop: uiTokens.space.sm, fontSize: uiTokens.font.meta.size, color: uiTokens.color.danger }}>
              Min attempts before skip cannot exceed max attempts.
            </div>
          )}
      </FormField>
    </CmsSection>
  );
}

