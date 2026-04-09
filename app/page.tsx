import Link from "next/link";
import { loadLevels } from "@/lib/levels";
import { loadModules } from "@/lib/modules";
import { loadLessons } from "@/lib/lessons";
import { loadGroups } from "@/lib/groups";
import { loadSlides } from "@/lib/slides";
import { loadActivitySlides } from "@/lib/activitySlides";
import { loadTitleSlides } from "@/lib/titleSlides";
import { loadLessonEnds } from "@/lib/lessonEnds";

export default async function DashboardPage() {
  try {
    const [levels, modules, lessons, groups, slides, activitySlides, titleSlides, lessonEnds] = await Promise.all([
      loadLevels("basic"),
      loadModules(),
      loadLessons(),
      loadGroups(),
      loadSlides(),
      loadActivitySlides(),
      loadTitleSlides(),
      loadLessonEnds(),
    ]);
    const modulesByLevel = new Map<number, typeof modules>();
    const lessonsByModule = new Map<string, typeof lessons>();
    const groupsByLesson = new Map<string, typeof groups>();
    const slidesByGroup = new Map<string, typeof slides>();
    const activitySlidesByGroup = new Map<string, typeof activitySlides>();
    const titleSlidesByLesson = new Map<string, typeof titleSlides>();
    const lessonEndsByLesson = new Map<string, typeof lessonEnds>();

    for (const moduleRow of modules) {
      if (moduleRow.level_number === null) {
        continue;
      }

      const bucket = modulesByLevel.get(moduleRow.level_number);
      if (bucket) {
        bucket.push(moduleRow);
      } else {
        modulesByLevel.set(moduleRow.level_number, [moduleRow]);
      }
    }

    for (const lesson of lessons) {
      const bucket = lessonsByModule.get(lesson.module_id);
      if (bucket) {
        bucket.push(lesson);
      } else {
        lessonsByModule.set(lesson.module_id, [lesson]);
      }
    }

    for (const group of groups) {
      const bucket = groupsByLesson.get(group.lesson_id);
      if (bucket) {
        bucket.push(group);
      } else {
        groupsByLesson.set(group.lesson_id, [group]);
      }
    }

    for (const slide of slides) {
      const bucket = slidesByGroup.get(slide.group_id);
      if (bucket) {
        bucket.push(slide);
      } else {
        slidesByGroup.set(slide.group_id, [slide]);
      }
    }

    for (const activitySlide of activitySlides) {
      const bucket = activitySlidesByGroup.get(activitySlide.group_id);
      if (bucket) {
        bucket.push(activitySlide);
      } else {
        activitySlidesByGroup.set(activitySlide.group_id, [activitySlide]);
      }
    }

    for (const titleSlide of titleSlides) {
      const bucket = titleSlidesByLesson.get(titleSlide.lesson_id);
      if (bucket) {
        bucket.push(titleSlide);
      } else {
        titleSlidesByLesson.set(titleSlide.lesson_id, [titleSlide]);
      }
    }

    for (const lessonEnd of lessonEnds) {
      const bucket = lessonEndsByLesson.get(lessonEnd.lesson_id);
      if (bucket) {
        bucket.push(lessonEnd);
      } else {
        lessonEndsByLesson.set(lessonEnd.lesson_id, [lessonEnd]);
      }
    }

    return (
      <section className="panel">
        <h2>Curriculum Hierarchy</h2>
        <p className="meta">
          Current scope: Levels with Modules, Lessons, Title Slides, Groups, Content Slides, Activity Slides, and
          lesson_ends
        </p>

        <ul className="treeRoot">
          {levels.map((level) => {
            const levelModules = modulesByLevel.get(level.level_number) ?? [];

            return (
              <li key={level.level_number} className="treeNode">
                <Link href={`/levels#level-${level.level_number}`}>{level.name}</Link>
                <ul className="treeChildren">
                  {levelModules.length === 0 ? (
                    <li className="treeNode">
                      <span className="meta">No modules.</span>
                    </li>
                  ) : (
                    levelModules.map((moduleRow) => {
                      const moduleLessons = lessonsByModule.get(moduleRow.id) ?? [];
                      return (
                        <li key={moduleRow.id} className="treeNode">
                          <Link href={`/edit-module/${moduleRow.id}`}>
                            {moduleRow.title || `Module ${moduleRow.id}`}
                          </Link>
                          <ul className="treeChildren">
                            {moduleLessons.length === 0 ? (
                              <li className="treeNode">
                                <span className="meta">No lessons.</span>
                              </li>
                            ) : (
                              moduleLessons.map((lesson) => {
                                const lessonGroups = groupsByLesson.get(lesson.id) ?? [];
                                const lessonTitleSlides = titleSlidesByLesson.get(lesson.id) ?? [];
                                const lessonBoundaryEnds = lessonEndsByLesson.get(lesson.id) ?? [];
                                return (
                                  <li key={lesson.id} className="treeNode">
                                    <Link href={`/edit-lesson/${lesson.id}`}>{lesson.title || `Lesson ${lesson.id}`}</Link>
                                    <ul className="treeChildren">
                                      <li className="treeNode">
                                        <span>Title Slide Boundary</span>
                                        <ul className="treeChildren">
                                          {lessonTitleSlides.length === 0 ? (
                                            <li className="treeNode">
                                              <span className="meta">No title slide entries.</span>
                                            </li>
                                          ) : (
                                            lessonTitleSlides.map((titleSlide) => (
                                              <li key={titleSlide.id} className="treeNode">
                                                <Link href={`/edit-title-slide/${titleSlide.id}`}>
                                                  {`Title Slide ${titleSlide.id}`}
                                                </Link>
                                              </li>
                                            ))
                                          )}
                                        </ul>
                                      </li>
                                      {lessonGroups.length === 0 ? (
                                        <li className="treeNode">
                                          <span className="meta">No groups.</span>
                                        </li>
                                      ) : (
                                        lessonGroups.map((group) => {
                                          const groupSlides = slidesByGroup.get(group.id) ?? [];
                                          const groupActivitySlides = activitySlidesByGroup.get(group.id) ?? [];
                                          return (
                                            <li key={group.id} className="treeNode">
                                              <Link href={`/edit-group/${group.id}`}>
                                                {group.title || `Group ${group.id}`}
                                              </Link>
                                              <ul className="treeChildren">
                                                <li className="treeNode">
                                                  <span>Content Slides</span>
                                                  <ul className="treeChildren">
                                                    {groupSlides.length === 0 ? (
                                                      <li className="treeNode">
                                                        <span className="meta">No content slides.</span>
                                                      </li>
                                                    ) : (
                                                      groupSlides.map((slide) => (
                                                        <li key={slide.id} className="treeNode">
                                                          <Link href={`/edit-slide/${slide.id}`}>{`Slide ${slide.id}`}</Link>
                                                        </li>
                                                      ))
                                                    )}
                                                  </ul>
                                                </li>
                                                <li className="treeNode">
                                                  <span>Activity Slides</span>
                                                  <ul className="treeChildren">
                                                    {groupActivitySlides.length === 0 ? (
                                                      <li className="treeNode">
                                                        <span className="meta">No activity slides.</span>
                                                      </li>
                                                    ) : (
                                                      groupActivitySlides.map((activitySlide) => (
                                                        <li key={activitySlide.id} className="treeNode">
                                                          <Link href={`/edit-activity-slide/${activitySlide.id}`}>
                                                            {`Activity Slide ${activitySlide.id}`}
                                                          </Link>
                                                        </li>
                                                      ))
                                                    )}
                                                  </ul>
                                                </li>
                                              </ul>
                                            </li>
                                          );
                                        })
                                      )}
                                      <li className="treeNode">
                                        <span>lesson_ends Boundary</span>
                                        <ul className="treeChildren">
                                          {lessonBoundaryEnds.length === 0 ? (
                                            <li className="treeNode">
                                              <span className="meta">No lesson_ends slide entries.</span>
                                            </li>
                                          ) : (
                                            lessonBoundaryEnds.map((lessonEnd) => (
                                              <li key={lessonEnd.id} className="treeNode">
                                                <Link href={`/edit-lesson-end/${lessonEnd.id}`}>
                                                  {`lesson_ends ${lessonEnd.id}`}
                                                </Link>
                                              </li>
                                            ))
                                          )}
                                        </ul>
                                      </li>
                                    </ul>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        </li>
                      );
                    })
                  )}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="panel">
        <h2>Curriculum Hierarchy</h2>
        <p className="meta">Could not load hierarchy data from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
