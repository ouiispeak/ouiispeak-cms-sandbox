Authority Role: mirror
Artifact Type: component-field-snapshot
Canonical Source: public.field_dictionary + public.field_dictionary_component_rules (seed snapshots: supabase/manual/010_field_dictionary_catalog_seed.sql, supabase/manual/012_component_activation_seed.sql)
Constitution Reference: central/CONSTITUTION.md

groups:
  Identity & Lifecycle:
    - groupId (system-controlled)
    - groupName
    - lastUpdatedAt
    - lastUpdatedBy
    - lessonId
    - moduleId
    - ownerTeam
    - slug (required)
    - title
    - version
    - visibility
    - reviewRequired
    - sourceVersion
  Purpose & Outcomes:
    - competencyTags
    - description
    - groupGoal
    - groupSummary
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
  Instructions & Flow:
    - allowRetry
    - allowSkip
    - autoAdvance
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
    - pronunciationFocus
    - remediationGuidance
    - remediationPaths
    - vocabularyTheme
  Assessment & Mastery:
    - assessmentPlan
    - isRequiredToPass
    - masteryRule
    - masteryThreshold
    - maxAttempts
    - maxScoreValue
    - passingScoreType
    - passingScoreValue
    - passRequiredForNext
    - requiredScore
    - successCriteria
  Structure & Sequencing:
    - groupPlan
    - groupSlidesPlan
    - groupType
    - orderIndex
    - purposeRelationshipTag
    - slidePlan
  Localization:
    - culturalContext
    - defaultLang
    - l1InterferenceNotes
    - registerTone
    - registerVariants
    - targetLanguage
  Teacher Guidance:
    - anecdoteOrMemoryHook
    - commonMisconceptions
    - notesForTeacherOrAI
    - shortSummaryTeacherGroup
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
    - learningGoalPreviewGroup
    - linkedGroups
    - linkedResources
    - timeExpectationGroup
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
    - extractabilityTier
    - ingestPayload
    - ingestSource
    - manualOverrideJson
    - metadata
    - publishNotes
