/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";

const nextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
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
};

module.exports = nextConfig;
