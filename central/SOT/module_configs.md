Authority Role: mirror
Artifact Type: component-field-snapshot
Canonical Source: public.field_dictionary + public.field_dictionary_component_rules (seed snapshots: supabase/manual/010_field_dictionary_catalog_seed.sql, supabase/manual/012_component_activation_seed.sql)
Constitution Reference: central/CONSTITUTION.md

modules:
  Identity & Lifecycle:
    - lastUpdatedAt
    - lastUpdatedBy
    - moduleId (system-controlled)
    - ownerTeam
    - slug (required)
    - title
    - version
    - visibility
    - reviewRequired
    - sourceVersion
  Purpose & Outcomes:
    - competencyTags
    - coreTopics
    - description
    - keywords
    - learningObjectives
    - moduleGoal
    - moduleOutcomes
    - tags
    - topicCategory
  Scope, Prerequisites & Targeting:
    - audienceNotes
    - levelMax
    - levelMin
    - cefrMax
    - cefrMin
    - level (required)
    - prerequisiteModules
  Pedagogy & Scaffolding:
    - differentiationPaths
    - differentiationStrategies
    - discourseFocus
    - grammarFocus
    - pedagogicalStrategy
    - pronunciationFocus
    - remediationGuidance
    - remediationPaths
    - vocabularyTheme
  Assessment & Mastery:
    - moduleAssessmentPlan
    - moduleMasteryRule
    - moduleMasteryThreshold
  Structure & Sequencing:
    - capstoneLesson
    - lessonSequenceRules
    - optionalLessons
    - orderIndex
    - progressionNotes
    - requiredLessons
    - sequenceType
  Localization:
    - defaultLang
    - registerTone
    - targetLanguage
  Teacher Guidance:
    - authorNotes
    - commonMisconceptions
    - shortSummaryTeacherModule
    - teacherNotes
    - teacherOverview
  AI Generation & Prompting:
    - aiInstructions
    - expansionGuidelines
    - forbiddenPatterns
    - simplificationGuidelines
    - styleConstraints
  Links, Dependencies & Summaries:
    - learningGoalPreviewModule
    - linkedModules
    - linkedResources
  Telemetry & Analytics:
    - canonicalNodeKey
    - expectedCompletionRate
    - expectedModuleDurationMinutes
    - experimentFlag
    - telemetryTags
  Operations, Provenance & Governance:
    - breakingChangeGuard
    - changeImpactAssessment
    - diffLog
    - ingestPayload
    - ingestSource
    - manualOverrideJson
    - metadata
    - publishNotes
