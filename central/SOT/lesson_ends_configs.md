Authority Role: mirror
Artifact Type: component-field-snapshot
Canonical Source: public.field_dictionary + public.field_dictionary_component_rules (seed snapshots: supabase/manual/010_field_dictionary_catalog_seed.sql, supabase/manual/012_component_activation_seed.sql)
Constitution Reference: central/CONSTITUTION.md

lesson_ends:
  Identity baseline keys:
    - lessonId
    - moduleId
    - orderIndex
    - slideId
    - slug
  Identity & Lifecycle:
    - activityId
    - groupId
    - groupName
    - lastUpdatedAt
    - lastUpdatedBy
    - lessonId
    - moduleId
    - ownerTeam
    - slideId
    - slug
    - sourceVersion
    - version
    - visibility
  Content & Media:
    - audioId
    - buttons
    - lessonEndActions
    - lessonEndMessage
  Instructions & Flow:
    - recommendedNextStep
  Pedagogy & Scaffolding:
    - extraPracticeNotes
  Structure & Sequencing:
    - orderIndex
  Localization:
    - defaultLang
    - targetLanguage
  Telemetry & Analytics:
    - telemetryTags
  Operations, Provenance & Governance:
    - diffLog
    - ingestPayload
    - ingestSource
    - metadata
  Runtime note:
    - current player B2 provider reads identity baseline keys from lesson_end_field_values
    - CMS import/export routes must keep these keys aligned with contract rules
