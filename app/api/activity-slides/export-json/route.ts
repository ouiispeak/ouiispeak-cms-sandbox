import { loadActivitySlideConfigCategories } from "@/lib/universalConfigs";
import { exportEmptyValueForInputType, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";
import {
  filterActivitySlideCategoriesForProfile,
  listActivityProfileExtraFieldKeys,
  resolveActivityProfile,
  resolveConcreteActivityProfile,
} from "@/lib/activityProfiles";
import { ACTIVITY_PROFILE_DEFAULTS } from "@/lib/activityRuntimeDefaults";
import {
  buildActivityPropsJsonTemplate,
  canonicalizeActivityExportTemplate,
} from "@/lib/activityExportCanonicalization";

export const dynamic = "force-dynamic";

type ActivitySlideTemplate = Record<string, Record<string, ExportTemplateValue>>;

export async function GET(request: Request): Promise<Response> {
  const template: ActivitySlideTemplate = {};
  const profile = resolveActivityProfile(new URL(request.url).searchParams.get("profile") ?? undefined);
  const concreteProfile = resolveConcreteActivityProfile(profile);
  const activityId = ACTIVITY_PROFILE_DEFAULTS[concreteProfile].activityId;
  const profileFieldKeys = listActivityProfileExtraFieldKeys(concreteProfile);
  const categories = filterActivitySlideCategoriesForProfile(await loadActivitySlideConfigCategories(), profile);
  const topLevelOnlyFields = getTopLevelOnlyFieldKeys("activity_slides");

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (topLevelOnlyFields.has(field.key)) {
        continue;
      }
      categoryPayload[field.key] = exportEmptyValueForInputType(field.inputType);
    }

    template[category.key] = categoryPayload;
  }

  const identityPayload = template["Identity & Lifecycle"];
  if (identityPayload) {
    if (Object.prototype.hasOwnProperty.call(identityPayload, "activityId")) {
      identityPayload.activityId = activityId;
    }
    if (Object.prototype.hasOwnProperty.call(identityPayload, "type")) {
      identityPayload.type = "activity";
    }
  }

  const activityPayload = template["Activities & Interaction"];
  if (activityPayload && Object.prototype.hasOwnProperty.call(activityPayload, "propsJson")) {
    activityPayload.propsJson = buildActivityPropsJsonTemplate(activityId, profileFieldKeys);
  }

  const payload = {
    slideId: "",
    groupId: "",
    ...canonicalizeActivityExportTemplate(template, activityId),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-slide-template-${profile}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
