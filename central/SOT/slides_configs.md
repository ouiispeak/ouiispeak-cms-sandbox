Authority Role: mirror
Artifact Type: component-field-snapshot
Canonical Source: public.field_dictionary + public.field_dictionary_component_rules (seed snapshots: supabase/manual/010_field_dictionary_catalog_seed.sql, supabase/manual/012_component_activation_seed.sql)
Constitution Reference: central/CONSTITUTION.md

slides:
  source_of_truth:
    - supabase/manual/012_component_activation_seed.sql
  component_scope: content_slides_only
  active_field_keys:
    - aiInstructions
    - anecdoteOrMemoryHook
    - assessmentPlan
    - audioId
    - body1
    - body2
    - body3
    - body4
    - body5
    - body6
    - body7
    - body8
    - buttons
    - commonMisconceptions
    - culturalContext
    - defaultLang
    - description
    - differentiationPaths
    - diffLog
    - expansionGuidelines
    - extraPracticeNotes
    - forbiddenPatterns
    - groupId
    - groupName
    - ingestPayload
    - ingestSource
    - instructions
    - keyTakeawaysSlide
    - l1InterferenceNotes
    - lastUpdatedAt
    - lastUpdatedBy
    - learningObjectives
    - lessonId
    - metadata
    - moduleId
    - notesForTeacherOrAI
    - orderIndex
    - ownerTeam
    - registerVariants
    - remediationPaths
    - shortSummaryTeacherSlide
    - signatureMetaphors
    - simplificationGuidelines
    - slideId (required, system-controlled)
    - slug (required)
    - sourceVersion
    - styleConstraints
    - successCriteria
    - tags
    - targetLanguage
    - targetNodeKeys
    - teacherNotes
    - teacherOverview
    - telemetryTags
    - textSubtype
    - type
    - version
    - visibility
  notes:
    - activity fields (`activityId`, `propsJson`, `runtimeContractV1`, `lines`) are not part of `slides`.
    - activity fields are owned by the `activity_slides` component.
