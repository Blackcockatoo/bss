/**
 * Content Security Policy for every response that passes through the proxy.
 *
 * App routes (everything React renders) get a strict, per-request nonce
 * policy: scripts run only if they come from this origin or carry the nonce
 * that Next.js stamps on its own inline bootstrap scripts. There is no
 * 'unsafe-inline' for scripts, so an injected <script> or inline handler is
 * refused by the browser.
 *
 * The standalone legacy HTML toys in /public (Geometry Sound, MOSS60 classic,
 * Monkey Invaders, Alchemest) are plain static files with inline <script>
 * blocks and onclick= attributes. A static file cannot receive a per-request
 * nonce, so those exact paths keep a narrower legacy policy that still allows
 * inline script but no third-party script host at all.
 *
 * Styles keep 'unsafe-inline': React `style={}` props, framer-motion and
 * Next's injected styles write inline style attributes, which a nonce cannot
 * cover. Style injection cannot run script, so the XSS protection comes from
 * script-src.
 */

export const CSP_NONCE_HEADER = "x-nonce";

/** Static HTML pages in /public that rely on inline script. */
export const LEGACY_INLINE_SCRIPT_PAGES: ReadonlySet<string> = new Set([
  "/geometry-sound.html",
  "/moss60.html",
  "/moss60-enhanced.html",
  "/moss60-ultimate.html",
  "/monkey-invaders.html",
  "/alchemest.html",
]);

const DEFAULT_MAPS_FORGE_URL = "https://forge.butterfly-effect.dev";

function toEnabled(value: string | undefined): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export type CspOptions = {
  /** Per-request nonce; omit for the legacy static-page policy. */
  nonce?: string | null;
  isDevelopment?: boolean;
  mapsEnabled?: boolean;
  mapsForgeOrigin?: string | null;
  frameAncestors?: string;
};

export function cspOptionsFromEnv(): Required<Omit<CspOptions, "nonce">> {
  return {
    isDevelopment: process.env.NODE_ENV !== "production",
    mapsEnabled: toEnabled(process.env.NEXT_PUBLIC_ENABLE_MAPS),
    mapsForgeOrigin: toOrigin(
      process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_URL || DEFAULT_MAPS_FORGE_URL,
    ),
    frameAncestors: process.env.ALLOWED_FRAME_ANCESTORS?.trim() || "'self'",
  };
}

export function buildContentSecurityPolicy(options: CspOptions = {}): string {
  const {
    nonce = null,
    isDevelopment = false,
    mapsEnabled = false,
    mapsForgeOrigin = null,
    frameAncestors = "'self'",
  } = options;

  const scriptSrc = new Set<string>(["'self'"]);
  if (nonce) {
    scriptSrc.add(`'nonce-${nonce}'`);
  } else {
    scriptSrc.add("'unsafe-inline'");
  }
  // React's dev build uses eval for error overlays and stack reconstruction.
  if (isDevelopment) scriptSrc.add("'unsafe-eval'");

  const styleSrc = new Set(["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]);
  const imgSrc = new Set(["'self'", "data:", "blob:"]);
  // The app only talks to its own origin (API routes, Vercel Analytics at
  // /_vercel/insights, the Field Mode offline pack). `next dev` needs a
  // socket for hot reload, possibly on a LAN address.
  const connectSrc = new Set(["'self'"]);
  if (isDevelopment) {
    connectSrc.add("ws:");
    connectSrc.add("wss:");
  }
  const fontSrc = new Set(["'self'", "data:", "https://fonts.gstatic.com"]);

  if (mapsEnabled) {
    if (mapsForgeOrigin) {
      scriptSrc.add(mapsForgeOrigin);
      connectSrc.add(mapsForgeOrigin);
    }
    for (const origin of ["https://maps.googleapis.com", "https://maps.gstatic.com"]) {
      scriptSrc.add(origin);
      imgSrc.add(origin);
      connectSrc.add(origin);
    }
  }

  return [
    "default-src 'self'",
    `script-src ${Array.from(scriptSrc).join(" ")}`,
    // Inline event-handler attributes (onclick=) are never allowed on app
    // routes, even if a nonce leaks.
    ...(nonce ? ["script-src-attr 'none'"] : []),
    `style-src ${Array.from(styleSrc).join(" ")}`,
    `img-src ${Array.from(imgSrc).join(" ")}`,
    "media-src 'self' blob:",
    `connect-src ${Array.from(connectSrc).join(" ")}`,
    `font-src ${Array.from(fontSrc).join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");
}

/** 128-bit random nonce, base64 encoded. Works in Node and Edge runtimes. */
export function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function isLegacyInlineScriptPage(pathname: string): boolean {
  return LEGACY_INLINE_SCRIPT_PAGES.has(pathname);
}

/**
 * The policy for one request. Returns the nonce (or null for the legacy
 * static pages) and the header value to send.
 */
export function contentSecurityPolicyForPath(
  pathname: string,
  options: Omit<CspOptions, "nonce"> = cspOptionsFromEnv(),
): { nonce: string | null; header: string } {
  if (isLegacyInlineScriptPage(pathname)) {
    return { nonce: null, header: buildContentSecurityPolicy({ ...options, nonce: null }) };
  }
  const nonce = createCspNonce();
  return { nonce, header: buildContentSecurityPolicy({ ...options, nonce }) };
}
