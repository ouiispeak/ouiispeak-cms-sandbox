# Speech Choice Verify - Player Implementation Guide

## Overview

`speech-choice-verify` is a new slide type that combines elements of `speech-match` and `ai-speak-student-repeat`. The key difference from `speech-match` is that **the recording button is active by default** when the slide loads, rather than playing audio first.

## Data Structure

The slide data structure (from CMS) matches `speech-match` but with `referenceText` added to each element:

```typescript
interface SpeechChoiceVerifySlideProps {
  title: string;
  subtitle?: string;        // Instructions
  note?: string;            // Optional note below subtitle
  elements: Array<{
    label: string;          // Display text: "A", "B", "J", "G"
    referenceText: string; // For matching: "J", "jay", "G", "gee"
    speech: {
      mode: "tts" | "file";
      lang?: "en" | "fr";
      text?: string;        // For TTS mode
      fileUrl?: string;     // For file mode
    };
  }>;
  defaultLang?: "english" | "french" | "both";
  // ... other base props
}
```

## Player Component Behavior

### Initial State
1. **Display choices** as buttons (like `speech-match`)
2. **Recording button is ACTIVE** (unlike `speech-match` which plays audio first)
3. Show instructions: "Say a letter" or similar (from `subtitle`)

### Flow

#### Step 1: Student Speaks
- Student sees all choice buttons (A-Z or whatever choices are configured)
- Recording button is active/ready
- Student speaks freely (e.g., "J")

#### Step 2: Whisper Transcription
- Record audio → send to Whisper `/api/transcribe` endpoint
- Get transcribed text (e.g., "G" - incorrect match)

#### Step 3: Auto-Match & Highlight
- Match transcribed text to `referenceText` of choices
- **Auto-highlight matched choice in ORANGE** (e.g., "G" lights up orange)
- If no match found, show "No match found" message

#### Step 4: Student Verification
- **If correct**: Student clicks the orange-highlighted choice
  - Choice turns **GREEN**
  - Play success sound (like `speech-match`)
  - Move to next slide/element
  
- **If incorrect**: Student clicks a different choice (the correct one)
  - System plays audio for that choice (from `speech` field)
  - Student hears correct pronunciation
  - Recording button becomes active again
  - Student retries speaking

#### Step 5: Retry Loop
- Student records again, trying to match the correct choice
- Repeat until correct match → green highlight + success sound

## Key Differences from Speech-Match

| Feature | Speech-Match | Speech-Choice-Verify |
|---------|-------------|---------------------|
| **Initial State** | Audio plays first | Recording button active |
| **Interaction** | Listen → Click | Speak → Verify → Retry if wrong |
| **Matching** | Audio to choice | Speech transcription to choice |
| **Verification** | N/A | Student confirms/corrects match |
| **Retry** | Click different choice | Record again after hearing audio |
| **Success** | Green + sound | Green + sound (same) |

## Implementation Checklist

### Required Components
- [ ] `SpeechChoiceVerifySlide.tsx` component
- [ ] Recording UI (reuse from `ai-speak-student-repeat`)
- [ ] Choice buttons (reuse from `speech-match`)
- [ ] Orange highlight state for auto-matched choice
- [ ] Green highlight state for confirmed correct choice
- [ ] Audio playback (reuse from `speech-match`)

### Required API Calls
- [ ] Whisper transcription API: `POST /api/transcribe`
  - Accepts: audio file (FormData)
  - Returns: `{ text: string }` (transcribed text)
- [ ] Matching logic: match transcribed text to `referenceText` values
  - Exact match: "J" → "J"
  - Case-insensitive: "j" → "J"
  - Phonetic variations: "jay" → "J", "gee" → "G"

### State Management
```typescript
interface SpeechChoiceVerifyState {
  choices: ChoiceElement[];
  selectedChoice: string | null;        // Currently selected choice ID
  autoMatchedChoice: string | null;     // Choice matched by Whisper (orange)
  confirmedChoice: string | null;       // Confirmed correct choice (green)
  recording: boolean;
  transcription: string | null;
  verificationStatus: 'pending' | 'confirmed' | 'corrected';
  audioPlaying: boolean;
}
```

### Visual States
- **Default**: All choices normal, recording button active
- **Orange**: Auto-matched choice highlighted (after Whisper match)
- **Green**: Confirmed correct choice (after student verification)
- **Audio Playing**: Show visual indicator when playing audio for correction

## Example Flow

1. Slide loads → Show choices: A, B, C, D, ..., J, G, ..., Z
2. Recording button active → Student says "J"
3. Whisper transcribes → "G" (incorrect)
4. System matches → "G" lights up **orange**
5. Student sees orange "G" → Clicks "J" instead (correct choice)
6. System plays audio for "J" → Student hears correct pronunciation
7. Recording button active again → Student says "J" again
8. Whisper transcribes → "J" (correct)
9. System matches → "J" lights up **orange**
10. Student clicks "J" → Turns **green** + success sound
11. Move to next slide/element

## Testing Scenarios

1. **Correct first try**: Student says correct letter → auto-match → student confirms → success
2. **Incorrect first try**: Student says wrong letter → auto-match wrong → student corrects → retry → success
3. **No match**: Student says something unrecognizable → show "No match" → student clicks correct choice → retry
4. **Phonetic confusion**: Student says "jay" → matches "J" → success
5. **Case variations**: Student says "j" → matches "J" → success

## Notes

- The `referenceText` field allows for phonetic variations (e.g., "jay" for "J")
- Audio playback is required for correction (helps student learn correct pronunciation)
- Retry loop continues until correct match is confirmed
- Success feedback matches `speech-match` (green highlight + sound)


