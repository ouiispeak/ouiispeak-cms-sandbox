"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { uiTokens } from "../../lib/uiTokens";

export default function TopNav() {
  const pathname = usePathname();
  
  const isDashboardActive = pathname === "/";
  const isQueuedActive = pathname === "/queued";
  const isCefrActive = pathname.startsWith("/manage-modules/") || 
                       pathname.startsWith("/edit-level/") || 
                       pathname.startsWith("/level-aspects/") ||
                       pathname.startsWith("/cefr/");
  const isModuleActive = pathname.startsWith("/edit-module/") || 
                         pathname.startsWith("/module-lessons/");
  const isLessonActive = pathname.startsWith("/edit-lesson/") || 
                       pathname.startsWith("/lesson-slides/");
  const isGroupActive = pathname.startsWith("/edit-group/") || 
                        pathname.startsWith("/group-slides/");
  const isSlideActive = pathname.startsWith("/edit-slide/");
  const isConfigActive = pathname.startsWith("/manage-slide-configs");

  // Level colors: background and border/underline
  const levelColors = {
    cefr: { bg: "#83b9b9", border: "#398f8f" },
    module: { bg: "#9cc7c7", border: "#6aabab" },
    lesson: { bg: "#b5d5d5", border: "#6aabab" },
    group: { bg: "#cde3e3", border: "#9cc7c7" },
    slide: { bg: "#e6f1f1", border: "#b4d5d5" },
  };

  const navLinkStyle = (
    isActive: boolean,
    isLast: boolean = false,
    levelType?: keyof typeof levelColors
  ): React.CSSProperties => {
    const colors = levelType && isActive ? levelColors[levelType] : null;
    return {
      fontSize: 14,
      fontWeight: isActive ? 500 : 400,
      textDecoration: "none",
      color: isActive ? uiTokens.color.text : uiTokens.color.textMuted,
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      flex: 1,
      transition: "background-color 0.2s, color 0.2s",
      borderBottom: isActive && colors ? `2px solid ${colors.border}` : isActive ? `2px solid #195149` : "2px solid transparent",
      borderRight: isLast ? "none" : "1px solid #595852",
      backgroundColor: isActive && colors ? colors.bg : isActive ? "#d3e3e1" : "transparent",
    };
  };

  const hoverStyle = {
    backgroundColor: "#d3e3e1",
    color: uiTokens.color.text,
  };

  const divider = (
    <span
      style={{
        width: 3,
        backgroundColor: "#595852",
        height: "100%",
        display: "block",
      }}
    />
  );

  return (
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            borderBottom: `1px solid #595852`,
            borderTop: "1px solid #595852",
            borderLeft: "1px solid #595852",
            borderRight: "1px solid #595852",
            borderRadius: `${uiTokens.radius.md}px ${uiTokens.radius.md}px 0 0`,
            backgroundColor: "#f0ede9",
            display: "flex",
            alignItems: "stretch",
            height: 48,
        }}
      >
      <Link
        href="/"
        style={{
          ...navLinkStyle(isDashboardActive),
        }}
        onMouseEnter={(e) => {
          if (!isDashboardActive) {
            Object.assign(e.currentTarget.style, hoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (!isDashboardActive) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = uiTokens.color.textMuted;
          }
        }}
      >
        CMS Dashboard
      </Link>
      <Link
        href="/queued"
        style={{
          ...navLinkStyle(isQueuedActive),
        }}
        onMouseEnter={(e) => {
          if (!isQueuedActive) {
            Object.assign(e.currentTarget.style, hoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (!isQueuedActive) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = uiTokens.color.textMuted;
          }
        }}
      >
        Queued
      </Link>
      <span style={navLinkStyle(isCefrActive, false, "cefr")}>
        CEFR
      </span>
      <span style={navLinkStyle(isModuleActive, false, "module")}>
        Module
      </span>
      <span style={navLinkStyle(isLessonActive, false, "lesson")}>
        Lesson
      </span>
      <span style={navLinkStyle(isGroupActive, false, "group")}>
        Group
      </span>
      <Link
        href="/manage-slide-configs"
        style={{
          ...navLinkStyle(isConfigActive, true),
        }}
        onMouseEnter={(e) => {
          if (!isConfigActive) {
            Object.assign(e.currentTarget.style, hoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (!isConfigActive) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = uiTokens.color.textMuted;
          }
        }}
      >
        Slide Configs
      </Link>
    </nav>
  );
}
