/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";

const PRIMARY_ORIGIN = "https://www.bluesnakestudios.com";
const SCHOOL_ORIGIN = "https://www.metapet.school";
const SCHOOL_HOST_PATTERN = "(?:www\\.)?metapet\\.school";

// Content-Security-Policy is NOT set here. It is set per request by the
// proxy (src/proxy.ts + src/lib/security/csp.ts) so app routes can use a
// fresh script nonce instead of 'unsafe-inline'. A second static CSP header
// here would be enforced in addition to it.

const nextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    // Short, guessable URLs for parents, schools and app-store reviewers.
    // Config redirects run before the proxy, so they work on both domains.
    // Temporary while the terms are in draft.
    return [
      { source: "/privacy", destination: "/legal/privacy", permanent: false },
      { source: "/terms", destination: "/legal/terms", permanent: false },
    ];
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
