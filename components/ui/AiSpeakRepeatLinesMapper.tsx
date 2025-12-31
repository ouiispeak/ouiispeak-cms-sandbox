"use client";

import { useState } from "react";
import { uiTokens } from "../../lib/uiTokens";
import Input from "./Input";
import Select from "./Select";
import Textarea from "./Textarea";
import AudioFileSelector from "./AudioFileSelector";
import { Button } from "../Button";
import { SPEECH_MODES, PLAYER_LANGUAGES } from "../../lib/constants/slideConstants";
import { normalizeLanguageToPlayer } from "../../lib/utils/elementMapperUtils";

/**
 * Form element type for AiSpeakRepeatLinesMapper
 * Represents a single cell in the lines structure
 */
export type AiSpeakRepeatFormCell = {
  label: string;
  speech: {
    mode: "tts" | "file";
    lang?: "en" | "fr";
    text?: string;
    fileUrl?: string;
  };
};

/**
 * Form structure: array of rows, each row is an array of cells
 */
export type AiSpeakRepeatFormLines = AiSpeakRepeatFormCell[][];

interface AiSpeakRepeatLinesMapperProps {
  lines: AiSpeakRepeatFormLines;
  onLinesChange: (lines: AiSpeakRepeatFormLines) => void;
  bucketName: string;
  defaultLang: string;
}

export default function AiSpeakRepeatLinesMapper({
  lines,
  onLinesChange,
  bucketName,
  defaultLang = "en",
}: AiSpeakRepeatLinesMapperProps) {
  const [showMapper, setShowMapper] = useState(false);

  const createEmptyCell = (): AiSpeakRepeatFormCell => {
    const normalizedLang = normalizeLanguageToPlayer(defaultLang);
    return {
      label: "",
      speech: {
        mode: SPEECH_MODES.TTS,
        lang: normalizedLang,
        text: "",
      },
    };
  };

  const handleAddRow = () => {
    onLinesChange([...lines, [createEmptyCell()]]);
  };

  const handleRemoveRow = (rowIndex: number) => {
    const newLines = lines.filter((_, i) => i !== rowIndex);
    onLinesChange(newLines);
  };

  const handleAddCell = (rowIndex: number) => {
    const newLines = [...lines];
    newLines[rowIndex] = [...newLines[rowIndex], createEmptyCell()];
    onLinesChange(newLines);
  };

  const handleRemoveCell = (rowIndex: number, cellIndex: number) => {
    const newLines = [...lines];
    newLines[rowIndex] = newLines[rowIndex].filter((_, i) => i !== cellIndex);
    // Don't allow removing the last cell in a row - remove the row instead
    if (newLines[rowIndex].length === 0) {
      newLines.splice(rowIndex, 1);
    }
    onLinesChange(newLines);
  };

  const handleCellChange = (
    rowIndex: number,
    cellIndex: number,
    updates: Partial<AiSpeakRepeatFormCell>
  ) => {
    const newLines = [...lines];
    newLines[rowIndex] = [...newLines[rowIndex]];
    newLines[rowIndex][cellIndex] = {
      ...newLines[rowIndex][cellIndex],
      ...updates,
    };
    onLinesChange(newLines);
  };

  const handleSpeechModeChange = (rowIndex: number, cellIndex: number, mode: "tts" | "file") => {
    const cell = lines[rowIndex][cellIndex];
    const normalizedLang = normalizeLanguageToPlayer(cell.speech.lang, defaultLang);

    const updatedSpeech: AiSpeakRepeatFormCell["speech"] = {
      mode,
      lang: normalizedLang,
    };

    if (mode === SPEECH_MODES.TTS) {
      updatedSpeech.text = cell.speech.text || cell.label;
      // Remove fileUrl when switching to TTS
      delete updatedSpeech.fileUrl;
    } else {
      updatedSpeech.fileUrl = cell.speech.fileUrl || "";
      // Remove text when switching to file
      delete updatedSpeech.text;
    }

    handleCellChange(rowIndex, cellIndex, { speech: updatedSpeech });
  };

  const handleLabelChange = (rowIndex: number, cellIndex: number, label: string) => {
    // Read current cell BEFORE updating
    const cell = lines[rowIndex][cellIndex];
    
    // Prepare updates
    const updates: Partial<AiSpeakRepeatFormCell> = { label };
    
    // If TTS mode and text is empty or matches old label, update text too
    if (cell.speech.mode === SPEECH_MODES.TTS && (!cell.speech.text || cell.speech.text === cell.label)) {
      updates.speech = { ...cell.speech, text: label };
    }
    
    // Apply all updates in a single call
    handleCellChange(rowIndex, cellIndex, updates);
  };

  const handleSpeechLangChange = (rowIndex: number, cellIndex: number, lang: "en" | "fr") => {
    const cell = lines[rowIndex][cellIndex];
    handleCellChange(rowIndex, cellIndex, {
      speech: {
        ...cell.speech,
        lang,
      },
    });
  };

  const handleSpeechTextChange = (rowIndex: number, cellIndex: number, text: string) => {
    const cell = lines[rowIndex][cellIndex];
    handleCellChange(rowIndex, cellIndex, {
      speech: {
        ...cell.speech,
        text,
      },
    });
  };

  const handleSpeechFileUrlChange = (rowIndex: number, cellIndex: number, fileUrl: string) => {
    const cell = lines[rowIndex][cellIndex];
    handleCellChange(rowIndex, cellIndex, {
      speech: {
        ...cell.speech,
        fileUrl,
        mode: SPEECH_MODES.FILE,
      },
    });
  };

  const totalCells = lines.reduce((sum, row) => sum + row.length, 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: uiTokens.space.xs,
          alignItems: "center",
          marginBottom: uiTokens.space.sm,
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowMapper(!showMapper)}
        >
          {showMapper ? "Hide Lines Editor" : "Show Lines Editor"}
        </Button>
        <span style={{ fontSize: uiTokens.font.meta.size, color: uiTokens.color.textMuted }}>
          {lines.length > 0 &&
            `${lines.length} row${lines.length !== 1 ? "s" : ""}, ${totalCells} element${totalCells !== 1 ? "s" : ""}`}
        </span>
      </div>

      {showMapper && (
        <div
          style={{
            marginTop: uiTokens.space.sm,
            padding: uiTokens.space.md,
            border: `1px solid ${uiTokens.color.border}`,
            borderRadius: uiTokens.radius.md,
            backgroundColor: uiTokens.color.surface,
          }}
        >
          <div
            style={{
              marginBottom: uiTokens.space.sm,
              fontSize: uiTokens.font.meta.size,
              color: uiTokens.color.textMuted,
            }}
          >
            Configure elements organized in rows. Each element has a label (display text) and audio
            configuration (TTS or uploaded file). Students can click any element to hear it, or use
            the play button to hear all elements in sequence.
          </div>

          {lines.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: uiTokens.space.md,
                color: uiTokens.color.textMuted,
              }}
            >
              <p>No rows yet. Click "Add Row" to create your first row of elements.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: uiTokens.space.md }}>
              {lines.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  style={{
                    padding: uiTokens.space.md,
                    border: `2px solid ${uiTokens.color.border}`,
                    borderRadius: uiTokens.radius.md,
                    backgroundColor: uiTokens.color.bg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: uiTokens.space.sm,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: uiTokens.font.label.size,
                        fontWeight: 600,
                        color: uiTokens.color.text,
                      }}
                    >
                      Row {rowIndex + 1}
                    </h4>
                    <div style={{ display: "flex", gap: uiTokens.space.xs }}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddCell(rowIndex)}
                      >
                        + Add Element
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveRow(rowIndex)}
                      >
                        Remove Row
                      </Button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: uiTokens.space.sm }}>
                    {row.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: uiTokens.space.md,
                          color: uiTokens.color.textMuted,
                        }}
                        >
                        <p>No elements in this row. Click "Add Element" to add one.</p>
                      </div>
                    ) : (
                      row.map((cell, cellIndex) => (
                        <div
                          key={cellIndex}
                          style={{
                            padding: uiTokens.space.sm,
                            border: `1px solid ${uiTokens.color.border}`,
                            borderRadius: uiTokens.radius.sm,
                            backgroundColor: uiTokens.color.surface,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: uiTokens.space.sm,
                              alignItems: "flex-start",
                            }}
                          >
                            <div
                              style={{
                                flex: "0 0 40px",
                                textAlign: "center",
                                paddingTop: uiTokens.space.xs,
                                fontSize: uiTokens.font.meta.size,
                                color: uiTokens.color.textMuted,
                              }}
                            >
                              {cellIndex + 1}
                            </div>

                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: uiTokens.space.sm }}>
                              {/* Label */}
                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    fontSize: uiTokens.font.meta.size,
                                    marginBottom: uiTokens.space.xs,
                                    color: uiTokens.color.textMuted,
                                  }}
                                >
                                  Label (required):
                                </label>
                                <Input
                                  type="text"
                                  value={cell.label}
                                  onChange={(e) => handleLabelChange(rowIndex, cellIndex, e.target.value)}
                                  placeholder={`Element ${cellIndex + 1} label`}
                                />
                              </div>

                              {/* Speech Mode */}
                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    fontSize: uiTokens.font.meta.size,
                                    marginBottom: uiTokens.space.xs,
                                    color: uiTokens.color.textMuted,
                                  }}
                                >
                                  Audio Mode:
                                </label>
                                <Select
                                  value={cell.speech.mode}
                                  onChange={(e) =>
                                    handleSpeechModeChange(rowIndex, cellIndex, e.target.value as "tts" | "file")
                                  }
                                >
                                  <option value={SPEECH_MODES.TTS}>Text-to-Speech (TTS)</option>
                                  <option value={SPEECH_MODES.FILE}>Uploaded Audio File</option>
                                </Select>
                              </div>

                              {/* TTS Mode Fields */}
                              {cell.speech.mode === SPEECH_MODES.TTS && (
                                <>
                                  <div>
                                    <label
                                      style={{
                                        display: "block",
                                        fontSize: uiTokens.font.meta.size,
                                        marginBottom: uiTokens.space.xs,
                                        color: uiTokens.color.textMuted,
                                      }}
                                    >
                                      TTS Text (required):
                                    </label>
                                    <Textarea
                                      value={cell.speech.text || ""}
                                      onChange={(e) =>
                                        handleSpeechTextChange(rowIndex, cellIndex, e.target.value)
                                      }
                                      placeholder="Text to synthesize (can be different from label)"
                                      rows={2}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        display: "block",
                                        fontSize: uiTokens.font.meta.size,
                                        marginBottom: uiTokens.space.xs,
                                        color: uiTokens.color.textMuted,
                                      }}
                                    >
                                      Language (optional, defaults to slide default):
                                    </label>
                                    <Select
                                      value={cell.speech.lang || defaultLang}
                                      onChange={(e) =>
                                        handleSpeechLangChange(rowIndex, cellIndex, e.target.value as "en" | "fr")
                                      }
                                    >
                                      <option value={PLAYER_LANGUAGES.ENGLISH}>English</option>
                                      <option value={PLAYER_LANGUAGES.FRENCH}>French</option>
                                    </Select>
                                  </div>
                                </>
                              )}

                              {/* File Mode Fields */}
                              {cell.speech.mode === SPEECH_MODES.FILE && (
                                <div>
                                  <label
                                    style={{
                                      display: "block",
                                      fontSize: uiTokens.font.meta.size,
                                      marginBottom: uiTokens.space.xs,
                                      color: uiTokens.color.textMuted,
                                    }}
                                  >
                                    Audio File (required):
                                  </label>
                                  <AudioFileSelector
                                    bucketName={bucketName}
                                    value={cell.speech.fileUrl || ""}
                                    onChange={(value) =>
                                      handleSpeechFileUrlChange(rowIndex, cellIndex, value)
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            <div style={{ flex: "0 0 auto", paddingTop: uiTokens.space.md }}>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveCell(rowIndex, cellIndex)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: uiTokens.space.md }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddRow}
              style={{ alignSelf: "flex-start" }}
            >
              + Add Row
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

