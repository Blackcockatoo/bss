const LOCAL_FALLBACK = "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.trim().length > 0) {
    return normalizeBaseUrl(configured);
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_FALLBACK;
  }

  return LOCAL_FALLBACK;
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}

