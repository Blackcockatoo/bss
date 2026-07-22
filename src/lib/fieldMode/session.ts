import { FIELD_MODE_LESSONS_PATH } from "@/lib/childSafeBaseline";
import type {
  LessonPresentationMode,
  LessonTimingMode,
} from "@/lib/teacher-lessons";

export const FIELD_MODE_SESSION_STORAGE_KEY =
  "metapet-schools-field-session";

export const FIELD_YEAR_BANDS = ["years-3-4", "years-5-6"] as const;
export const FIELD_DURATIONS = [10, 15, 20] as const;
export const FIELD_DELIVERY_MODES = [
  "projector",
  "pairs",
  "shared-device",
] as const;
export const FIELD_SUPPORT_MODES = ["standard", "low-sensory"] as const;

export type FieldYearBand = (typeof FIELD_YEAR_BANDS)[number];
export type FieldDuration = (typeof FIELD_DURATIONS)[number];
export type FieldDeliveryMode = (typeof FIELD_DELIVERY_MODES)[number];
export type FieldSupportMode = (typeof FIELD_SUPPORT_MODES)[number];

export interface FieldSessionConfig {
  yearBand: FieldYearBand;
  durationMinutes: FieldDuration;
  deliveryMode: FieldDeliveryMode;
  supportMode: FieldSupportMode;
  soundEnabled: boolean;
}

export const DEFAULT_FIELD_SESSION: FieldSessionConfig = {
  yearBand: "years-3-4",
  durationMinutes: 15,
  deliveryMode: "projector",
  supportMode: "standard",
  soundEnabled: false,
};

export const FIELD_SESSION_LABELS = {
  yearBand: {
    "years-3-4": "Years 3–4",
    "years-5-6": "Years 5–6",
  },
  deliveryMode: {
    projector: "Whole-class screen",
    pairs: "Pairs",
    "shared-device": "Shared device groups",
  },
  supportMode: {
    standard: "Standard presentation",
    "low-sensory": "Low-sensory presentation",
  },
} as const;

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(
  value: string | undefined,
  options: readonly T[],
  fallback: T,
): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

export function sanitizeFieldSession(
  value: Partial<FieldSessionConfig> | null | undefined,
): FieldSessionConfig {
  const duration = Number(value?.durationMinutes);
  return {
    yearBand: oneOf(
      value?.yearBand,
      FIELD_YEAR_BANDS,
      DEFAULT_FIELD_SESSION.yearBand,
    ),
    durationMinutes: FIELD_DURATIONS.includes(duration as FieldDuration)
      ? (duration as FieldDuration)
      : DEFAULT_FIELD_SESSION.durationMinutes,
    deliveryMode: oneOf(
      value?.deliveryMode,
      FIELD_DELIVERY_MODES,
      DEFAULT_FIELD_SESSION.deliveryMode,
    ),
    supportMode: oneOf(
      value?.supportMode,
      FIELD_SUPPORT_MODES,
      DEFAULT_FIELD_SESSION.supportMode,
    ),
    soundEnabled: value?.soundEnabled === true,
  };
}

export function parseFieldSession(params: RawParams): FieldSessionConfig {
  return sanitizeFieldSession({
    yearBand: first(params.years) as FieldYearBand,
    durationMinutes: Number(first(params.minutes)) as FieldDuration,
    deliveryMode: first(params.delivery) as FieldDeliveryMode,
    supportMode: first(params.support) as FieldSupportMode,
    soundEnabled: first(params.sound) === "on",
  });
}

export function buildFieldLessonPath(
  slug: string,
  config: FieldSessionConfig,
): string {
  const safe = sanitizeFieldSession(config);
  const params = new URLSearchParams({
    years: safe.yearBand,
    minutes: String(safe.durationMinutes),
    delivery: safe.deliveryMode,
    support: safe.supportMode,
    sound: safe.soundEnabled ? "on" : "off",
  });
  return `${FIELD_MODE_LESSONS_PATH}/${encodeURIComponent(slug)}?${params.toString()}`;
}

export function fieldTimingMode(config: FieldSessionConfig): LessonTimingMode {
  return config.durationMinutes === 10 ? "demo" : "standard";
}

export function fieldPresentationMode(
  config: FieldSessionConfig,
): LessonPresentationMode {
  return config.supportMode === "low-sensory" ? "support" : "standard";
}
