import Link from "next/link";
import { loadLevels } from "@/lib/levels";
import { loadModules } from "@/lib/modules";
import { loadLessons } from "@/lib/lessons";
import { loadGroups } from "@/lib/groups";
import { loadSlides } from "@/lib/slides";

export default async function DashboardPage() {
  try {
    const [levels, modules, lessons, groups, slides] = await Promise.all([
      loadLevels("basic"),
      loadModules(),
      loadLessons(),
      loadGroups(),
      loadSlides(),
    ]);
    const modulesByLevel = new Map<number, typeof modules>();
    const lessonsByModule = new Map<string, typeof lessons>();
    const groupsByLesson = new Map<string, typeof groups>();
    const slidesByGroup = new Map<string, typeof slides>();

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

    return (
      <section className="panel">
        <h2>Curriculum Hierarchy</h2>
        <p className="meta">Current scope: Levels with Modules, Lessons, Groups, and Slides</p>

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
                                return (
                                  <li key={lesson.id} className="treeNode">
                                    <Link href={`/edit-lesson/${lesson.id}`}>{lesson.title || `Lesson ${lesson.id}`}</Link>
                                    <ul className="treeChildren">
                                      {lessonGroups.length === 0 ? (
                                        <li className="treeNode">
                                          <span className="meta">No groups.</span>
                                        </li>
                                      ) : (
                                        lessonGroups.map((group) => {
                                          const groupSlides = slidesByGroup.get(group.id) ?? [];
                                          return (
                                            <li key={group.id} className="treeNode">
                                              <Link href={`/edit-group/${group.id}`}>
                                                {group.title || `Group ${group.id}`}
                                              </Link>
                                              <ul className="treeChildren">
                                                {groupSlides.length === 0 ? (
                                                  <li className="treeNode">
                                                    <span className="meta">No slides.</span>
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
