"use client";

import { useEffect, useState } from "react";
import CmsPageShell from "../../components/cms/CmsPageShell";
import CmsSection from "../../components/ui/CmsSection";
import { uiTokens } from "../../lib/uiTokens";
import { loadModules } from "../../lib/data/modules";
import { loadApprovedLessonsForBrowse } from "../../lib/data/lessons";
import type { Module } from "../../lib/domain/module";

type LessonRow = { id: string; module_id: string | null; slug: string | null; title: string | null; order_index: number | null };

export default function ModulesBrowserPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: modulesData, error: modulesError } = await loadModules();

      if (modulesError) {
        setError(modulesError);
        return;
      }

      const { data: lessonsData, error: lessonsError } = await loadApprovedLessonsForBrowse();

      if (lessonsError) {
        setError(lessonsError);
        return;
      }

      setModules(modulesData ?? []);
      setLessons((lessonsData ?? []) as LessonRow[]);
    }

    load();
  }, []);

  return (
    <CmsPageShell title="Modules Browser">
      {error && <p style={{ color: uiTokens.color.danger }}>{error}</p>}

      {modules.map((module) => {
        const moduleLessons = lessons.filter(
          (lesson) => lesson.module_id === module.id
        );

        return (
          <CmsSection
            key={module.id}
            title={
              <>
                {module.title}{" "}
                <span className="metaText">({module.slug})</span>
              </>
            }
          >
            {moduleLessons.length === 0 && (
              <p>No lessons in this module yet.</p>
            )}

            <ul style={{ paddingLeft: uiTokens.space.md, margin: 0 }}>
              {moduleLessons.map((lesson) => (
                <li key={lesson.id} style={{ marginBottom: uiTokens.space.xs }}>
                  {lesson.order_index}. {lesson.title}{" "}
                  <span className="metaText">({lesson.slug})</span>
                </li>
              ))}
            </ul>
          </CmsSection>
        );
      })}
    </CmsPageShell>
  );
}
