Authority Role: mirror
Artifact Type: component-field-snapshot
Canonical Source: public.field_dictionary + public.field_dictionary_component_rules (seed snapshots: supabase/manual/010_field_dictionary_catalog_seed.sql, supabase/manual/012_component_activation_seed.sql)
Constitution Reference: central/CONSTITUTION.md

lessons:
  Identity & Lifecycle:
    - lastUpdatedAt
    - lastUpdatedBy
    - lessonId (system-controlled)
    - moduleId
    - ownerTeam
    - slug (required)
    - title
    - version
    - visibility
    - reviewRequired
    - sourceVersion
  Purpose & Outcomes:
    - activityDescription
    - competencyTags
    - coreTopics
    - description
    - keywords
    - learningObjectives
    - tags
    - topicCategory
  Scope, Prerequisites & Targeting:
    - audienceNotes
    - levelMax
    - levelMin
    - cefrLevel
    - cefrMax
    - cefrMin
    - diagnosticChecks
    - level
    - prerequisiteEdges
    - prerequisiteNodes
    - prerequisites
    - prerequisiteSlices
    - priorLessons
  Instructions & Flow:
    - allowRetry
    - allowSkip
    - minAttemptsBeforeSkip
    - retryPolicy
    - skipPolicy
  Pedagogy & Scaffolding:
    - differentiationPaths
    - differentiationStrategies
    - discourseFocus
    - extraPracticeNotes
    - grammarFocus
    - pacingNotes
    - pedagogicalStrategy
    - practiceProgression
    - pronunciationFocus
    - remediationGuidance
    - remediationPaths
    - scaffoldingPlan
    - vocabularyTheme
  Assessment & Mastery:
    - assessmentPlan
    - masteryRule
    - masteryThreshold
    - maxAttempts
    - passRequiredForNext
    - requiredScore
    - successCriteria
  Structure & Sequencing:
    - groupPlan
    - orderIndex
    - slidePlan
  Localization:
    - culturalContext
    - defaultLang
    - l1InterferenceNotes
    - registerTone
    - registerVariants
    - targetLanguage
  Teacher Guidance:
    - commonMisconceptions
    - notesForTeacherOrAI
    - shortSummaryLessonAdmin
    - shortSummaryLessonStudent
    - shortSummaryTeacherLesson
    - teacherNotes
    - teacherOverview
  AI Generation & Prompting:
    - aiInstructions
    - exampleResponses
    - expansionGuidelines
    - forbiddenPatterns
    - signatureMetaphors
    - simplificationGuidelines
    - styleConstraints
  Activities & Interaction:
    - activityTypes
  Links, Dependencies & Summaries:
    - estimatedMinutes
    - keyTakeawaysLesson
    - learningGoalPreviewLesson
    - linkedResources
    - timeExpectationLesson
  Telemetry & Analytics:
    - canonicalNodeKey
    - expectedCompletionRate
    - expectedTimeOnTask
    - experimentFlag
    - targetedEdges
    - targetedNodes
    - targetedSlices
    - targetNodeKeys
    - telemetryTags
  Operations, Provenance & Governance:
    - breakingChangeGuard
    - changeImpactAssessment
    - diffLog
    - ingestPayload
    - ingestSource
    - manualOverrideJson
    - publishNotes
