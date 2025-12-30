/**
 * Interaction Flags Section Component
 * 
 * Displays interaction flags for the slide
 */

import React from "react";
import CmsSection from "../ui/CmsSection";
import FormField from "../ui/FormField";
import Input from "../ui/Input";
import { uiTokens } from "../../lib/uiTokens";
import { SLIDE_TYPES } from "../../lib/types/slideProps";

interface InteractionFlagsSectionProps {
  slideType: string;
  isInteractive: boolean;
  allowSkip: boolean;
  allowRetry: boolean;
  isActivity: boolean;
  maxAttempts: string;
  minAttemptsBeforeSkip: string;
  onIsInteractiveChange: (value: boolean) => void;
  onAllowSkipChange: (value: boolean) => void;
  onAllowRetryChange: (value: boolean) => void;
  onIsActivityChange: (value: boolean) => void;
  onMaxAttemptsChange: (value: string) => void;
  onMinAttemptsBeforeSkipChange: (value: string) => void;
}

export function InteractionFlagsSection({
  slideType,
  isInteractive,
  allowSkip,
  allowRetry,
  isActivity,
  maxAttempts,
  minAttemptsBeforeSkip,
  onIsInteractiveChange,
  onAllowSkipChange,
  onAllowRetryChange,
  onIsActivityChange,
  onMaxAttemptsChange,
  onMinAttemptsBeforeSkipChange,
}: InteractionFlagsSectionProps) {
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
      title="Interaction Flags"
      backgroundColor="#e6f1f1"
      borderColor="#b4d5d5"
      description="Flags controlling slide interaction behavior"
    >
      <FormField label="Is interactive" infoTooltip="The slide can accept user interaction/input">
        <label style={{ display: "flex", alignItems: "center", gap: uiTokens.space.sm, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isInteractive}
            onChange={(e) => onIsInteractiveChange(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: uiTokens.font.label.size }}>Enable interactive mode</span>
        </label>
      </FormField>

      <FormField label="Allow skip" infoTooltip="Whether users can skip this slide">
        <label style={{ display: "flex", alignItems: "center", gap: uiTokens.space.sm, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={allowSkip}
            onChange={(e) => onAllowSkipChange(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: uiTokens.font.label.size }}>Allow users to skip this slide</span>
        </label>
      </FormField>

      <FormField label="Allow retry" infoTooltip="Whether users can retry this slide">
        <label style={{ display: "flex", alignItems: "center", gap: uiTokens.space.sm, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={allowRetry}
            onChange={(e) => onAllowRetryChange(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: uiTokens.font.label.size }}>Allow users to retry this slide</span>
        </label>
      </FormField>

      {slideType === SLIDE_TYPES.AI_SPEAK_STUDENT_REPEAT && (
        <FormField label="Is activity" infoTooltip="The slide counts as an activity for scoring/tracking purposes">
          <label style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isActivity}
              onChange={(e) => onIsActivityChange(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: uiTokens.font.label.size }}>Count as activity</span>
          </label>
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

