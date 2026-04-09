"use client";

import { useState } from "react";
import type { ChoiceElementValue, SpeechLang, SpeechMode, SpeechValue } from "@/components/custom-fields/ChoiceElementMapper";

export type AudioLinesValue = ChoiceElementValue[][];

type AudioLinesMapperProps = {
  idPrefix: string;
  value: AudioLinesValue;
  onChange: (next: AudioLinesValue) => void;
  readOnly: boolean;
  defaultLang?: SpeechLang;
};

function createEmptyCell(defaultLang: SpeechLang): ChoiceElementValue {
  return {
    label: "",
    speech: {
      mode: "tts",
      lang: defaultLang,
      text: "",
    },
  };
}

function normalizeSpeech(speech: SpeechValue | undefined, fallbackLang: SpeechLang): SpeechValue {
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

export default function AudioLinesMapper({
  idPrefix,
  value,
  onChange,
  readOnly,
  defaultLang = "en",
}: AudioLinesMapperProps) {
  const [showEditor, setShowEditor] = useState(false);
  const lines = value;
  const totalCells = lines.reduce((sum, row) => sum + row.length, 0);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={() => setShowEditor((prev) => !prev)} disabled={readOnly && lines.length === 0}>
          {showEditor ? "Hide Lines Editor" : "Show Lines Editor"}
        </button>
        <span style={{ fontSize: 12, color: "#666" }}>
          {lines.length} row{lines.length === 1 ? "" : "s"}, {totalCells} element{totalCells === 1 ? "" : "s"}
        </span>
      </div>

      {showEditor ? (
        <div style={{ display: "grid", gap: 12 }}>
          {lines.map((row, rowIndex) => (
            <div
              key={`${idPrefix}-row-${rowIndex}`}
              style={{ border: "1px solid #d8dee9", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}
            >
              <strong>{`Row ${rowIndex + 1}`}</strong>

              {row.map((cell, cellIndex) => {
                const normalizedSpeech = normalizeSpeech(cell.speech, defaultLang);

                return (
                  <div
                    key={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}`}
                    style={{ border: "1px solid #e7eaf0", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}
                  >
                    <label htmlFor={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-label`}>Label</label>
                    <input
                      id={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-label`}
                      type="text"
                      value={cell.label}
                      onChange={(event) =>
                        onChange(
                          lines.map((currentRow, currentRowIndex) =>
                            currentRowIndex === rowIndex
                              ? currentRow.map((currentCell, currentCellIndex) =>
                                  currentCellIndex === cellIndex
                                    ? { ...currentCell, label: event.target.value }
                                    : currentCell
                                )
                              : currentRow
                          )
                        )
                      }
                      readOnly={readOnly}
                      disabled={readOnly}
                    />

                    <label htmlFor={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-mode`}>Speech Mode</label>
                    <select
                      id={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-mode`}
                      value={normalizedSpeech.mode}
                      onChange={(event) => {
                        const nextMode: SpeechMode = event.target.value === "file" ? "file" : "tts";
                        const nextSpeech: SpeechValue =
                          nextMode === "tts"
                            ? {
                                mode: "tts",
                                lang: normalizedSpeech.lang ?? defaultLang,
                                text: normalizedSpeech.text || cell.label,
                              }
                            : {
                                mode: "file",
                                lang: normalizedSpeech.lang ?? defaultLang,
                                fileUrl: normalizedSpeech.fileUrl || "",
                              };

                        onChange(
                          lines.map((currentRow, currentRowIndex) =>
                            currentRowIndex === rowIndex
                              ? currentRow.map((currentCell, currentCellIndex) =>
                                  currentCellIndex === cellIndex
                                    ? { ...currentCell, speech: nextSpeech }
                                    : currentCell
                                )
                              : currentRow
                          )
                        );
                      }}
                      disabled={readOnly}
                    >
                      <option value="tts">TTS</option>
                      <option value="file">Audio File</option>
                    </select>

                    <label htmlFor={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-lang`}>Language</label>
                    <select
                      id={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-lang`}
                      value={normalizedSpeech.lang ?? defaultLang}
                      onChange={(event) => {
                        const nextLang: SpeechLang = event.target.value === "fr" ? "fr" : "en";
                        onChange(
                          lines.map((currentRow, currentRowIndex) =>
                            currentRowIndex === rowIndex
                              ? currentRow.map((currentCell, currentCellIndex) =>
                                  currentCellIndex === cellIndex
                                    ? {
                                        ...currentCell,
                                        speech: {
                                          ...normalizedSpeech,
                                          lang: nextLang,
                                        },
                                      }
                                    : currentCell
                                )
                              : currentRow
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
                        <label htmlFor={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-text`}>Text</label>
                        <input
                          id={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-text`}
                          type="text"
                          value={normalizedSpeech.text ?? ""}
                          onChange={(event) =>
                            onChange(
                              lines.map((currentRow, currentRowIndex) =>
                                currentRowIndex === rowIndex
                                  ? currentRow.map((currentCell, currentCellIndex) =>
                                      currentCellIndex === cellIndex
                                        ? {
                                            ...currentCell,
                                            speech: {
                                              ...normalizedSpeech,
                                              mode: "tts",
                                              text: event.target.value,
                                            },
                                          }
                                        : currentCell
                                    )
                                  : currentRow
                              )
                            )
                          }
                          readOnly={readOnly}
                          disabled={readOnly}
                        />
                      </>
                    ) : (
                      <>
                        <label htmlFor={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-file`}>File URL</label>
                        <input
                          id={`${idPrefix}-row-${rowIndex}-cell-${cellIndex}-file`}
                          type="text"
                          value={normalizedSpeech.fileUrl ?? ""}
                          onChange={(event) =>
                            onChange(
                              lines.map((currentRow, currentRowIndex) =>
                                currentRowIndex === rowIndex
                                  ? currentRow.map((currentCell, currentCellIndex) =>
                                      currentCellIndex === cellIndex
                                        ? {
                                            ...currentCell,
                                            speech: {
                                              ...normalizedSpeech,
                                              mode: "file",
                                              fileUrl: event.target.value,
                                            },
                                          }
                                        : currentCell
                                    )
                                  : currentRow
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
                        onClick={() =>
                          onChange(
                            lines.map((currentRow, currentRowIndex) =>
                              currentRowIndex === rowIndex
                                ? [...currentRow, createEmptyCell(defaultLang)]
                                : currentRow
                            )
                          )
                        }
                        disabled={readOnly}
                      >
                        Add Element
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = lines.map((currentRow, currentRowIndex) =>
                            currentRowIndex === rowIndex
                              ? currentRow.filter((_, currentCellIndex) => currentCellIndex !== cellIndex)
                              : currentRow
                          );
                          onChange(
                            next
                              .map((mappedRow) => mappedRow.filter(Boolean))
                              .filter((mappedRow) => mappedRow.length > 0)
                          );
                        }}
                        disabled={readOnly || row.length === 0}
                      >
                        Remove Element
                      </button>
                    </div>
                  </div>
                );
              })}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onChange([...lines, [createEmptyCell(defaultLang)]])}
                  disabled={readOnly}
                >
                  Add Row
                </button>
                <button
                  type="button"
                  onClick={() => onChange(lines.filter((_, currentRowIndex) => currentRowIndex !== rowIndex))}
                  disabled={readOnly || lines.length === 0}
                >
                  Remove Row
                </button>
              </div>
            </div>
          ))}

          {lines.length === 0 ? (
            <button type="button" onClick={() => onChange([[createEmptyCell(defaultLang)]])} disabled={readOnly}>
              Add Row
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
