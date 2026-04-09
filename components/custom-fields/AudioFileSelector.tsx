"use client";

type AudioFileSelectorProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  readOnly: boolean;
  placeholder?: string;
};

export default function AudioFileSelector({
  id,
  value,
  onChange,
  readOnly,
  placeholder = "lesson-audio/file.mp3",
}: AudioFileSelectorProps) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      readOnly={readOnly}
      disabled={readOnly}
      placeholder={placeholder}
    />
  );
}
