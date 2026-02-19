"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CmsPageShell from "../../components/cms/CmsPageShell";
import CmsSection from "../../components/ui/CmsSection";
import { uiTokens } from "../../lib/uiTokens";
import { loadQueuedLessons, updateLessonStatus } from "../../lib/data/lessons";
import { loadModules } from "../../lib/data/modules";
import type { LessonData } from "../../lib/data/lessons";
import type { Module } from "../../lib/domain/module";
import { toLesson } from "../../lib/mappers/lessonMapper";
import { getLessonDisplayName, getModuleDisplayName } from "../../lib/utils/displayName";

export default function QueuedPage() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  async function load() {
    setLoading(true);
    setError(null);

    const [lessonsResult, modulesResult] = await Promise.all([
      loadQueuedLessons(),
      loadModules(),
    ]);

    if (lessonsResult.error) {
      setError(lessonsResult.error);
      setLoading(false);
      return;
    }

    if (modulesResult.error) {
      setError(modulesResult.error);
      setLoading(false);
      return;
    }

    setLessons(lessonsResult.data ?? []);
    setModules(modulesResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(lessonId: string) {
    setApprovingId(lessonId);
    setMessage(null);

    const { data, error } = await updateLessonStatus(lessonId, "draft");

    if (error) {
      setMessage(`Approval failed: ${error}`);
      setApprovingId(null);
      return;
    }

    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    setMessage(data ? `"${getLessonDisplayName(toLesson(data as LessonData))}" approved. It is now visible in the dashboard.` : "Lesson approved.");
    setApprovingId(null);
  }

  return (
    <CmsPageShell title="Queued" showBack={false}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: uiTokens.color.textMuted, marginBottom: uiTokens.space.md, fontSize: uiTokens.font.meta.size }}>
          Lessons with status <strong>waiting_review</strong> appear here. They are not visible on the dashboard, in the hierarchy, or anywhere else until approved.
        </p>

        {message && (
          <p
            style={{
              marginBottom: uiTokens.space.md,
              padding: uiTokens.space.sm,
              backgroundColor: uiTokens.color.successBg || "#e8f5e9",
              color: uiTokens.color.text,
              borderRadius: uiTokens.radius.sm,
              fontSize: uiTokens.font.meta.size,
            }}
          >
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: uiTokens.color.danger, marginBottom: uiTokens.space.md }}>
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : lessons.length === 0 ? (
          <CmsSection title="No queued lessons">
            <p style={{ color: uiTokens.color.textMuted }}>
              There are no lessons waiting for review. New lessons from ingestion will appear here.
            </p>
          </CmsSection>
        ) : (
          <CmsSection title={`${lessons.length} lesson${lessons.length !== 1 ? "s" : ""} waiting for review`}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: uiTokens.font.label.size,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${uiTokens.color.border}`, textAlign: "left" }}>
                  <th style={{ padding: uiTokens.space.sm, fontWeight: 600 }}>Lesson</th>
                  <th style={{ padding: uiTokens.space.sm, fontWeight: 600 }}>Module</th>
                  <th style={{ padding: uiTokens.space.sm, fontWeight: 600 }}>Slug</th>
                  <th style={{ padding: uiTokens.space.sm, fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const lessonDomain = toLesson(lesson);
                  const module = lesson.module_id ? moduleMap.get(lesson.module_id) : null;

                  return (
                    <tr
                      key={lesson.id}
                      style={{ borderBottom: `1px solid ${uiTokens.color.border}` }}
                    >
                      <td style={{ padding: uiTokens.space.sm }}>
                        <Link
                          href={`/edit-lesson/${lesson.id}`}
                          style={{ color: uiTokens.color.primary, textDecoration: "none", fontWeight: 500 }}
                        >
                          {getLessonDisplayName(lessonDomain)}
                        </Link>
                      </td>
                      <td style={{ padding: uiTokens.space.sm, color: uiTokens.color.textMuted }}>
                        {module ? getModuleDisplayName(module) : lesson.module_id ?? "—"}
                      </td>
                      <td style={{ padding: uiTokens.space.sm, fontFamily: "monospace", fontSize: uiTokens.font.meta.size }}>
                        {lesson.slug ?? "—"}
                      </td>
                      <td style={{ padding: uiTokens.space.sm }}>
                        <button
                          type="button"
                          onClick={() => handleApprove(lesson.id)}
                          disabled={approvingId === lesson.id}
                          style={{
                            padding: `${uiTokens.space.md} ${uiTokens.space.lg}`,
                            backgroundColor: approvingId === lesson.id ? uiTokens.color.border : uiTokens.color.primary,
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: approvingId === lesson.id ? "not-allowed" : "pointer",
                            fontSize: uiTokens.font.meta.size,
                          }}
                        >
                          {approvingId === lesson.id ? "Approving…" : "Approve"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CmsSection>
        )}
      </div>
    </CmsPageShell>
  );
}
