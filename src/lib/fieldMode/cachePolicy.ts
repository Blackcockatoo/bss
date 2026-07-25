import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_MANIFEST_PATH,
  FIELD_MODE_MISSIONS_PATH,
  FIELD_MODE_OFFLINE_PATH,
  FIELD_MODE_PACK_MANIFEST_PATH,
  FIELD_MODE_PASSPORT_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
  FIELD_MODE_RECORD_PATH,
  FIELD_MODE_REVIEW_PATH,
  FIELD_MODE_SAFETY_PATH,
  FIELD_MODE_START_PATH,
} from "@/lib/childSafeBaseline";
import { FIELD_MODE_INSTALL_ICON_PATHS } from "@/lib/fieldMode/pwa";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

export const FIELD_PACK_SCHEMA_VERSION = 1;
export const FIELD_PACK_RELEASE = "pass-4";

export const FIELD_PACK_CACHE_POLICY = {
  shellCachePrefix: "meta-pet-shell-",
  shellCacheVersion: "v3",
  fieldCachePrefix: "meta-pet-field-pack-",
  fieldMetadataCache: "meta-pet-field-pack-meta-v1",
  navigationStrategy: "installed-pack-first",
  updateStrategy: "atomic-candidate",
  keepPreviousCompletePack: true,
  maximumDiscoveredAssets: 800,
  emergencyNoopEnvironmentKey: "FIELD_MODE_OFFLINE_EMERGENCY_NOOP",
} as const;

const FIELD_PACK_BASE_ROUTES = [
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_START_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_MISSIONS_PATH,
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_RECORD_PATH,
  FIELD_MODE_PASSPORT_PATH,
  FIELD_MODE_REVIEW_PATH,
  FIELD_MODE_OFFLINE_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_SAFETY_PATH,
] as const;

export const FIELD_PACK_LESSON_ROUTES = LESSON_DEFINITIONS.map(
  (lesson) => `${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`,
);

export const FIELD_PACK_PRINT_ROUTES = LESSON_DEFINITIONS.map(
  (lesson) => `${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`,
);

export const FIELD_PACK_ROUTE_PATHS = Array.from(
  new Set([
    ...FIELD_PACK_BASE_ROUTES,
    ...FIELD_PACK_LESSON_ROUTES,
    ...FIELD_PACK_PRINT_ROUTES,
  ]),
);

export const FIELD_PACK_STATIC_ASSET_PATHS = [
  FIELD_MODE_MANIFEST_PATH,
  ...FIELD_MODE_INSTALL_ICON_PATHS,
] as const;

export interface FieldPackLessonEntry {
  number: number;
  slug: string;
  title: string;
  route: string;
  printRoute: string;
}

export interface FieldPackManifest {
  schemaVersion: typeof FIELD_PACK_SCHEMA_VERSION;
  product: "MetaPet Field Mode — Australian Schools";
  release: typeof FIELD_PACK_RELEASE;
  version: string;
  generatedAt: string;
  emergencyNoop: boolean;
  routes: string[];
  assets: string[];
  lessons: FieldPackLessonEntry[];
  guarantees: {
    update: "atomic-candidate";
    rollback: "previous-complete-pack";
    animationFallback: "static-when-offline";
    records: "local-device-only";
  };
}

type BuildEnvironment = Partial<Record<string, string | undefined>>;

function enabled(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(
    value?.trim().toLowerCase() ?? "",
  );
}

function safeBuildReference(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return normalized ? normalized.slice(0, 16) : null;
}

export function resolveFieldPackVersion(env: BuildEnvironment): string {
  const reference =
    safeBuildReference(env.VERCEL_GIT_COMMIT_SHA) ??
    safeBuildReference(env.GITHUB_SHA) ??
    safeBuildReference(env.NEXT_PUBLIC_BUILD_ID) ??
    safeBuildReference(env.SOURCE_VERSION) ??
    "development";

  return `field-${FIELD_PACK_RELEASE}-${reference}`;
}

export function buildFieldPackManifest(
  env: BuildEnvironment,
  now = new Date(),
): FieldPackManifest {
  return {
    schemaVersion: FIELD_PACK_SCHEMA_VERSION,
    product: "MetaPet Field Mode — Australian Schools",
    release: FIELD_PACK_RELEASE,
    version: resolveFieldPackVersion(env),
    generatedAt: now.toISOString(),
    emergencyNoop: enabled(
      env[FIELD_PACK_CACHE_POLICY.emergencyNoopEnvironmentKey],
    ),
    routes: [...FIELD_PACK_ROUTE_PATHS],
    assets: [...FIELD_PACK_STATIC_ASSET_PATHS],
    lessons: LESSON_DEFINITIONS.map((lesson) => ({
      number: lesson.number,
      slug: lesson.slug,
      title: lesson.title,
      route: `${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`,
      printRoute: `${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`,
    })),
    guarantees: {
      update: "atomic-candidate",
      rollback: "previous-complete-pack",
      animationFallback: "static-when-offline",
      records: "local-device-only",
    },
  };
}

export function getFieldPackManifestPath(): string {
  return FIELD_MODE_PACK_MANIFEST_PATH;
}
