/**
 * Create Text Slide Configuration
 * 
 * Creates the first slide type configuration as a proof of concept.
 * This script creates a config for "text-slide" type.
 * 
 * Usage:
 *   npx tsx scripts/create-text-slide-config.ts
 */

// IMPORTANT: Load environment variables BEFORE any other imports
import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

// Verify environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("❌ Error: Missing Supabase environment variables");
  console.error("   Make sure .env.local exists and contains:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL=...");
  console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY=...\n");
  process.exit(1);
}

// Now import modules (but we'll create supabase client in the script)
import type { SlideTypeConfig } from "../lib/schemas/slideTypeConfig";
import { DEFAULT_SECTIONS } from "../lib/schemas/slideTypeConfig";
import { createClient } from "@supabase/supabase-js";
import type { SlideTypeConfigRecord } from "../lib/schemas/slideTypeConfig";
import { recordToConfig, configToRecord, validateSlideTypeConfig } from "../lib/schemas/slideTypeConfig";

/**
 * Create configuration for text-slide type
 * 
 * Text-slide shows:
 * - Identity section: slideId, slideType, groupId, groupName, orderIndex, label
 * - Content section: title, subtitle, body, buttons
 * - No other sections (no language, media, speech, interaction, flow, metadata)
 */
async function createTextSlideConfig() {
  console.log("Creating text-slide configuration...\n");

  // Create Supabase client with loaded environment variables
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const config: SlideTypeConfig = {
    typeKey: "text-slide",
    displayName: "Text Slide",
    isActive: true,
    version: 1,
    formConfig: {
      sections: [
        DEFAULT_SECTIONS.find(s => s.id === "identity")!,
        DEFAULT_SECTIONS.find(s => s.id === "content")!
      ],
      fields: [
        // Identity & Structure Section
        {
          fieldId: "slideId",
          sectionId: "identity",
          order: 1,
          required: false,
          visible: true
        },
        {
          fieldId: "slideType",
          sectionId: "identity",
          order: 2,
          required: false,
          visible: true
        },
        {
          fieldId: "groupId",
          sectionId: "identity",
          order: 3,
          required: false,
          visible: true
        },
        {
          fieldId: "groupName",
          sectionId: "identity",
          order: 4,
          required: false,
          visible: true
        },
        {
          fieldId: "orderIndex",
          sectionId: "identity",
          order: 5,
          required: false,
          visible: true
        },
        {
          fieldId: "label",
          sectionId: "identity",
          order: 6,
          required: true,
          visible: true
        },
        // Core Content Section
        {
          fieldId: "title",
          sectionId: "content",
          order: 1,
          required: false,
          visible: true
        },
        {
          fieldId: "subtitle",
          sectionId: "content",
          order: 2,
          required: false,
          visible: true
        },
        {
          fieldId: "body",
          sectionId: "content",
          order: 3,
          required: false,
          visible: true
        },
        {
          fieldId: "text_subtype",
          sectionId: "content",
          order: 4,
          required: false,
          visible: true
        },
        {
          fieldId: "buttons",
          sectionId: "content",
          order: 5,
          required: false,
          visible: true
        }
      ],
      validationRules: [
        {
          fieldId: "label",
          rule: "non-empty",
          message: "Label is required"
        },
        {
          fieldId: "buttons",
          rule: "valid-json",
          message: "Buttons must be valid JSON"
        }
      ]
    }
  };

  // Validate configuration
  const validation = validateSlideTypeConfig(config);
  if (!validation.valid) {
    console.error("❌ Invalid configuration:");
    validation.errors.forEach(err => console.error(`   - ${err}`));
    console.error("");
    process.exit(1);
  }

  // Check if config already exists
  const { data: existing } = await supabase
    .from("slide_type_configs")
    .select("type_key")
    .eq("type_key", config.typeKey)
    .maybeSingle();

  if (existing) {
    console.error(`❌ Configuration for type "${config.typeKey}" already exists.`);
    console.error("   Use updateSlideTypeConfig or delete the existing config first.\n");
    process.exit(1);
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
    console.error("❌ Failed to create configuration:");
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }

  // Convert back to SlideTypeConfig format
  const createdConfig = recordToConfig(data as SlideTypeConfigRecord);

  console.log("✅ Successfully created text-slide configuration!");
  console.log(`   Type Key: ${createdConfig.typeKey}`);
  console.log(`   Display Name: ${createdConfig.displayName}`);
  console.log(`   Version: ${createdConfig.version}`);
  console.log(`   Sections: ${createdConfig.formConfig.sections.length}`);
  console.log(`   Fields: ${createdConfig.formConfig.fields.length}`);
  console.log(`   Validation Rules: ${createdConfig.formConfig.validationRules.length}\n`);
  
  console.log("📋 Configuration Summary:");
  console.log(`   Sections: ${createdConfig.formConfig.sections.map(s => s.title).join(", ")}`);
  console.log(`   Fields: ${createdConfig.formConfig.fields.map(f => f.fieldId).join(", ")}\n`);
  
  console.log("✅ Proof of concept complete! Configuration saved to database.\n");
  process.exit(0);
}

// Run
createTextSlideConfig().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

