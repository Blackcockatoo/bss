function toEnabled(value: string | undefined, defaultValue = false): boolean {
  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function readEnvString(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const ENABLE_AUTH = toEnabled(
  process.env.NEXT_PUBLIC_ENABLE_AUTH,
  false,
);
export const ENABLE_CHILD_SAFE_BASELINE = toEnabled(
  process.env.NEXT_PUBLIC_CHILD_SAFE_BASELINE,
  false,
);
const APP_PROFILE_VALUE = (
  readEnvString(process.env.NEXT_PUBLIC_APP_PROFILE) ?? ""
).toLowerCase();
// NOTE: enabling NEXT_PUBLIC_CHILD_SAFE_BASELINE deliberately forces the whole
// build into the "schools" profile even when NEXT_PUBLIC_APP_PROFILE is unset or
// "core". This is a fail-safe default: turning on the child-safe baseline must
// never leave the app in the consumer surface. Keep this coupling one-directional
// (baseline => schools); do not add logic that lets a core profile silently drop
// the baseline.
export const APP_PROFILE =
  APP_PROFILE_VALUE === "schools" || ENABLE_CHILD_SAFE_BASELINE
    ? "schools"
    : "core";
export const IS_SCHOOLS_PROFILE = APP_PROFILE === "schools";

// Single source of truth for whether the request-time child-safe route boundary
// must be enforced. The boundary is active whenever the schools profile is in
// effect (which already subsumes the baseline flag via APP_PROFILE above) OR the
// baseline flag is explicitly set. Middleware and any other enforcement point
// should read this instead of re-parsing NEXT_PUBLIC_CHILD_SAFE_BASELINE.
export const ENFORCE_CHILD_SAFE_BOUNDARY =
  IS_SCHOOLS_PROFILE || ENABLE_CHILD_SAFE_BASELINE;
export const ENABLE_MAPS = toEnabled(
  process.env.NEXT_PUBLIC_ENABLE_MAPS,
  false,
);
export const MAPS_API_KEY =
  readEnvString(process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_KEY) ?? "";
export const MAPS_FORGE_API_URL =
  readEnvString(process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_URL) ??
  "https://forge.butterfly-effect.dev";
export const MAPS_PROXY_URL = `${MAPS_FORGE_API_URL.replace(/\/+$/, "")}/v1/maps/proxy`;

export function getMapsConfigurationError(): string | null {
  if (!ENABLE_MAPS) {
    return null;
  }

  if (!MAPS_API_KEY) {
    return "Maps are enabled, but NEXT_PUBLIC_FRONTEND_FORGE_API_KEY is missing.";
  }

  try {
    new URL(MAPS_FORGE_API_URL);
  } catch {
    return "Maps are enabled, but NEXT_PUBLIC_FRONTEND_FORGE_API_URL is invalid.";
  }

  return null;
}

export const MAPS_FEATURE_READY =
  ENABLE_MAPS && getMapsConfigurationError() === null;
