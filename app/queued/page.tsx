"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CmsPageShell from "../../components/cms/CmsPageShell";
import { Button } from "../../components/Button";
import CmsSection from "../../components/ui/CmsSection";
import { uiTokens } from "../../lib/uiTokens";
import { loadQueuedLessons, updateLessonStatus, deleteLesson } from "../../lib/data/lessons";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  async function handleDelete(lessonId: string) {
    const lessonDomain = toLesson(lessons.find((l) => l.id === lessonId)!);
    const name = getLessonDisplayName(lessonDomain);
    if (!window.confirm(`Delete "${name}"? This will permanently remove the lesson, its groups, and slides.`)) return;
    setDeletingId(lessonId);
    setMessage(null);

    const { error } = await deleteLesson(lessonId);

    if (error) {
      setMessage(`Deletion failed: ${error}`);
    } else {
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      setMessage(`"${name}" deleted.`);
    }
    setDeletingId(null);
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
              backgroundColor: message.startsWith("Deletion failed") ? (uiTokens.color.dangerBg || "#ffebee") : (uiTokens.color.successBg || "#e8f5e9"),
              color: message.startsWith("Deletion failed") ? (uiTokens.color.danger || "#c62828") : uiTokens.color.text,
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
                        <div style={{ display: "flex", gap: uiTokens.space.xs, alignItems: "center", fontSize: uiTokens.font.meta.size }}>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={approvingId === lesson.id || deletingId === lesson.id}
                            onClick={() => handleApprove(lesson.id)}
                            title={approvingId === lesson.id ? "Approving…" : "Approve lesson"}
                            style={{
                              color: approvingId === lesson.id || deletingId === lesson.id ? "#dededc" : "#ffffff",
                              backgroundColor: approvingId === lesson.id || deletingId === lesson.id ? "#cdcdcb" : uiTokens.color.primary,
                              border: "none",
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={approvingId === lesson.id || deletingId === lesson.id ? "#8b8a86" : "#ffffff"} style={{ width: 16, height: 16 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={approvingId === lesson.id || deletingId === lesson.id}
                            onClick={() => handleDelete(lesson.id)}
                            title={deletingId === lesson.id ? "Deleting…" : "Delete lesson"}
                            style={{
                              color: approvingId === lesson.id || deletingId === lesson.id ? "#dededc" : "#ffffff",
                              backgroundColor: approvingId === lesson.id || deletingId === lesson.id ? "#cdcdcb" : uiTokens.color.danger,
                              border: "none",
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={approvingId === lesson.id || deletingId === lesson.id ? "#8b8a86" : "#ffffff"} style={{ width: 16, height: 16 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </Button>
                        </div>
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
