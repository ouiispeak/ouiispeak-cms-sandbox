/**
 * Verify Current Form Structure
 * 
 * Checks a specific slide to verify:
 * 1. What slide type it is
 * 2. What fields should be showing based on current hardcoded logic
 * 3. What fields are configured in our new system
 * 4. Compare them to ensure they match
 * 
 * Usage:
 *   npx tsx scripts/verify-current-form.ts <slideId>
 *   Example: npx tsx scripts/verify-current-form.ts de0cf25d-a0b4-47a1-94b5-880e486edecc
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
import { recordToConfig } from "../lib/schemas/slideTypeConfig";
import type { SlideTypeConfig, SlideTypeConfigRecord } from "../lib/schemas/slideTypeConfig";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Analyze what fields should show for a slide type based on current hardcoded logic
 */
function getExpectedFieldsForType(slideType: string): {
  sections: string[];
  fields: Array<{ fieldId: string; section: string; visible: boolean }>;
} {
  const fields: Array<{ fieldId: string; section: string; visible: boolean }> = [];

  // Identity & Structure Section - Always shown
  fields.push(
    { fieldId: "slideId", section: "identity", visible: true },
    { fieldId: "slideType", section: "identity", visible: true },
    { fieldId: "groupId", section: "identity", visible: true },
    { fieldId: "groupName", section: "identity", visible: true },
    { fieldId: "orderIndex", section: "identity", visible: true },
    { fieldId: "label", section: "identity", visible: true }
  );

  // Core Content Section
  // Title, Subtitle, Body shown if NOT (ai-speak-repeat OR ai-speak-student-repeat OR speech-match)
  if (slideType !== "ai-speak-repeat" && slideType !== "ai-speak-student-repeat" && slideType !== "speech-match") {
    fields.push({ fieldId: "title", section: "content", visible: true });
    
    if (slideType === "lesson-end") {
      fields.push(
        { fieldId: "lessonEndMessage", section: "content", visible: true },
        { fieldId: "lessonEndActions", section: "content", visible: true }
      );
    } else {
      fields.push({ fieldId: "subtitle", section: "content", visible: true });
    }
    
    // Body shown if NOT (title-slide OR lesson-end)
    if (slideType !== "title-slide" && slideType !== "lesson-end") {
      fields.push({ fieldId: "body", section: "content", visible: true });
    }
  }

  // Buttons - Always shown
  fields.push({ fieldId: "buttons", section: "content", visible: true });

  // Language & Localization - Always shown (but might be empty for some types)
  // Note: In current code, this section always exists but might be empty

  // Media Reference - Shown if NOT (title-slide OR text-slide)
  if (slideType !== "title-slide" && slideType !== "text-slide") {
    fields.push({ fieldId: "audioId", section: "media", visible: true });
  }

  // Speech & Audio Interaction - Shown if NOT (title-slide OR text-slide)
  if (slideType !== "title-slide" && slideType !== "text-slide") {
    if (slideType === "ai-speak-student-repeat") {
      fields.push(
        { fieldId: "instructions", section: "content", visible: true },
        { fieldId: "promptLabel", section: "content", visible: true },
        { fieldId: "elements", section: "speech", visible: true }
      );
    } else if (slideType === "speech-match") {
      fields.push(
        { fieldId: "title", section: "content", visible: true }, // Duplicate but shown in speech-match context
        { fieldId: "subtitle", section: "content", visible: true }, // Duplicate
        { fieldId: "note", section: "speech", visible: true },
        { fieldId: "choiceElements", section: "speech", visible: true }
      );
    } else {
      // ai-speak-repeat or other
      fields.push({ fieldId: "phrases", section: "speech", visible: true });
    }
  }

  // Interaction Flags - Shown if NOT (title-slide OR text-slide)
  if (slideType !== "title-slide" && slideType !== "text-slide") {
    fields.push(
      { fieldId: "isInteractive", section: "interaction", visible: true },
      { fieldId: "allowSkip", section: "interaction", visible: true },
      { fieldId: "allowRetry", section: "interaction", visible: true },
      { fieldId: "isActivity", section: "interaction", visible: true }
    );
  }

  // Interaction/Flow - Shown if NOT (title-slide OR text-slide)
  if (slideType !== "title-slide" && slideType !== "text-slide") {
    if (slideType === "ai-speak-student-repeat") {
      fields.push({ fieldId: "onCompleteAtIndex", section: "flow", visible: true });
    }
    fields.push(
      { fieldId: "maxAttempts", section: "flow", visible: true },
      { fieldId: "minAttemptsBeforeSkip", section: "flow", visible: true }
    );
  }

  // Authoring Metadata - Shown if NOT (title-slide OR lesson-end OR text-slide)
  if (slideType !== "title-slide" && slideType !== "lesson-end" && slideType !== "text-slide") {
    fields.push({ fieldId: "activityName", section: "metadata", visible: true });
  }

  // Language - Always available but might not be shown for all types
  // In current code, defaultLang field exists but section might be empty for text-slide

  // Determine which sections should be visible
  const sectionIds = new Set(fields.map(f => f.section));
  const sections = Array.from(sectionIds);

  return { sections, fields };
}

async function verifySlideForm(slideId: string) {
  console.log(`🔍 Verifying form for slide: ${slideId}\n`);

  // Load slide from database
  const { data: slideData, error: slideError } = await supabase
    .from("slides")
    .select("id, type, props_json")
    .eq("id", slideId)
    .maybeSingle();

  if (slideError) {
    console.error(`❌ Error loading slide: ${slideError.message}`);
    process.exit(1);
  }

  if (!slideData) {
    console.error(`❌ Slide not found: ${slideId}`);
    process.exit(1);
  }

  const slideType = slideData.type;
  console.log(`📋 Slide Information:`);
  console.log(`   ID: ${slideData.id}`);
  console.log(`   Type: ${slideType}`);
  console.log(`   Props JSON keys: ${Object.keys((slideData.props_json as any) || {}).join(", ") || "(empty)"}\n`);

  // Get expected fields based on current hardcoded logic
  console.log("🔍 Analyzing current hardcoded logic...");
  const expected = getExpectedFieldsForType(slideType);
  console.log(`   Expected sections: ${expected.sections.length}`);
  console.log(`   Expected fields: ${expected.fields.length}\n`);

  // Get configured fields from our new system (if config exists)
  console.log("🔍 Checking new configuration system...");
  
  // Inline function to avoid import issues
  const { data: configData, error: configError } = await supabase
    .from("slide_type_configs")
    .select("*")
    .eq("type_key", slideType)
    .maybeSingle();

  let configResult: { data: SlideTypeConfig | null; error: string | null };
  if (configError) {
    configResult = { data: null, error: `Failed to load configuration: ${configError.message}` };
  } else if (!configData) {
    configResult = { data: null, error: `No configuration found for type "${slideType}"` };
  } else {
    const config = recordToConfig(configData as SlideTypeConfigRecord);
    configResult = { data: config, error: null };
  }
  
  if (configResult.error || !configResult.data) {
    console.log(`   ⚠️  No configuration found: ${configResult.error || "Configuration data is null"}`);
    console.log(`   This is expected if the slide type hasn't been migrated yet.\n`);
    
    // Summary for no config
    console.log("─".repeat(60));
    console.log("Summary:");
    console.log(`   Slide Type: ${slideType}`);
    console.log(`   Expected Fields: ${expected.fields.length}`);
    console.log(`   Configuration: Not found (expected for unmigrated types)`);
    console.log("");
    return;
  }

  const config = configResult.data;
    console.log(`   ✅ Configuration found: ${config.displayName} (v${config.version})`);
    console.log(`   Configured sections: ${config.formConfig.sections.length}`);
    console.log(`   Configured fields: ${config.formConfig.fields.length}\n`);

    // Compare expected vs configured
    console.log("📊 Comparison: Expected (Current Logic) vs Configured (New System)\n");

    // Compare sections
    const expectedSections = new Set(expected.sections);
    const configuredSections = new Set(config.formConfig.sections.map(s => s.id));
    
    const missingSections = Array.from(expectedSections).filter(s => !configuredSections.has(s));
    const extraSections = Array.from(configuredSections).filter(s => !expectedSections.has(s));

    if (missingSections.length > 0 || extraSections.length > 0) {
      console.log("⚠️  Section Mismatch:");
      if (missingSections.length > 0) {
        console.log(`   Missing in config: ${missingSections.join(", ")}`);
      }
      if (extraSections.length > 0) {
        console.log(`   Extra in config: ${extraSections.join(", ")}`);
      }
      console.log("");
    } else {
      console.log("✅ Sections match\n");
    }

    // Compare fields
    const expectedFieldIds = new Set(expected.fields.map(f => f.fieldId));
    const configuredFieldIds = new Set(config.formConfig.fields.map(f => f.fieldId));

    const missingFields = Array.from(expectedFieldIds).filter(f => !configuredFieldIds.has(f));
    const extraFields = Array.from(configuredFieldIds).filter(f => !expectedFieldIds.has(f));

    console.log("📋 Field Comparison:");
    if (missingFields.length > 0) {
      console.log(`   ⚠️  Missing in config: ${missingFields.join(", ")}`);
    }
    if (extraFields.length > 0) {
      console.log(`   ⚠️  Extra in config: ${extraFields.join(", ")}`);
    }
    if (missingFields.length === 0 && extraFields.length === 0) {
      console.log(`   ✅ All fields match (${expectedFieldIds.size} fields)`);
    }
    console.log("");

    // Detailed field breakdown
    console.log("📋 Expected Fields (Current Logic):");
    expected.fields.forEach(field => {
      console.log(`   - ${field.fieldId} (${field.section})`);
    });
    console.log("");

    console.log("📋 Configured Fields (New System):");
    config.formConfig.fields
      .sort((a, b) => {
        const sectionOrder = config.formConfig.sections.findIndex(s => s.id === a.sectionId) - 
                            config.formConfig.sections.findIndex(s => s.id === b.sectionId);
        if (sectionOrder !== 0) return sectionOrder;
        return a.order - b.order;
      })
      .forEach(field => {
        const section = config.formConfig.sections.find(s => s.id === field.sectionId);
        console.log(`   - ${field.fieldId} (${section?.title || field.sectionId}) - ${field.visible ? "visible" : "hidden"} - ${field.required ? "required" : "optional"}`);
      });
    console.log("");

    // Summary for this config
    const fieldsMatch = missingFields.length === 0 && extraFields.length === 0;
    const sectionsMatch = missingSections.length === 0 && extraSections.length === 0;
    
    if (fieldsMatch && sectionsMatch) {
      console.log("✅ Perfect match! Configuration matches current hardcoded logic.\n");
    } else {
      console.log("⚠️  Mismatches found. Review the differences above.\n");
    }

  // Final summary
  console.log("─".repeat(60));
  console.log("Summary:");
  console.log(`   Slide Type: ${slideType}`);
  console.log(`   Expected Fields: ${expected.fields.length}`);
  console.log(`   Configured Fields: ${config.formConfig.fields.length}`);
  console.log(`   Fields Match: ${fieldsMatch ? "✅ Yes" : "❌ No"}`);
  console.log(`   Sections Match: ${sectionsMatch ? "✅ Yes" : "❌ No"}`);
  console.log("");
}

// Get slide ID from command line args
const slideId = process.argv[2];

if (!slideId) {
  console.error("❌ Error: Slide ID required");
  console.error("   Usage: npx tsx scripts/verify-current-form.ts <slideId>");
  console.error("   Example: npx tsx scripts/verify-current-form.ts de0cf25d-a0b4-47a1-94b5-880e486edecc\n");
  process.exit(1);
}

verifySlideForm(slideId).catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

