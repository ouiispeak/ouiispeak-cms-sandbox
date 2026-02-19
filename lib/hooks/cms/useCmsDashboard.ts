import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { loadDashboardData } from "../../data/dashboard";
import { buildCmsHierarchy, type CmsHierarchyMaps, type LessonForHierarchy } from "../../data/buildHierarchy";
import { loadQueuedLessons } from "../../data/lessons";
import { loadGroupsByLesson } from "../../data/groups";
import { toLesson } from "../../mappers/lessonMapper";
import type { LessonData } from "../../data/lessons";
import { supabase } from "../../supabase";
import { toSlideMinimal } from "../../mappers/slideMapper";
import type { SlideForHierarchy } from "../../data/buildHierarchy";
import { validateSlidePropsRuntime } from "../../utils/validateSlideProps";
import { logger } from "../../utils/logger";

export type DashboardLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; maps: CmsHierarchyMaps };

export function useCmsDashboard() {
  const [loadState, setLoadState] = useState<DashboardLoadState>({ status: "loading" });
  const pathname = usePathname();

  const loadData = useCallback(async () => {
    setLoadState({ status: "loading" });

    const [dashboardResult, queuedResult] = await Promise.all([
      loadDashboardData(),
      loadQueuedLessons(),
    ]);

    if (dashboardResult.error || !dashboardResult.data) {
      setLoadState({
        status: "error",
        message: dashboardResult.error || "Failed to load dashboard data",
      });
      return;
    }

    const { modules, lessons, groups, slides } = dashboardResult.data;

    // Load queued lessons with their groups and slides
    let queuedLessons: LessonForHierarchy[] = [];
    let queuedGroups = [...groups];
    let queuedSlides = [...slides];

    if (queuedResult.data && queuedResult.data.length > 0) {
      queuedLessons = (queuedResult.data as LessonData[]).map((ld) => {
        const lesson = toLesson(ld);
        return {
          id: lesson.id,
          slug: lesson.slug,
          label: lesson.label,
          title: lesson.title,
          moduleId: lesson.moduleId,
          orderIndex: ld.order_index,
        };
      });

      const queuedLessonIds = queuedLessons.map((l) => l.id).filter((id): id is string => !!id);

      // Load groups for queued lessons
      const groupPromises = queuedLessonIds.map((lid) => loadGroupsByLesson(lid));
      const groupResults = await Promise.all(groupPromises);
      for (const gr of groupResults) {
        if (gr.data) queuedGroups.push(...gr.data);
      }

      // Load slides for queued lessons
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validIds = queuedLessonIds.filter((id) => id && uuidRegex.test(id));
      if (validIds.length > 0) {
        const { data: slidesData, error: slidesError } = await supabase
          .from("slides")
          .select("id, lesson_id, group_id, order_index, type, props_json")
          .in("lesson_id", validIds)
          .order("order_index", { ascending: true });

        if (!slidesError && slidesData) {
          const mapped: SlideForHierarchy[] = (slidesData as Array<{ id: string; lesson_id: string | null; group_id: string | null; order_index: number | null; type: string; props_json: unknown }>).map((row) => {
            const validation = validateSlidePropsRuntime(row.type, row.props_json, row.id);
            if (!validation.valid) {
              logger.warn("[Dashboard Slide Props Validation]", { slideId: row.id, slideType: row.type, errors: validation.errors, warnings: validation.warnings });
            }
            return {
              ...toSlideMinimal({
                id: row.id,
                lesson_id: row.lesson_id,
                group_id: row.group_id,
                order_index: row.order_index,
                type: row.type,
              }),
              propsJson: row.props_json,
            };
          });
          queuedSlides.push(...mapped);
        }
      }

      queuedLessons.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.id.localeCompare(b.id));
    }

    // Build hierarchy with merged groups/slides (includes queued)
    const maps = buildCmsHierarchy(
      modules,
      lessons,
      queuedGroups,
      queuedSlides
    );
    maps.queuedLessons = queuedLessons;

    setLoadState({ status: "ready", maps });
  }, []);

  useEffect(() => {
    loadData();
  }, [pathname, loadData]);

  return {
    loadState,
    reload: loadData,
  };
}
