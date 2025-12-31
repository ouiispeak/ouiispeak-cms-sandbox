# CMS Constitution

**Version**: 1.0.0  
**Last Updated**: 2025-01-17

**Document Precedence**: This file defines the canonical contracts and architectural boundaries for the CMS (Content Management System). It ensures that CMS authoring decisions are documented, consistent, and maintainable. Changes to CMS contracts require explicit updates to this document.

**See Also**: 
- `docs/CONTENT_CONSTITUTION.md` (in main repo) - Content output schema contracts
- `docs/PLAYER_CONSTITUTION.md` (in main repo) - Player contracts and boundaries
- `docs/README.md` - Documentation index

**Purpose**: Define immutable contracts and architectural boundaries for the CMS authoring system. This constitution prevents architecture drift and ensures consistent field organization, form structure, and configuration management across the CMS.

---

## Changelog

### v1.1.0 (2025-01-17)
- Added slide props save contract (Section 7) - documents required fields for each slide type
- Established immutable contract: all form fields must be included in save payload
- Documented speech-match slide save requirements (instructions, promptLabel, note)
- Documented instructions display behavior: speech-match instructions are sidebar-only (not displayed in slide)

### v1.0.0 (2025-01-17)
- Initial CMS constitution established
- Defined field section organization principles
- Established Core Content vs. Speech & Audio Interaction categorization rules
- Documented slide type configuration system contracts
- Established migration policy for configuration changes

---

## 1. Scope and Non-Goals

### Scope
- Field section organization and categorization rules
- Slide type configuration structure and contracts
- Form field placement principles
- Configuration migration policies
- Field registry and default section assignments

### Non-Goals
- Content output schema (see CONTENT_CONSTITUTION.md)
- Player rendering contracts (see PLAYER_CONSTITUTION.md)
- Database schema design (see schema.*.md files)
- UI/UX design specifications
- Content authoring guidelines (pedagogy, not technical)

---

## 2. Field Section Organization Principles

### Core Content Section

**Purpose**: Contains all fields that represent primary content shown directly to learners.

**Fields that belong in Core Content**:
- `title` - Primary heading for the slide
- `subtitle` - Secondary heading or subtopic
- `body` - Main slide copy/text content
- `instructions` - **Optional instructions shown to learners before they practice**
- `promptLabel` - **Label displayed above practice prompts**
- `note` - Optional note displayed below subtitle
- `buttons` - Interactive buttons displayed on the slide
- `lessonEndMessage` - Message text for lesson-end slides
- `lessonEndActions` - Action buttons for lesson-end slides

**Rationale**: These fields represent semantic content that learners see and interact with. They are not technical implementation details or audio-specific configurations.

### Speech & Audio Interaction Section

**Purpose**: Contains fields that configure audio playback, speech recognition, and audio-related interactions.

**Fields that belong in Speech & Audio Interaction**:
- `phrases` - Phrases for speech recognition and audio interaction
- `elements` - Practice elements with audio references (for student repeat slides)
- `choiceElements` - Choice elements with audio references (for speech match/choice verify slides)
- Audio-specific configurations and metadata

**Rationale**: These fields configure the audio/voice interaction behavior, not the content displayed to learners.

### Field Categorization Rule

**Rule**: If a field represents **content shown to learners**, it belongs in **Core Content**. If a field represents **audio/voice interaction configuration**, it belongs in **Speech & Audio Interaction**.

**Examples**:
- ✅ `instructions` → Core Content (learners read this text)
- ✅ `promptLabel` → Core Content (learners see this label)
- ✅ `elements` → Speech & Audio Interaction (configures audio playback)
- ✅ `phrases` → Speech & Audio Interaction (configures speech recognition)

---

## 3. Slide Type Configuration System

### Configuration Structure

Each slide type has a configuration stored in the `slide_type_configs` table with the following structure:

```typescript
type SlideTypeConfig = {
  typeKey: string;              // Slide type identifier (e.g., "ai-speak-student-repeat")
  displayName: string;          // Human-readable name
  isActive: boolean;            // Whether this type is enabled
  version: number;              // Configuration version (incremented on changes)
  formConfig: {
    sections: FormSection[];    // Section definitions
    fields: FormFieldConfig[];  // Field definitions with section assignments
    validationRules: ValidationRule[];
  }
}
```

### Field Configuration Contract

Each field in `formConfig.fields` must specify:
- `fieldId: string` - Field identifier (references FIELD_REGISTRY)
- `sectionId: string` - **Must follow Section 2 categorization rules**
- `order: number` - Display order within section
- `required: boolean` - Whether field is required
- `visible: boolean` - Whether field is visible

### Section Assignment Rules

1. **Core Content fields** must have `sectionId: "content"`
2. **Speech & Audio Interaction fields** must have `sectionId: "speech"`
3. **Field registry defaults** (`defaultSection` in `slideFieldRegistry.ts`) must align with Section 2 principles
4. **Configuration scripts** (`create-all-slide-configs.ts`) must assign fields to correct sections per Section 2

---

## 4. Field Registry Contract

### Default Section Assignment

The field registry (`lib/schemas/slideFieldRegistry.ts`) defines default sections for fields. These defaults must align with Section 2 categorization rules:

- `instructions` → `defaultSection: "content"`
- `promptLabel` → `defaultSection: "content"`
- `phrases` → `defaultSection: "speech"`
- `elements` → `defaultSection: "speech"`
- `choiceElements` → `defaultSection: "speech"`

**Rationale**: Default sections serve as fallbacks when slide type configurations don't explicitly assign a section. They must reflect the correct categorization.

### Field Registry Updates

When adding new fields:
1. Determine correct section per Section 2 categorization rules
2. Set `defaultSection` in field registry
3. Update slide type configurations to explicitly assign the field
4. Update this constitution if categorization rules change

---

## 5. Configuration Migration Policy

### When Migrations Are Required

Migrations are required when:
1. Field section assignments change (e.g., moving `instructions` from "speech" to "content")
2. Field ordering changes within sections
3. New fields are added to existing slide types
4. Field visibility or requirement status changes

### Migration Process

1. **Update Code**:
   - Update `create-all-slide-configs.ts` script with new field assignments
   - Update `slideFieldRegistry.ts` default sections if needed
   - Update verification scripts (`verify-current-form.ts`) to match new structure

2. **Create Migration Script**:
   - Create script in `scripts/` directory (e.g., `migrate-*-to-*.ts`)
   - Script must:
     - Load existing configurations from database
     - Update field `sectionId` values
     - Reorder fields within sections
     - Increment configuration `version`
     - Update database records

3. **Run Migration**:
   - Execute migration script: `npx tsx scripts/migrate-*.ts`
   - Verify migration success (script outputs summary)
   - Test form preview in browser

4. **Document Changes**:
   - Update this constitution's changelog
   - Document rationale for section changes
   - Update any affected documentation

### Migration Script Requirements

Migration scripts must:
- ✅ Load environment variables from `.env.local`
- ✅ Connect to Supabase using environment variables
- ✅ Handle missing configurations gracefully
- ✅ Skip configurations that don't need changes
- ✅ Increment version numbers
- ✅ Provide clear output showing what changed
- ✅ Be idempotent (safe to run multiple times)

### Example Migration

**Scenario**: Moving `instructions` and `promptLabel` from "speech" to "content" section.

**Migration Script**: `scripts/migrate-instructions-promptlabel-to-content.ts`

**Process**:
1. Script loads all slide type configurations
2. For each config, checks if `instructions` or `promptLabel` exist
3. If found in "speech" section, moves to "content" section
4. Updates field ordering within sections
5. Increments configuration version
6. Updates database record

---

## 6. Form Rendering Contract

### Dynamic Form System

The CMS uses a dynamic form system (`DynamicSlideForm`) that:
- Reads slide type configurations from database
- Groups fields by section using `groupFieldsBySection()` utility
- Renders sections in order defined by configuration
- Renders fields within sections in order defined by configuration

### Section Rendering Order

Sections are rendered in the order defined by `formConfig.sections`, sorted by `order` property. Standard section order:
1. Identity & Structure
2. Core Content
3. Language & Localization
4. Media Reference
5. Speech & Audio Interaction
6. Interaction Flags
7. Interaction/Flow
8. Authoring Metadata

### Field Rendering Within Sections

Fields within a section are rendered in the order defined by `formConfig.fields`, sorted by `order` property within each section.

---

## 7. Slide Props Save Contract

### Save Function Contract

**Location**: `lib/hooks/slides/useSlideFormSave.ts` - `save()` function

**Purpose**: Ensure all form fields are included in `props_json` when saving slides to the database.

### Required Fields by Slide Type

Each slide type must save all fields that are:
1. Defined in the slide type's props schema
2. Present in the form configuration
3. Entered by the user (even if empty strings)

### Speech-Match Slide Save Contract

**Critical Fields**: The following fields MUST be included in the save payload for `speech-match` slides:

- `instructions` - String field (required in schema, defaults to empty string)
- `promptLabel` - String field (optional in schema)
- `note` - String field (optional in schema)
- `elements` - Array field (required in schema)

**Implementation Contract**:
```typescript
// For speech-match slides, save hook MUST include:
if (state.instructions.trim()) {
  speechMatchProps.instructions = state.instructions.trim();
}
if (state.promptLabel.trim()) {
  speechMatchProps.promptLabel = state.promptLabel.trim();
}
if (state.note.trim()) {
  speechMatchProps.note = state.note.trim();
}
```

**Rationale**: These fields are part of the Core Content section and represent content shown to learners. They must be persisted to the database to ensure proper display in the player.

**Display Behavior**:
- `instructions` for speech-match slides are NOT displayed in the slide component itself
- `instructions` for speech-match slides are ONLY accessible via the sidebar instructions button (activity help button)
- This ensures instructions are available on-demand without cluttering the slide interface

**Contract**: This save behavior is immutable. All slide type-specific save logic must include all fields defined in the form configuration and props schema.

---

## 8. Configuration Versioning

### Version Increment Policy

Configuration versions must be incremented when:
- Field section assignments change
- Field ordering changes
- New fields are added
- Field visibility or requirement status changes
- Validation rules change

### Version Numbering

- Start at version `1` for new configurations
- Increment by `1` for each change
- Version numbers are sequential integers (no semantic versioning)

### Backward Compatibility

- Old configurations remain valid until migrated
- Migration scripts update configurations to latest version
- Form system supports all versions (reads from database)

---

## 9. Enforcement and Compliance

### Code Review Checklist

When reviewing CMS changes, verify:
- [ ] Field section assignments follow Section 2 categorization rules
- [ ] Field registry defaults align with categorization rules
- [ ] Configuration scripts assign fields to correct sections
- [ ] Migration scripts increment version numbers
- [ ] This constitution is updated if categorization rules change

### Testing Requirements

Before deploying configuration changes:
1. Run migration script in development environment
2. Verify form preview shows fields in correct sections
3. Test saving slides with updated configuration
4. Verify existing slides still load correctly
5. Check that migration script is idempotent

---

## 10. Future Considerations

### Potential Additions

- Field visibility rules based on slide type
- Conditional field display logic
- Field grouping within sections
- Custom section definitions per slide type
- Field validation rules per slide type

### Open Questions

- Should field ordering be configurable per slide type?
- Should sections be customizable per slide type?
- How should field dependencies be handled?

---

## Appendix A: Field Categorization Reference

### Core Content Fields
- `title`
- `subtitle`
- `body`
- `instructions`
- `promptLabel`
- `note`
- `buttons`
- `lessonEndMessage`
- `lessonEndActions`

### Speech & Audio Interaction Fields
- `phrases`
- `elements`
- `choiceElements`

### Other Sections
- **Identity & Structure**: `slideId`, `slideType`, `groupId`, `groupName`, `orderIndex`, `label`
- **Language & Localization**: `defaultLang`
- **Media Reference**: `audioId`
- **Interaction Flags**: `isInteractive`, `allowSkip`, `allowRetry`, `isActivity`
- **Interaction/Flow**: `onCompleteAtIndex`, `maxAttempts`, `minAttemptsBeforeSkip`
- **Authoring Metadata**: `activityName`

---

**End of CMS Constitution**

