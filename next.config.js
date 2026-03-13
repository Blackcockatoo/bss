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
const scriptSrc = new Set(["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"]);
const styleSrc = new Set(["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]);
const imgSrc = new Set([
  "'self'",
  "data:",
  "blob:",
  "https://source.unsplash.com",
  "https://images.unsplash.com",
  "https://ext.same-assets.com",
  "https://ugc.same-assets.com",
]);
const connectSrc = new Set(["'self'", "wss:"]);
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
