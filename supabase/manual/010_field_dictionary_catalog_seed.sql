-- 010_field_dictionary_catalog_seed.sql
-- Generated from live local Supabase on 2026-04-06.
-- Purpose: make field dictionary/universal projection match the current approved catalog.

DELETE FROM public.component_config_fields;
DELETE FROM public.field_dictionary_component_rules;
DELETE FROM public.universal_fields;
DELETE FROM public.field_dictionary_locations;
DELETE FROM public.field_dictionary;

INSERT INTO public.config_categories (name, category_order)
VALUES
  ('Identity & Lifecycle', 1),
  ('Purpose & Outcomes', 2),
  ('Scope, Prerequisites & Targeting', 3),
  ('Content & Media', 4),
  ('Instructions & Flow', 5),
  ('Pedagogy & Scaffolding', 6),
  ('Assessment & Mastery', 7),
  ('Structure & Sequencing', 8),
  ('Teacher Guidance', 9),
  ('AI Generation & Prompting', 10),
  ('Links, Dependencies & Summaries', 11),
  ('Operations, Provenance & Governance', 12),
  ('Localization', 13),
  ('Activities & Interaction', 14),
  ('Telemetry & Analytics', 15)
ON CONFLICT (name) DO UPDATE
SET category_order = EXCLUDED.category_order;

INSERT INTO public.field_dictionary (field_key, category_name, input_type, field_order, status, definition)
VALUES
  ('activityId', 'Identity & Lifecycle', 'text', 1, 'active', NULL),
  ('groupId', 'Identity & Lifecycle', 'text', 2, 'active', NULL),
  ('groupName', 'Identity & Lifecycle', 'text', 3, 'active', NULL),
  ('lastUpdatedAt', 'Identity & Lifecycle', 'text', 4, 'active', NULL),
  ('lastUpdatedBy', 'Identity & Lifecycle', 'text', 5, 'active', NULL),
  ('lessonId', 'Identity & Lifecycle', 'text', 6, 'active', NULL),
  ('moduleId', 'Identity & Lifecycle', 'text', 7, 'active', NULL),
  ('ownerTeam', 'Identity & Lifecycle', 'text', 8, 'active', NULL),
  ('slideId', 'Identity & Lifecycle', 'text', 9, 'active', NULL),
  ('slug', 'Identity & Lifecycle', 'text', 10, 'active', NULL),
  ('title', 'Identity & Lifecycle', 'text', 11, 'active', NULL),
  ('type', 'Identity & Lifecycle', 'text', 12, 'active', NULL),
  ('version', 'Identity & Lifecycle', 'text', 13, 'active', NULL),
  ('visibility', 'Identity & Lifecycle', 'text', 14, 'active', NULL),
  ('activityDescription', 'Purpose & Outcomes', 'text', 1, 'active', NULL),
  ('competencyTags', 'Purpose & Outcomes', 'text', 2, 'active', NULL),
  ('coreTopics', 'Purpose & Outcomes', 'text', 3, 'active', NULL),
  ('description', 'Purpose & Outcomes', 'text', 4, 'active', NULL),
  ('groupGoal', 'Purpose & Outcomes', 'text', 5, 'active', NULL),
  ('groupSummary', 'Purpose & Outcomes', 'text', 6, 'active', NULL),
  ('keywords', 'Purpose & Outcomes', 'text', 7, 'active', NULL),
  ('learningObjectives', 'Purpose & Outcomes', 'text', 8, 'active', NULL),
  ('moduleGoal', 'Purpose & Outcomes', 'text', 9, 'active', NULL),
  ('moduleOutcomes', 'Purpose & Outcomes', 'text', 10, 'active', NULL),
  ('tags', 'Purpose & Outcomes', 'text', 11, 'active', NULL),
  ('topicCategory', 'Purpose & Outcomes', 'text', 12, 'active', NULL),
  ('audienceNotes', 'Scope, Prerequisites & Targeting', 'text', 1, 'active', NULL),
  ('level', 'Scope, Prerequisites & Targeting', 'text', 2, 'active', NULL),
  ('levelMax', 'Scope, Prerequisites & Targeting', 'text', 3, 'active', NULL),
  ('levelMin', 'Scope, Prerequisites & Targeting', 'text', 4, 'active', NULL),
  ('cefrLevel', 'Scope, Prerequisites & Targeting', 'text', 5, 'active', NULL),
  ('cefrMax', 'Scope, Prerequisites & Targeting', 'text', 6, 'active', NULL),
  ('cefrMin', 'Scope, Prerequisites & Targeting', 'text', 7, 'active', NULL),
  ('diagnosticChecks', 'Scope, Prerequisites & Targeting', 'text', 8, 'active', NULL),
  ('prerequisiteEdges', 'Scope, Prerequisites & Targeting', 'text', 9, 'active', NULL),
  ('prerequisiteModules', 'Scope, Prerequisites & Targeting', 'text', 10, 'active', NULL),
  ('prerequisiteNodes', 'Scope, Prerequisites & Targeting', 'text', 11, 'active', NULL),
  ('prerequisites', 'Scope, Prerequisites & Targeting', 'text', 12, 'active', NULL),
  ('prerequisiteSlices', 'Scope, Prerequisites & Targeting', 'text', 13, 'active', NULL),
  ('priorLessons', 'Scope, Prerequisites & Targeting', 'text', 14, 'active', NULL),
  ('audioId', 'Content & Media', 'text', 1, 'active', NULL),
  ('body', 'Content & Media', 'text', 2, 'active', NULL),
  ('body1', 'Content & Media', 'text', 3, 'active', NULL),
  ('body2', 'Content & Media', 'text', 4, 'active', NULL),
  ('body3', 'Content & Media', 'text', 5, 'active', NULL),
  ('body4', 'Content & Media', 'text', 6, 'active', NULL),
  ('body5', 'Content & Media', 'text', 7, 'active', NULL),
  ('body6', 'Content & Media', 'text', 8, 'active', NULL),
  ('body7', 'Content & Media', 'text', 9, 'active', NULL),
  ('body8', 'Content & Media', 'text', 10, 'active', NULL),
  ('buttons', 'Content & Media', 'text', 11, 'active', NULL),
  ('lessonEndMessage', 'Content & Media', 'text', 12, 'active', NULL),
  ('note', 'Content & Media', 'text', 13, 'active', NULL),
  ('subtitle', 'Content & Media', 'text', 14, 'active', NULL),
  ('textSubtype', 'Content & Media', 'text', 15, 'active', NULL),
  ('lessonEndActions', 'Content & Media', 'text', 16, 'active', NULL),
  ('primaryCtaAction', 'Content & Media', 'text', 17, 'active', NULL),
  ('primaryCtaLabel', 'Content & Media', 'text', 18, 'active', NULL),
  ('allowRetry', 'Instructions & Flow', 'checkbox', 1, 'active', NULL),
  ('allowSkip', 'Instructions & Flow', 'checkbox', 2, 'active', NULL),
  ('retryPolicy', 'Instructions & Flow', 'text', 3, 'active', NULL),
  ('skipPolicy', 'Instructions & Flow', 'text', 4, 'active', NULL),
  ('minAttemptsBeforeSkip', 'Instructions & Flow', 'text', 5, 'active', NULL),
  ('autoAdvance', 'Instructions & Flow', 'checkbox', 6, 'active', NULL),
  ('delayMs', 'Instructions & Flow', 'text', 7, 'active', NULL),
  ('instructions', 'Instructions & Flow', 'text', 8, 'active', NULL),
  ('recommendedNextStep', 'Instructions & Flow', 'text', 9, 'active', NULL),
  ('differentiationPaths', 'Pedagogy & Scaffolding', 'text', 1, 'active', NULL),
  ('differentiationStrategies', 'Pedagogy & Scaffolding', 'text', 2, 'active', NULL),
  ('discourseFocus', 'Pedagogy & Scaffolding', 'text', 3, 'active', NULL),
  ('extraPracticeNotes', 'Pedagogy & Scaffolding', 'text', 4, 'active', NULL),
  ('grammarFocus', 'Pedagogy & Scaffolding', 'text', 5, 'active', NULL),
  ('pacingNotes', 'Pedagogy & Scaffolding', 'text', 6, 'active', NULL),
  ('pedagogicalStrategy', 'Pedagogy & Scaffolding', 'text', 7, 'active', NULL),
  ('practiceProgression', 'Pedagogy & Scaffolding', 'text', 8, 'active', NULL),
  ('pronunciationFocus', 'Pedagogy & Scaffolding', 'text', 9, 'active', NULL),
  ('remediationGuidance', 'Pedagogy & Scaffolding', 'text', 10, 'active', NULL),
  ('remediationPaths', 'Pedagogy & Scaffolding', 'text', 11, 'active', NULL),
  ('scaffoldingPlan', 'Pedagogy & Scaffolding', 'text', 12, 'active', NULL),
  ('vocabularyTheme', 'Pedagogy & Scaffolding', 'text', 13, 'active', NULL),
  ('assessmentPlan', 'Assessment & Mastery', 'text', 1, 'active', NULL),
  ('isRequiredToPass', 'Assessment & Mastery', 'checkbox', 2, 'active', NULL),
  ('masteryRule', 'Assessment & Mastery', 'text', 3, 'active', NULL),
  ('masteryThreshold', 'Assessment & Mastery', 'text', 4, 'active', NULL),
  ('maxAttempts', 'Assessment & Mastery', 'text', 5, 'active', NULL),
  ('maxScoreValue', 'Assessment & Mastery', 'text', 6, 'active', NULL),
  ('moduleAssessmentPlan', 'Assessment & Mastery', 'text', 7, 'active', NULL),
  ('moduleMasteryRule', 'Assessment & Mastery', 'text', 8, 'active', NULL),
  ('moduleMasteryThreshold', 'Assessment & Mastery', 'text', 9, 'active', NULL),
  ('passingScoreType', 'Assessment & Mastery', 'text', 10, 'active', NULL),
  ('passingScoreValue', 'Assessment & Mastery', 'text', 11, 'active', NULL),
  ('passRequiredForNext', 'Assessment & Mastery', 'checkbox', 12, 'active', NULL),
  ('requiredScore', 'Assessment & Mastery', 'text', 13, 'active', NULL),
  ('successCriteria', 'Assessment & Mastery', 'text', 14, 'active', NULL),
  ('capstoneLesson', 'Structure & Sequencing', 'text', 1, 'active', NULL),
  ('groupPlan', 'Structure & Sequencing', 'text', 2, 'active', NULL),
  ('groupSlidesPlan', 'Structure & Sequencing', 'text', 3, 'active', NULL),
  ('groupType', 'Structure & Sequencing', 'text', 4, 'active', NULL),
  ('lessonSequenceRules', 'Structure & Sequencing', 'text', 5, 'active', NULL),
  ('optionalLessons', 'Structure & Sequencing', 'text', 6, 'active', NULL),
  ('orderIndex', 'Structure & Sequencing', 'text', 7, 'active', NULL),
  ('progressionNotes', 'Structure & Sequencing', 'text', 8, 'active', NULL),
  ('purposeRelationshipTag', 'Structure & Sequencing', 'text', 9, 'active', NULL),
  ('requiredLessons', 'Structure & Sequencing', 'text', 10, 'active', NULL),
  ('sequenceType', 'Structure & Sequencing', 'text', 11, 'active', NULL),
  ('slidePlan', 'Structure & Sequencing', 'text', 12, 'active', NULL),
  ('culturalContext', 'Localization', 'text', 1, 'active', NULL),
  ('defaultLang', 'Localization', 'text', 2, 'active', NULL),
  ('l1InterferenceNotes', 'Localization', 'text', 3, 'active', NULL),
  ('registerTone', 'Localization', 'text', 4, 'active', NULL),
  ('registerVariants', 'Localization', 'text', 5, 'active', NULL),
  ('targetLanguage', 'Localization', 'text', 6, 'active', NULL),
  ('anecdoteOrMemoryHook', 'Teacher Guidance', 'text', 1, 'active', NULL),
  ('authorNotes', 'Teacher Guidance', 'text', 2, 'active', NULL),
  ('commonMisconceptions', 'Teacher Guidance', 'text', 3, 'active', NULL),
  ('notesForTeacherOrAI', 'Teacher Guidance', 'text', 4, 'active', NULL),
  ('shortSummaryLessonAdmin', 'Teacher Guidance', 'text', 5, 'active', NULL),
  ('shortSummaryLessonStudent', 'Teacher Guidance', 'text', 6, 'active', NULL),
  ('shortSummaryTeacherActivity', 'Teacher Guidance', 'text', 7, 'active', NULL),
  ('shortSummaryTeacherGroup', 'Teacher Guidance', 'text', 8, 'active', NULL),
  ('shortSummaryTeacherLesson', 'Teacher Guidance', 'text', 9, 'active', NULL),
  ('shortSummaryTeacherModule', 'Teacher Guidance', 'text', 10, 'active', NULL),
  ('shortSummaryTeacherSlide', 'Teacher Guidance', 'text', 11, 'active', NULL),
  ('teacherNotes', 'Teacher Guidance', 'text', 12, 'active', NULL),
  ('teacherOverview', 'Teacher Guidance', 'text', 13, 'active', NULL),
  ('aiInstructions', 'AI Generation & Prompting', 'text', 1, 'active', NULL),
  ('exampleResponses', 'AI Generation & Prompting', 'text', 2, 'active', NULL),
  ('expansionGuidelines', 'AI Generation & Prompting', 'text', 3, 'active', NULL),
  ('forbiddenPatterns', 'AI Generation & Prompting', 'text', 4, 'active', NULL),
  ('signatureMetaphors', 'AI Generation & Prompting', 'text', 5, 'active', NULL),
  ('simplificationGuidelines', 'AI Generation & Prompting', 'text', 6, 'active', NULL),
  ('styleConstraints', 'AI Generation & Prompting', 'text', 7, 'active', NULL),
  ('acceptedCorrections', 'Activities & Interaction', 'text', 1, 'active', NULL),
  ('activityTypes', 'Activities & Interaction', 'text', 2, 'active', NULL),
  ('audioA', 'Activities & Interaction', 'text', 3, 'active', NULL),
  ('audioB', 'Activities & Interaction', 'text', 4, 'active', NULL),
  ('audioClips', 'Activities & Interaction', 'text', 5, 'active', NULL),
  ('audioPrompt', 'Activities & Interaction', 'text', 6, 'active', NULL),
  ('avatarDialogues', 'Activities & Interaction', 'text', 7, 'active', NULL),
  ('blanks', 'Activities & Interaction', 'text', 8, 'active', NULL),
  ('categoryLabels', 'Activities & Interaction', 'text', 9, 'active', NULL),
  ('choiceElements', 'Activities & Interaction', 'text', 10, 'active', NULL),
  ('correctAnswer', 'Activities & Interaction', 'text', 11, 'active', NULL),
  ('correctCurveId', 'Activities & Interaction', 'text', 12, 'active', NULL),
  ('correctOddIndex', 'Activities & Interaction', 'text', 13, 'active', NULL),
  ('correctOrderClips', 'Activities & Interaction', 'text', 14, 'active', NULL),
  ('correctStressIndex', 'Activities & Interaction', 'text', 15, 'active', NULL),
  ('errorIndex', 'Activities & Interaction', 'text', 16, 'active', NULL),
  ('imageUrl', 'Activities & Interaction', 'text', 17, 'active', NULL),
  ('incorrectSentence', 'Activities & Interaction', 'text', 18, 'active', NULL),
  ('intonationOptions', 'Activities & Interaction', 'text', 19, 'active', NULL),
  ('keywordThreshold', 'Activities & Interaction', 'text', 20, 'active', NULL),
  ('letterUnits', 'Activities & Interaction', 'text', 21, 'active', NULL),
  ('lines', 'Activities & Interaction', 'text', 22, 'active', NULL),
  ('matchPairs', 'Activities & Interaction', 'text', 23, 'active', NULL),
  ('maxRetries', 'Activities & Interaction', 'text', 24, 'active', NULL),
  ('maxWordCount', 'Activities & Interaction', 'text', 25, 'active', NULL),
  ('minWordCount', 'Activities & Interaction', 'text', 26, 'active', NULL),
  ('passThreshold', 'Activities & Interaction', 'text', 27, 'active', NULL),
  ('promptMode', 'Activities & Interaction', 'text', 28, 'active', NULL),
  ('promptText', 'Activities & Interaction', 'text', 29, 'active', NULL),
  ('sentenceCards', 'Activities & Interaction', 'text', 30, 'active', NULL),
  ('sentenceTokens', 'Activities & Interaction', 'text', 31, 'active', NULL),
  ('sentenceWithGaps', 'Activities & Interaction', 'text', 32, 'active', NULL),
  ('statement', 'Activities & Interaction', 'text', 33, 'active', NULL),
  ('syllableBreakdown', 'Activities & Interaction', 'text', 34, 'active', NULL),
  ('targetKeywords', 'Activities & Interaction', 'text', 35, 'active', NULL),
  ('targetText', 'Activities & Interaction', 'text', 36, 'active', NULL),
  ('tenseBins', 'Activities & Interaction', 'text', 37, 'active', NULL),
  ('word', 'Activities & Interaction', 'text', 38, 'active', NULL),
  ('wordAudio', 'Activities & Interaction', 'text', 39, 'active', NULL),
  ('wordBank', 'Activities & Interaction', 'text', 40, 'active', NULL),
  ('correctOrderWords', 'Activities & Interaction', 'text', 41, 'active', NULL),
  ('propsJson', 'Activities & Interaction', 'json', 42, 'active', NULL),
  ('estimatedMinutes', 'Links, Dependencies & Summaries', 'text', 1, 'active', NULL),
  ('keyTakeawaysLesson', 'Links, Dependencies & Summaries', 'text', 2, 'active', NULL),
  ('keyTakeawaysSlide', 'Links, Dependencies & Summaries', 'text', 3, 'active', NULL),
  ('learningGoalPreviewGroup', 'Links, Dependencies & Summaries', 'text', 4, 'active', NULL),
  ('learningGoalPreviewLesson', 'Links, Dependencies & Summaries', 'text', 5, 'active', NULL),
  ('learningGoalPreviewModule', 'Links, Dependencies & Summaries', 'text', 6, 'active', NULL),
  ('linkedGroups', 'Links, Dependencies & Summaries', 'text', 7, 'active', NULL),
  ('linkedModules', 'Links, Dependencies & Summaries', 'text', 8, 'active', NULL),
  ('linkedResources', 'Links, Dependencies & Summaries', 'text', 9, 'active', NULL),
  ('timeExpectationActivity', 'Links, Dependencies & Summaries', 'text', 10, 'active', NULL),
  ('timeExpectationGroup', 'Links, Dependencies & Summaries', 'text', 11, 'active', NULL),
  ('timeExpectationLesson', 'Links, Dependencies & Summaries', 'text', 12, 'active', NULL),
  ('canonicalNodeKey', 'Telemetry & Analytics', 'text', 1, 'active', NULL),
  ('expectedCompletionRate', 'Telemetry & Analytics', 'text', 2, 'active', NULL),
  ('expectedModuleDurationMinutes', 'Telemetry & Analytics', 'text', 3, 'active', NULL),
  ('expectedTimeOnTask', 'Telemetry & Analytics', 'text', 4, 'active', NULL),
  ('experimentFlag', 'Telemetry & Analytics', 'text', 5, 'active', NULL),
  ('targetedEdges', 'Telemetry & Analytics', 'text', 6, 'active', NULL),
  ('targetedNodes', 'Telemetry & Analytics', 'text', 7, 'active', NULL),
  ('targetedSlices', 'Telemetry & Analytics', 'text', 8, 'active', NULL),
  ('targetNodeKeys', 'Telemetry & Analytics', 'text', 9, 'active', NULL),
  ('telemetryTags', 'Telemetry & Analytics', 'text', 10, 'active', NULL),
  ('breakingChangeGuard', 'Operations, Provenance & Governance', 'checkbox', 1, 'active', NULL),
  ('changeImpactAssessment', 'Operations, Provenance & Governance', 'text', 2, 'active', NULL),
  ('diffLog', 'Operations, Provenance & Governance', 'text', 3, 'active', NULL),
  ('extractabilityTier', 'Operations, Provenance & Governance', 'text', 4, 'active', NULL),
  ('ingestPayload', 'Operations, Provenance & Governance', 'text', 5, 'active', NULL),
  ('ingestSource', 'Operations, Provenance & Governance', 'text', 6, 'active', NULL),
  ('manualOverrideJson', 'Operations, Provenance & Governance', 'text', 7, 'active', NULL),
  ('metadata', 'Operations, Provenance & Governance', 'text', 8, 'active', NULL),
  ('publishNotes', 'Operations, Provenance & Governance', 'text', 9, 'active', NULL),
  ('reviewRequired', 'Operations, Provenance & Governance', 'checkbox', 10, 'active', NULL),
  ('runtimeContractV1', 'Operations, Provenance & Governance', 'text', 11, 'active', NULL),
  ('sourceVersion', 'Identity & Lifecycle', 'text', 15, 'active', NULL);

UPDATE public.field_dictionary
SET input_type = 'json'
WHERE field_key IN (
  'buttons',
  'diffLog',
  'ingestPayload',
  'lessonEndActions',
  'manualOverrideJson',
  'metadata',
  'propsJson',
  'runtimeContractV1'
);

UPDATE public.field_dictionary
SET input_type = 'list'
WHERE field_key IN (
  'acceptedCorrections',
  'categoryLabels',
  'correctOrderClips',
  'letterUnits',
  'sentenceCards',
  'sentenceTokens',
  'targetKeywords',
  'tenseBins',
  'wordBank'
);

UPDATE public.field_dictionary
SET input_type = 'audio_selector'
WHERE field_key IN ('audioA', 'audioB', 'audioId');

UPDATE public.field_dictionary
SET input_type = 'audio_list'
WHERE field_key = 'audioClips';

UPDATE public.field_dictionary
SET input_type = 'audio_prompt'
WHERE field_key IN ('audioPrompt', 'wordAudio');

UPDATE public.field_dictionary
SET input_type = 'blanks_mapper'
WHERE field_key = 'blanks';

UPDATE public.field_dictionary
SET input_type = 'audio_lines_mapper'
WHERE field_key = 'lines';

UPDATE public.field_dictionary
SET input_type = 'choice_elements_mapper'
WHERE field_key = 'choiceElements';

UPDATE public.field_dictionary
SET input_type = 'match_pairs_mapper'
WHERE field_key = 'matchPairs';

UPDATE public.field_dictionary
SET input_type = 'avatar_dialogues_mapper'
WHERE field_key = 'avatarDialogues';

UPDATE public.field_dictionary
SET input_type = 'media_picker'
WHERE field_key = 'imageUrl';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["1","2","3","4","5","6","7","8","9","10"]'::jsonb,
  select_source = NULL
WHERE field_key IN ('levelMin', 'levelMax');

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["A0","A1","A2","B1","B2","C1","C2"]'::jsonb,
  select_source = NULL
WHERE field_key IN ('cefrLevel', 'cefrMin', 'cefrMax');

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["same","different"]'::jsonb,
  select_source = 'option_id'
WHERE field_key = 'correctAnswer';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["rising","falling","fall-rise"]'::jsonb,
  select_source = NULL
WHERE field_key = 'correctCurveId';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["english","french","both"]'::jsonb,
  select_source = NULL
WHERE field_key = 'defaultLang';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["HIGH","MEDIUM","LOW"]'::jsonb,
  select_source = NULL
WHERE field_key = 'extractabilityTier';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["ORIENTATION","INPUT","SCAFFOLDED_PRACTICE","TARGET_PERFORMANCE","INTEGRATION"]'::jsonb,
  select_source = NULL
WHERE field_key = 'groupType';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["lv2_pipeline","manual","import","ai_generate"]'::jsonb,
  select_source = NULL
WHERE field_key = 'ingestSource';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["percent_correct","raw_score","rubric_based","completion_only"]'::jsonb,
  select_source = NULL
WHERE field_key = 'masteryRule';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["completion","avg_score_threshold","capstone_required"]'::jsonb,
  select_source = NULL
WHERE field_key = 'moduleMasteryRule';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["percent","raw","none"]'::jsonb,
  select_source = NULL
WHERE field_key = 'passingScoreType';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["explicit","guided_discovery","task_based","spaced_retrieval","contrastive_analysis","mixed"]'::jsonb,
  select_source = NULL
WHERE field_key = 'pedagogicalStrategy';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["start_lesson","continue"]'::jsonb,
  select_source = NULL
WHERE field_key = 'primaryCtaAction';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["same_different","select_word"]'::jsonb,
  select_source = NULL
WHERE field_key = 'promptMode';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["PREPARE_FOR_PURPOSE","SUPPORT_FIRST_CONTROL","MEASURE_FIRST_CONTROL","STABILIZE_TRANSFER"]'::jsonb,
  select_source = NULL
WHERE field_key = 'purposeRelationshipTag';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["repeat_lesson","next_lesson","review_mistakes","exit"]'::jsonb,
  select_source = NULL
WHERE field_key = 'recommendedNextStep';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["formal","neutral","informal","mixed"]'::jsonb,
  select_source = NULL
WHERE field_key = 'registerTone';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["unlimited","limited","none"]'::jsonb,
  select_source = NULL
WHERE field_key = 'retryPolicy';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["linear","flexible","adaptive"]'::jsonb,
  select_source = NULL
WHERE field_key = 'sequenceType';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["allow_all","allow_after_min_attempts","no_skip"]'::jsonb,
  select_source = NULL
WHERE field_key = 'skipPolicy';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["MOTIVATION","INSTRUCTION","EXPLANATION","EXAMPLE","FEEDBACK_SUMMARY"]'::jsonb,
  select_source = NULL
WHERE field_key = 'textSubtype';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = '["private","beta","public"]'::jsonb,
  select_source = NULL
WHERE field_key = 'visibility';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = NULL,
  select_source = 'lessons'
WHERE field_key = 'capstoneLesson';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = NULL,
  select_source = 'modules'
WHERE field_key = 'moduleId';

UPDATE public.field_dictionary
SET
  input_type = 'select',
  select_options_json = NULL,
  select_source = 'levels'
WHERE field_key IN ('levels', 'level');

-- Canonical category/field ordering for UI config/edit rendering.
-- NOTE: levelMax/levelMin are the canonical replacements for legacy bandMax/bandMin.
WITH desired_field_order(field_key, category_name, field_order) AS (
  VALUES
    ('activityId', 'Identity & Lifecycle', 1),
    ('groupId', 'Identity & Lifecycle', 2),
    ('groupName', 'Identity & Lifecycle', 3),
    ('lastUpdatedAt', 'Identity & Lifecycle', 4),
    ('lastUpdatedBy', 'Identity & Lifecycle', 5),
    ('lessonId', 'Identity & Lifecycle', 6),
    ('moduleId', 'Identity & Lifecycle', 7),
    ('ownerTeam', 'Identity & Lifecycle', 8),
    ('slideId', 'Identity & Lifecycle', 9),
    ('slug', 'Identity & Lifecycle', 10),
    ('title', 'Identity & Lifecycle', 11),
    ('version', 'Identity & Lifecycle', 12),
    ('visibility', 'Identity & Lifecycle', 13),
    ('sourceVersion', 'Identity & Lifecycle', 14),
    ('type', 'Identity & Lifecycle', 15),
    ('moduleGoal', 'Purpose & Outcomes', 1),
    ('moduleOutcomes', 'Purpose & Outcomes', 2),
    ('groupGoal', 'Purpose & Outcomes', 3),
    ('groupSummary', 'Purpose & Outcomes', 4),
    ('description', 'Purpose & Outcomes', 5),
    ('activityDescription', 'Purpose & Outcomes', 6),
    ('learningObjectives', 'Purpose & Outcomes', 7),
    ('competencyTags', 'Purpose & Outcomes', 8),
    ('tags', 'Purpose & Outcomes', 9),
    ('coreTopics', 'Purpose & Outcomes', 10),
    ('topicCategory', 'Purpose & Outcomes', 11),
    ('keywords', 'Purpose & Outcomes', 12),
    ('audienceNotes', 'Scope, Prerequisites & Targeting', 1),
    ('level', 'Scope, Prerequisites & Targeting', 2),
    ('cefrLevel', 'Scope, Prerequisites & Targeting', 3),
    ('levelMax', 'Scope, Prerequisites & Targeting', 4),
    ('cefrMax', 'Scope, Prerequisites & Targeting', 5),
    ('levelMin', 'Scope, Prerequisites & Targeting', 6),
    ('cefrMin', 'Scope, Prerequisites & Targeting', 7),
    ('diagnosticChecks', 'Scope, Prerequisites & Targeting', 8),
    ('prerequisiteModules', 'Scope, Prerequisites & Targeting', 9),
    ('prerequisites', 'Scope, Prerequisites & Targeting', 10),
    ('priorLessons', 'Scope, Prerequisites & Targeting', 11),
    ('prerequisiteEdges', 'Scope, Prerequisites & Targeting', 12),
    ('prerequisiteNodes', 'Scope, Prerequisites & Targeting', 13),
    ('prerequisiteSlices', 'Scope, Prerequisites & Targeting', 14),
    ('audioId', 'Content & Media', 1),
    ('subtitle', 'Content & Media', 2),
    ('textSubtype', 'Content & Media', 3),
    ('note', 'Content & Media', 4),
    ('body', 'Content & Media', 5),
    ('body1', 'Content & Media', 6),
    ('body2', 'Content & Media', 7),
    ('body3', 'Content & Media', 8),
    ('body4', 'Content & Media', 9),
    ('body5', 'Content & Media', 10),
    ('body6', 'Content & Media', 11),
    ('body7', 'Content & Media', 12),
    ('body8', 'Content & Media', 13),
    ('buttons', 'Content & Media', 14),
    ('lessonEndMessage', 'Content & Media', 15),
    ('lessonEndActions', 'Content & Media', 16),
    ('primaryCtaAction', 'Content & Media', 17),
    ('primaryCtaLabel', 'Content & Media', 18),
    ('instructions', 'Instructions & Flow', 1),
    ('allowRetry', 'Instructions & Flow', 2),
    ('retryPolicy', 'Instructions & Flow', 3),
    ('allowSkip', 'Instructions & Flow', 4),
    ('skipPolicy', 'Instructions & Flow', 5),
    ('minAttemptsBeforeSkip', 'Instructions & Flow', 6),
    ('autoAdvance', 'Instructions & Flow', 7),
    ('delayMs', 'Instructions & Flow', 8),
    ('recommendedNextStep', 'Instructions & Flow', 9),
    ('scaffoldingPlan', 'Pedagogy & Scaffolding', 1),
    ('pedagogicalStrategy', 'Pedagogy & Scaffolding', 2),
    ('differentiationPaths', 'Pedagogy & Scaffolding', 3),
    ('differentiationStrategies', 'Pedagogy & Scaffolding', 4),
    ('remediationGuidance', 'Pedagogy & Scaffolding', 5),
    ('remediationPaths', 'Pedagogy & Scaffolding', 6),
    ('discourseFocus', 'Pedagogy & Scaffolding', 7),
    ('grammarFocus', 'Pedagogy & Scaffolding', 8),
    ('pronunciationFocus', 'Pedagogy & Scaffolding', 9),
    ('vocabularyTheme', 'Pedagogy & Scaffolding', 10),
    ('extraPracticeNotes', 'Pedagogy & Scaffolding', 11),
    ('pacingNotes', 'Pedagogy & Scaffolding', 12),
    ('practiceProgression', 'Pedagogy & Scaffolding', 13),
    ('moduleAssessmentPlan', 'Assessment & Mastery', 1),
    ('moduleMasteryRule', 'Assessment & Mastery', 2),
    ('moduleMasteryThreshold', 'Assessment & Mastery', 3),
    ('assessmentPlan', 'Assessment & Mastery', 4),
    ('successCriteria', 'Assessment & Mastery', 5),
    ('isRequiredToPass', 'Assessment & Mastery', 6),
    ('passRequiredForNext', 'Assessment & Mastery', 7),
    ('passingScoreType', 'Assessment & Mastery', 8),
    ('passingScoreValue', 'Assessment & Mastery', 9),
    ('requiredScore', 'Assessment & Mastery', 10),
    ('maxAttempts', 'Assessment & Mastery', 11),
    ('maxScoreValue', 'Assessment & Mastery', 12),
    ('masteryRule', 'Assessment & Mastery', 13),
    ('masteryThreshold', 'Assessment & Mastery', 14),
    ('orderIndex', 'Structure & Sequencing', 1),
    ('capstoneLesson', 'Structure & Sequencing', 2),
    ('lessonSequenceRules', 'Structure & Sequencing', 3),
    ('requiredLessons', 'Structure & Sequencing', 4),
    ('optionalLessons', 'Structure & Sequencing', 5),
    ('groupPlan', 'Structure & Sequencing', 6),
    ('groupSlidesPlan', 'Structure & Sequencing', 7),
    ('groupType', 'Structure & Sequencing', 8),
    ('progressionNotes', 'Structure & Sequencing', 9),
    ('purposeRelationshipTag', 'Structure & Sequencing', 10),
    ('sequenceType', 'Structure & Sequencing', 11),
    ('slidePlan', 'Structure & Sequencing', 12),
    ('teacherNotes', 'Teacher Guidance', 1),
    ('teacherOverview', 'Teacher Guidance', 2),
    ('notesForTeacherOrAI', 'Teacher Guidance', 3),
    ('authorNotes', 'Teacher Guidance', 4),
    ('anecdoteOrMemoryHook', 'Teacher Guidance', 5),
    ('commonMisconceptions', 'Teacher Guidance', 6),
    ('shortSummaryTeacherModule', 'Teacher Guidance', 7),
    ('shortSummaryLessonAdmin', 'Teacher Guidance', 8),
    ('shortSummaryTeacherLesson', 'Teacher Guidance', 9),
    ('shortSummaryLessonStudent', 'Teacher Guidance', 10),
    ('shortSummaryTeacherGroup', 'Teacher Guidance', 11),
    ('shortSummaryTeacherActivity', 'Teacher Guidance', 12),
    ('shortSummaryTeacherSlide', 'Teacher Guidance', 13),
    ('aiInstructions', 'AI Generation & Prompting', 1),
    ('exampleResponses', 'AI Generation & Prompting', 2),
    ('expansionGuidelines', 'AI Generation & Prompting', 3),
    ('forbiddenPatterns', 'AI Generation & Prompting', 4),
    ('signatureMetaphors', 'AI Generation & Prompting', 5),
    ('simplificationGuidelines', 'AI Generation & Prompting', 6),
    ('styleConstraints', 'AI Generation & Prompting', 7),
    ('keyTakeawaysLesson', 'Links, Dependencies & Summaries', 1),
    ('keyTakeawaysSlide', 'Links, Dependencies & Summaries', 2),
    ('learningGoalPreviewModule', 'Links, Dependencies & Summaries', 3),
    ('learningGoalPreviewLesson', 'Links, Dependencies & Summaries', 4),
    ('learningGoalPreviewGroup', 'Links, Dependencies & Summaries', 5),
    ('linkedModules', 'Links, Dependencies & Summaries', 6),
    ('linkedGroups', 'Links, Dependencies & Summaries', 7),
    ('linkedResources', 'Links, Dependencies & Summaries', 8),
    ('timeExpectationLesson', 'Links, Dependencies & Summaries', 9),
    ('timeExpectationGroup', 'Links, Dependencies & Summaries', 10),
    ('timeExpectationActivity', 'Links, Dependencies & Summaries', 11),
    ('estimatedMinutes', 'Links, Dependencies & Summaries', 12),
    ('breakingChangeGuard', 'Operations, Provenance & Governance', 1),
    ('changeImpactAssessment', 'Operations, Provenance & Governance', 2),
    ('diffLog', 'Operations, Provenance & Governance', 3),
    ('extractabilityTier', 'Operations, Provenance & Governance', 4),
    ('ingestPayload', 'Operations, Provenance & Governance', 5),
    ('ingestSource', 'Operations, Provenance & Governance', 6),
    ('manualOverrideJson', 'Operations, Provenance & Governance', 7),
    ('metadata', 'Operations, Provenance & Governance', 8),
    ('publishNotes', 'Operations, Provenance & Governance', 9),
    ('reviewRequired', 'Operations, Provenance & Governance', 10),
    ('runtimeContractV1', 'Operations, Provenance & Governance', 11)
)
UPDATE public.field_dictionary fd
SET
  category_name = desired.category_name,
  field_order = desired.field_order
FROM desired_field_order desired
WHERE fd.field_key = desired.field_key;

UPDATE public.field_dictionary
SET is_read_only = false;

UPDATE public.field_dictionary
SET is_read_only = true
WHERE field_key IN (
  'activityId',
  'groupId',
  'groupName',
  'lastUpdatedAt',
  'lessonId',
  'priorLessons',
  'slideId',
  'targetLanguage',
  'targetNodeKeys',
  'type',
  'version'
);

-- Keep component field activation empty until explicitly assigned by operator.
DELETE FROM public.field_dictionary_component_rules;
DELETE FROM public.component_config_fields;
