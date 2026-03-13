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
