import type { MetadataRoute } from "next";

const BASE = "https://bss-l8cw.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/pet`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/school-game`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/identity`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/genome-explorer`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/digital-dna`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];
}
