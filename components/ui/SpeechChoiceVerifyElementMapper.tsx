"use client";

import { useState } from "react";
import { uiTokens } from "../../lib/uiTokens";
import FormField from "./FormField";
import Input from "./Input";
import Select from "./Select";
import AudioFileSelector from "./AudioFileSelector";
import { Button } from "../Button";
import { useElementMapper } from "../../lib/hooks/utils/useElementMapper";
import { normalizeLanguageToPlayer } from "../../lib/utils/elementMapperUtils";
import type { SpeechChoiceVerifyElement, SpeechConfig } from "../../lib/types/slideProps";
import { SPEECH_MODES, PLAYER_LANGUAGES } from "../../lib/constants/slideConstants";

type SpeechChoiceVerifyElementMapperProps = {
  elements: Array<{
    label: string;
    referenceText?: string;
    speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
  }>;
  onElementsChange: (elements: Array<{
    label: string;
    referenceText?: string;
    speech: { mode: "tts" | "file"; lang?: "en" | "fr"; text?: string; fileUrl?: string };
  }>) => void;
  bucketName: string;
  defaultLang?: string;
};

export default function SpeechChoiceVerifyElementMapper({
  elements,
  onElementsChange,
  bucketName,
  defaultLang = "en",
}: SpeechChoiceVerifyElementMapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const createEmptyElement = () => {
    const normalizedLang = normalizeLanguageToPlayer(defaultLang);
    return {
      label: "",
      referenceText: "",
      speech: {
        mode: SPEECH_MODES.TTS,
        lang: normalizedLang,
        text: "",
      },
    };
  };

  const { handleAddElement, handleRemoveElement, handleElementChange } = useElementMapper(
    elements,
    onElementsChange,
    createEmptyElement
  );

  const handleSpeechModeChange = (index: number, mode: "tts" | "file") => {
    const element = elements[index];
    const normalizedLang = normalizeLanguageToPlayer(element.speech.lang, defaultLang);
    
    const updatedSpeech: SpeechConfig = {
      mode,
      lang: normalizedLang,
    };
    
    if (mode === SPEECH_MODES.TTS) {
      updatedSpeech.text = element.speech.text || element.label;
    } else {
      updatedSpeech.fileUrl = element.speech.fileUrl || "";
    }
    
    handleElementChange(index, { speech: updatedSpeech });
  };

  const handleLabelChange = (index: number, label: string) => {
    handleElementChange(index, { label });
    // Auto-update referenceText if it's empty or matches old label
    const element = elements[index];
    if (!element.referenceText || element.referenceText === element.label) {
      handleElementChange(index, { referenceText: label });
    }
  };

  const handleReferenceTextChange = (index: number, referenceText: string) => {
    handleElementChange(index, { referenceText });
  };

  const handleSpeechLangChange = (index: number, lang: "en" | "fr") => {
    const element = elements[index];
    handleElementChange(index, {
      speech: {
        ...element.speech,
        lang,
      },
    });
  };

  const handleSpeechTextChange = (index: number, text: string) => {
    const element = elements[index];
    handleElementChange(index, {
      speech: {
        ...element.speech,
        text,
      },
    });
  };

  const handleSpeechFileUrlChange = (index: number, fileUrl: string) => {
    const element = elements[index];
    handleElementChange(index, {
      speech: {
        ...element.speech,
        fileUrl,
        mode: SPEECH_MODES.FILE,
      },
    });
  };

  return (
    <div style={{ marginTop: uiTokens.space.sm }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: uiTokens.space.sm }}>
        <h3 style={{ fontSize: uiTokens.font.sectionTitle.size, fontWeight: 600 }}>Choices</h3>
        <div style={{ display: "flex", gap: uiTokens.space.xs }}>
          <Button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ backgroundColor: uiTokens.color.primary, color: "white" }}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
          <Button
            type="button"
            onClick={handleAddElement}
            style={{ backgroundColor: uiTokens.color.success, color: "white" }}
          >
            Add Choice
          </Button>
        </div>
      </div>

      {elements.length === 0 ? (
        <p style={{ color: uiTokens.color.textMuted, fontStyle: "italic" }}>
          No choices added yet. Click "Add Choice" to get started.
        </p>
      ) : (
        elements.map((element, index) => (
          <div
            key={index}
            style={{
              marginBottom: uiTokens.space.lg,
              padding: uiTokens.space.md,
              backgroundColor: uiTokens.color.bg,
              borderRadius: uiTokens.radius.md,
              border: `1px solid ${uiTokens.color.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: uiTokens.space.sm }}>
              <h4 style={{ fontSize: uiTokens.font.sectionTitle.size, fontWeight: 600 }}>Choice {index + 1}</h4>
              <Button
                type="button"
                onClick={() => handleRemoveElement(index)}
                style={{ backgroundColor: uiTokens.color.danger, color: "white" }}
              >
                Remove
              </Button>
            </div>

            <FormField label="Label" required infoTooltip="Display text shown to students (e.g., 'A', 'B', 'J', 'G')">
              <Input
                value={element.label}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                placeholder="e.g., A, B, J, G"
              />
            </FormField>

            <FormField 
              label="Reference Text" 
              required 
              infoTooltip="Text used for matching student's speech. Should match what the student will say (e.g., 'J', 'jay', 'G', 'gee'). Defaults to label if not set."
            >
              <Input
                value={element.referenceText || element.label}
                onChange={(e) => handleReferenceTextChange(index, e.target.value)}
                placeholder="e.g., J, jay, G, gee"
              />
            </FormField>

            <FormField label="Speech Mode" required>
              <Select
                value={element.speech.mode}
                onChange={(e) => handleSpeechModeChange(index, e.target.value as "tts" | "file")}
              >
                <option value="tts">TTS (Text-to-Speech)</option>
                <option value="file">Audio File</option>
              </Select>
            </FormField>

            {element.speech.mode === "tts" ? (
              <>
                <FormField label="Language" required>
                  <Select
                    value={element.speech.lang || "en"}
                    onChange={(e) => handleSpeechLangChange(index, e.target.value as "en" | "fr")}
                  >
                    {Object.entries(PLAYER_LANGUAGES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key === "ENGLISH" ? "English" : "French"}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="TTS Text" required infoTooltip="Text to speak. Defaults to label if not set.">
                  <Input
                    value={element.speech.text || element.label}
                    onChange={(e) => handleSpeechTextChange(index, e.target.value)}
                    placeholder="Text to speak"
                  />
                </FormField>
              </>
            ) : (
              <FormField label="Audio File" required>
                <AudioFileSelector
                  bucketName={bucketName}
                  value={element.speech.fileUrl || ""}
                  onChange={(fileUrl) => handleSpeechFileUrlChange(index, fileUrl)}
                />
              </FormField>
            )}
          </div>
        ))
      )}
    </div>
  );
}

