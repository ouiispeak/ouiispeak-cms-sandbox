"use client";

export type BlankMapperRow = {
  correctGapIndex: string;
  acceptedAlternatives: string;
};

type BlanksMapperProps = {
  idPrefix: string;
  value: BlankMapperRow[];
  onChange: (next: BlankMapperRow[]) => void;
  readOnly: boolean;
};

function createEmptyBlank(): BlankMapperRow {
  return {
    correctGapIndex: "",
    acceptedAlternatives: "",
  };
}

export default function BlanksMapper({ idPrefix, value, onChange, readOnly }: BlanksMapperProps) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {value.map((row, index) => (
        <div
          key={`${idPrefix}-blank-${index}`}
          style={{
            border: "1px solid #d8dee9",
            borderRadius: 8,
            padding: 12,
            marginTop: 6,
            display: "grid",
            gap: 8,
          }}
        >
          <label htmlFor={`${idPrefix}-blank-gap-${index}`}>Correct Gap Index</label>
          <input
            id={`${idPrefix}-blank-gap-${index}`}
            type="number"
            min={1}
            step={1}
            value={row.correctGapIndex}
            onChange={(event) =>
              onChange(
                value.map((currentRow, currentIndex) =>
                  currentIndex === index
                    ? { ...currentRow, correctGapIndex: event.target.value }
                    : currentRow
                )
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />

          <label htmlFor={`${idPrefix}-blank-alt-${index}`}>Accepted Alternatives</label>
          <textarea
            id={`${idPrefix}-blank-alt-${index}`}
            rows={2}
            value={row.acceptedAlternatives}
            onChange={(event) =>
              onChange(
                value.map((currentRow, currentIndex) =>
                  currentIndex === index
                    ? { ...currentRow, acceptedAlternatives: event.target.value }
                    : currentRow
                )
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button
              type="button"
              onClick={() => onChange([...value, createEmptyBlank()])}
              disabled={readOnly}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
              disabled={readOnly || value.length === 0}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {value.length === 0 ? (
        <button type="button" onClick={() => onChange([createEmptyBlank()])} disabled={readOnly}>
          Add Blank
        </button>
      ) : null}
    </div>
  );
}
