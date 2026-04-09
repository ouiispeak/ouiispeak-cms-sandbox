-- 015_act_001_slide_setup.sql
-- Purpose: activate shared default + ACT profile fields on the group-scoped activity_slides component.
-- Notes:
-- - Activity slides are a dedicated component (`activity_slides`); content `slides` remain non-activity.
-- - `propsJson` is included for player C0 activity envelope parity.
-- Idempotent: safe to re-run.

DO $$
DECLARE
  requested_field_keys TEXT[] := ARRAY[
    'activityId',
    'aiInstructions',
    'allowRetry',
    'allowSkip',
    'anecdoteOrMemoryHook',
    'assessmentPlan',
    'audienceNotes',
    'audioA',
    'audioB',
    'audioId',
    'audioPrompt',
    'autoAdvance',
    'levelMax',
    'levelMin',
    'body',
    'buttons',
    'cefrLevel',
    'cefrMax',
    'cefrMin',
    'choiceElements',
    'commonMisconceptions',
    'competencyTags',
    'correctCurveId',
    'correctStressIndex',
    'coreTopics',
    'culturalContext',
    'defaultLang',
    'delayMs',
    'description',
    'diagnosticChecks',
    'differentiationPaths',
    'differentiationStrategies',
    'diffLog',
    'discourseFocus',
    'estimatedMinutes',
    'exampleResponses',
    'expectedCompletionRate',
    'expectedTimeOnTask',
    'expansionGuidelines',
    'extractabilityTier',
    'extraPracticeNotes',
    'forbiddenPatterns',
    'grammarFocus',
    'groupId',
    'groupName',
    'ingestPayload',
    'ingestSource',
    'instructions',
    'isRequiredToPass',
    'intonationOptions',
    'keywords',
    'l1InterferenceNotes',
    'lastUpdatedAt',
    'lastUpdatedBy',
    'learningObjectives',
    'lessonId',
    'lines',
    'linkedResources',
    'manualOverrideJson',
    'masteryRule',
    'masteryThreshold',
    'maxAttempts',
    'maxScoreValue',
    'metadata',
    'minAttemptsBeforeSkip',
    'moduleId',
    'note',
    'notesForTeacherOrAI',
    'orderIndex',
    'ownerTeam',
    'passRequiredForNext',
    'passingScoreType',
    'passingScoreValue',
    'prerequisiteEdges',
    'prerequisiteModules',
    'prerequisiteNodes',
    'prerequisiteSlices',
    'prerequisites',
    'priorLessons',
    'pronunciationFocus',
    'promptMode',
    'propsJson',
    'registerTone',
    'registerVariants',
    'remediationGuidance',
    'remediationPaths',
    'requiredScore',
    'retryPolicy',
    'runtimeContractV1',
    'shortSummaryTeacherActivity',
    'shortSummaryTeacherSlide',
    'signatureMetaphors',
    'simplificationGuidelines',
    'skipPolicy',
    'slideId',
    'slug',
    'sourceVersion',
    'styleConstraints',
    'subtitle',
    'syllableBreakdown',
    'successCriteria',
    'tags',
    'targetedEdges',
    'targetedNodes',
    'targetedSlices',
    'targetLanguage',
    'targetNodeKeys',
    'teacherNotes',
    'teacherOverview',
    'telemetryTags',
    'textSubtype',
    'timeExpectationActivity',
    'title',
    'topicCategory',
    'type',
    'version',
    'visibility',
    'vocabularyTheme'
  ];
  missing_field_keys TEXT[];
BEGIN
  SELECT ARRAY_AGG(requested.field_key ORDER BY requested.field_key)
  INTO missing_field_keys
  FROM UNNEST(requested_field_keys) AS requested(field_key)
  LEFT JOIN public.field_dictionary fd
    ON fd.field_key = requested.field_key
  WHERE fd.field_key IS NULL;

  IF missing_field_keys IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot activate activity slide shared/profile fields. Missing field_dictionary keys: %', missing_field_keys;
  END IF;

  INSERT INTO public.field_dictionary_component_rules (field_key, component_name, is_present, is_required)
  SELECT
    requested.field_key,
    'activity_slides',
    true,
    CASE
      WHEN requested.field_key IN ('slideId', 'slug') THEN true
      ELSE false
    END
  FROM UNNEST(requested_field_keys) AS requested(field_key)
  ON CONFLICT (field_key, component_name) DO UPDATE
  SET
    is_present = EXCLUDED.is_present,
    is_required = EXCLUDED.is_required;
END $$;
