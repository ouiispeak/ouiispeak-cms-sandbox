/**
 * Dynamic Slide Form Component
 * 
 * Renders a form dynamically based on slide type configuration.
 * This is the main component that replaces hardcoded form logic.
 */

"use client";

import { useSlideTypeConfig } from "../../lib/hooks/slides/useSlideTypeConfig";
import { SectionRenderer } from "./SectionRenderer";
import { groupFieldsBySection } from "../../lib/utils/formUtils";
import { uiTokens } from "../../lib/uiTokens";

interface DynamicSlideFormProps {
  slideType: string;
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  defaultLang?: string;
  bucketName?: string;
}

/**
 * Main dynamic form component that renders based on configuration
 */
export function DynamicSlideForm({
  slideType,
  values,
  onChange,
  defaultLang,
  bucketName = "lesson-audio"
}: DynamicSlideFormProps) {
  const { config, loading, error, reload } = useSlideTypeConfig(slideType);

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: uiTokens.space.lg, textAlign: "center" }}>
        <div style={{ fontSize: uiTokens.font.label.size, color: uiTokens.color.mutedText }}>
          Loading form configuration...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: uiTokens.space.lg }}>
        <div style={{ 
          padding: uiTokens.space.md, 
          backgroundColor: uiTokens.color.danger + "20",
          border: `1px solid ${uiTokens.color.danger}`,
          borderRadius: uiTokens.radius.sm,
          color: uiTokens.color.danger
        }}>
          <strong>Error loading form configuration:</strong> {error}
        </div>
        <div style={{ marginTop: uiTokens.space.md, fontSize: uiTokens.font.meta.size, color: uiTokens.color.mutedText }}>
          Please check your database connection and try again. If the problem persists, contact support.
        </div>
        <div style={{ marginTop: uiTokens.space.sm }}>
          <button
            onClick={reload}
            style={{
              padding: `${uiTokens.space.sm} ${uiTokens.space.md}`,
              backgroundColor: uiTokens.color.secondary || "#6c757d",
              color: "white",
              border: "none",
              borderRadius: uiTokens.radius.sm,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No configuration found - Configs are required
  if (!config) {
    return (
      <div style={{ padding: uiTokens.space.lg }}>
        <div style={{ 
          padding: uiTokens.space.md, 
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: uiTokens.radius.sm,
          color: "#856404"
        }}>
          <strong>Configuration Required</strong>
        </div>
        <div style={{ marginTop: uiTokens.space.md, fontSize: uiTokens.font.label.size, color: uiTokens.color.text }}>
          No configuration found for slide type: <strong>{slideType}</strong>
        </div>
        <div style={{ marginTop: uiTokens.space.md, fontSize: uiTokens.font.label.size, color: uiTokens.color.text }}>
          Slide configurations are required. Please create a configuration for this slide type:
        </div>
        <div style={{ marginTop: uiTokens.space.sm }}>
          <a
            href="/manage-slide-configs"
            style={{
              display: "inline-block",
              padding: `${uiTokens.space.sm} ${uiTokens.space.md}`,
              backgroundColor: uiTokens.color.primary,
              color: "white",
              textDecoration: "none",
              borderRadius: uiTokens.radius.sm,
              fontWeight: 500
            }}
          >
            Go to Manage Slide Configs →
          </a>
        </div>
        <div style={{ marginTop: uiTokens.space.md, fontSize: uiTokens.font.meta.size, color: uiTokens.color.mutedText }}>
          Once you create and save the configuration, click the button below to reload the form.
        </div>
        <div style={{ marginTop: uiTokens.space.sm }}>
          <button
            onClick={reload}
            style={{
              padding: `${uiTokens.space.sm} ${uiTokens.space.md}`,
              backgroundColor: uiTokens.color.secondary || "#6c757d",
              color: "white",
              border: "none",
              borderRadius: uiTokens.radius.sm,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Reload Configuration
          </button>
        </div>
      </div>
    );
  }

  // Group fields by section
  const sectionsWithFields = groupFieldsBySection(config.formConfig);

  // Render form
  return (
    <>
      {/* Refresh button - shown when config is loaded */}
      <div style={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        marginBottom: uiTokens.space.sm 
      }}>
        <button
          onClick={reload}
          disabled={loading}
          style={{
            padding: `${uiTokens.space.xs} ${uiTokens.space.sm}`,
            backgroundColor: loading ? uiTokens.color.mutedText : uiTokens.color.secondary || "#6c757d",
            color: "white",
            border: "none",
            borderRadius: uiTokens.radius.sm,
            fontSize: uiTokens.font.meta.size,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
          title="Reload configuration from database (useful after updating config in manage-slide-configs)"
        >
          {loading ? "Reloading..." : "🔄 Reload Config"}
        </button>
      </div>
      {sectionsWithFields.map(({ section, fields }) => (
        <SectionRenderer
          key={section.id}
          section={section}
          fields={fields}
          values={values}
          onChange={onChange}
          defaultLang={defaultLang}
          bucketName={bucketName}
          slideType={slideType}
        />
      ))}
    </>
  );
}

