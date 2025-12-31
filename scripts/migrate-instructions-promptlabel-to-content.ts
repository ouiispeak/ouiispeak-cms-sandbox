/**
 * Migration Script: Move instructions and promptLabel to Core Content Section
 * 
 * Updates slide type configurations to move the `instructions` and `promptLabel` 
 * fields from the "speech" section to the "content" (Core Content) section.
 * 
 * This affects all slide types that use these fields:
 * - ai-speak-student-repeat
 * - Any other slide types that may have these fields configured
 * 
 * Usage:
 *   npx tsx scripts/migrate-instructions-promptlabel-to-content.ts
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
import { recordToConfig, configToRecord } from "../lib/schemas/slideTypeConfig";
import type { SlideTypeConfig, SlideTypeConfigRecord } from "../lib/schemas/slideTypeConfig";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Migrate a single slide type configuration
 */
async function migrateSlideTypeConfig(typeKey: string): Promise<boolean> {
  console.log(`\n🔄 Migrating ${typeKey} configuration...`);

  // Load existing configuration
  const { data: existingConfig, error: loadError } = await supabase
    .from("slide_type_configs")
    .select("*")
    .eq("type_key", typeKey)
    .maybeSingle();

  if (loadError) {
    console.error(`❌ Error loading configuration: ${loadError.message}`);
    return false;
  }

  if (!existingConfig) {
    console.log(`⚠️  No existing configuration found for ${typeKey}`);
    return false;
  }

  // Convert to config object
  const config = recordToConfig(existingConfig as SlideTypeConfigRecord);
  
  console.log(`   Current version: ${config.version}`);
  console.log(`   Fields: ${config.formConfig.fields.length}`);

  // Find instructions and promptLabel fields
  const instructionsField = config.formConfig.fields.find(f => f.fieldId === "instructions");
  const promptLabelField = config.formConfig.fields.find(f => f.fieldId === "promptLabel");

  if (!instructionsField && !promptLabelField) {
    console.log(`   ⚠️  No instructions or promptLabel fields found - skipping`);
    return false;
  }

  let needsUpdate = false;

  // Check and update instructions field
  if (instructionsField) {
    if (instructionsField.sectionId === "speech") {
      console.log(`   📝 Moving instructions: speech → content`);
      instructionsField.sectionId = "content";
      needsUpdate = true;
    } else if (instructionsField.sectionId === "content") {
      console.log(`   ✅ Instructions already in content section`);
    } else {
      console.log(`   ⚠️  Instructions in unexpected section: ${instructionsField.sectionId}`);
    }
  }

  // Check and update promptLabel field
  if (promptLabelField) {
    if (promptLabelField.sectionId === "speech") {
      console.log(`   📝 Moving promptLabel: speech → content`);
      promptLabelField.sectionId = "content";
      needsUpdate = true;
    } else if (promptLabelField.sectionId === "content") {
      console.log(`   ✅ PromptLabel already in content section`);
    } else {
      console.log(`   ⚠️  PromptLabel in unexpected section: ${promptLabelField.sectionId}`);
    }
  }

  if (!needsUpdate) {
    console.log(`   ✅ No changes needed`);
    return false;
  }

  // Update order within content section
  // Find the highest order in content section (excluding the fields we're moving)
  const contentFields = config.formConfig.fields.filter(
    f => f.sectionId === "content" && f.fieldId !== "instructions" && f.fieldId !== "promptLabel"
  );
  const maxContentOrder = contentFields.length > 0 
    ? Math.max(...contentFields.map(f => f.order), 0)
    : 0;
  
  // Set order for instructions and promptLabel after existing content fields
  if (instructionsField && instructionsField.sectionId === "content") {
    instructionsField.order = maxContentOrder + 1;
  }
  if (promptLabelField && promptLabelField.sectionId === "content") {
    promptLabelField.order = maxContentOrder + 2;
  }

  // Reorder elements in speech section if needed
  const elementsField = config.formConfig.fields.find(
    f => f.fieldId === "elements" && f.sectionId === "speech"
  );
  if (elementsField) {
    elementsField.order = 1;
  }

  // Increment version
  config.version = config.version + 1;
  console.log(`   📝 Updating version: ${config.version - 1} → ${config.version}`);

  // Convert back to record format
  const updatedRecord = configToRecord(config);

  // Update database
  const { data: updatedData, error: updateError } = await supabase
    .from("slide_type_configs")
    .update({
      version: updatedRecord.version,
      form_config: updatedRecord.form_config
    })
    .eq("type_key", typeKey)
    .select()
    .single();

  if (updateError) {
    console.error(`❌ Error updating configuration: ${updateError.message}`);
    return false;
  }

  console.log(`   ✅ Migration completed successfully!`);
  if (instructionsField) {
    console.log(`      Instructions: now in content section (order ${instructionsField.order})`);
  }
  if (promptLabelField) {
    console.log(`      PromptLabel: now in content section (order ${promptLabelField.order})`);
  }
  
  return true;
}

async function migrateAllConfigs() {
  console.log("🚀 Starting migration: Move instructions and promptLabel to Core Content section\n");
  console.log("─".repeat(60));

  // Get all slide type configs
  const { data: allConfigs, error: listError } = await supabase
    .from("slide_type_configs")
    .select("type_key")
    .order("type_key");

  if (listError) {
    console.error(`❌ Error listing configurations: ${listError.message}`);
    process.exit(1);
  }

  if (!allConfigs || allConfigs.length === 0) {
    console.log("⚠️  No slide type configurations found in database");
    console.log("   Run 'npx tsx scripts/create-all-slide-configs.ts' to create them first.\n");
    process.exit(0);
  }

  console.log(`Found ${allConfigs.length} slide type configuration(s)\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  // Migrate each configuration
  for (const config of allConfigs) {
    const result = await migrateSlideTypeConfig(config.type_key);
    if (result === true) {
      migrated++;
    } else if (result === false) {
      skipped++;
    } else {
      failed++;
    }
  }

  console.log("\n─".repeat(60));
  console.log("Migration Summary:");
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log("");

  if (failed === 0) {
    console.log("✅ Migration completed successfully!");
    console.log("   The instructions and promptLabel fields are now in the Core Content section.");
    console.log("   Refresh your form preview to see the changes.\n");
    process.exit(0);
  } else {
    console.log("❌ Some migrations failed. Review errors above.\n");
    process.exit(1);
  }
}

migrateAllConfigs().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

