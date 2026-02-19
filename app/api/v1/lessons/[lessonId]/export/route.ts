/**
 * Lesson Export API Endpoint
 *
 * GET /api/v1/lessons/[lessonId]/export
 * Returns lesson, groups, and slides in one payload
 *
 * Caching: Uses Next.js revalidation (60 seconds)
 */

import { NextRequest, NextResponse } from "next/server";
import { defaultDataAccess } from "@/lib/data/supabaseDataAccess";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    const [lessonResult, groupsResult, slidesResult] = await Promise.all([
      defaultDataAccess.getLessonById(lessonId),
      defaultDataAccess.getGroupsByLessonId(lessonId),
      defaultDataAccess.getSlidesByLessonId(lessonId),
    ]);

    if (lessonResult.error) {
      return NextResponse.json(
        { error: lessonResult.error },
        { status: 404 }
      );
    }

    if (!lessonResult.data) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    if (groupsResult.error) {
      return NextResponse.json(
        { error: groupsResult.error },
        { status: 404 }
      );
    }

    if (slidesResult.error) {
      return NextResponse.json(
        { error: slidesResult.error },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        lesson: lessonResult.data,
        groups: groupsResult.data ?? [],
        slides: slidesResult.data ?? [],
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
