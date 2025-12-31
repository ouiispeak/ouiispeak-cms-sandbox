/**
 * Dynamic Field Renderer Component
 * 
 * Renders form fields based on field configuration and definition.
 * Handles all field types including complex components.
 */

"use client";

import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Select from "../ui/Select";
import FormField from "../ui/FormField";
import { getFieldDefinition } from "../../lib/schemas/slideFieldRegistry";
import type { FormFieldConfig } from "../../lib/schemas/slideTypeConfig";
import type { FieldDefinition } from "../../lib/schemas/slideFieldRegistry";
import { uiTokens } from "../../lib/uiTokens";
import { logger } from "../../lib/utils/logger";
import dynamic from "next/dynamic";

// Dynamically import complex components to avoid SSR issues
const StudentRepeatElementMapper = dynamic(
  () => import("../ui/StudentRepeatElementMapper"),
  { ssr: false }
);

const ChoiceElementMapper = dynamic(
  () => import("../ui/ChoiceElementMapper"),
  { ssr: false }
);

const SpeechChoiceVerifyElementMapper = dynamic(
  () => import("../ui/SpeechChoiceVerifyElementMapper"),
  { ssr: false }
);

const AiSpeakRepeatLinesMapper = dynamic(
  () => import("../ui/AiSpeakRepeatLinesMapper"),
  { ssr: false }
);

const AudioFileSelector = dynamic(
  () => import("../ui/AudioFileSelector"),
  { ssr: false }
);

interface FieldRendererProps {
  fieldConfig: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
  defaultLang?: string;
  bucketName?: string;
  slideType?: string; // Used to determine which mapper component to use
}

/**
 * Renders a single form field based on configuration
 */
export function FieldRenderer({
  fieldConfig,
  value,
  onChange,
  defaultLang,
  bucketName = "lesson-audio",
  slideType
}: FieldRendererProps) {
  // Don't render if field is not visible
  if (!fieldConfig.visible) {
    return null;
  }

  // Get field definition from registry
  const fieldDefinition = getFieldDefinition(fieldConfig.fieldId);
  
  if (!fieldDefinition) {
    logger.warn(`Field definition not found for fieldId: ${fieldConfig.fieldId}`);
    return (
      <FormField label={fieldConfig.fieldId} required={fieldConfig.required}>
        <div style={{ color: uiTokens.color.danger }}>
          Field definition not found: {fieldConfig.fieldId}
        </div>
      </FormField>
    );
  }

  // Handle complex components
  if (fieldDefinition.componentName) {
    return renderComplexComponent(
      fieldConfig,
      fieldDefinition,
      value,
      onChange,
      defaultLang,
      bucketName,
      slideType
    );
  }

  // Handle standard field types
  return renderStandardField(fieldConfig, fieldDefinition, value, onChange);
}

/**
 * Renders complex components (StudentRepeatElementMapper, ChoiceElementMapper, etc.)
 */
function renderComplexComponent(
  fieldConfig: FormFieldConfig,
  fieldDefinition: FieldDefinition,
  value: any,
  onChange: (value: any) => void,
  defaultLang?: string,
  bucketName?: string,
  slideType?: string
) {
  const componentProps = {
    ...fieldDefinition.componentProps,
    bucketName: bucketName || fieldDefinition.componentProps?.bucketName || "lesson-audio",
    defaultLang: defaultLang || fieldDefinition.componentProps?.defaultLang || "en"
  };

  let component: React.ReactNode = null;

  switch (fieldDefinition.componentName) {
    case "StudentRepeatElementMapper":
      component = (
        <StudentRepeatElementMapper
          elements={value || []}
          onElementsChange={onChange}
          {...componentProps}
        />
      );
      break;

    case "ChoiceElementMapper":
      // Use SpeechChoiceVerifyElementMapper for speech-choice-verify slides
      if (slideType === "speech-choice-verify") {
        component = (
          <SpeechChoiceVerifyElementMapper
            elements={value || []}
            onElementsChange={onChange}
            {...componentProps}
          />
        );
      } else {
        component = (
          <ChoiceElementMapper
            elements={value || []}
            onElementsChange={onChange}
            {...componentProps}
          />
        );
      }
      break;

    case "SpeechChoiceVerifyElementMapper":
      component = (
        <SpeechChoiceVerifyElementMapper
          elements={value || []}
          onElementsChange={onChange}
          {...componentProps}
        />
      );
      break;

    case "AiSpeakRepeatLinesMapper":
      component = (
        <AiSpeakRepeatLinesMapper
          lines={value || []}
          onLinesChange={onChange}
          {...componentProps}
        />
      );
      break;

    case "AudioFileSelector":
      component = (
        <AudioFileSelector
          bucketName={componentProps.bucketName}
          value={value || ""}
          onChange={onChange}
        />
      );
      break;

    default:
      return (
        <FormField label={fieldDefinition.displayName} required={fieldConfig.required} infoTooltip={fieldDefinition.infoTooltip}>
          <div style={{ color: uiTokens.color.danger }}>
            Unknown component: {fieldDefinition.componentName}
          </div>
        </FormField>
      );
  }

  return (
    <FormField
      label={fieldDefinition.displayName}
      required={fieldConfig.required}
      infoTooltip={fieldDefinition.infoTooltip}
    >
      {component}
    </FormField>
  );
}

/**
 * Renders standard field types (text, textarea, select, checkbox, number)
 */
function renderStandardField(
  fieldConfig: FormFieldConfig,
  fieldDefinition: FieldDefinition,
  value: any,
  onChange: (value: any) => void
) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (fieldDefinition.type === "checkbox") {
      onChange((e.target as HTMLInputElement).checked);
    } else if (fieldDefinition.type === "number") {
      // Keep as string for number fields (state expects strings for maxAttempts, etc.)
      onChange(e.target.value);
    } else {
      onChange(e.target.value);
    }
  };

  let inputComponent: React.ReactNode = null;

  switch (fieldDefinition.type) {
    case "text":
      inputComponent = (
        <Input
          type="text"
          value={value || ""}
          onChange={handleChange}
          placeholder={fieldDefinition.placeholder}
          readOnly={fieldDefinition.readOnly}
        />
      );
      break;

    case "textarea":
      inputComponent = (
        <Textarea
          value={value || ""}
          onChange={handleChange}
          placeholder={fieldDefinition.placeholder}
          rows={fieldDefinition.rows || 4}
          readOnly={fieldDefinition.readOnly}
        />
      );
      break;

    case "select":
      inputComponent = (
        <Select
          value={value || ""}
          onChange={handleChange}
        >
          {fieldDefinition.selectOptions?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      );
      break;

    case "checkbox":
      inputComponent = (
        <label style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={value || false}
            onChange={handleChange}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: uiTokens.font.label.size }}>
            {fieldDefinition.placeholder || `Enable ${fieldDefinition.displayName.toLowerCase()}`}
          </span>
        </label>
      );
      break;

    case "number":
      inputComponent = (
        <Input
          type="number"
          value={value || ""}
          onChange={handleChange}
          placeholder={fieldDefinition.placeholder}
          min={fieldDefinition.validation?.min}
          max={fieldDefinition.validation?.max}
          step="1"
        />
      );
      break;

    default:
      return (
        <FormField label={fieldDefinition.displayName} required={fieldConfig.required} infoTooltip={fieldDefinition.infoTooltip}>
          <div style={{ color: uiTokens.color.danger }}>
            Unsupported field type: {fieldDefinition.type}
          </div>
        </FormField>
      );
  }

  return (
    <FormField
      label={fieldDefinition.displayName}
      required={fieldConfig.required}
      infoTooltip={fieldDefinition.infoTooltip}
    >
      {inputComponent}
    </FormField>
  );
}

