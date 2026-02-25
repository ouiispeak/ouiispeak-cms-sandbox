/**
 * Slide Field Registry
 * 
 * Central registry of all available form fields for slide editing.
 * This is the single source of truth for field definitions, metadata, and validation.
 * 
 * Extracted from: app/edit-slide/[slideId]/page.tsx
 * Last updated: [Current Date]
 */

export interface FieldDefinition {
  /** Unique identifier for the field (e.g., "label", "title", "phrases") */
  id: string;
  
  /** Display name shown in the form label */
  displayName: string;
  
  /** Field type determines which component to render */
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "audio" | "complex";
  
  /** Custom component name if field uses a special component (e.g., "StudentRepeatElementMapper") */
  componentName?: string;
  
  /** Default value for the field */
  defaultValue?: unknown;
  
  /** Validation rules */
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    custom?: string; // Reference to custom validation function
    customMessage?: string; // Custom error message for custom validation
  };
  
  /** Help text/tooltip shown to users */
  infoTooltip?: string;
  
  /** Default section this field belongs to */
  defaultSection?: string;
  
  /** Options for select fields */
  selectOptions?: Array<{ value: string; label: string }>;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Number of rows for textarea fields */
  rows?: number;
  
  /** Whether field is read-only */
  readOnly?: boolean;
  
  /** Additional props for complex components */
  componentProps?: Record<string, any>;
}

/**
 * Field Registry - All available form fields
 * 
 * Organized by logical groups for easier maintenance.
 * Fields are identified by their unique `id` which corresponds to the state variable name
 * or the key in props_json.
 */
export const FIELD_REGISTRY: FieldDefinition[] = [
  // ============================================================================
  // Identity & Structure Section
  // ============================================================================
  
  {
    id: "slideId",
    displayName: "Slide ID",
    type: "text",
    readOnly: true,
    infoTooltip: "System UUID for the slide (read-only). Used internally by the CMS to identify this slide.",
    defaultSection: "identity"
  },
  
  {
    id: "slideType",
    displayName: "Slide Type",
    type: "text",
    readOnly: true,
    infoTooltip: "Type key used to select the editor (read-only). Determines which editor component is used to edit this slide.",
    defaultSection: "identity"
  },
  
  {
    id: "groupId",
    displayName: "Group ID",
    type: "text",
    readOnly: true,
    infoTooltip: "Owning group UUID (read-only). This slide belongs to this group in the lesson hierarchy.",
    defaultSection: "identity"
  },
  
  {
    id: "groupName",
    displayName: "Group Name",
    type: "text",
    readOnly: true,
    infoTooltip: "Name of the group this slide belongs to (read-only). Displayed for reference.",
    defaultSection: "identity"
  },
  
  {
    id: "orderIndex",
    displayName: "Order Index",
    type: "number",
    readOnly: true,
    infoTooltip: "Sequence position in the group (read-only). Determines the order this slide appears within its group.",
    defaultSection: "identity"
  },
  
  {
    id: "label",
    displayName: "Label",
    type: "text",
    validation: { required: true },
    infoTooltip: "Internal name for this slide used in the CMS and navigation. Not shown to learners. Required for CMS organization.",
    placeholder: "Enter slide label",
    defaultSection: "identity"
  },
  
  // ============================================================================
  // Core Content Section
  // ============================================================================
  
  {
    id: "title",
    displayName: "Title",
    type: "text",
    infoTooltip: "Primary heading for the slide. This is shown to learners as the main title of the slide.",
    placeholder: "Enter slide title",
    defaultSection: "content"
  },
  
  {
    id: "subtitle",
    displayName: "Subtitle",
    type: "text",
    infoTooltip: "Secondary heading or subtopic. Shown to learners below the main title.",
    placeholder: "Enter slide subtitle",
    defaultSection: "content"
  },
  
  {
    id: "body",
    displayName: "Body",
    type: "textarea",
    infoTooltip: "Main slide copy shown to learners. This is the primary content text displayed on the slide. For finale slides, uses the same font style as text slides and appears below the subtitle (or title if no subtitle).",
    placeholder: "Enter slide body text",
    rows: 6,
    defaultSection: "content"
  },

  {
    id: "text_subtype",
    displayName: "Text Subtype",
    type: "select",
    infoTooltip: "Pedagogical role of this text slide. MOTIVATION: hooks interest; INSTRUCTION: what to do; EXPLANATION: why/how; EXAMPLE: model; FEEDBACK_SUMMARY: wrap-up.",
    selectOptions: [
      { value: "", label: "Select subtype..." },
      { value: "MOTIVATION", label: "Motivation" },
      { value: "INSTRUCTION", label: "Instruction" },
      { value: "EXPLANATION", label: "Explanation" },
      { value: "EXAMPLE", label: "Example" },
      { value: "FEEDBACK_SUMMARY", label: "Feedback Summary" }
    ],
    defaultSection: "content"
  },
  
  {
    id: "lessonEndMessage",
    displayName: "Message",
    type: "textarea",
    infoTooltip: "Message text shown to learners below the title. This is the main content for lesson-end slides.",
    placeholder: "Enter lesson end message",
    rows: 4,
    defaultSection: "content"
  },
  
  {
    id: "lessonEndActions",
    displayName: "Actions",
    type: "textarea",
    infoTooltip: "Action buttons displayed at the bottom of the slide. Enter as JSON array, e.g., [{\"type\": \"restart\", \"label\": \"Recommencer la leçon\"}, {\"type\": \"progress\", \"label\": \"Voir ma progression\"}]",
    placeholder: '[{"type": "restart", "label": "Recommencer la leçon"}, {"type": "progress", "label": "Voir ma progression"}]',
    rows: 4,
    validation: { custom: "valid-json" },
    defaultSection: "content"
  },
  
  {
    id: "buttons",
    displayName: "Buttons",
    type: "textarea",
    infoTooltip: "Interactive buttons displayed on the slide. Used for navigation, actions, or choices. Enter as JSON.",
    placeholder: 'Enter button configuration as JSON, e.g., [{"label": "Next", "action": "next"}]',
    rows: 4,
    validation: { custom: "valid-json" },
    defaultSection: "content"
  },
  
  // ============================================================================
  // Language & Localization Section
  // ============================================================================
  
  {
    id: "defaultLang",
    displayName: "Default Language",
    type: "select",
    infoTooltip: "Default language for text-to-speech and content display. Choose English, French, or Both.",
    selectOptions: [
      { value: "", label: "Select language..." },
      { value: "english", label: "English" },
      { value: "french", label: "French" },
      { value: "both", label: "Both" }
    ],
    defaultSection: "language"
  },
  
  // ============================================================================
  // Media Reference Section
  // ============================================================================
  
  {
    id: "audioId",
    displayName: "Audio ID",
    type: "audio",
    componentName: "AudioFileSelector",
    infoTooltip: "Reference ID or path for audio media used in this slide. Select from uploaded files using Browse or enter a path manually.",
    componentProps: {
      bucketName: "lesson-audio"
    },
    defaultSection: "media"
  },
  
  // ============================================================================
  // Speech & Audio Interaction Section
  // ============================================================================
  
  {
    id: "phrases",
    displayName: "Phrases",
    type: "textarea",
    infoTooltip: "Phrases for speech recognition and audio interaction. Enter one phrase per line. (Legacy field - use 'lines' for ai-speak-repeat slides)",
    placeholder: "Enter phrases, one per line",
    rows: 6,
    defaultSection: "speech"
  },
  
  {
    id: "lines",
    displayName: "Lines",
    type: "complex",
    componentName: "AiSpeakRepeatLinesMapper",
    infoTooltip: "Elements organized in rows. Each element has a label (display text) and audio configuration (TTS or uploaded file). Students can click any element to hear it, or use the play button to hear all elements in sequence.",
    componentProps: {
      bucketName: "lesson-audio"
    },
    validation: {
      custom: "at-least-one-row",
      customMessage: "AI Speak Repeat: add at least 1 row with at least 1 element before saving."
    },
    defaultSection: "speech"
  },
  
  {
    id: "instructions",
    displayName: "Instructions",
    type: "textarea",
    infoTooltip: "Optional instructions shown to learners before they practice.",
    placeholder: "Enter instructions for learners",
    rows: 3,
    defaultSection: "content"
  },
  
  {
    id: "promptLabel",
    displayName: "Prompt Label",
    type: "text",
    infoTooltip: "Label displayed above the practice prompt. Defaults to 'Phrase à prononcer' if not set.",
    placeholder: "Phrase à prononcer",
    defaultSection: "content"
  },
  
  {
    id: "note",
    displayName: "Note",
    type: "text",
    infoTooltip: "Optional note displayed below subtitle.",
    placeholder: "Optional note",
    defaultSection: "content"
  },
  
  {
    id: "elements",
    displayName: "Elements",
    type: "complex",
    componentName: "StudentRepeatElementMapper",
    infoTooltip: "Practice elements that students will hear and repeat. Each element has a sample prompt (display text), optional reference text (for pronunciation matching), and optional audio file.",
    componentProps: {
      bucketName: "lesson-audio"
    },
    validation: {
      custom: "at-least-one-element",
      customMessage: "Student Repeat: add at least 1 element before saving."
    },
    defaultSection: "speech"
  },
  
  {
    id: "choiceElements",
    displayName: "Elements",
    type: "complex",
    componentName: "ChoiceElementMapper",
    infoTooltip: "Choice elements that students can select. Each element has a label (display text) and speech (audio to play). Students hear the audio and click on the matching label.",
    componentProps: {
      bucketName: "lesson-audio"
    },
    validation: {
      custom: "at-least-one-choice"
    },
    defaultSection: "speech"
  },
  
  // ============================================================================
  // Interaction Flags Section
  // ============================================================================
  
  {
    id: "isInteractive",
    displayName: "Is interactive",
    type: "checkbox",
    defaultValue: false,
    infoTooltip: "The slide can accept user interaction/input",
    defaultSection: "interaction"
  },
  
  {
    id: "allowSkip",
    displayName: "Allow skip",
    type: "checkbox",
    defaultValue: false,
    infoTooltip: "Whether users can skip this slide",
    defaultSection: "interaction"
  },
  
  {
    id: "allowRetry",
    displayName: "Allow retry",
    type: "checkbox",
    defaultValue: false,
    infoTooltip: "Whether users can retry this slide",
    defaultSection: "interaction"
  },
  
  {
    id: "isActivity",
    displayName: "Is activity",
    type: "checkbox",
    defaultValue: false,
    infoTooltip: "The slide counts as an activity for scoring/tracking purposes",
    defaultSection: "interaction"
  },
  
  // ============================================================================
  // Interaction/Flow Section
  // ============================================================================
  
  {
    id: "onCompleteAtIndex",
    displayName: "On Complete At Index",
    type: "number",
    infoTooltip: "Trigger completion callback at this element index (0-based). Leave empty if not needed.",
    placeholder: "Leave empty if not needed",
    validation: {
      min: 0
    },
    defaultSection: "flow"
  },
  
  {
    id: "maxAttempts",
    displayName: "Max attempts",
    type: "number",
    infoTooltip: "Maximum number of attempts allowed for this slide. Leave empty for unlimited.",
    placeholder: "Leave empty for unlimited",
    validation: {
      min: 0
    },
    defaultSection: "flow"
  },
  
  {
    id: "minAttemptsBeforeSkip",
    displayName: "Min attempts before skip",
    type: "number",
    infoTooltip: "Minimum number of attempts required before skip is allowed. Leave empty if skip is always allowed (when allow skip is enabled).",
    placeholder: "Leave empty if no minimum",
    validation: {
      min: 0,
      custom: "max-attempts-check" // Must not exceed maxAttempts
    },
    defaultSection: "flow"
  },
  
  // ============================================================================
  // Authoring Metadata Section
  // ============================================================================
  
  {
    id: "activityName",
    displayName: "Activity Name",
    type: "text",
    infoTooltip: "Name of the activity for CMS organization and tracking.",
    placeholder: "Enter activity name",
    defaultSection: "metadata"
  },

  // ============================================================================
  // RAG-Ready Pedagogical Slots (MVP: optional; future: Reference RAG fills)
  // ============================================================================
  {
    id: "l1_l2_friction_warning",
    displayName: "L1/L2 Friction Warning",
    type: "textarea",
    infoTooltip: "Optional. Known L1→L2 transfer issues for this content. Future: Reference RAG fills from PDF library.",
    placeholder: "e.g., French speakers often confuse X with Y",
    rows: 2,
    defaultSection: "content"
  },
  {
    id: "cultural_context",
    displayName: "Cultural Context",
    type: "textarea",
    infoTooltip: "Optional. Cultural nuances or context for this content. Future: Reference RAG fills.",
    placeholder: "e.g., usage in specific regions or contexts",
    rows: 2,
    defaultSection: "content"
  },
  {
    id: "simplification_hint",
    displayName: "Simplification Hint",
    type: "textarea",
    infoTooltip: "Optional. Hint for simplifying this content (Task Affordance: expansion/simplification layer). Future: Reference RAG fills.",
    placeholder: "e.g., simpler phrasing for anxious learners",
    rows: 2,
    defaultSection: "content"
  },

  // ============================================================================
  // Need To Be Created (LLM-proposed activity placeholder)
  // ============================================================================
  {
    id: "proposedType",
    displayName: "Proposed Type",
    type: "text",
    readOnly: true,
    infoTooltip: "Slide type the LLM proposed (e.g. SENTENCE_TEMPLATE_CHOICE). Implement this type in the CMS and Player, then add to S1 canonical types.",
    placeholder: "e.g. SENTENCE_TEMPLATE_CHOICE",
    defaultSection: "content"
  },
  {
    id: "proposedContent",
    displayName: "Proposed Content",
    type: "textarea",
    readOnly: true,
    infoTooltip: "Human-readable content/instructions from the proposed activity. Use this when implementing the new slide type.",
    placeholder: "Proposed activity content...",
    rows: 6,
    defaultSection: "content"
  },
  {
    id: "rawActivity",
    displayName: "Raw Activity (JSON)",
    type: "textarea",
    readOnly: true,
    infoTooltip: "Full raw activity/slide object from LaDy. Reference when implementing the new slide type in CMS and Player.",
    placeholder: "Raw activity JSON...",
    rows: 8,
    defaultSection: "content"
  },
  {
    id: "stimulus",
    displayName: "Stimulus",
    type: "textarea",
    readOnly: true,
    infoTooltip: "What the learner sees/hears. Future-friendly for Flag/Recreate.",
    placeholder: "Stimulus content...",
    rows: 3,
    defaultSection: "content"
  },
  {
    id: "action",
    displayName: "Action",
    type: "textarea",
    readOnly: true,
    infoTooltip: "What the learner does. Future-friendly for Flag/Recreate.",
    placeholder: "Action description...",
    rows: 3,
    defaultSection: "content"
  },
  {
    id: "feedback",
    displayName: "Feedback",
    type: "textarea",
    readOnly: true,
    infoTooltip: "Response to the action. Future-friendly for Flag/Recreate.",
    placeholder: "Feedback content...",
    rows: 3,
    defaultSection: "content"
  }
];

/**
 * Get field definition by ID
 */
export function getFieldDefinition(fieldId: string): FieldDefinition | undefined {
  return FIELD_REGISTRY.find(field => field.id === fieldId);
}

/**
 * Get all fields for a given section
 */
export function getFieldsBySection(sectionId: string): FieldDefinition[] {
  return FIELD_REGISTRY.filter(field => field.defaultSection === sectionId);
}

/**
 * Get all field IDs
 */
export function getAllFieldIds(): string[] {
  return FIELD_REGISTRY.map(field => field.id);
}

/**
 * Validate field value against field definition
 */
export function validateFieldValue(fieldId: string, value: unknown): { valid: boolean; message?: string } {
  const field = getFieldDefinition(fieldId);
  if (!field) {
    return { valid: false, message: `Unknown field: ${fieldId}` };
  }
  
  if (!field.validation) {
    return { valid: true };
  }
  
  // Required validation
  if (field.validation.required) {
    if (value === null || value === undefined || value === "") {
      return { valid: false, message: `${field.displayName} is required` };
    }
  }
  
  // String length validation
  if (typeof value === "string" && field.validation.minLength !== undefined) {
    if (value.length < field.validation.minLength) {
      return { valid: false, message: `${field.displayName} must be at least ${field.validation.minLength} characters` };
    }
  }
  
  if (typeof value === "string" && field.validation.maxLength !== undefined) {
    if (value.length > field.validation.maxLength) {
      return { valid: false, message: `${field.displayName} must be no more than ${field.validation.maxLength} characters` };
    }
  }
  
  // Number validation
  if (typeof value === "number" && field.validation.min !== undefined) {
    if (value < field.validation.min) {
      return { valid: false, message: `${field.displayName} must be at least ${field.validation.min}` };
    }
  }
  
  if (typeof value === "number" && field.validation.max !== undefined) {
    if (value > field.validation.max) {
      return { valid: false, message: `${field.displayName} must be no more than ${field.validation.max}` };
    }
  }
  
  // Custom validation (handled elsewhere)
  if (field.validation.custom) {
    // Custom validations are handled in the validation layer
    return { valid: true };
  }
  
  return { valid: true };
}

