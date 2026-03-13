const LOCAL_FALLBACK = "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function normalizeDeploymentUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeBaseUrl(trimmed);
  }

  return normalizeBaseUrl(`https://${trimmed}`);
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.trim().length > 0) {
    return normalizeBaseUrl(configured);
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl && vercelProductionUrl.trim().length > 0) {
    return normalizeDeploymentUrl(vercelProductionUrl);
  }

  const vercelPreviewUrl = process.env.VERCEL_URL;
  if (vercelPreviewUrl && vercelPreviewUrl.trim().length > 0) {
    return normalizeDeploymentUrl(vercelPreviewUrl);
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_FALLBACK;
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL must be set in production when no deployment URL is available.",
  );
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}
