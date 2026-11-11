/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";
const frameAncestors = process.env.ALLOWED_FRAME_ANCESTORS?.trim() || "'self'";
const defaultMapsForgeUrl = "https://forge.butterfly-effect.dev";

function toEnabled(value, defaultValue = false) {
  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const mapsEnabled = toEnabled(process.env.NEXT_PUBLIC_ENABLE_MAPS, false);
const mapsForgeOrigin = toOrigin(
  process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_URL || defaultMapsForgeUrl,
);
const isDevelopment = process.env.NODE_ENV !== "production";
const PRIMARY_ORIGIN = "https://www.bluesnakestudios.com";
const SCHOOL_ORIGIN = "https://www.metapet.school";
const SCHOOL_HOST_PATTERN = "(?:www\\.)?metapet\\.school";

// cdnjs is still required by public/geometry-sound.html (three.js r128 and
// Tone.js 14.8.49 loaded via <script src>). Remove once those are vendored.
const scriptSrc = new Set(["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"]);
const styleSrc = new Set(["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]);
// Unsplash and same-assets.com were template leftovers; nothing in src/ or
// public/ loads images from them any more.
const imgSrc = new Set(["'self'", "data:", "blob:"]);
// The app only talks to its own origin (API routes, Vercel Analytics at
// /_vercel/insights, the Field Mode offline pack). No WebSocket host is used
// in production, so bare `wss:` (any secure socket host) is no longer allowed.
// `next dev` needs a socket for hot reload, which may be on a LAN address
// because dev binds to 0.0.0.0.
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

  scriptSrc.add("https://maps.googleapis.com");
  scriptSrc.add("https://maps.gstatic.com");
  imgSrc.add("https://maps.googleapis.com");
  imgSrc.add("https://maps.gstatic.com");
  connectSrc.add("https://maps.googleapis.com");
  connectSrc.add("https://maps.gstatic.com");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${Array.from(scriptSrc).join(" ")}`,
  `style-src ${Array.from(styleSrc).join(" ")}`,
  `img-src ${Array.from(imgSrc).join(" ")}`,
  "media-src 'self' blob:",
  `connect-src ${Array.from(connectSrc).join(" ")}`,
  `font-src ${Array.from(fontSrc).join(" ")}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  `frame-ancestors ${frameAncestors}`,
].join("; ");

const nextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          // Vercel's CDN adds `Access-Control-Allow-Origin: *` to cached
          // responses by default, which lets any website read our pages
          // cross-origin. No route in this app is meant to be read by another
          // origin (all fetches are same-origin), so pin it to our own origin.
          // Later rules override this one for the school domain.
          {
            key: "Access-Control-Allow-Origin",
            value: PRIMARY_ORIGIN,
          },
        ],
      },
      {
        source: "/(.*)",
        has: [{ type: "host", value: SCHOOL_HOST_PATTERN }],
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: SCHOOL_ORIGIN,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
