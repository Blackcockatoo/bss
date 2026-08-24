import {
  ROUTE_PROGRESSION,
  ROUTE_PROGRESSION_SEQUENCE,
} from "@/lib/routeProgression";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import { SCHOOL_PROFILE_DESCRIPTION } from "@/lib/schools/privacyTruth";

function formatPortalLabel(label: string) {
  return label === label.toUpperCase() ? label : label.toLowerCase();
}

function joinWithOxfordComma(values: string[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

const PORTAL_LADDER_LABELS = ROUTE_PROGRESSION_SEQUENCE.map((routeKey) =>
  formatPortalLabel(ROUTE_PROGRESSION[routeKey].shortLabel),
);

const [portalLaunchLabel = "pet", ...portalNextLabels] = PORTAL_LADDER_LABELS;

const portalPathSummary = portalNextLabels.length > 0
  ? `Start with ${portalLaunchLabel}, then review ${joinWithOxfordComma(portalNextLabels)}.`
  : `Start with ${portalLaunchLabel}.`;

export const PORTAL_TAGLINE = IS_SCHOOLS_PROFILE
  ? "A classroom companion for systems thinking and digital responsibility."
  : "Privacy-first digital learning companion for classrooms and families.";

export const PORTAL_DESCRIPTION = IS_SCHOOLS_PROFILE
  ? SCHOOL_PROFILE_DESCRIPTION
  : `Meta-Pet turns care, pattern learning, and digital responsibility into short guided activities. It runs browser-first and local-first: no ads, no required student account, and local state that can be exported or cleared by the user. Consumer pages may use product analytics; classroom routes do not. ${portalPathSummary}`;
