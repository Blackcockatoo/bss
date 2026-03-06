// Central site registry — single source of truth for all Jewble sites

export interface SiteEntry {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  accent: string;
  accentDim: string;
  accentBorder: string;
  badge: string;
  framework: string;
  icon: string;
}

export const SITES: SiteEntry[] = [
  {
    id: "metapet",
    name: "Meta-Pet App",
    tagline: "The companion with a 180-digit genome",
    description:
      "15 emotional states. Homeostasis-based vitals. Genome-based evolution. Zero data collected — ever. The core Jewble product.",
    url: "https://bluesnakestudios.com",
    accent: "#f5c84c",
    accentDim: "rgba(245,200,76,.10)",
    accentBorder: "rgba(245,200,76,.28)",
    badge: "LIVE",
    framework: "Next.js 16",
    icon: "⬡",
  },
  {
    id: "veil",
    name: "Teacher Veil Hub",
    tagline: "7 sessions. Full teacher support.",
    description:
      "Curriculum-aligned implementation guide. Teacher scripts, reflection prompts, parent kit, and a full privacy brief.",
    url: "https://teachers-meta-pet-mr-brand.vercel.app",
    accent: "#4dd6c8",
    accentDim: "rgba(77,214,200,.10)",
    accentBorder: "rgba(77,214,200,.28)",
    badge: "LIVE",
    framework: "Vite + React 19",
    icon: "◈",
  },
  {
    id: "campaign",
    name: "Campaign Site",
    tagline: "For parents, schools & investors",
    description:
      "Audience-targeted messaging. The full story of why loyal beats viral and why privacy beats surveillance.",
    url: "https://elevator-pitch-seven.vercel.app",
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,.10)",
    accentBorder: "rgba(167,139,250,.28)",
    badge: "LIVE",
    framework: "Vite + React 18",
    icon: "◇",
  },
  {
    id: "elevator",
    name: "Elevator Pitch",
    tagline: "The penthouse floor presentation",
    description:
      "Interactive floor-by-floor investor pitch. Zero-Collection Educational Architecture in seven slides — lobby to penthouse.",
    url: "https://elevator-pitch-seven.vercel.app/elevator",
    accent: "#9ba3af",
    accentDim: "rgba(155,163,175,.10)",
    accentBorder: "rgba(155,163,175,.25)",
    badge: "LIVE",
    framework: "React JSX",
    icon: "↑",
  },
];
