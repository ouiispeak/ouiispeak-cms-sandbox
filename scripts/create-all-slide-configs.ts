/**
 * Create All Slide Type Configurations
 * 
 * Creates configurations for all slide types in the system.
 * 
 * Usage:
 *   npx tsx scripts/create-all-slide-configs.ts
 */

// Load environment variables BEFORE any other imports
import dotenv from "dotenv";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("❌ Error: Missing Supabase environment variables");
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";
import type { SlideTypeConfig } from "../lib/schemas/slideTypeConfig";
import { DEFAULT_SECTIONS } from "../lib/schemas/slideTypeConfig";
import { validateSlideTypeConfig, configToRecord } from "../lib/schemas/slideTypeConfig";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Create title-slide configuration
 * 
 * Title-slide shows:
 * - Identity section: slideId, slideType, groupId, groupName, orderIndex, label
 * - Content section: title, subtitle, buttons
 * - No body, no other sections
 */
function createTitleSlideConfig(): SlideTypeConfig {
  return {
    typeKey: "title-slide",
    displayName: "Title Slide",
    isActive: true,
    version: 1,
    formConfig: {
      sections: [
        DEFAULT_SECTIONS.find(s => s.id === "identity")!,
        DEFAULT_SECTIONS.find(s => s.id === "content")!
      ],
      fields: [
        // Identity & Structure Section
        { fieldId: "slideId", sectionId: "identity", order: 1, required: false, visible: true },
        { fieldId: "slideType", sectionId: "identity", order: 2, required: false, visible: true },
        { fieldId: "groupId", sectionId: "identity", order: 3, required: false, visible: true },
        { fieldId: "groupName", sectionId: "identity", order: 4, required: false, visible: true },
        { fieldId: "orderIndex", sectionId: "identity", order: 5, required: false, visible: true },
        { fieldId: "label", sectionId: "identity", order: 6, required: true, visible: true },
        // Core Content Section
        { fieldId: "title", sectionId: "content", order: 1, required: false, visible: true },
        { fieldId: "subtitle", sectionId: "content", order: 2, required: false, visible: true },
        { fieldId: "buttons", sectionId: "content", order: 3, required: false, visible: true }
      ],
      validationRules: [
        { fieldId: "label", rule: "non-empty", message: "Label is required" },
        { fieldId: "buttons", rule: "valid-json", message: "Buttons must be valid JSON" }
      ]
    }
  };
}

/**
 * Create lesson-end configuration
 * 
 * Lesson-end shows:
 * - Identity section: slideId, slideType, groupId, groupName, orderIndex, label
 * - Content section: title, lessonEndMessage, lessonEndActions, buttons
 * - No subtitle, no body, no other sections
 */
function createLessonEndConfig(): SlideTypeConfig {
  return {
    typeKey: "lesson-end",
    displayName: "Lesson End",
    isActive: true,
    version: 1,
    formConfig: {
      sections: [
        DEFAULT_SECTIONS.find(s => s.id === "identity")!,
        DEFAULT_SECTIONS.find(s => s.id === "content")!
      ],
      fields: [
        // Identity & Structure Section
        { fieldId: "slideId", sectionId: "identity", order: 1, required: false, visible: true },
        { fieldId: "slideType", sectionId: "identity", order: 2, required: false, visible: true },
        { fieldId: "groupId", sectionId: "identity", order: 3, required: false, visible: true },
        { fieldId: "groupName", sectionId: "identity", order: 4, required: false, visible: true },
        { fieldId: "orderIndex", sectionId: "identity", order: 5, required: false, visible: true },
        { fieldId: "label", sectionId: "identity", order: 6, required: true, visible: true },
        // Core Content Section
        { fieldId: "title", sectionId: "content", order: 1, required: false, visible: true },
        { fieldId: "lessonEndMessage", sectionId: "content", order: 2, required: false, visible: true },
        { fieldId: "lessonEndActions", sectionId: "content", order: 3, required: false, visible: true },
        { fieldId: "buttons", sectionId: "content", order: 4, required: false, visible: true }
      ],
      validationRules: [
        { fieldId: "label", rule: "non-empty", message: "Label is required" },
        { fieldId: "lessonEndActions", rule: "valid-json", message: "Actions must be valid JSON" },
        { fieldId: "buttons", rule: "valid-json", message: "Buttons must be valid JSON" }
      ]
    }
  };
}

/**
 * Create ai-speak-repeat configuration
 * 
 * ai-speak-repeat shows:
 * - Identity section: slideId, slideType, groupId, groupName, orderIndex, label
 * - Content section: buttons (no title/subtitle/body)
 * - Language section: defaultLang
 * - Media section: audioId
 * - Speech section: phrases
 * - Interaction flags: isInteractive, allowSkip, allowRetry, isActivity
 * - Flow section: maxAttempts, minAttemptsBeforeSkip
 * - Metadata section: activityName
 */
function createAiSpeakRepeatConfig(): SlideTypeConfig {
  return {
    typeKey: "ai-speak-repeat",
    displayName: "AI Speak Repeat",
    isActive: true,
    version: 1,
    formConfig: {
      sections: [
        DEFAULT_SECTIONS.find(s => s.id === "identity")!,
        DEFAULT_SECTIONS.find(s => s.id === "content")!,
        DEFAULT_SECTIONS.find(s => s.id === "language")!,
        DEFAULT_SECTIONS.find(s => s.id === "media")!,
        DEFAULT_SECTIONS.find(s => s.id === "speech")!,
        DEFAULT_SECTIONS.find(s => s.id === "interaction")!,
        DEFAULT_SECTIONS.find(s => s.id === "flow")!,
        DEFAULT_SECTIONS.find(s => s.id === "metadata")!
      ],
      fields: [
        // Identity & Structure Section
        { fieldId: "slideId", sectionId: "identity", order: 1, required: false, visible: true },
        { fieldId: "slideType", sectionId: "identity", order: 2, required: false, visible: true },
        { fieldId: "groupId", sectionId: "identity", order: 3, required: false, visible: true },
        { fieldId: "groupName", sectionId: "identity", order: 4, required: false, visible: true },
        { fieldId: "orderIndex", sectionId: "identity", order: 5, required: false, visible: true },
        { fieldId: "label", sectionId: "identity", order: 6, required: true, visible: true },
        // Core Content Section
        { fieldId: "title", sectionId: "content", order: 1, required: false, visible: true },
        { fieldId: "subtitle", sectionId: "content", order: 2, required: false, visible: true },
        { fieldId: "instructions", sectionId: "content", order: 3, required: false, visible: true },
        { fieldId: "buttons", sectionId: "content", order: 4, required: false, visible: true },
        // Language & Localization Section
        { fieldId: "defaultLang", sectionId: "language", order: 1, required: false, visible: true },
        // Media Reference Section
        { fieldId: "audioId", sectionId: "media", order: 1, required: false, visible: true },
        // Speech & Audio Interaction Section
        { fieldId: "lines", sectionId: "speech", order: 1, required: true, visible: true },
        // Interaction Flags Section
        { fieldId: "isInteractive", sectionId: "interaction", order: 1, required: false, visible: true },
        { fieldId: "allowSkip", sectionId: "interaction", order: 2, required: false, visible: true },
        { fieldId: "allowRetry", sectionId: "interaction", order: 3, required: false, visible: true },
        { fieldId: "isActivity", sectionId: "interaction", order: 4, required: false, visible: true },
        // Interaction/Flow Section
        { fieldId: "maxAttempts", sectionId: "flow", order: 1, required: false, visible: true },
        { fieldId: "minAttemptsBeforeSkip", sectionId: "flow", order: 2, required: false, visible: true },
        // Authoring Metadata Section
        { fieldId: "activityName", sectionId: "metadata", order: 1, required: false, visible: true }
      ],
      validationRules: [
        { fieldId: "label", rule: "non-empty", message: "Label is required" },
        { fieldId: "lines", rule: "non-empty", message: "Lines are required" },
        { fieldId: "buttons", rule: "valid-json", message: "Buttons must be valid JSON" }
      ]
    }
  };
}

/**
 * Create ai-speak-student-repeat configuration
 * 
 * ai-speak-student-repeat shows:
 * - Identity section: slideId, slideType, groupId, groupName, orderIndex, label
 * - Content section: buttons (no title/subtitle/body)
 * - Language section: defaultLang
 * - Media section: audioId
 * - Speech section: instructions, promptLabel, elements
 * - Interaction flags: isInteractive, allowSkip, allowRetry, isActivity
 * - Flow section: onCompleteAtIndex, maxAttempts, minAttemptsBeforeSkip
 * - Metadata section: activityName
 */
function createAiSpeakStudentRepeatConfig(): SlideTypeConfig {
  return {
    typeKey: "ai-speak-student-repeat",
    displayName: "AI Speak Student Repeat",
    isActive: true,
    version: 1,
    formConfig: {
      sections: [
        DEFAULT_SECTIONS.find(s => s.id === "identity")!,
        DEFAULT_SECTIONS.find(s => s.id === "content")!,
        DEFAULT_SECTIONS.find(s => s.id === "language")!,
        DEFAULT_SECTIONS.find(s => s.id === "media")!,
        DEFAULT_SECTIONS.find(s => s.id === "speech")!,
        DEFAULT_SECTIONS.find(s => s.id === "interaction")!,
        DEFAULT_SECTIONS.find(s => s.id === "flow")!,
        DEFAULT_SECTIONS.find(s => s.id === "metadata")!
      ],
      fields: [
        // Identity & Structure Section
        { fieldId: "slideId", sectionId: "identity", order: 1, required: false, visible: true },
        { fieldId: "slideType", sectionId: "identity", order: 2, required: false, visible: true },
        { fieldId: "groupId", sectionId: "identity", order: 3, required: false, visible: true },
        { fieldId: "groupName", sectionId: "identity", order: 4, required: false, visible: true },
        { fieldId: "orderIndex", sectionId: "identity", order: 5, required: false, visible: true },
        { fieldId: "label", sectionId: "identity", order: 6, required: true, visible: true },
        // Core Content Section
        { fieldId: "buttons", sectionId: "content", order: 1, required: false, visible: true },
        { fieldId: "instructions", sectionId: "content", order: 2, required: false, visible: true },
        { fieldId: "promptLabel", sectionId: "content", order: 3, required: false, visible: true },
        // Language & Localization Section
        { fieldId: "defaultLang", sectionId: "language", order: 1, required: false, visible: true },
        // Media Reference Section
        { fieldId: "audioId", sectionId: "media", order: 1, required: false, visible: true },
        // Speech & Audio Interaction Section
        { fieldId: "elements", sectionId: "speech", order: 1, required: true, visible: true },
        // Interaction Flags Section
        { fieldId: "isInteractive", sectionId: "interaction", order: 1, required: false, visible: true },
        { fieldId: "allowSkip", sectionId: "interaction", order: 2, required: false, visible: true },
        { fieldId: "allowRetry", sectionId: "interaction", order: 3, required: false, visible: true },
        { fieldId: "isActivity", sectionId: "interaction", order: 4, required: false, visible: true },
        // Interaction/Flow Section
        { fieldId: "onCompleteAtIndex", sectionId: "flow", order: 1, required: false, visible: true },
        { fieldId: "maxAttempts", sectionId: "flow", order: 2, required: false, visible: true },
        { fieldId: "minAttemptsBeforeSkip", sectionId: "flow", order: 3, required: false, visible: true },
        // Authoring Metadata Section
        { fieldId: "activityName", sectionId: "metadata", order: 1, required: false, visible: true }
      ],
      validationRules: [
        { fieldId: "label", rule: "non-empty", message: "Label is required" },
        { fieldId: "elements", rule: "at-least-one-element", message: "Student Repeat: add at least 1 element before saving." },
        { fieldId: "buttons", rule: "valid-json", message: "Buttons must be valid JSON" }
      ]
    }
  };
}

/**
 * Create speech-match configuration
 * 
 * speech-match shows:
 * - Identity section: slideId, slideType, groupId, groupName, orderIndex, label
 * - Content section: title, subtitle, note, buttons
 * - Language section: defaultLang
 * - Media section: audioId
 * - Speech section: choiceElements
 * - Interaction flags: isInteractive, allowSkip, allowRetry, isActivity
 * - Flow section: maxAttempts, minAttemptsBeforeSkip
 * - Metadata section: activityName
 */
function createSpeechMatchConfig(): SlideTypeConfig {
  return {
    typeKey: "speech-match",
    displayName: "Speech Match",
    isActive: true,
    version: 1,
    formConfig: {
      sections: [
        DEFAULT_SECTIONS.find(s => s.id === "identity")!,
        DEFAULT_SECTIONS.find(s => s.id === "content")!,
        DEFAULT_SECTIONS.find(s => s.id === "language")!,
        DEFAULT_SECTIONS.find(s => s.id === "media")!,
        DEFAULT_SECTIONS.find(s => s.id === "speech")!,
        DEFAULT_SECTIONS.find(s => s.id === "interaction")!,
        DEFAULT_SECTIONS.find(s => s.id === "flow")!,
        DEFAULT_SECTIONS.find(s => s.id === "metadata")!
      ],
      fields: [
        // Identity & Structure Section
        { fieldId: "slideId", sectionId: "identity", order: 1, required: false, visible: true },
        { fieldId: "slideType", sectionId: "identity", order: 2, required: false, visible: true },
        { fieldId: "groupId", sectionId: "identity", order: 3, required: false, visible: true },
        { fieldId: "groupName", sectionId: "identity", order: 4, required: false, visible: true },
        { fieldId: "orderIndex", sectionId: "identity", order: 5, required: false, visible: true },
        { fieldId: "label", sectionId: "identity", order: 6, required: true, visible: true },
        // Core Content Section
        { fieldId: "title", sectionId: "content", order: 1, required: false, visible: true },
        { fieldId: "subtitle", sectionId: "content", order: 2, required: false, visible: true },
        { fieldId: "note", sectionId: "content", order: 3, required: false, visible: true },
        { fieldId: "buttons", sectionId: "content", order: 4, required: false, visible: true },
        // Language & Localization Section
        { fieldId: "defaultLang", sectionId: "language", order: 1, required: false, visible: true },
        // Media Reference Section
        { fieldId: "audioId", sectionId: "media", order: 1, required: false, visible: true },
        // Speech & Audio Interaction Section
        { fieldId: "choiceElements", sectionId: "speech", order: 1, required: true, visible: true },
        // Interaction Flags Section
        { fieldId: "isInteractive", sectionId: "interaction", order: 1, required: false, visible: true },
        { fieldId: "allowSkip", sectionId: "interaction", order: 2, required: false, visible: true },
        { fieldId: "allowRetry", sectionId: "interaction", order: 3, required: false, visible: true },
        { fieldId: "isActivity", sectionId: "interaction", order: 4, required: false, visible: true },
        // Interaction/Flow Section
        { fieldId: "maxAttempts", sectionId: "flow", order: 1, required: false, visible: true },
        { fieldId: "minAttemptsBeforeSkip", sectionId: "flow", order: 2, required: false, visible: true },
        // Authoring Metadata Section
        { fieldId: "activityName", sectionId: "metadata", order: 1, required: false, visible: true }
      ],
      validationRules: [
        { fieldId: "label", rule: "non-empty", message: "Label is required" },
        { fieldId: "choiceElements", rule: "at-least-one-choice", message: "Speech Match: add at least 1 choice with a label and TTS text or audio." },
        { fieldId: "buttons", rule: "valid-json", message: "Buttons must be valid JSON" }
      ]
    }
  };
}

/**
 * Create speech-choice-verify configuration
 * 
 * speech-choice-verify shows:
 * - Identity section: slideId, slideType, groupId, groupName, orderIndex, label
 * - Content section: title, subtitle, note, buttons
 * - Language section: defaultLang
 * - Media section: audioId
 * - Speech section: choiceElements (with referenceText)
 * - Interaction flags: isInteractive, allowSkip, allowRetry, isActivity
 * - Flow section: maxAttempts, minAttemptsBeforeSkip
 * - Metadata section: activityName
 */
function createSpeechChoiceVerifyConfig(): SlideTypeConfig {
  return {
    typeKey: "speech-choice-verify",
    displayName: "Speech Choice Verify",
    isActive: true,
    version: 1,
    formConfig: {
      sections: [
        DEFAULT_SECTIONS.find(s => s.id === "identity")!,
        DEFAULT_SECTIONS.find(s => s.id === "content")!,
        DEFAULT_SECTIONS.find(s => s.id === "language")!,
        DEFAULT_SECTIONS.find(s => s.id === "media")!,
        DEFAULT_SECTIONS.find(s => s.id === "speech")!,
        DEFAULT_SECTIONS.find(s => s.id === "interaction")!,
        DEFAULT_SECTIONS.find(s => s.id === "flow")!,
        DEFAULT_SECTIONS.find(s => s.id === "metadata")!
      ],
      fields: [
        // Identity & Structure Section
        { fieldId: "slideId", sectionId: "identity", order: 1, required: false, visible: true },
        { fieldId: "slideType", sectionId: "identity", order: 2, required: false, visible: true },
        { fieldId: "groupId", sectionId: "identity", order: 3, required: false, visible: true },
        { fieldId: "groupName", sectionId: "identity", order: 4, required: false, visible: true },
        { fieldId: "orderIndex", sectionId: "identity", order: 5, required: false, visible: true },
        { fieldId: "label", sectionId: "identity", order: 6, required: true, visible: true },
        // Core Content Section
        { fieldId: "title", sectionId: "content", order: 1, required: false, visible: true },
        { fieldId: "subtitle", sectionId: "content", order: 2, required: false, visible: true },
        { fieldId: "note", sectionId: "content", order: 3, required: false, visible: true },
        { fieldId: "buttons", sectionId: "content", order: 4, required: false, visible: true },
        // Language & Localization Section
        { fieldId: "defaultLang", sectionId: "language", order: 1, required: false, visible: true },
        // Media Reference Section
        { fieldId: "audioId", sectionId: "media", order: 1, required: false, visible: true },
        // Speech & Audio Interaction Section
        { fieldId: "choiceElements", sectionId: "speech", order: 1, required: true, visible: true },
        // Interaction Flags Section
        { fieldId: "isInteractive", sectionId: "interaction", order: 1, required: false, visible: true },
        { fieldId: "allowSkip", sectionId: "interaction", order: 2, required: false, visible: true },
        { fieldId: "allowRetry", sectionId: "interaction", order: 3, required: false, visible: true },
        { fieldId: "isActivity", sectionId: "interaction", order: 4, required: false, visible: true },
        // Interaction/Flow Section
        { fieldId: "maxAttempts", sectionId: "flow", order: 1, required: false, visible: true },
        { fieldId: "minAttemptsBeforeSkip", sectionId: "flow", order: 2, required: false, visible: true },
        // Authoring Metadata Section
        { fieldId: "activityName", sectionId: "metadata", order: 1, required: false, visible: true }
      ],
      validationRules: [
        { fieldId: "label", rule: "non-empty", message: "Label is required" },
        { fieldId: "choiceElements", rule: "at-least-one-choice", message: "Speech Choice Verify: add at least 1 choice with label, referenceText, and speech." },
        { fieldId: "buttons", rule: "valid-json", message: "Buttons must be valid JSON" }
      ]
    }
  };
}

async function createConfig(config: SlideTypeConfig) {
  // Validate configuration
  const validation = validateSlideTypeConfig(config);
  if (!validation.valid) {
    console.error(`❌ Invalid configuration for ${config.typeKey}:`);
    validation.errors.forEach(err => console.error(`   - ${err}`));
    return false;
  }

  // Check if config already exists
  const { data: existing } = await supabase
    .from("slide_type_configs")
    .select("type_key")
    .eq("type_key", config.typeKey)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️  Configuration for "${config.typeKey}" already exists. Skipping...`);
    return false;
  }

  // Convert to database record format
  const record = configToRecord(config);

  // Insert into database
  const { data, error } = await supabase
    .from("slide_type_configs")
    .insert({
      type_key: record.type_key,
      display_name: record.display_name,
      is_active: record.is_active,
      version: record.version,
      form_config: record.form_config
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Failed to create configuration for ${config.typeKey}:`);
    console.error(`   ${error.message}`);
    return false;
  }

  console.log(`✅ Created configuration for ${config.displayName}`);
  console.log(`   Type Key: ${config.typeKey}`);
  console.log(`   Version: ${config.version}`);
  console.log(`   Sections: ${config.formConfig.sections.length}`);
  console.log(`   Fields: ${config.formConfig.fields.length}`);
  console.log(`   Validation Rules: ${config.formConfig.validationRules.length}\n`);
  
  return true;
}

async function createAllConfigs() {
  console.log("🚀 Creating configurations for all slide types...\n");

  const configs = [
    createTitleSlideConfig(),
    createLessonEndConfig(),
    createAiSpeakRepeatConfig(),
    createAiSpeakStudentRepeatConfig(),
    createSpeechMatchConfig(),
    createSpeechChoiceVerifyConfig()
  ];

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const config of configs) {
    const result = await createConfig(config);
    if (result === true) {
      created++;
    } else if (result === false && config.typeKey !== "text-slide") {
      // text-slide already exists, that's expected
      skipped++;
    } else {
      failed++;
    }
  }

  console.log("─".repeat(60));
  console.log("Summary:");
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log("");

  if (failed === 0) {
    console.log("✅ All configurations created successfully!");
    console.log("   You can now enable dynamic forms for these types in .env.local:");
    console.log("   NEXT_PUBLIC_DYNAMIC_FORM_TYPES=text-slide,title-slide,lesson-end,ai-speak-repeat,ai-speak-student-repeat,speech-match\n");
    process.exit(0);
  } else {
    console.log("❌ Some configurations failed to create. Review errors above.\n");
    process.exit(1);
  }
}

// Run
createAllConfigs().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

