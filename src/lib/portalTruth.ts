import {
  ROUTE_PROGRESSION,
  ROUTE_PROGRESSION_SEQUENCE,
} from "@/lib/routeProgression";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

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

export const PORTAL_TAGLINE = IS_SCHOOLS_PROFILE
  ? "A classroom companion for systems thinking and digital responsibility."
  : portalNextLabels.length > 0
    ? `Start with the ${portalLaunchLabel}, then climb into ${joinWithOxfordComma(portalNextLabels)}.`
    : `Start with the ${portalLaunchLabel}.`;

export const PORTAL_DESCRIPTION = IS_SCHOOLS_PROFILE
  ? "Teacher-led, time-bounded sessions for Years 3-6. No accounts, no data collection, everything stays on the school device."
  : "Care builds the bond, school turns that bond into pattern learning, identity keeps ownership local-first, and DNA reveals the hidden engine underneath all three.";
