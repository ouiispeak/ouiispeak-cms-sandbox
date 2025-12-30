/**
 * Manage Slide Type Configurations Page
 * 
 * Master UI for managing slide type configurations.
 * Allows creating, editing, and previewing configurations for all slide types.
 * 
 * Access at: /manage-slide-configs
 */

"use client";

import { useState, useEffect } from "react";
import CmsPageShell from "../../components/cms/CmsPageShell";
import { SlideTypeConfigEditor } from "../../components/slide-config/SlideTypeConfigEditor";
import { listSlideTypeConfigs } from "../../lib/data/slideTypeConfigs";
import type { SlideTypeConfig } from "../../lib/schemas/slideTypeConfig";
import { uiTokens } from "../../lib/uiTokens";

export default function ManageSlideConfigsPage() {
  const [configs, setConfigs] = useState<SlideTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypeKey, setSelectedTypeKey] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    setError(null);
    const result = await listSlideTypeConfigs(true); // Include inactive
    if (result.error) {
      setError(result.error);
    } else {
      setConfigs(result.data || []);
      // Auto-select first config if none selected
      if (!selectedTypeKey && result.data && result.data.length > 0) {
        setSelectedTypeKey(result.data[0].typeKey);
      }
    }
    setLoading(false);
  }

  const selectedConfig = configs.find(c => c.typeKey === selectedTypeKey);

  return (
    <CmsPageShell>
      <div style={{ padding: uiTokens.space.lg }}>
        <h1 style={{ fontSize: uiTokens.font.pageTitle.size, marginBottom: uiTokens.space.lg }}>
          Manage Slide Type Configurations
        </h1>

        {loading && (
          <div style={{ padding: uiTokens.space.md, textAlign: "center" }}>
            <p>Loading configurations...</p>
          </div>
        )}

        {error && (
          <div style={{ 
            padding: uiTokens.space.md, 
            backgroundColor: uiTokens.color.danger + "20",
            border: `1px solid ${uiTokens.color.danger}`,
            borderRadius: uiTokens.radius.sm,
            color: uiTokens.color.danger,
            marginBottom: uiTokens.space.lg
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Type Selector */}
            <div style={{ marginBottom: uiTokens.space.lg }}>
              <label style={{ 
                display: "block", 
                marginBottom: uiTokens.space.sm, 
                fontSize: uiTokens.font.label.size,
                fontWeight: uiTokens.font.label.weight
              }}>
                Select Slide Type:
              </label>
              <select
                value={selectedTypeKey || ""}
                onChange={(e) => setSelectedTypeKey(e.target.value || null)}
                style={{
                  padding: uiTokens.space.sm,
                  fontSize: uiTokens.font.label.size,
                  borderRadius: uiTokens.radius.sm,
                  border: `1px solid ${uiTokens.color.border}`,
                  minWidth: "300px",
                  backgroundColor: uiTokens.color.bg,
                  color: uiTokens.color.text
                }}
              >
                <option value="">-- Select a slide type --</option>
                {configs.map(config => (
                  <option key={config.typeKey} value={config.typeKey}>
                    {config.displayName} ({config.typeKey}) {config.isActive ? "" : "(inactive)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Editor */}
            {selectedTypeKey && selectedConfig ? (
              <SlideTypeConfigEditor
                key={selectedTypeKey} // Force re-render when typeKey changes
                config={selectedConfig}
                onSave={async (updatedConfig) => {
                  // Reload configs after save
                  await loadConfigs();
                  // Keep the same type selected
                  setSelectedTypeKey(updatedConfig.typeKey);
                }}
                onCancel={() => {
                  // Reload to reset any unsaved changes
                  loadConfigs();
                }}
              />
            ) : selectedTypeKey ? (
              <div style={{ 
                padding: uiTokens.space.lg, 
                backgroundColor: uiTokens.color.surface,
                borderRadius: uiTokens.radius.md,
                textAlign: "center"
              }}>
                <p>Configuration not found for type: {selectedTypeKey}</p>
                <p style={{ fontSize: uiTokens.font.meta.size, color: uiTokens.color.mutedText, marginTop: uiTokens.space.sm }}>
                  You may need to create a configuration for this type first.
                </p>
              </div>
            ) : (
              <div style={{ 
                padding: uiTokens.space.lg, 
                backgroundColor: uiTokens.color.surface,
                borderRadius: uiTokens.radius.md,
                textAlign: "center"
              }}>
                <p>Select a slide type to edit its configuration.</p>
              </div>
            )}
          </>
        )}
      </div>
    </CmsPageShell>
  );
}

