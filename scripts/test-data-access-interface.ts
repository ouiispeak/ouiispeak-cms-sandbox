/**
 * Tier 3.1 Step 1 Test: Data Access Interface
 * 
 * Tests: Does the interface compile and work correctly?
 */

import type { IDataAccess, DataResult } from "../lib/data/interfaces";
import type { Lesson } from "../lib/domain/lesson";
import type { Slide } from "../lib/domain/slide";
import type { GroupMinimal } from "../lib/domain/group";

/**
 * Mock implementation for testing
 */
class MockDataAccess implements IDataAccess {
  async getLessonById(lessonId: string): Promise<DataResult<Lesson>> {
    return {
      data: {
        id: lessonId,
        moduleId: "module-1",
        label: "Test Lesson",
        title: "Test Lesson Title",
        slug: "test-lesson",
        orderIndex: 1,
        estimatedMinutes: null,
        requiredScore: null,
        content: null,
        shortSummaryAdmin: null,
        shortSummaryStudent: null,
        courseOrganizationGroup: null,
        slideContents: null,
        activityTypes: null,
        activityDescription: null,
        signatureMetaphors: null,
        mainGrammarTopics: null,
        pronunciationFocus: null,
        vocabularyTheme: null,
        l1L2Issues: null,
        prerequisites: null,
        learningObjectives: null,
        notesForTeacherOrAI: null,
      },
      error: null,
    };
  }

  async getSlidesByLessonId(lessonId: string): Promise<DataResult<Slide[]>> {
    return {
      data: [
        {
          id: "slide-1",
          lessonId,
          groupId: "group-1",
          orderIndex: 1,
          type: "text-slide",
          propsJson: {},
          aidHook: null,
          code: null,
          metaJson: null,
          isActivity: false,
          scoreType: null,
          passingScoreValue: null,
          maxScoreValue: null,
          passRequiredForNext: null,
        },
      ],
      error: null,
    };
  }

  async getGroupsByLessonId(lessonId: string): Promise<DataResult<GroupMinimal[]>> {
    return {
      data: [
        {
          id: "group-1",
          lessonId,
          orderIndex: 1,
          label: "Test Group",
          title: "Test Group Title",
        },
      ],
      error: null,
    };
  }
}

async function testDataAccessInterface() {
  console.log("🧪 Step 1 Test: Data Access Interface");
  console.log("");

  try {
    const dataAccess: IDataAccess = new MockDataAccess();

    // Test getLessonById
    console.log("Testing getLessonById()...");
    const lessonResult = await dataAccess.getLessonById("test-lesson-1");
    if (lessonResult.error || !lessonResult.data) {
      console.log("❌ ERROR: getLessonById failed");
      process.exit(1);
    }
    console.log("✅ SUCCESS: getLessonById works");
    console.log(`   Lesson: ${lessonResult.data.label}`);
    console.log("");

    // Test getSlidesByLessonId
    console.log("Testing getSlidesByLessonId()...");
    const slidesResult = await dataAccess.getSlidesByLessonId("test-lesson-1");
    if (slidesResult.error || !slidesResult.data) {
      console.log("❌ ERROR: getSlidesByLessonId failed");
      process.exit(1);
    }
    console.log("✅ SUCCESS: getSlidesByLessonId works");
    console.log(`   Slides: ${slidesResult.data.length}`);
    console.log("");

    // Test getGroupsByLessonId
    console.log("Testing getGroupsByLessonId()...");
    const groupsResult = await dataAccess.getGroupsByLessonId("test-lesson-1");
    if (groupsResult.error || !groupsResult.data) {
      console.log("❌ ERROR: getGroupsByLessonId failed");
      process.exit(1);
    }
    console.log("✅ SUCCESS: getGroupsByLessonId works");
    console.log(`   Groups: ${groupsResult.data.length}`);
    console.log("");

    console.log("✅ Step 1 PASSED: Data access interface works correctly!");
  } catch (err) {
    console.log("❌ FAILED:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

testDataAccessInterface();

