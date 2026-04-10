"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import AudioPromptField from "@/components/custom-fields/AudioPromptField";
import BlanksMapper, { type BlankMapperRow } from "@/components/custom-fields/BlanksMapper";
import AudioFileSelector from "@/components/custom-fields/AudioFileSelector";
import AudioLinesMapper, { type AudioLinesValue } from "@/components/custom-fields/AudioLinesMapper";
import ChoiceElementMapper, {
  type ChoiceElementValue as ChoiceElement,
  type SpeechLang,
  type SpeechMode,
  type SpeechValue as Speech,
} from "@/components/custom-fields/ChoiceElementMapper";
import MatchPairsMapper, { type MatchPairValue as MatchPair } from "@/components/custom-fields/MatchPairsMapper";
import DialogueTurnsMapper, {
  type DialogueTurnValue as DialogueTurn,
} from "@/components/custom-fields/DialogueTurnsMapper";

type AudioPromptValue = {
  label: string;
  speech: Speech;
};


type WordBankItem = {
  word: string;
  category: string;
};

type SentenceCard = {
  text: string;
  correct_tense: string;
};

type AudioClip = ChoiceElement;

type CustomInputType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "json"
  | "list"
  | "audio_selector"
  | "audio_list"
  | "audio_prompt"
  | "blanks_mapper"
  | "audio_lines_mapper"
  | "choice_elements_mapper"
  | "match_pairs_mapper"
  | "avatar_dialogues_mapper"
  | "media_picker";

type CompositeField = {
  key: string;
  name: string;
  defaultValue?: string;
};

type CustomFieldInputProps = {
  id: string;
  name: string;
  inputType: CustomInputType;
  fieldKey?: string;
  compositeFields?: CompositeField[];
  defaultValue?: string;
  readOnly: boolean;
};

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function toStringValue(value: string | undefined): string {
  return typeof value === "string" ? value : "";
}

function asSpeech(value: unknown): Speech {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { mode: "tts", lang: "en", text: "" };
  }
  const row = value as Record<string, unknown>;
  const mode: SpeechMode = row.mode === "file" ? "file" : "tts";
  const lang: SpeechLang = row.lang === "fr" ? "fr" : "en";
  return {
    mode,
    lang,
    text: typeof row.text === "string" ? row.text : "",
    fileUrl: typeof row.fileUrl === "string" ? row.fileUrl : "",
  };
}

function asChoiceElement(value: unknown): ChoiceElement {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { label: "", speech: { mode: "tts", lang: "en", text: "" } };
  }
  const row = value as Record<string, unknown>;
  return {
    label: typeof row.label === "string" ? row.label : "",
    speech: asSpeech(row.speech),
  };
}

function asBlankRow(value: unknown): BlankMapperRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { correctGapIndex: "", acceptedAlternatives: "" };
  }
  const row = value as Record<string, unknown>;
  return {
    correctGapIndex: typeof row.correctGapIndex === "string" ? row.correctGapIndex : "",
    acceptedAlternatives:
      typeof row.acceptedAlternatives === "string" ? row.acceptedAlternatives : "",
  };
}

function asMatchPair(value: unknown): MatchPair {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { left: "", right: "" };
  }
  const row = value as Record<string, unknown>;
  return {
    left: typeof row.left === "string" ? row.left : "",
    right: typeof row.right === "string" ? row.right : "",
  };
}

function asDialogueTurn(value: unknown, index: number): DialogueTurn {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      id: `turn-${index + 1}`,
      avatarLine: "",
      avatarAction: "",
      audioFile: "",
      correctResponses: [],
    };
  }
  const row = value as Record<string, unknown>;
  let audioFile = typeof row.audioFile === "string" ? row.audioFile : "";
  if (!audioFile && row.audio && typeof row.audio === "object" && !Array.isArray(row.audio)) {
    const audioRow = row.audio as Record<string, unknown>;
    if (audioRow.speech && typeof audioRow.speech === "object" && !Array.isArray(audioRow.speech)) {
      const speechRow = audioRow.speech as Record<string, unknown>;
      if (speechRow.mode === "file" && typeof speechRow.fileUrl === "string") {
        audioFile = speechRow.fileUrl;
      }
    }
  }

  const responses = Array.isArray(row.correctResponses)
    ? row.correctResponses.filter((item): item is string => typeof item === "string")
    : [];
  return {
    id: typeof row.id === "string" && row.id.trim() ? row.id : `turn-${index + 1}`,
    avatarLine: typeof row.avatarLine === "string" ? row.avatarLine : "",
    avatarAction: typeof row.avatarAction === "string" ? row.avatarAction : "",
    audioFile,
    correctResponses: responses,
  };
}

function parseAudioList(value: string | undefined): string[] {
  const fromJson = parseJson<unknown>(value, null);
  if (Array.isArray(fromJson)) {
    return fromJson.filter((item): item is string => typeof item === "string");
  }
  const source = toStringValue(value);
  if (!source.trim()) {
    return [];
  }
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseChoiceElements(value: string | undefined): ChoiceElement[] {
  const parsed = parseJson<unknown>(value, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((row) => asChoiceElement(row));
}

function parseAudioPrompt(value: string | undefined): AudioPromptValue {
  const parsed = parseJson<unknown>(value, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { label: "", speech: { mode: "tts", lang: "en", text: "" } };
  }
  const row = parsed as Record<string, unknown>;
  return {
    label: typeof row.label === "string" ? row.label : "",
    speech: asSpeech(row.speech),
  };
}

function parseBlanks(value: string | undefined): BlankMapperRow[] {
  const parsed = parseJson<unknown>(value, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((row) => asBlankRow(row));
}

function parseLines(value: string | undefined): AudioLinesValue {
  const parsed = parseJson<unknown>(value, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((row) => {
    if (!Array.isArray(row)) {
      return [] as ChoiceElement[];
    }
    return row.map((cell) => asChoiceElement(cell));
  });
}

function parsePairs(value: string | undefined): MatchPair[] {
  const parsed = parseJson<unknown>(value, null);
  if (Array.isArray(parsed)) {
    return parsed.map((row) => asMatchPair(row));
  }
  const source = toStringValue(value);
  if (!source.trim()) {
    return [];
  }
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, right] = line.split("|").map((part) => part.trim());
      return { left: left ?? "", right: right ?? "" };
    });
}

function parseDialogues(value: string | undefined): DialogueTurn[] {
  const parsed = parseJson<unknown>(value, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((row, index) => asDialogueTurn(row, index));
}

function toSerializedDialogueTurns(dialogues: DialogueTurn[]): string {
  const payload = dialogues.map((turn) => {
    const trimmedAudioFile = turn.audioFile.trim();
    const normalizedResponses = turn.correctResponses
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (!trimmedAudioFile) {
      return {
        id: turn.id,
        avatarLine: turn.avatarLine,
        avatarAction: turn.avatarAction,
        correctResponses: normalizedResponses,
      };
    }

    return {
      id: turn.id,
      avatarLine: turn.avatarLine,
      avatarAction: turn.avatarAction,
      audioFile: trimmedAudioFile,
      audio: {
        speech: {
          mode: "file" as const,
          fileUrl: trimmedAudioFile,
        },
      },
      correctResponses: normalizedResponses,
    };
  });

  return JSON.stringify(payload);
}

function parseStringArray(value: string | undefined): string[] {
  const parsed = parseJson<unknown>(value, null);
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === "string");
  }
  const source = toStringValue(value);
  if (!source.trim()) {
    return [];
  }
  return source
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberArray(value: string | undefined): number[] {
  const parsed = parseJson<unknown>(value, null);
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item))
      .map((item) => Math.trunc(item));
  }

  const source = toStringValue(value);
  if (!source.trim()) {
    return [];
  }

  return source
    .split(/\n|,/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item))
    .map((item) => Math.trunc(item));
}

function parseWordBankItems(value: string | undefined): WordBankItem[] {
  const parsed = parseJson<unknown>(value, null);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return { word: "", category: "" };
      }
      const row = item as Record<string, unknown>;
      return {
        word: typeof row.word === "string" ? row.word : "",
        category: typeof row.category === "string" ? row.category : "",
      };
    });
  }

  const source = toStringValue(value);
  if (!source.trim()) {
    return [];
  }

  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [word, category] = line.split("|").map((part) => part.trim());
      return { word: word ?? "", category: category ?? "" };
    });
}

function parseSentenceCards(value: string | undefined): SentenceCard[] {
  const parsed = parseJson<unknown>(value, null);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return { text: "", correct_tense: "" };
      }
      const row = item as Record<string, unknown>;
      return {
        text: typeof row.text === "string" ? row.text : "",
        correct_tense: typeof row.correct_tense === "string" ? row.correct_tense : "",
      };
    });
  }

  const source = toStringValue(value);
  if (!source.trim()) {
    return [];
  }

  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [text, tense] = line.split("|").map((part) => part.trim());
      return { text: text ?? "", correct_tense: tense ?? "" };
    });
}

function HiddenValue({ name, value }: { name: string; value: string }) {
  return <input type="hidden" name={name} value={value} />;
}

function HiddenCompositeValue({
  compositeFields,
  fieldKey,
  value,
}: {
  compositeFields: CompositeField[];
  fieldKey: string;
  value: string;
}) {
  const field = compositeFields.find((item) => item.key === fieldKey);
  if (!field) {
    return null;
  }
  return <HiddenValue name={field.name} value={value} />;
}

function CustomCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #d8dee9",
        borderRadius: 8,
        padding: 12,
        marginTop: 6,
        display: "grid",
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}

function RowActions({
  onAdd,
  onRemove,
  removeDisabled,
  readOnly,
}: {
  onAdd: () => void;
  onRemove: () => void;
  removeDisabled: boolean;
  readOnly: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
      <button type="button" onClick={onAdd} disabled={readOnly}>
        Add
      </button>
      <button type="button" onClick={onRemove} disabled={readOnly || removeDisabled}>
        Remove
      </button>
    </div>
  );
}

function SpeechEditor({
  value,
  onChange,
  readOnly,
  idPrefix,
}: {
  value: Speech;
  onChange: (next: Speech) => void;
  readOnly: boolean;
  idPrefix: string;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor={`${idPrefix}-mode`}>Speech Mode</label>
      <select
        id={`${idPrefix}-mode`}
        value={value.mode}
        onChange={(event) => onChange({ ...value, mode: event.target.value === "file" ? "file" : "tts" })}
        disabled={readOnly}
      >
        <option value="tts">TTS</option>
        <option value="file">Audio File</option>
      </select>

      <label htmlFor={`${idPrefix}-lang`}>Language</label>
      <select
        id={`${idPrefix}-lang`}
        value={value.lang ?? "en"}
        onChange={(event) => onChange({ ...value, lang: event.target.value === "fr" ? "fr" : "en" })}
        disabled={readOnly}
      >
        <option value="en">English</option>
        <option value="fr">French</option>
      </select>

      {value.mode === "tts" ? (
        <>
          <label htmlFor={`${idPrefix}-text`}>TTS Text</label>
          <input
            id={`${idPrefix}-text`}
            type="text"
            value={value.text ?? ""}
            onChange={(event) => onChange({ ...value, text: event.target.value, fileUrl: "" })}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </>
      ) : (
        <>
          <label htmlFor={`${idPrefix}-file`}>Audio File Path</label>
          <input
            id={`${idPrefix}-file`}
            type="text"
            value={value.fileUrl ?? ""}
            onChange={(event) => onChange({ ...value, fileUrl: event.target.value, text: "" })}
            readOnly={readOnly}
            disabled={readOnly}
            placeholder="lesson-audio/file.mp3"
          />
        </>
      )}
    </div>
  );
}

export default function CustomFieldInput({
  id,
  name,
  inputType,
  fieldKey,
  compositeFields = [],
  defaultValue,
  readOnly,
}: CustomFieldInputProps) {
  const compositeFieldMap = useMemo(() => {
    const map = new Map<string, CompositeField>();
    for (const field of compositeFields) {
      map.set(field.key, field);
    }
    return map;
  }, [compositeFields]);

  const getCompositeFieldDefault = (key: string): string | undefined => compositeFieldMap.get(key)?.defaultValue;

  const [audioPath, setAudioPath] = useState(() => toStringValue(defaultValue));
  const [audioList, setAudioList] = useState<string[]>(() => parseAudioList(defaultValue));
  const [audioPrompt, setAudioPrompt] = useState<AudioPromptValue>(() => parseAudioPrompt(defaultValue));
  const [blanks, setBlanks] = useState<BlankMapperRow[]>(() => parseBlanks(defaultValue));
  const [lines, setLines] = useState<AudioLinesValue>(() => parseLines(defaultValue));
  const [choiceElements, setChoiceElements] = useState<ChoiceElement[]>(() => parseChoiceElements(defaultValue));
  const [pairs, setPairs] = useState<MatchPair[]>(() => parsePairs(defaultValue));
  const [dialogues, setDialogues] = useState<DialogueTurn[]>(() => parseDialogues(defaultValue));
  const [imageUrl, setImageUrl] = useState(() => toStringValue(defaultValue));
  const [correctStressIndex, setCorrectStressIndex] = useState(() =>
    toStringValue(getCompositeFieldDefault("correctStressIndex"))
  );
  const [intonationOptions, setIntonationOptions] = useState<string[]>(() => parseStringArray(defaultValue));
  const [correctCurveId, setCorrectCurveId] = useState(() =>
    toStringValue(getCompositeFieldDefault("correctCurveId"))
  );
  const [categoryLabels, setCategoryLabels] = useState<string[]>(() => parseStringArray(defaultValue));
  const [wordBankItems, setWordBankItems] = useState<WordBankItem[]>(() =>
    parseWordBankItems(getCompositeFieldDefault("wordBank"))
  );
  const [sentenceTokens, setSentenceTokens] = useState<string[]>(() => parseStringArray(defaultValue));
  const [correctOrderWords, setCorrectOrderWords] = useState<string[]>(() =>
    parseStringArray(getCompositeFieldDefault("correctOrderWords"))
  );
  const [tenseBins, setTenseBins] = useState<string[]>(() => parseStringArray(defaultValue));
  const [sentenceCards, setSentenceCards] = useState<SentenceCard[]>(() =>
    parseSentenceCards(getCompositeFieldDefault("sentenceCards"))
  );
  const [incorrectSentence, setIncorrectSentence] = useState(() => toStringValue(defaultValue));
  const [errorIndex, setErrorIndex] = useState(() => toStringValue(getCompositeFieldDefault("errorIndex")));
  const [acceptedCorrections, setAcceptedCorrections] = useState<string[]>(() =>
    parseStringArray(getCompositeFieldDefault("acceptedCorrections"))
  );
  const [promptText, setPromptText] = useState(() => toStringValue(defaultValue));
  const [targetKeywords, setTargetKeywords] = useState<string[]>(() =>
    parseStringArray(getCompositeFieldDefault("targetKeywords"))
  );
  const [keywordThreshold, setKeywordThreshold] = useState(() =>
    toStringValue(getCompositeFieldDefault("keywordThreshold"))
  );
  const [minWordCount, setMinWordCount] = useState(() =>
    toStringValue(getCompositeFieldDefault("minWordCount"))
  );
  const [maxWordCount, setMaxWordCount] = useState(() =>
    toStringValue(getCompositeFieldDefault("maxWordCount"))
  );
  const [wordValue, setWordValue] = useState(() => toStringValue(defaultValue));
  const [letterUnits, setLetterUnits] = useState<string[]>(() =>
    parseStringArray(getCompositeFieldDefault("letterUnits"))
  );
  const [audioClips, setAudioClips] = useState<AudioClip[]>(() => parseChoiceElements(defaultValue));
  const [correctOrderClips, setCorrectOrderClips] = useState<number[]>(() =>
    parseNumberArray(getCompositeFieldDefault("correctOrderClips"))
  );

  const serializedValue = useMemo(() => {
    switch (inputType) {
      case "audio_selector":
        return audioPath;
      case "audio_list":
        return JSON.stringify(audioList);
      case "audio_prompt":
        return JSON.stringify(audioPrompt);
      case "blanks_mapper":
        return JSON.stringify(blanks);
      case "audio_lines_mapper":
        return JSON.stringify(lines);
      case "choice_elements_mapper":
        return JSON.stringify(choiceElements);
      case "match_pairs_mapper":
        return JSON.stringify(pairs);
      case "avatar_dialogues_mapper":
        return toSerializedDialogueTurns(dialogues);
      case "media_picker":
        return imageUrl;
      default:
        return "";
    }
  }, [inputType, audioPath, audioList, audioPrompt, blanks, lines, choiceElements, pairs, dialogues, imageUrl]);

  const serializedIntonationOptions = useMemo(
    () => JSON.stringify(intonationOptions.filter((item) => item.trim().length > 0)),
    [intonationOptions]
  );
  const serializedCategoryLabels = useMemo(
    () => JSON.stringify(categoryLabels.filter((item) => item.trim().length > 0)),
    [categoryLabels]
  );
  const serializedWordBankItems = useMemo(
    () =>
      JSON.stringify(
        wordBankItems
          .map((item) => ({ word: item.word.trim(), category: item.category.trim() }))
          .filter((item) => item.word.length > 0 || item.category.length > 0)
      ),
    [wordBankItems]
  );
  const serializedSentenceTokens = useMemo(
    () => JSON.stringify(sentenceTokens.filter((item) => item.trim().length > 0)),
    [sentenceTokens]
  );
  const serializedCorrectOrderWords = useMemo(
    () => JSON.stringify(correctOrderWords.filter((item) => item.trim().length > 0)),
    [correctOrderWords]
  );
  const serializedTenseBins = useMemo(
    () => JSON.stringify(tenseBins.filter((item) => item.trim().length > 0)),
    [tenseBins]
  );
  const serializedSentenceCards = useMemo(
    () =>
      JSON.stringify(
        sentenceCards
          .map((item) => ({ text: item.text.trim(), correct_tense: item.correct_tense.trim() }))
          .filter((item) => item.text.length > 0 || item.correct_tense.length > 0)
      ),
    [sentenceCards]
  );
  const serializedAcceptedCorrections = useMemo(
    () => JSON.stringify(acceptedCorrections.filter((item) => item.trim().length > 0)),
    [acceptedCorrections]
  );
  const serializedTargetKeywords = useMemo(
    () => JSON.stringify(targetKeywords.filter((item) => item.trim().length > 0)),
    [targetKeywords]
  );
  const serializedLetterUnits = useMemo(
    () => JSON.stringify(letterUnits.filter((item) => item.trim().length > 0)),
    [letterUnits]
  );
  const serializedAudioClips = useMemo(() => JSON.stringify(audioClips), [audioClips]);
  const serializedCorrectOrderClips = useMemo(() => JSON.stringify(correctOrderClips), [correctOrderClips]);

  if (fieldKey === "syllableBreakdown") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Syllable Breakdown</label>
          <textarea
            id={id}
            rows={3}
            value={audioPath}
            onChange={(event) => setAudioPath(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-correct-stress`}>Correct Stress Index (1-based)</label>
          <input
            id={`${id}-correct-stress`}
            type="number"
            min={1}
            step={1}
            value={correctStressIndex}
            onChange={(event) => setCorrectStressIndex(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <HiddenValue name={name} value={audioPath} />
        <HiddenCompositeValue
          compositeFields={compositeFields}
          fieldKey="correctStressIndex"
          value={correctStressIndex}
        />
      </>
    );
  }

  if (fieldKey === "intonationOptions") {
    const availableOptions = intonationOptions.filter((item) => item.trim().length > 0);
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Intonation Options (one per line)</label>
          <textarea
            id={id}
            rows={4}
            value={intonationOptions.join("\n")}
            onChange={(event) =>
              setIntonationOptions(
                event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-correct-curve`}>Correct Curve ID</label>
          <input
            id={`${id}-correct-curve`}
            type="text"
            list={`${id}-correct-curve-options`}
            value={correctCurveId}
            onChange={(event) => setCorrectCurveId(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            placeholder="rising"
          />
          <datalist id={`${id}-correct-curve-options`}>
            {availableOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <HiddenValue name={name} value={serializedIntonationOptions} />
        <HiddenCompositeValue compositeFields={compositeFields} fieldKey="correctCurveId" value={correctCurveId} />
      </>
    );
  }

  if (fieldKey === "categoryLabels") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Category Labels (one per line)</label>
          <textarea
            id={id}
            rows={4}
            value={categoryLabels.join("\n")}
            onChange={(event) =>
              setCategoryLabels(
                event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
          <div style={{ display: "grid", gap: 8 }}>
            {wordBankItems.map((item, index) => (
              <CustomCard key={`${id}-wordbank-${index}`}>
                <strong>{`Word ${index + 1}`}</strong>
                <label htmlFor={`${id}-wordbank-${index}-word`}>Word</label>
                <input
                  id={`${id}-wordbank-${index}-word`}
                  type="text"
                  value={item.word}
                  onChange={(event) =>
                    setWordBankItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, word: event.target.value } : row
                      )
                    )
                  }
                  readOnly={readOnly}
                  disabled={readOnly}
                />
                <label htmlFor={`${id}-wordbank-${index}-category`}>Category</label>
                <input
                  id={`${id}-wordbank-${index}-category`}
                  type="text"
                  value={item.category}
                  onChange={(event) =>
                    setWordBankItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, category: event.target.value } : row
                      )
                    )
                  }
                  readOnly={readOnly}
                  disabled={readOnly}
                />
                <RowActions
                  onAdd={() => setWordBankItems((current) => [...current, { word: "", category: "" }])}
                  onRemove={() =>
                    setWordBankItems((current) => current.filter((_, rowIndex) => rowIndex !== index))
                  }
                  removeDisabled={wordBankItems.length === 0}
                  readOnly={readOnly}
                />
              </CustomCard>
            ))}
            {wordBankItems.length === 0 ? (
              <button
                type="button"
                onClick={() => setWordBankItems([{ word: "", category: "" }])}
                disabled={readOnly}
              >
                Add Word
              </button>
            ) : null}
          </div>
        </div>
        <HiddenValue name={name} value={serializedCategoryLabels} />
        <HiddenCompositeValue compositeFields={compositeFields} fieldKey="wordBank" value={serializedWordBankItems} />
      </>
    );
  }

  if (fieldKey === "sentenceTokens") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Sentence Tokens (one per line)</label>
          <textarea
            id={id}
            rows={4}
            value={sentenceTokens.join("\n")}
            onChange={(event) =>
              setSentenceTokens(
                event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-correct-order`}>Correct Order Words (one per line)</label>
          <textarea
            id={`${id}-correct-order`}
            rows={4}
            value={correctOrderWords.join("\n")}
            onChange={(event) =>
              setCorrectOrderWords(
                event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <HiddenValue name={name} value={serializedSentenceTokens} />
        <HiddenCompositeValue
          compositeFields={compositeFields}
          fieldKey="correctOrderWords"
          value={serializedCorrectOrderWords}
        />
      </>
    );
  }

  if (fieldKey === "tenseBins") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Tense Bins (one per line)</label>
          <textarea
            id={id}
            rows={4}
            value={tenseBins.join("\n")}
            onChange={(event) =>
              setTenseBins(
                event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
          <div style={{ display: "grid", gap: 8 }}>
            {sentenceCards.map((item, index) => (
              <CustomCard key={`${id}-sentence-card-${index}`}>
                <strong>{`Sentence Card ${index + 1}`}</strong>
                <label htmlFor={`${id}-sentence-card-${index}-text`}>Text</label>
                <textarea
                  id={`${id}-sentence-card-${index}-text`}
                  rows={2}
                  value={item.text}
                  onChange={(event) =>
                    setSentenceCards((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, text: event.target.value } : row
                      )
                    )
                  }
                  readOnly={readOnly}
                  disabled={readOnly}
                />
                <label htmlFor={`${id}-sentence-card-${index}-tense`}>Correct Tense</label>
                <input
                  id={`${id}-sentence-card-${index}-tense`}
                  type="text"
                  value={item.correct_tense}
                  onChange={(event) =>
                    setSentenceCards((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, correct_tense: event.target.value } : row
                      )
                    )
                  }
                  readOnly={readOnly}
                  disabled={readOnly}
                />
                <RowActions
                  onAdd={() =>
                    setSentenceCards((current) => [...current, { text: "", correct_tense: "" }])
                  }
                  onRemove={() =>
                    setSentenceCards((current) => current.filter((_, rowIndex) => rowIndex !== index))
                  }
                  removeDisabled={sentenceCards.length === 0}
                  readOnly={readOnly}
                />
              </CustomCard>
            ))}
            {sentenceCards.length === 0 ? (
              <button
                type="button"
                onClick={() => setSentenceCards([{ text: "", correct_tense: "" }])}
                disabled={readOnly}
              >
                Add Sentence Card
              </button>
            ) : null}
          </div>
        </div>
        <HiddenValue name={name} value={serializedTenseBins} />
        <HiddenCompositeValue
          compositeFields={compositeFields}
          fieldKey="sentenceCards"
          value={serializedSentenceCards}
        />
      </>
    );
  }

  if (fieldKey === "incorrectSentence") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Incorrect Sentence</label>
          <textarea
            id={id}
            rows={3}
            value={incorrectSentence}
            onChange={(event) => setIncorrectSentence(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-error-index`}>Error Index (1-based)</label>
          <input
            id={`${id}-error-index`}
            type="number"
            min={1}
            step={1}
            value={errorIndex}
            onChange={(event) => setErrorIndex(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-accepted-corrections`}>Accepted Corrections (comma/newline separated)</label>
          <textarea
            id={`${id}-accepted-corrections`}
            rows={4}
            value={acceptedCorrections.join("\n")}
            onChange={(event) =>
              setAcceptedCorrections(
                event.target.value
                  .split(/\n|,/)
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <HiddenValue name={name} value={incorrectSentence} />
        <HiddenCompositeValue compositeFields={compositeFields} fieldKey="errorIndex" value={errorIndex} />
        <HiddenCompositeValue
          compositeFields={compositeFields}
          fieldKey="acceptedCorrections"
          value={serializedAcceptedCorrections}
        />
      </>
    );
  }

  if (fieldKey === "promptText") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Prompt Text</label>
          <textarea
            id={id}
            rows={3}
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-target-keywords`}>Target Keywords (comma/newline separated)</label>
          <textarea
            id={`${id}-target-keywords`}
            rows={3}
            value={targetKeywords.join("\n")}
            onChange={(event) =>
              setTargetKeywords(
                event.target.value
                  .split(/\n|,/)
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-keyword-threshold`}>Keyword Threshold</label>
          <input
            id={`${id}-keyword-threshold`}
            type="number"
            min={1}
            value={keywordThreshold}
            onChange={(event) => setKeywordThreshold(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-min-word-count`}>Min Word Count</label>
          <input
            id={`${id}-min-word-count`}
            type="number"
            min={1}
            value={minWordCount}
            onChange={(event) => setMinWordCount(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-max-word-count`}>Max Word Count</label>
          <input
            id={`${id}-max-word-count`}
            type="number"
            min={1}
            value={maxWordCount}
            onChange={(event) => setMaxWordCount(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <HiddenValue name={name} value={promptText} />
        <HiddenCompositeValue
          compositeFields={compositeFields}
          fieldKey="targetKeywords"
          value={serializedTargetKeywords}
        />
        <HiddenCompositeValue
          compositeFields={compositeFields}
          fieldKey="keywordThreshold"
          value={keywordThreshold}
        />
        <HiddenCompositeValue compositeFields={compositeFields} fieldKey="minWordCount" value={minWordCount} />
        <HiddenCompositeValue compositeFields={compositeFields} fieldKey="maxWordCount" value={maxWordCount} />
      </>
    );
  }

  if (fieldKey === "word") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor={id}>Word</label>
          <input
            id={id}
            type="text"
            value={wordValue}
            onChange={(event) => setWordValue(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${id}-letter-units`}>Letter Units (comma/newline separated)</label>
          <textarea
            id={`${id}-letter-units`}
            rows={3}
            value={letterUnits.join("\n")}
            onChange={(event) =>
              setLetterUnits(
                event.target.value
                  .split(/\n|,/)
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <HiddenValue name={name} value={wordValue} />
        <HiddenCompositeValue compositeFields={compositeFields} fieldKey="letterUnits" value={serializedLetterUnits} />
      </>
    );
  }

  if (fieldKey === "audioClips") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          {audioClips.map((clip, index) => (
            <CustomCard key={`${id}-clip-${index}`}>
              <strong>{`Clip ${index + 1}`}</strong>
              <label htmlFor={`${id}-clip-${index}-label`}>Label</label>
              <input
                id={`${id}-clip-${index}-label`}
                type="text"
                value={clip.label}
                onChange={(event) =>
                  setAudioClips((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, label: event.target.value } : row
                    )
                  )
                }
                readOnly={readOnly}
                disabled={readOnly}
              />
              <SpeechEditor
                value={clip.speech}
                onChange={(speech) =>
                  setAudioClips((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, speech } : row
                    )
                  )
                }
                readOnly={readOnly}
                idPrefix={`${id}-clip-${index}`}
              />
              <RowActions
                onAdd={() =>
                  setAudioClips((current) => [
                    ...current,
                    { label: "", speech: { mode: "tts", lang: "en", text: "" } },
                  ])
                }
                onRemove={() =>
                  setAudioClips((current) => current.filter((_, rowIndex) => rowIndex !== index))
                }
                removeDisabled={audioClips.length === 0}
                readOnly={readOnly}
              />
            </CustomCard>
          ))}
          {audioClips.length === 0 ? (
            <button
              type="button"
              onClick={() =>
                setAudioClips([{ label: "", speech: { mode: "tts", lang: "en", text: "" } }])
              }
              disabled={readOnly}
            >
              Add Audio Clip
            </button>
          ) : null}
          <label htmlFor={`${id}-correct-order-clips`}>Correct Order Clips (comma/newline separated 1-based indices)</label>
          <textarea
            id={`${id}-correct-order-clips`}
            rows={2}
            value={correctOrderClips.join(", ")}
            onChange={(event) => setCorrectOrderClips(parseNumberArray(event.target.value))}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <HiddenValue name={name} value={serializedAudioClips} />
        <HiddenCompositeValue
          compositeFields={compositeFields}
          fieldKey="correctOrderClips"
          value={serializedCorrectOrderClips}
        />
      </>
    );
  }

  if (inputType === "audio_selector") {
    return (
      <>
        <AudioFileSelector id={id} value={audioPath} onChange={setAudioPath} readOnly={readOnly} />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "audio_list") {
    return (
      <>
        <textarea
          id={id}
          value={audioList.join("\n")}
          onChange={(event) =>
            setAudioList(
              event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
            )
          }
          readOnly={readOnly}
          disabled={readOnly}
          rows={4}
          placeholder="one audio path per line"
        />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "audio_prompt") {
    return (
      <>
        <AudioPromptField
          idPrefix={id}
          value={audioPrompt}
          onChange={setAudioPrompt}
          readOnly={readOnly}
        />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "blanks_mapper") {
    return (
      <>
        <BlanksMapper idPrefix={id} value={blanks} onChange={setBlanks} readOnly={readOnly} />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "audio_lines_mapper") {
    return (
      <>
        <AudioLinesMapper idPrefix={id} value={lines} onChange={setLines} readOnly={readOnly} />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "choice_elements_mapper") {
    return (
      <>
        <ChoiceElementMapper idPrefix={id} value={choiceElements} onChange={setChoiceElements} readOnly={readOnly} />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "match_pairs_mapper") {
    return (
      <>
        <MatchPairsMapper idPrefix={id} value={pairs} onChange={setPairs} readOnly={readOnly} />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "avatar_dialogues_mapper") {
    return (
      <>
        <DialogueTurnsMapper idPrefix={id} value={dialogues} onChange={setDialogues} readOnly={readOnly} />
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  if (inputType === "media_picker") {
    return (
      <>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            id={id}
            type="text"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            placeholder="https://example.com/image.png"
          />
          {imageUrl.trim() ? (
            <Image
              src={imageUrl}
              alt="Preview"
              unoptimized
              width={220}
              height={140}
              style={{ maxWidth: 220, maxHeight: 140, objectFit: "cover", borderRadius: 6 }}
            />
          ) : null}
        </div>
        <HiddenValue name={name} value={serializedValue} />
      </>
    );
  }

  return (
    <>
      <input id={id} type="text" value="" readOnly disabled />
      <HiddenValue name={name} value={serializedValue} />
    </>
  );
}
