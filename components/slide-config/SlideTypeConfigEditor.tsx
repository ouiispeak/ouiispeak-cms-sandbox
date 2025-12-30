/**
 * Slide Type Configuration Editor
 * 
 * Main component for editing slide type configurations.
 * Provides UI for selecting fields, organizing sections, and previewing the form.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { FieldSelector } from "./FieldSelector";
import { ConfigPreview } from "./ConfigPreview";
import { SectionEditor } from "./SectionEditor";
import { updateSlideTypeConfig } from "../../lib/data/slideTypeConfigs";
import type { SlideTypeConfig, FormFieldConfig, FormSection } from "../../lib/schemas/slideTypeConfig";
import { DEFAULT_SECTIONS } from "../../lib/schemas/slideTypeConfig";
import { FIELD_REGISTRY } from "../../lib/schemas/slideFieldRegistry";
import { uiTokens } from "../../lib/uiTokens";
import CmsSection from "../ui/CmsSection";
import SaveChangesButton from "../ui/SaveChangesButton";
import StatusMessage from "../ui/StatusMessage";

interface SlideTypeConfigEditorProps {
  config: SlideTypeConfig;
  onSave: (updatedConfig: SlideTypeConfig) => void;
  onCancel: () => void;
}

export function SlideTypeConfigEditor({
  config,
  onSave,
  onCancel
}: SlideTypeConfigEditorProps) {
  const [editedConfig, setEditedConfig] = useState<SlideTypeConfig>(config);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fields" | "sections" | "preview">("fields");

  // Update editedConfig when config prop changes (e.g., when dropdown selection changes)
  useEffect(() => {
    console.log(`[SlideTypeConfigEditor] Config prop changed for ${config.typeKey}, updating editedConfig`);
    setEditedConfig(config);
    setMessage(null); // Clear any previous messages
  }, [config]);

  // Get all available fields from registry
  const availableFields = useMemo(() => {
    return FIELD_REGISTRY.map(field => ({
      ...field,
      isSelected: editedConfig.formConfig.fields.some(f => f.fieldId === field.id),
      fieldConfig: editedConfig.formConfig.fields.find(f => f.fieldId === field.id)
    }));
  }, [editedConfig]);

  const handleFieldToggle = (fieldId: string, selected: boolean) => {
    setEditedConfig(prev => {
      const newFields = selected
        ? [...prev.formConfig.fields, {
            fieldId,
            sectionId: DEFAULT_SECTIONS[0].id, // Default to first section
            order: prev.formConfig.fields.length + 1,
            required: false,
            visible: true
          }]
        : prev.formConfig.fields.filter(f => f.fieldId !== fieldId);

      // Clean up validation rules for removed fields
      const fieldIds = new Set(newFields.map(f => f.fieldId));
      const cleanedValidationRules = prev.formConfig.validationRules.filter(
        rule => fieldIds.has(rule.fieldId)
      );

      return {
        ...prev,
        formConfig: {
          ...prev.formConfig,
          fields: newFields,
          validationRules: cleanedValidationRules
        }
      };
    });
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormFieldConfig>) => {
    setEditedConfig(prev => ({
      ...prev,
      formConfig: {
        ...prev.formConfig,
        fields: prev.formConfig.fields.map(f =>
          f.fieldId === fieldId ? { ...f, ...updates } : f
        )
      }
    }));
  };

  const handleSectionUpdate = (sectionId: string, updates: Partial<FormSection>) => {
    setEditedConfig(prev => ({
      ...prev,
      formConfig: {
        ...prev.formConfig,
        sections: prev.formConfig.sections.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        )
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Clean up validation rules for fields that don't exist
    const fieldIds = new Set(editedConfig.formConfig.fields.map(f => f.fieldId));
    const cleanedValidationRules = editedConfig.formConfig.validationRules.filter(
      rule => fieldIds.has(rule.fieldId)
    );

    // If validation rules were cleaned, update the config
    const configToSave = cleanedValidationRules.length !== editedConfig.formConfig.validationRules.length
      ? {
          ...editedConfig,
          formConfig: {
            ...editedConfig.formConfig,
            validationRules: cleanedValidationRules
          }
        }
      : editedConfig;

    const result = await updateSlideTypeConfig(configToSave.typeKey, configToSave);

    if (result.error) {
      setMessage(`Error: ${result.error}`);
      setSaving(false);
    } else {
      setMessage("Configuration saved successfully!");
      setSaving(false);
      if (result.data) {
        // Update local state with cleaned config
        setEditedConfig(result.data);
        onSave(result.data);
      }
    }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(editedConfig);

  return (
    <div>
      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: uiTokens.space.sm, 
        marginBottom: uiTokens.space.lg,
        borderBottom: `2px solid ${uiTokens.color.border}`
      }}>
        <button
          type="button"
          onClick={() => setActiveTab("fields")}
          style={{
            padding: `${uiTokens.space.sm} ${uiTokens.space.md}`,
            border: "none",
            borderBottom: activeTab === "fields" ? `3px solid ${uiTokens.color.primary}` : "3px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: uiTokens.font.label.size,
            fontWeight: activeTab === "fields" ? 600 : 400,
            color: activeTab === "fields" ? uiTokens.color.primary : uiTokens.color.text
          }}
        >
          Fields
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sections")}
          style={{
            padding: `${uiTokens.space.sm} ${uiTokens.space.md}`,
            border: "none",
            borderBottom: activeTab === "sections" ? `3px solid ${uiTokens.color.primary}` : "3px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: uiTokens.font.label.size,
            fontWeight: activeTab === "sections" ? 600 : 400,
            color: activeTab === "sections" ? uiTokens.color.primary : uiTokens.color.text
          }}
        >
          Sections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          style={{
            padding: `${uiTokens.space.sm} ${uiTokens.space.md}`,
            border: "none",
            borderBottom: activeTab === "preview" ? `3px solid ${uiTokens.color.primary}` : "3px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: uiTokens.font.label.size,
            fontWeight: activeTab === "preview" ? 600 : 400,
            color: activeTab === "preview" ? uiTokens.color.primary : uiTokens.color.text
          }}
        >
          Preview
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div style={{ marginBottom: uiTokens.space.md }}>
          <StatusMessage variant={message.includes("Error") ? "error" : "success"}>
            {message}
          </StatusMessage>
        </div>
      )}

      {/* Save/Cancel Buttons - Above Fields tab only */}
      {activeTab === "fields" && (
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: uiTokens.space.md,
          marginBottom: uiTokens.space.lg,
          paddingBottom: uiTokens.space.md,
          borderBottom: `1px solid ${uiTokens.color.border}`
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: `${uiTokens.space.sm} ${uiTokens.space.md}`,
              border: `1px solid ${uiTokens.color.border}`,
              borderRadius: uiTokens.radius.sm,
              backgroundColor: uiTokens.color.bg,
              color: uiTokens.color.text,
              cursor: "pointer",
              fontSize: uiTokens.font.label.size
            }}
          >
            Cancel
          </button>
          <SaveChangesButton
            onClick={handleSave}
            hasUnsavedChanges={hasChanges}
            saving={saving}
            label="Save Configuration"
          />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "fields" && (
        <FieldSelector
          availableFields={availableFields}
          config={editedConfig}
          onFieldToggle={handleFieldToggle}
          onFieldUpdate={handleFieldUpdate}
        />
      )}

      {activeTab === "sections" && (
        <SectionEditor
          config={editedConfig}
          onSectionUpdate={handleSectionUpdate}
        />
      )}

      {activeTab === "preview" && (
        <ConfigPreview config={editedConfig} />
      )}
    </div>
  );
}

