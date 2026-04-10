"use client";

import { useState } from "react";

export type DialogueTurnValue = {
  id: string;
  avatarLine: string;
  avatarAction: string;
  audioFile: string;
  audio?: {
    speech?: {
      mode?: "tts" | "file";
      text?: string;
      fileUrl?: string;
      lang?: "en" | "fr";
    };
  };
  correctResponses: string[];
};

type DialogueTurnsMapperProps = {
  idPrefix: string;
  value: DialogueTurnValue[];
  onChange: (next: DialogueTurnValue[]) => void;
  readOnly: boolean;
};

function createEmptyTurn(index: number): DialogueTurnValue {
  return {
    id: `turn-${index + 1}`,
    avatarLine: "",
    avatarAction: "",
    audioFile: "",
    correctResponses: [],
  };
}

export default function DialogueTurnsMapper({
  idPrefix,
  value,
  onChange,
  readOnly,
}: DialogueTurnsMapperProps) {
  const [showEditor, setShowEditor] = useState(false);
  const turns = value;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={() => setShowEditor((prev) => !prev)} disabled={readOnly && turns.length === 0}>
          {showEditor ? "Hide Avatar Dialogues" : "Show Avatar Dialogues"}
        </button>
        <span style={{ fontSize: 12, color: "#666" }}>
          {turns.length} turn{turns.length === 1 ? "" : "s"}
        </span>
      </div>

      {showEditor ? (
        <div style={{ display: "grid", gap: 8 }}>
          {turns.map((turn, index) => (
            <div
              key={`${idPrefix}-dialogue-${index}`}
              style={{ border: "1px solid #d8dee9", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}
            >
              <strong>{`Turn ${index + 1}`}</strong>

              <label htmlFor={`${idPrefix}-dialogue-${index}-id`}>ID</label>
              <input
                id={`${idPrefix}-dialogue-${index}-id`}
                type="text"
                value={turn.id}
                onChange={(event) =>
                  onChange(
                    turns.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, id: event.target.value } : row
                    )
                  )
                }
                readOnly={readOnly}
                disabled={readOnly}
              />

              <label htmlFor={`${idPrefix}-dialogue-${index}-line`}>Avatar Line</label>
              <textarea
                id={`${idPrefix}-dialogue-${index}-line`}
                rows={2}
                value={turn.avatarLine}
                onChange={(event) =>
                  onChange(
                    turns.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, avatarLine: event.target.value } : row
                    )
                  )
                }
                readOnly={readOnly}
                disabled={readOnly}
              />

              <label htmlFor={`${idPrefix}-dialogue-${index}-action`}>Avatar Action</label>
              <input
                id={`${idPrefix}-dialogue-${index}-action`}
                type="text"
                value={turn.avatarAction}
                onChange={(event) =>
                  onChange(
                    turns.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, avatarAction: event.target.value } : row
                    )
                  )
                }
                readOnly={readOnly}
                disabled={readOnly}
              />

              <label htmlFor={`${idPrefix}-dialogue-${index}-audio`}>Audio File</label>
              <input
                id={`${idPrefix}-dialogue-${index}-audio`}
                type="text"
                value={turn.audioFile}
                onChange={(event) =>
                  onChange(
                    turns.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, audioFile: event.target.value } : row
                    )
                  )
                }
                readOnly={readOnly}
                disabled={readOnly}
              />

              <label htmlFor={`${idPrefix}-dialogue-${index}-responses`}>Correct Responses (one per line)</label>
              <textarea
                id={`${idPrefix}-dialogue-${index}-responses`}
                rows={3}
                value={turn.correctResponses.join("\n")}
                onChange={(event) =>
                  onChange(
                    turns.map((row, rowIndex) =>
                      rowIndex === index
                        ? {
                            ...row,
                            correctResponses: event.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean),
                          }
                        : row
                    )
                  )
                }
                readOnly={readOnly}
                disabled={readOnly}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onChange([...turns, createEmptyTurn(turns.length)])} disabled={readOnly}>
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => onChange(turns.filter((_, rowIndex) => rowIndex !== index))}
                  disabled={readOnly || turns.length === 0}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {turns.length === 0 ? (
            <button type="button" onClick={() => onChange([createEmptyTurn(0)])} disabled={readOnly}>
              Add Dialogue Turn
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
