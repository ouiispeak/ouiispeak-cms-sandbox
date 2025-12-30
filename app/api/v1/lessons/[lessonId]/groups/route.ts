/**
 * Tier 3.1 Step 5: Lesson Groups API Endpoint
 * 
 * GET /api/v1/lessons/[lessonId]/groups
 * Returns all groups for a lesson
 * 
 * Caching: Uses Next.js revalidation (60 seconds)
 */

import { NextRequest, NextResponse } from "next/server";
import { defaultDataAccess } from "@/lib/data/supabaseDataAccess";

// Tier 3.1 Step 4: Enable caching with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

/**
 * GET /api/v1/lessons/[lessonId]/groups
 * 
 * Returns all groups for a lesson
 */
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

    const result = await defaultDataAccess.getGroupsByLessonId(lessonId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Groups not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Tier 3.1 Step 4: Cache control headers
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

