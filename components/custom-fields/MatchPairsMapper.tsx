"use client";

export type MatchPairValue = {
  left: string;
  right: string;
};

type MatchPairsMapperProps = {
  idPrefix: string;
  value: MatchPairValue[];
  onChange: (next: MatchPairValue[]) => void;
  readOnly: boolean;
};

function createEmptyPair(): MatchPairValue {
  return { left: "", right: "" };
}

export default function MatchPairsMapper({ idPrefix, value, onChange, readOnly }: MatchPairsMapperProps) {
  const pairs = value;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {pairs.map((pair, index) => (
        <div
          key={`${idPrefix}-pair-${index}`}
          style={{ border: "1px solid #d8dee9", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}
        >
          <strong>{`Pair ${index + 1}`}</strong>
          <label htmlFor={`${idPrefix}-pair-${index}-left`}>Left</label>
          <input
            id={`${idPrefix}-pair-${index}-left`}
            type="text"
            value={pair.left}
            onChange={(event) =>
              onChange(
                pairs.map((row, rowIndex) =>
                  rowIndex === index ? { ...row, left: event.target.value } : row
                )
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={`${idPrefix}-pair-${index}-right`}>Right</label>
          <input
            id={`${idPrefix}-pair-${index}-right`}
            type="text"
            value={pair.right}
            onChange={(event) =>
              onChange(
                pairs.map((row, rowIndex) =>
                  rowIndex === index ? { ...row, right: event.target.value } : row
                )
              )
            }
            readOnly={readOnly}
            disabled={readOnly}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => onChange([...pairs, createEmptyPair()])} disabled={readOnly}>
              Add
            </button>
            <button
              type="button"
              onClick={() => onChange(pairs.filter((_, rowIndex) => rowIndex !== index))}
              disabled={readOnly || pairs.length === 0}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {pairs.length === 0 ? (
        <button type="button" onClick={() => onChange([createEmptyPair()])} disabled={readOnly}>
          Add Pair
        </button>
      ) : null}
    </div>
  );
}
