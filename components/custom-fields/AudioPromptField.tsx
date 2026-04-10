"use client";

type SpeechMode = "tts" | "file";
type SpeechLang = "en" | "fr";

export type AudioPromptSpeech = {
  mode: SpeechMode;
  lang?: SpeechLang;
  text?: string;
  fileUrl?: string;
};

export type AudioPromptValue = {
  label: string;
  speech: AudioPromptSpeech;
};

type AudioPromptFieldProps = {
  idPrefix: string;
  value: AudioPromptValue | null;
  onChange: (next: AudioPromptValue) => void;
  readOnly: boolean;
  defaultLang?: SpeechLang;
};

const EMPTY_PROMPT: AudioPromptValue = {
  label: "",
  speech: {
    mode: "tts",
    lang: "en",
    text: "",
  },
};

function normalizeLang(lang: string | undefined, fallback: SpeechLang = "en"): SpeechLang {
  if (lang === "fr") return "fr";
  if (lang === "en") return "en";
  return fallback;
}

export default function AudioPromptField({
  idPrefix,
  value,
  onChange,
  readOnly,
  defaultLang = "en",
}: AudioPromptFieldProps) {
  const prompt = value ?? {
    ...EMPTY_PROMPT,
    speech: {
      ...EMPTY_PROMPT.speech,
      lang: normalizeLang(undefined, defaultLang),
    },
  };

  const currentLang = normalizeLang(prompt.speech.lang, defaultLang);

  const handleLabelChange = (label: string) => {
    onChange({
      ...prompt,
      label,
    });
  };

  const handleSpeechModeChange = (mode: SpeechMode) => {
    if (mode === "tts") {
      onChange({
        ...prompt,
        speech: {
          mode: "tts",
          lang: currentLang,
          text: prompt.speech.text || prompt.label,
        },
      });
      return;
    }

    onChange({
      ...prompt,
      speech: {
        mode: "file",
        lang: currentLang,
        fileUrl: prompt.speech.fileUrl || "",
      },
    });
  };

  const handleLanguageChange = (lang: SpeechLang) => {
    onChange({
      ...prompt,
      speech: {
        ...prompt.speech,
        lang,
      },
    });
  };

  const handleTextChange = (text: string) => {
    onChange({
      ...prompt,
      speech: {
        ...prompt.speech,
        mode: "tts",
        text,
      },
    });
  };

  const handleFileUrlChange = (fileUrl: string) => {
    onChange({
      ...prompt,
      speech: {
        ...prompt.speech,
        mode: "file",
        fileUrl,
      },
    });
  };

  return (
    <div
      style={{
        marginTop: 6,
        padding: 12,
        border: "1px solid #d8dee9",
        borderRadius: 8,
        display: "grid",
        gap: 8,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
        Audio question prompt. Label is for CMS authors only; ingest normalizes speech payloads to canonical audio shape.
      </p>

      <label htmlFor={`${idPrefix}-label`}>Label (guide text for approvers)</label>
      <input
        id={`${idPrefix}-label`}
        type="text"
        value={prompt.label}
        onChange={(event) => handleLabelChange(event.target.value)}
        readOnly={readOnly}
        disabled={readOnly}
        placeholder="e.g., He goes to the store"
      />

      <label htmlFor={`${idPrefix}-mode`}>Speech Mode</label>
      <select
        id={`${idPrefix}-mode`}
        value={prompt.speech.mode}
        onChange={(event) => handleSpeechModeChange(event.target.value === "file" ? "file" : "tts")}
        disabled={readOnly}
      >
        <option value="tts">TTS (Text-to-Speech)</option>
        <option value="file">Audio File</option>
      </select>

      {prompt.speech.mode === "tts" ? (
        <>
          <label htmlFor={`${idPrefix}-lang`}>Language</label>
          <select
            id={`${idPrefix}-lang`}
            value={currentLang}
            onChange={(event) => handleLanguageChange(event.target.value === "fr" ? "fr" : "en")}
            disabled={readOnly}
          >
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>

          <label htmlFor={`${idPrefix}-text`}>Text For TTS</label>
          <input
            id={`${idPrefix}-text`}
            type="text"
            value={prompt.speech.text || ""}
            onChange={(event) => handleTextChange(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            placeholder={prompt.label || "Text to speak"}
          />
        </>
      ) : (
        <>
          <label htmlFor={`${idPrefix}-file`}>Audio File Path</label>
          <input
            id={`${idPrefix}-file`}
            type="text"
            value={prompt.speech.fileUrl || ""}
            onChange={(event) => handleFileUrlChange(event.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            placeholder="lesson-audio/file.mp3"
          />
        </>
      )}
    </div>
  );
}
