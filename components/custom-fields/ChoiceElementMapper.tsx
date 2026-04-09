"use client";

import { useState } from "react";

export type SpeechMode = "tts" | "file";
export type SpeechLang = "en" | "fr";

export type SpeechValue = {
  mode: SpeechMode;
  lang?: SpeechLang;
  text?: string;
  fileUrl?: string;
};

export type ChoiceElementValue = {
  label: string;
  speech: SpeechValue;
};

type ChoiceElementMapperProps = {
  idPrefix: string;
  value: ChoiceElementValue[];
  onChange: (next: ChoiceElementValue[]) => void;
  readOnly: boolean;
  defaultLang?: SpeechLang;
};

function createEmptyChoice(defaultLang: SpeechLang): ChoiceElementValue {
  return {
    label: "",
    speech: {
      mode: "tts",
      lang: defaultLang,
      text: "",
    },
  };
}

function ensureSpeech(speech: SpeechValue | undefined, fallbackLang: SpeechLang): SpeechValue {
  const mode: SpeechMode = speech?.mode === "file" ? "file" : "tts";
  const lang: SpeechLang = speech?.lang === "fr" ? "fr" : "en";
  if (mode === "tts") {
    return {
      mode,
      lang: speech?.lang ? lang : fallbackLang,
      text: speech?.text ?? "",
    };
  }
  return {
    mode,
    lang: speech?.lang ? lang : fallbackLang,
    fileUrl: speech?.fileUrl ?? "",
  };
}

export default function ChoiceElementMapper({
  idPrefix,
  value,
  onChange,
  readOnly,
  defaultLang = "en",
}: ChoiceElementMapperProps) {
  const [showEditor, setShowEditor] = useState(false);
  const elements = value;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={() => setShowEditor((prev) => !prev)} disabled={readOnly && elements.length === 0}>
          {showEditor ? "Hide Choice Editor" : "Show Choice Editor"}
        </button>
        <span style={{ fontSize: 12, color: "#666" }}>
          {elements.length} choice{elements.length === 1 ? "" : "s"}
        </span>
      </div>

      {showEditor ? (
        <div style={{ display: "grid", gap: 8 }}>
          {elements.map((element, index) => {
            const normalizedSpeech = ensureSpeech(element.speech, defaultLang);

            return (
              <div
                key={`${idPrefix}-choice-${index}`}
                style={{
                  border: "1px solid #d8dee9",
                  borderRadius: 8,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong>{`Choice ${index + 1}`}</strong>

                <label htmlFor={`${idPrefix}-choice-${index}-label`}>Label</label>
                <input
                  id={`${idPrefix}-choice-${index}-label`}
                  type="text"
                  value={element.label}
                  onChange={(event) =>
                    onChange(
                      elements.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, label: event.target.value } : row
                      )
                    )
                  }
                  readOnly={readOnly}
                  disabled={readOnly}
                />

                <label htmlFor={`${idPrefix}-choice-${index}-mode`}>Speech Mode</label>
                <select
                  id={`${idPrefix}-choice-${index}-mode`}
                  value={normalizedSpeech.mode}
                  onChange={(event) => {
                    const nextMode: SpeechMode = event.target.value === "file" ? "file" : "tts";
                    const nextSpeech: SpeechValue =
                      nextMode === "tts"
                        ? {
                            mode: "tts",
                            lang: normalizedSpeech.lang ?? defaultLang,
                            text: normalizedSpeech.text || element.label,
                          }
                        : {
                            mode: "file",
                            lang: normalizedSpeech.lang ?? defaultLang,
                            fileUrl: normalizedSpeech.fileUrl || "",
                          };
                    onChange(
                      elements.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, speech: nextSpeech } : row
                      )
                    );
                  }}
                  disabled={readOnly}
                >
                  <option value="tts">TTS</option>
                  <option value="file">Audio File</option>
                </select>

                <label htmlFor={`${idPrefix}-choice-${index}-lang`}>Language</label>
                <select
                  id={`${idPrefix}-choice-${index}-lang`}
                  value={normalizedSpeech.lang ?? defaultLang}
                  onChange={(event) => {
                    const nextLang: SpeechLang = event.target.value === "fr" ? "fr" : "en";
                    onChange(
                      elements.map((row, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...row,
                              speech: {
                                ...normalizedSpeech,
                                lang: nextLang,
                              },
                            }
                          : row
                      )
                    );
                  }}
                  disabled={readOnly}
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                </select>

                {normalizedSpeech.mode === "tts" ? (
                  <>
                    <label htmlFor={`${idPrefix}-choice-${index}-text`}>Text</label>
                    <input
                      id={`${idPrefix}-choice-${index}-text`}
                      type="text"
                      value={normalizedSpeech.text ?? ""}
                      onChange={(event) =>
                        onChange(
                          elements.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  speech: {
                                    ...normalizedSpeech,
                                    mode: "tts",
                                    text: event.target.value,
                                  },
                                }
                              : row
                          )
                        )
                      }
                      readOnly={readOnly}
                      disabled={readOnly}
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor={`${idPrefix}-choice-${index}-file`}>File URL</label>
                    <input
                      id={`${idPrefix}-choice-${index}-file`}
                      type="text"
                      value={normalizedSpeech.fileUrl ?? ""}
                      onChange={(event) =>
                        onChange(
                          elements.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  speech: {
                                    ...normalizedSpeech,
                                    mode: "file",
                                    fileUrl: event.target.value,
                                  },
                                }
                              : row
                          )
                        )
                      }
                      readOnly={readOnly}
                      disabled={readOnly}
                    />
                  </>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onChange([...elements, createEmptyChoice(defaultLang)])}
                    disabled={readOnly}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(elements.filter((_, rowIndex) => rowIndex !== index))}
                    disabled={readOnly || elements.length === 0}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          {elements.length === 0 ? (
            <button type="button" onClick={() => onChange([createEmptyChoice(defaultLang)])} disabled={readOnly}>
              Add Choice
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
