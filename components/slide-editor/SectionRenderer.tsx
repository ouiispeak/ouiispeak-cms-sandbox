/**
 * Dynamic Section Renderer Component
 * 
 * Renders a form section with its fields based on configuration.
 */

"use client";

import CmsSection from "../ui/CmsSection";
import { FieldRenderer } from "./FieldRenderer";
import type { FormSection, FormFieldConfig } from "../../lib/schemas/slideTypeConfig";

interface SectionRendererProps {
  section: FormSection;
  fields: FormFieldConfig[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  defaultLang?: string;
  bucketName?: string;
  slideType?: string;
}

/**
 * Renders a form section with its configured fields
 */
export function SectionRenderer({
  section,
  fields,
  values,
  onChange,
  defaultLang,
  bucketName,
  slideType
}: SectionRendererProps) {
  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <CmsSection
      title={section.title}
      description={section.description}
      backgroundColor={section.backgroundColor}
      borderColor={section.borderColor}
    >
      {sortedFields.map((fieldConfig) => (
        <FieldRenderer
          key={fieldConfig.fieldId}
          fieldConfig={fieldConfig}
          value={values[fieldConfig.fieldId]}
          onChange={(value) => onChange(fieldConfig.fieldId, value)}
          defaultLang={defaultLang}
          bucketName={bucketName}
          slideType={slideType}
        />
      ))}
    </CmsSection>
  );
}

