/**
 * Slide Type Constants
 * 
 * Centralized constants for all slide-related string values.
 * This prevents typos, improves type safety, and makes refactoring easier.
 * 
 * Usage:
 *   import { SLIDE_TYPES, CMS_LANGUAGES, PLAYER_LANGUAGES, SPEECH_MODES } from '@/lib/constants/slideConstants';
 * 
 * Last updated: [Current Date]
 */

// ============================================================================
// Slide Types
// ============================================================================

/**
 * All valid slide type values
 */
export const SLIDE_TYPES = {
  TEXT: "text-slide",
  TITLE: "title-slide",
  LESSON_END: "lesson-end",
  AI_SPEAK_REPEAT: "ai-speak-repeat",
  AI_SPEAK_STUDENT_REPEAT: "ai-speak-student-repeat",
  STUDENT_RECORD_ACCURACY: "student-record-accuracy",
  STUDENT_SPEAK_ONLY: "student-speak-only",
  SPELL_AND_PRONOUNCE: "spell-and-pronounce",
  SPEECH_MATCH: "speech-match",
  SPEECH_CHOICE_VERIFY: "speech-choice-verify",
  AVATAR_COMMAND_ROUND: "avatar-command-round",
  /** LLM-proposed activity type not yet implemented. Manual implementation needed. */
  NEED_TO_BE_CREATED: "need-to-be-created",
} as const;

/**
 * Type for slide type values
 */
export type SlideType = typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES];

/**
 * Array of all slide type values (useful for validation, iteration)
 */
export const SLIDE_TYPE_VALUES = Object.values(SLIDE_TYPES);

/**
 * Check if a string is a valid slide type
 */
export function isValidSlideType(value: string): value is SlideType {
  return SLIDE_TYPE_VALUES.includes(value as SlideType);
}

// ============================================================================
// CMS Languages
// ============================================================================

/**
 * Language values used in CMS (stored in props_json)
 */
export const CMS_LANGUAGES = {
  ENGLISH: "english",
  FRENCH: "french",
  BOTH: "both",
  EMPTY: "",
} as const;

/**
 * Type for CMS language values
 */
export type CmsLanguage = typeof CMS_LANGUAGES[keyof typeof CMS_LANGUAGES];

/**
 * Array of all CMS language values
 */
export const CMS_LANGUAGE_VALUES = Object.values(CMS_LANGUAGES);

/**
 * Check if a string is a valid CMS language
 */
export function isValidCmsLanguage(value: string): value is CmsLanguage {
  return CMS_LANGUAGE_VALUES.includes(value as CmsLanguage);
}

// ============================================================================
// Player Languages
// ============================================================================

/**
 * Language values used in Player (for TTS)
 */
export const PLAYER_LANGUAGES = {
  ENGLISH: "en",
  FRENCH: "fr",
} as const;

/**
 * Type for player language values
 */
export type PlayerLanguage = typeof PLAYER_LANGUAGES[keyof typeof PLAYER_LANGUAGES];

/**
 * Array of all player language values
 */
export const PLAYER_LANGUAGE_VALUES = Object.values(PLAYER_LANGUAGES);

/**
 * Check if a string is a valid player language
 */
export function isValidPlayerLanguage(value: string): value is PlayerLanguage {
  return PLAYER_LANGUAGE_VALUES.includes(value as PlayerLanguage);
}

// ============================================================================
// Speech Modes
// ============================================================================

/**
 * Speech mode values for audio playback
 */
export const SPEECH_MODES = {
  TTS: "tts",
  FILE: "file",
} as const;

/**
 * Type for speech mode values
 */
export type SpeechMode = typeof SPEECH_MODES[keyof typeof SPEECH_MODES];

/**
 * Array of all speech mode values
 */
export const SPEECH_MODE_VALUES = Object.values(SPEECH_MODES);

/**
 * Check if a string is a valid speech mode
 */
export function isValidSpeechMode(value: string): value is SpeechMode {
  return SPEECH_MODE_VALUES.includes(value as SpeechMode);
}

// ============================================================================
// Language Mapping
// ============================================================================

/**
 * Map CMS language format to player format
 */
export function mapCmsLanguageToPlayer(cmsLang: CmsLanguage): PlayerLanguage {
  const langMap: Record<CmsLanguage, PlayerLanguage> = {
    [CMS_LANGUAGES.ENGLISH]: PLAYER_LANGUAGES.ENGLISH,
    [CMS_LANGUAGES.FRENCH]: PLAYER_LANGUAGES.FRENCH,
    [CMS_LANGUAGES.BOTH]: PLAYER_LANGUAGES.ENGLISH, // Default to 'en' for 'both', player will handle TTS accordingly
    [CMS_LANGUAGES.EMPTY]: PLAYER_LANGUAGES.ENGLISH, // Default to 'en' for empty
  };
  return langMap[cmsLang] || PLAYER_LANGUAGES.ENGLISH; // Fallback to 'en'
}

// ============================================================================
// Types are already exported above (export type SlideType = ...)
// No need to re-export here
// ============================================================================

