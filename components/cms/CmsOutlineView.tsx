"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../Button";
import { uiTokens } from "../../lib/uiTokens";
import { useCmsDashboard } from "../../lib/hooks/cms/useCmsDashboard";
import { getModuleDisplayName, getLessonDisplayName, getGroupDisplayName, getSlideDisplayName } from "../../lib/utils/displayName";

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

interface CmsOutlineViewProps {
  currentModuleId?: string;
  currentLessonId?: string;
  currentGroupId?: string;
  currentSlideId?: string;
  currentLevel?: string;
  hasUnsavedChanges?: boolean;
}

export default function CmsOutlineView({
  currentModuleId,
  currentLessonId,
  currentGroupId,
  currentSlideId,
  currentLevel,
  hasUnsavedChanges = false,
}: CmsOutlineViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { loadState } = useCmsDashboard();
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [openLessons, setOpenLessons] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openQueued, setOpenQueued] = useState(false);

  // Auto-expand to show current item
  useEffect(() => {
    if (loadState.status === "ready" && (currentModuleId || currentLessonId || currentGroupId || currentSlideId || currentLevel)) {
      const maps = loadState.maps;

      // Check if current item is in queued section
      let queuedLessonId: string | null = null;
      if (currentLessonId && maps.queuedLessons?.some((l) => l.id === currentLessonId)) {
        queuedLessonId = currentLessonId;
      } else if (currentGroupId) {
        for (const [lid, grps] of maps.groupsByLesson.entries()) {
          if (grps.some((g) => g.id === currentGroupId) && maps.queuedLessons?.some((l) => l.id === lid)) {
            queuedLessonId = lid;
            break;
          }
        }
      } else if (currentSlideId) {
        for (const [gid, sls] of maps.slidesByGroup.entries()) {
          if (sls.some((s) => s.id === currentSlideId)) {
            for (const [lid, grps] of maps.groupsByLesson.entries()) {
              if (grps.some((g) => g.id === gid) && maps.queuedLessons?.some((l) => l.id === lid)) {
                queuedLessonId = lid;
                break;
              }
            }
            break;
          }
        }
        if (!queuedLessonId) {
          for (const [lid, sls] of maps.ungroupedSlidesByLesson.entries()) {
            if (sls.some((s) => s.id === currentSlideId) && maps.queuedLessons?.some((l) => l.id === lid)) {
              queuedLessonId = lid;
              break;
            }
          }
        }
      }

      if (queuedLessonId) {
        setOpenQueued(true);
        setOpenLessons((prev) => ({ ...prev, [queuedLessonId!]: true }));
        if (currentGroupId) setOpenGroups((prev) => ({ ...prev, [currentGroupId]: true }));
      }

      // Expand current level (skip for queued items)
      if (currentLevel && !queuedLessonId) {
        setOpenLevels((prev) => ({ ...prev, [currentLevel.toUpperCase()]: true }));
      } else if (currentModuleId) {
        // Find module and expand its level
        for (const [level, modules] of maps.modulesByLevel.entries()) {
          const module = modules.find(m => m.id === currentModuleId);
          if (module) {
            setOpenLevels((prev) => ({ ...prev, [level]: true }));
            setOpenModules((prev) => ({ ...prev, [currentModuleId]: true }));
            break;
          }
        }
      } else if (currentLessonId && !queuedLessonId) {
        // Find lesson's module and expand
        for (const [moduleId, lessons] of maps.lessonsByModule.entries()) {
          const lesson = lessons.find(l => l.id === currentLessonId);
          if (lesson) {
            // Find module to get level
            for (const [level, modules] of maps.modulesByLevel.entries()) {
              const module = modules.find(m => m.id === moduleId);
              if (module) {
                setOpenLevels((prev) => ({ ...prev, [level]: true }));
                setOpenModules((prev) => ({ ...prev, [moduleId]: true }));
                setOpenLessons((prev) => ({ ...prev, [currentLessonId]: true }));
                break;
              }
            }
            break;
          }
        }
      } else if (currentGroupId && !queuedLessonId) {
        // Find group's lesson and module
        for (const [lessonId, groups] of maps.groupsByLesson.entries()) {
          const group = groups.find(g => g.id === currentGroupId);
          if (group) {
            // Find lesson's module
            for (const [moduleId, lessons] of maps.lessonsByModule.entries()) {
              const lesson = lessons.find(l => l.id === lessonId);
              if (lesson) {
                // Find module to get level
                for (const [level, modules] of maps.modulesByLevel.entries()) {
                  const module = modules.find(m => m.id === moduleId);
                  if (module) {
                    setOpenLevels((prev) => ({ ...prev, [level]: true }));
                    setOpenModules((prev) => ({ ...prev, [moduleId]: true }));
                    setOpenLessons((prev) => ({ ...prev, [lessonId]: true }));
                    setOpenGroups((prev) => ({ ...prev, [currentGroupId]: true }));
                    break;
                  }
                }
                break;
              }
            }
            break;
          }
        }
      } else if (currentSlideId && !queuedLessonId) {
        // Find slide's group or lesson
        for (const [groupId, slides] of maps.slidesByGroup.entries()) {
          const slide = slides.find(s => s.id === currentSlideId);
          if (slide) {
            // Find group's lesson
            for (const [lessonId, groups] of maps.groupsByLesson.entries()) {
              const group = groups.find(g => g.id === groupId);
              if (group) {
                // Find lesson's module
                for (const [moduleId, lessons] of maps.lessonsByModule.entries()) {
                  const lesson = lessons.find(l => l.id === lessonId);
                  if (lesson) {
                    // Find module to get level
                    for (const [level, modules] of maps.modulesByLevel.entries()) {
                      const module = modules.find(m => m.id === moduleId);
                      if (module) {
                        setOpenLevels((prev) => ({ ...prev, [level]: true }));
                        setOpenModules((prev) => ({ ...prev, [moduleId]: true }));
                        setOpenLessons((prev) => ({ ...prev, [lessonId]: true }));
                        setOpenGroups((prev) => ({ ...prev, [groupId]: true }));
                        break;
                      }
                    }
                    break;
                  }
                }
                break;
              }
            }
            break;
          }
        }
        // Check ungrouped slides
        if (!maps.slidesByGroup.get(currentSlideId)) {
          for (const [lessonId, slides] of maps.ungroupedSlidesByLesson.entries()) {
            const slide = slides.find(s => s.id === currentSlideId);
            if (slide) {
              // Find lesson's module
              for (const [moduleId, lessons] of maps.lessonsByModule.entries()) {
                const lesson = lessons.find(l => l.id === lessonId);
                if (lesson) {
                  // Find module to get level
                  for (const [level, modules] of maps.modulesByLevel.entries()) {
                    const module = modules.find(m => m.id === moduleId);
                    if (module) {
                      setOpenLevels((prev) => ({ ...prev, [level]: true }));
                      setOpenModules((prev) => ({ ...prev, [moduleId]: true }));
                      setOpenLessons((prev) => ({ ...prev, [lessonId]: true }));
                      break;
                    }
                  }
                  break;
                }
              }
              break;
            }
          }
        }
      }
    }
  }, [loadState, currentModuleId, currentLessonId, currentGroupId, currentSlideId, currentLevel]);

  if (loadState.status !== "ready") {
    return <div style={{ padding: uiTokens.space.md, fontSize: uiTokens.font.meta.size, color: uiTokens.color.textMuted }}>Loading...</div>;
  }

  const maps = loadState.maps;

  function toggleLevel(level: string) {
    setOpenLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  }

  function toggleModule(moduleId: string) {
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }

  function toggleLesson(lessonId: string) {
    setOpenLessons((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }));
  }

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function toggleQueued() {
    setOpenQueued((prev) => !prev);
  }

  function isCurrent(path: string): boolean {
    return pathname === path;
  }

  return (
    <div style={{ padding: uiTokens.space.md, fontSize: uiTokens.font.meta.size }}>
      {LEVELS.map((lvl) => {
        const levelModules = maps.modulesByLevel.get(lvl) ?? [];
        const isOpen = !!openLevels[lvl];
        const isCurrentLevel = currentLevel?.toUpperCase() === lvl;

        return (
          <div key={lvl} style={{ marginBottom: uiTokens.space.xs }}>
            <div style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
              <Button
                variant="ghost"
                onClick={() => toggleLevel(lvl)}
                style={{
                  padding: "2px 4px",
                  minWidth: "auto",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 12 }}>{isOpen ? "▾" : "▸"}</span>
              </Button>
              <Link
                href={`/manage-modules/${lvl.toLowerCase()}`}
                style={{
                  textDecoration: "none",
                  color: isCurrentLevel ? "#398f8f" : uiTokens.color.textMuted,
                  fontWeight: isCurrentLevel ? 600 : 400,
                }}
                onClick={(e) => {
                  if (hasUnsavedChanges && !isCurrentLevel) {
                    e.preventDefault();
                    e.stopPropagation();
                    const confirmed = window.confirm(
                      "You have unsaved changes. Are you sure you want to leave?"
                    );
                    if (confirmed) {
                      router.push(`/manage-modules/${lvl.toLowerCase()}`);
                    }
                  }
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentLevel) {
                    e.currentTarget.style.color = "#398f8f";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentLevel) {
                    e.currentTarget.style.color = uiTokens.color.textMuted;
                  }
                }}
              >
                {lvl}
              </Link>
            </div>

            {isOpen && levelModules.length > 0 && (
              <div style={{ marginLeft: uiTokens.space.md, marginTop: uiTokens.space.xs }}>
                {levelModules.map((module) => {
                  const moduleLessons = maps.lessonsByModule.get(module.id) ?? [];
                  const moduleOpen = !!openModules[module.id];
                  const isCurrentModule = currentModuleId === module.id;

                  return (
                    <div key={module.id} style={{ marginBottom: uiTokens.space.xs }}>
                      <div style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
                        <Button
                          variant="ghost"
                          onClick={() => toggleModule(module.id)}
                          style={{
                            padding: "2px 4px",
                            minWidth: "auto",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: uiTokens.color.textMuted,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#398f8f";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = uiTokens.color.textMuted;
                          }}
                        >
                          <span style={{ fontSize: 12 }}>{moduleOpen ? "▾" : "▸"}</span>
                        </Button>
                        <Link
                          href={`/edit-module/${module.id}`}
                          style={{
                            textDecoration: "none",
                            color: isCurrentModule ? "#398f8f" : uiTokens.color.textMuted,
                            fontWeight: isCurrentModule ? 600 : 400,
                          }}
                          onClick={(e) => {
                            if (hasUnsavedChanges && !isCurrentModule) {
                              e.preventDefault();
                              e.stopPropagation();
                              const confirmed = window.confirm(
                                "You have unsaved changes. Are you sure you want to leave?"
                              );
                              if (confirmed) {
                                router.push(`/edit-module/${module.id}`);
                              }
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrentModule) {
                              e.currentTarget.style.color = "#398f8f";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrentModule) {
                              e.currentTarget.style.color = uiTokens.color.textMuted;
                            }
                          }}
                        >
                          {getModuleDisplayName(module)}
                          {!module.label && module.title && (
                            <span style={{ color: uiTokens.color.textMuted, fontSize: uiTokens.font.meta.size, marginLeft: uiTokens.space.xs }}>
                              ({module.title})
                            </span>
                          )}
                        </Link>
                      </div>

                      {moduleOpen && moduleLessons.length > 0 && (
                        <div style={{ marginLeft: uiTokens.space.md, marginTop: uiTokens.space.xs }}>
                          {moduleLessons.map((lesson) => {
                            const lessonGroups = maps.groupsByLesson.get(lesson.id) ?? [];
                            const ungroupedSlides = maps.ungroupedSlidesByLesson.get(lesson.id) ?? [];
                            const lessonOpen = !!openLessons[lesson.id];
                            const isCurrentLesson = currentLessonId === lesson.id;

                            return (
                              <div key={lesson.id} style={{ marginBottom: uiTokens.space.xs }}>
                                <div style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleLesson(lesson.id)}
                                    style={{
                                      padding: "2px 4px",
                                      minWidth: "auto",
                                      border: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                      color: uiTokens.color.textMuted,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = "#398f8f";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = uiTokens.color.textMuted;
                                    }}
                                  >
                                    <span style={{ fontSize: 12 }}>{lessonOpen ? "▾" : "▸"}</span>
                                  </Button>
                                  <Link
                                    href={`/edit-lesson/${lesson.id}`}
                                    style={{
                                      textDecoration: "none",
                                      color: isCurrentLesson ? "#398f8f" : uiTokens.color.textMuted,
                                      fontWeight: isCurrentLesson ? 600 : 400,
                                    }}
                                    onClick={(e) => {
                                      if (hasUnsavedChanges && !isCurrentLesson) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const confirmed = window.confirm(
                                          "You have unsaved changes. Are you sure you want to leave?"
                                        );
                                        if (confirmed) {
                                          router.push(`/edit-lesson/${lesson.id}`);
                                        }
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isCurrentLesson) {
                                        e.currentTarget.style.color = "#398f8f";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isCurrentLesson) {
                                        e.currentTarget.style.color = uiTokens.color.textMuted;
                                      }
                                    }}
                                  >
                                    {lesson.title}
                                  </Link>
                                </div>

                                {lessonOpen && (lessonGroups.length > 0 || ungroupedSlides.length > 0) && (
                                  <div style={{ marginLeft: uiTokens.space.md, marginTop: uiTokens.space.xs }}>
                                    {lessonGroups.map((group) => {
                                      const groupSlides = maps.slidesByGroup.get(group.id) ?? [];
                                      const groupOpen = !!openGroups[group.id];
                                      const isCurrentGroup = currentGroupId === group.id;

                                      return (
                                        <div key={group.id} style={{ marginBottom: uiTokens.space.xs }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
                                            <Button
                                              variant="ghost"
                                              onClick={() => toggleGroup(group.id)}
                                              style={{
                                                padding: "2px 4px",
                                                minWidth: "auto",
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                color: uiTokens.color.textMuted,
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.color = "#398f8f";
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.color = uiTokens.color.textMuted;
                                              }}
                                            >
                                              <span style={{ fontSize: 12 }}>{groupOpen ? "▾" : "▸"}</span>
                                            </Button>
                                            <Link
                                              href={`/edit-group/${group.id}`}
                                              style={{
                                                textDecoration: "none",
                                                color: isCurrentGroup ? "#398f8f" : uiTokens.color.textMuted,
                                                fontWeight: isCurrentGroup ? 600 : 400,
                                              }}
                                              onClick={(e) => {
                                                if (hasUnsavedChanges && !isCurrentGroup) {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  const confirmed = window.confirm(
                                                    "You have unsaved changes. Are you sure you want to leave?"
                                                  );
                                                  if (confirmed) {
                                                    router.push(`/edit-group/${group.id}`);
                                                  }
                                                }
                                              }}
                                              onMouseEnter={(e) => {
                                                if (!isCurrentGroup) {
                                                  e.currentTarget.style.color = "#398f8f";
                                                }
                                              }}
                                              onMouseLeave={(e) => {
                                                if (!isCurrentGroup) {
                                                  e.currentTarget.style.color = uiTokens.color.textMuted;
                                                }
                                              }}
                                            >
                                              {group.title}
                                            </Link>
                                          </div>

                                          {groupOpen && groupSlides.length > 0 && (
                                            <ul style={{ marginLeft: uiTokens.space.md, marginTop: uiTokens.space.xs, paddingLeft: uiTokens.space.md, listStyle: "disc", marginBottom: 0 }}>
                                              {groupSlides.map((slide) => {
                                                const isCurrentSlide = currentSlideId === slide.id;

                                                return (
                                                  <li key={slide.id} style={{ marginBottom: uiTokens.space.xs }}>
                                                    <Link
                                                      href={`/edit-slide/${slide.id}`}
                                                      onClick={(e) => {
                                                        if (hasUnsavedChanges && !isCurrentSlide) {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          const confirmed = window.confirm(
                                                            "You have unsaved changes. Are you sure you want to leave?"
                                                          );
                                                          if (confirmed) {
                                                            router.push(`/edit-slide/${slide.id}`);
                                                          }
                                                        }
                                                      }}
                                                      style={{
                                                        textDecoration: "none",
                                                        color: isCurrentSlide ? "#398f8f" : uiTokens.color.textMuted,
                                                        fontWeight: isCurrentSlide ? 600 : 400,
                                                      }}
                                                      onMouseEnter={(e) => {
                                                        if (!isCurrentSlide) {
                                                          e.currentTarget.style.color = "#398f8f";
                                                        }
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        if (!isCurrentSlide) {
                                                          e.currentTarget.style.color = uiTokens.color.textMuted;
                                                        }
                                                      }}
                                                    >
                                                      {getSlideDisplayName(slide)}
                                                    </Link>
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {ungroupedSlides.length > 0 && (
                                      <ul style={{ marginTop: uiTokens.space.xs, marginLeft: uiTokens.space.md, paddingLeft: uiTokens.space.md, listStyle: "disc", marginBottom: 0 }}>
                                        {ungroupedSlides.map((slide) => {
                                          const isCurrentSlide = currentSlideId === slide.id;

                                          return (
                                            <li key={slide.id} style={{ marginBottom: uiTokens.space.xs }}>
                                              <Link
                                                href={`/edit-slide/${slide.id}`}
                                                onClick={(e) => {
                                                  if (hasUnsavedChanges && !isCurrentSlide) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const confirmed = window.confirm(
                                                      "You have unsaved changes. Are you sure you want to leave?"
                                                    );
                                                    if (confirmed) {
                                                      router.push(`/edit-slide/${slide.id}`);
                                                    }
                                                  }
                                                }}
                                                style={{
                                                  textDecoration: "none",
                                                  color: isCurrentSlide ? "#398f8f" : uiTokens.color.textMuted,
                                                  fontWeight: isCurrentSlide ? 600 : 400,
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (!isCurrentSlide) {
                                                    e.currentTarget.style.color = "#398f8f";
                                                  }
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (!isCurrentSlide) {
                                                    e.currentTarget.style.color = uiTokens.color.textMuted;
                                                  }
                                                }}
                                              >
                                                {getSlideDisplayName(slide)}
                                              </Link>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Queued section - lessons with status waiting_review */}
      {(maps.queuedLessons?.length ?? 0) > 0 && (
        <div style={{ marginBottom: uiTokens.space.xs, marginTop: uiTokens.space.md }}>
          <div style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
            <Button
              variant="ghost"
              onClick={() => toggleQueued()}
              style={{
                padding: "2px 4px",
                minWidth: "auto",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 12 }}>{openQueued ? "▾" : "▸"}</span>
            </Button>
            <Link
              href="/queued"
              style={{
                textDecoration: "none",
                color: uiTokens.color.textMuted,
                fontWeight: 400,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#398f8f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = uiTokens.color.textMuted;
              }}
            >
              Queued
            </Link>
          </div>

          {openQueued && (
            <div style={{ marginLeft: uiTokens.space.md, marginTop: uiTokens.space.xs }}>
              {maps.queuedLessons.map((lesson) => {
                const lessonGroups = maps.groupsByLesson.get(lesson.id) ?? [];
                const ungroupedSlides = maps.ungroupedSlidesByLesson.get(lesson.id) ?? [];
                const lessonOpen = !!openLessons[lesson.id];
                const isCurrentLesson = currentLessonId === lesson.id;

                return (
                  <div key={lesson.id} style={{ marginBottom: uiTokens.space.xs }}>
                    <div style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
                      <Button
                        variant="ghost"
                        onClick={() => toggleLesson(lesson.id)}
                        style={{
                          padding: "2px 4px",
                          minWidth: "auto",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: uiTokens.color.textMuted,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#398f8f";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = uiTokens.color.textMuted;
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{lessonOpen ? "▾" : "▸"}</span>
                      </Button>
                      <Link
                        href={`/edit-lesson/${lesson.id}`}
                        style={{
                          textDecoration: "none",
                          color: isCurrentLesson ? "#398f8f" : uiTokens.color.textMuted,
                          fontWeight: isCurrentLesson ? 600 : 400,
                        }}
                        onClick={(e) => {
                          if (hasUnsavedChanges && !isCurrentLesson) {
                            e.preventDefault();
                            e.stopPropagation();
                            const confirmed = window.confirm(
                              "You have unsaved changes. Are you sure you want to leave?"
                            );
                            if (confirmed) {
                              router.push(`/edit-lesson/${lesson.id}`);
                            }
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrentLesson) {
                            e.currentTarget.style.color = "#398f8f";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrentLesson) {
                            e.currentTarget.style.color = uiTokens.color.textMuted;
                          }
                        }}
                      >
                        {getLessonDisplayName(lesson)}
                      </Link>
                    </div>

                    {lessonOpen && (lessonGroups.length > 0 || ungroupedSlides.length > 0) && (
                      <div style={{ marginLeft: uiTokens.space.md, marginTop: uiTokens.space.xs }}>
                        {lessonGroups.map((group) => {
                          const groupSlides = maps.slidesByGroup.get(group.id) ?? [];
                          const groupOpen = !!openGroups[group.id];
                          const isCurrentGroup = currentGroupId === group.id;

                          return (
                            <div key={group.id} style={{ marginBottom: uiTokens.space.xs }}>
                              <div style={{ display: "flex", alignItems: "center", gap: uiTokens.space.xs }}>
                                <Button
                                  variant="ghost"
                                  onClick={() => toggleGroup(group.id)}
                                  style={{
                                    padding: "2px 4px",
                                    minWidth: "auto",
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: uiTokens.color.textMuted,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#398f8f";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = uiTokens.color.textMuted;
                                  }}
                                >
                                  <span style={{ fontSize: 12 }}>{groupOpen ? "▾" : "▸"}</span>
                                </Button>
                                <Link
                                  href={`/edit-group/${group.id}`}
                                  style={{
                                    textDecoration: "none",
                                    color: isCurrentGroup ? "#398f8f" : uiTokens.color.textMuted,
                                    fontWeight: isCurrentGroup ? 600 : 400,
                                  }}
                                  onClick={(e) => {
                                    if (hasUnsavedChanges && !isCurrentGroup) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const confirmed = window.confirm(
                                        "You have unsaved changes. Are you sure you want to leave?"
                                      );
                                      if (confirmed) {
                                        router.push(`/edit-group/${group.id}`);
                                      }
                                    }
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isCurrentGroup) {
                                      e.currentTarget.style.color = "#398f8f";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isCurrentGroup) {
                                      e.currentTarget.style.color = uiTokens.color.textMuted;
                                    }
                                  }}
                                >
                                  {getGroupDisplayName(group)}
                                </Link>
                              </div>

                              {groupOpen && groupSlides.length > 0 && (
                                <ul style={{ marginLeft: uiTokens.space.md, marginTop: uiTokens.space.xs, paddingLeft: uiTokens.space.md, listStyle: "disc", marginBottom: 0 }}>
                                  {groupSlides.map((slide) => {
                                    const isCurrentSlide = currentSlideId === slide.id;

                                    return (
                                      <li key={slide.id} style={{ marginBottom: uiTokens.space.xs }}>
                                        <Link
                                          href={`/edit-slide/${slide.id}`}
                                          onClick={(e) => {
                                            if (hasUnsavedChanges && !isCurrentSlide) {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const confirmed = window.confirm(
                                                "You have unsaved changes. Are you sure you want to leave?"
                                              );
                                              if (confirmed) {
                                                router.push(`/edit-slide/${slide.id}`);
                                              }
                                            }
                                          }}
                                          style={{
                                            textDecoration: "none",
                                            color: isCurrentSlide ? "#398f8f" : uiTokens.color.textMuted,
                                            fontWeight: isCurrentSlide ? 600 : 400,
                                          }}
                                          onMouseEnter={(e) => {
                                            if (!isCurrentSlide) {
                                              e.currentTarget.style.color = "#398f8f";
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (!isCurrentSlide) {
                                              e.currentTarget.style.color = uiTokens.color.textMuted;
                                            }
                                          }}
                                        >
                                          {getSlideDisplayName(slide)}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          );
                        })}

                        {ungroupedSlides.length > 0 && (
                          <ul style={{ marginTop: uiTokens.space.xs, marginLeft: uiTokens.space.md, paddingLeft: uiTokens.space.md, listStyle: "disc", marginBottom: 0 }}>
                            {ungroupedSlides.map((slide) => {
                              const isCurrentSlide = currentSlideId === slide.id;

                              return (
                                <li key={slide.id} style={{ marginBottom: uiTokens.space.xs }}>
                                  <Link
                                    href={`/edit-slide/${slide.id}`}
                                    onClick={(e) => {
                                      if (hasUnsavedChanges && !isCurrentSlide) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const confirmed = window.confirm(
                                          "You have unsaved changes. Are you sure you want to leave?"
                                        );
                                        if (confirmed) {
                                          router.push(`/edit-slide/${slide.id}`);
                                        }
                                      }
                                    }}
                                    style={{
                                      textDecoration: "none",
                                      color: isCurrentSlide ? "#398f8f" : uiTokens.color.textMuted,
                                      fontWeight: isCurrentSlide ? 600 : 400,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isCurrentSlide) {
                                        e.currentTarget.style.color = "#398f8f";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isCurrentSlide) {
                                        e.currentTarget.style.color = uiTokens.color.textMuted;
                                      }
                                    }}
                                  >
                                    {getSlideDisplayName(slide)}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

