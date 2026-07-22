/**
 * Central domain configuration for MetaPet's two public product surfaces.
 *
 * A single Vercel deployment serves both public products. Which product a
 * visitor sees is decided at request time from the hostname, not from a
 * build-time flag, so the same code can back:
 *
 *   - "metapet.school"        → the focused Australian classroom product
 *   - "bluesnakestudios.com"  → the full MetaPet + Blue Snake Studios ecosystem
 *
 * Everything hostname-aware funnels through {@link resolveProductSurface} and
 * {@link getSurfaceConfig} so hostname checks never get scattered across
 * components. This module is deliberately dependency-free (no `next/*`, no
 * Node APIs) so it is safe to import from Edge middleware, server components,
 * and client components alike.
 */

export type ProductSurface = "school" | "studio";

export interface NavigationItem {
  label: string;
  /** Surface-native path (school clean URL / studio route) or absolute URL. */
  href: string;
  /** Absolute cross-domain links (e.g. studio → school) set this. */
  external?: boolean;
}

export interface MetadataConfig {
  title: string;
  description: string;
  siteName: string;
  /** Canonical origin, e.g. "https://metapet.school". */
  origin: string;
  themeColor: string;
  locale: string;
}

/**
 * Consumer/creative capabilities. The school surface keeps every consumer
 * flag off so the classroom product can never expose them, while the studio
 * surface keeps the full ecosystem available.
 */
export interface FeatureFlags {
  wallet: boolean;
  breeding: boolean;
  marketplace: boolean;
  bodyForge: boolean;
  dnaLab: boolean;
  consumerOnboarding: boolean;
  studioProjects: boolean;
  consumerGlobalNav: boolean;
  fieldMode: boolean;
  classroomRuntime: boolean;
}

export interface ProductSurfaceConfig {
  id: ProductSurface;
  hostname: string;
  name: string;
  /** Public landing path on this surface. */
  homePath: string;
  /** Clean public routes exposed on this surface. */
  allowedRoutes: string[];
  navigation: NavigationItem[];
  /**
   * Restricted navigation used while Field Mode is active (school only).
   */
  fieldNavigation: NavigationItem[];
  metadata: MetadataConfig;
  featureFlags: FeatureFlags;
}

function readEnv(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export const DEFAULT_SCHOOL_DOMAIN = "metapet.school";
export const DEFAULT_STUDIO_DOMAIN = "bluesnakestudios.com";

/** Configured public domains (overridable per environment). */
export const SCHOOL_DOMAIN = readEnv(
  process.env.NEXT_PUBLIC_SCHOOL_DOMAIN,
  DEFAULT_SCHOOL_DOMAIN,
);
export const STUDIO_DOMAIN = readEnv(
  process.env.NEXT_PUBLIC_STUDIO_DOMAIN,
  DEFAULT_STUDIO_DOMAIN,
);

export const SCHOOL_ORIGIN = `https://${SCHOOL_DOMAIN}`;
export const STUDIO_ORIGIN = `https://www.${STUDIO_DOMAIN}`;

/** The surface used when a hostname cannot be classified. */
export const DEFAULT_SURFACE: ProductSurface = "studio";

const SCHOOL_NAVIGATION: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Field Mode", href: "/field" },
  { label: "Lessons", href: "/lessons" },
  { label: "Classroom", href: "/classroom" },
  { label: "Teacher Guide", href: "/teacher-guide" },
  { label: "Safety and Privacy", href: "/safety" },
  { label: "Contact", href: "/contact" },
];

const SCHOOL_FIELD_NAVIGATION: NavigationItem[] = [
  { label: "Field Home", href: "/field" },
  { label: "Lessons", href: "/lessons" },
  { label: "Classroom", href: "/classroom" },
  { label: "Teacher Guide", href: "/teacher-guide" },
  { label: "Safety and Privacy", href: "/safety" },
  { label: "Exit Field Mode", href: "/" },
];

const STUDIO_NAVIGATION: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Pet", href: "/pet" },
  { label: "Explore", href: "/app/activities" },
  { label: "Wellness", href: "/app/wellness" },
  { label: "Identity", href: "/identity" },
  // Clearly separated link out to the dedicated school product.
  { label: "MetaPet for Schools", href: SCHOOL_ORIGIN, external: true },
];

const SCHOOL_ALLOWED_ROUTES = [
  "/",
  "/field",
  "/lessons",
  "/classroom",
  "/teacher-guide",
  "/parents",
  "/safety",
  "/privacy",
  "/contact",
  "/start",
];

const STUDIO_ALLOWED_ROUTES = ["/"];

const SURFACE_CONFIGS: Record<ProductSurface, ProductSurfaceConfig> = {
  school: {
    id: "school",
    hostname: SCHOOL_DOMAIN,
    name: "MetaPet School",
    homePath: "/",
    allowedRoutes: SCHOOL_ALLOWED_ROUTES,
    navigation: SCHOOL_NAVIGATION,
    fieldNavigation: SCHOOL_FIELD_NAVIGATION,
    metadata: {
      title: "MetaPet School",
      description:
        "Australian classroom learning through living digital creatures. Teacher-led, child-safe and classroom focused, designed for Years 3–6. A Blue Snake Studios education product.",
      siteName: "MetaPet School",
      origin: SCHOOL_ORIGIN,
      themeColor: "#f5f7fa",
      locale: "en_AU",
    },
    featureFlags: {
      wallet: false,
      breeding: false,
      marketplace: false,
      bodyForge: false,
      dnaLab: false,
      consumerOnboarding: false,
      studioProjects: false,
      consumerGlobalNav: false,
      fieldMode: true,
      classroomRuntime: true,
    },
  },
  studio: {
    id: "studio",
    hostname: STUDIO_DOMAIN,
    name: "Blue Snake Studios",
    homePath: "/",
    allowedRoutes: STUDIO_ALLOWED_ROUTES,
    navigation: STUDIO_NAVIGATION,
    fieldNavigation: [],
    metadata: {
      title: "Blue Snake Studios",
      description:
        "Blue Snake Studios builds the full MetaPet ecosystem: living digital creatures, DNA visualisations, breeding, Body Forge, wallet and add-ons, plus experimental and studio projects.",
      siteName: "Blue Snake Studios",
      origin: STUDIO_ORIGIN,
      themeColor: "#040810",
      locale: "en",
    },
    featureFlags: {
      wallet: true,
      breeding: true,
      marketplace: true,
      bodyForge: true,
      dnaLab: true,
      consumerOnboarding: true,
      studioProjects: true,
      consumerGlobalNav: true,
      fieldMode: false,
      classroomRuntime: true,
    },
  },
};

export function getSurfaceConfig(
  surface: ProductSurface,
): ProductSurfaceConfig {
  return SURFACE_CONFIGS[surface];
}

/**
 * Normalise a hostname for comparison: lowercase, strip any port, and drop a
 * leading "www." so "www.metapet.school:443" and "metapet.school" match.
 */
export function normalizeHostname(
  hostname: string | null | undefined,
): string {
  if (!hostname) {
    return "";
  }

  const withoutPort = hostname.trim().toLowerCase().split(":")[0] ?? "";
  return withoutPort.replace(/^www\./, "");
}

function hostMatchesDomain(host: string, domain: string): boolean {
  const normalizedDomain = normalizeHostname(domain);
  if (!normalizedDomain) {
    return false;
  }

  return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
}

export interface ResolveSurfaceOptions {
  /**
   * Explicit surface override. Used for build-time single-surface deployments
   * (NEXT_PUBLIC_APP_PROFILE=schools) and for a dev-only query/env override.
   * When set, it always wins.
   */
  override?: ProductSurface | null;
}

/**
 * Resolve the active product surface from a request hostname.
 *
 * Resolution order:
 *   1. An explicit override (build-time profile / dev override) always wins.
 *   2. The configured school domain (and any subdomain / www variant).
 *   3. The configured studio domain (and any subdomain / www variant).
 *   4. Fallback to {@link DEFAULT_SURFACE} (studio) for unclassified hosts
 *      such as Vercel preview URLs and localhost, where the caller is
 *      expected to supply an override when a specific surface is wanted.
 */
export function resolveProductSurface(
  hostname: string | null | undefined,
  options: ResolveSurfaceOptions = {},
): ProductSurface {
  if (options.override === "school" || options.override === "studio") {
    return options.override;
  }

  const host = normalizeHostname(hostname);
  if (!host) {
    return DEFAULT_SURFACE;
  }

  if (hostMatchesDomain(host, SCHOOL_DOMAIN)) {
    return "school";
  }

  if (hostMatchesDomain(host, STUDIO_DOMAIN)) {
    return "studio";
  }

  return DEFAULT_SURFACE;
}

export function isProductSurface(
  value: string | null | undefined,
): value is ProductSurface {
  return value === "school" || value === "studio";
}
