const ANALYTICS_STORAGE_KEY = 'metapet-analytics';

export type ProductSurface = 'school' | 'studio';

export type AnalyticsEventName =
  | 'session_start'
  | 'session_end'
  | 'ritual_complete'
  | 'mini_game_completed'
  | 'pet_saved'
  | 'moss60_export'
  | 'moss60_verify'
  | 'moss60_import'
  | 'moss60_reimport'
  // School-surface focused events (teacher/classroom funnel).
  | 'school_teacher_entry'
  | 'school_lesson_start'
  | 'school_field_mode_activated'
  | 'school_lesson_complete'
  | 'school_guide_view'
  | 'school_contact_interest'
  | 'school_error';

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  /** Active product surface so school and studio funnels never mix. */
  surface: ProductSurface;
  payload?: Record<string, unknown>;
  timestamp: number;
};

/**
 * Determine the active surface on the client without a hostname read.
 *
 * The server layout stamps `<html data-surface>` from the middleware-resolved
 * surface, so reading it here stays consistent with SSR (no hydration risk)
 * and keeps school analytics tagged even before other context loads.
 */
export function getClientSurface(): ProductSurface {
  if (typeof document === 'undefined') return 'studio';
  const value = document.documentElement.dataset.surface;
  return value === 'school' ? 'school' : 'studio';
}

function readStoredEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writeStoredEvents(events: AnalyticsEvent[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to store analytics events:', error);
  }
}

export function trackEvent(
  name: AnalyticsEventName,
  payload?: Record<string, unknown>
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    name,
    surface: getClientSurface(),
    payload,
    timestamp: Date.now(),
  };

  const events = readStoredEvents();
  events.push(event);
  writeStoredEvents(events);

  return event;
}
