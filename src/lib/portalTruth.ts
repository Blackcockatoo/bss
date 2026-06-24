import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export const PORTAL_TAGLINE = IS_SCHOOLS_PROFILE
  ? "A classroom companion for systems thinking and digital responsibility."
  : "Privacy-first digital learning companion for classrooms and families.";

export const PORTAL_DESCRIPTION = IS_SCHOOLS_PROFILE
  ? "Teacher-led, time-bounded sessions for Years 3-6. No accounts, no data collection, everything stays on the school device."
  : "Meta-Pet turns care, pattern learning, and digital responsibility into short guided activities. It runs browser-first and local-first: no ads, no trackers, no student accounts, and no unnecessary data collection.";
