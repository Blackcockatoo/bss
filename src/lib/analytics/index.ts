const ANALYTICS_STORAGE_KEY = 'metapet-analytics';

export type AnalyticsEventName =
  | 'session_start'
  | 'session_end'
  | 'ritual_complete'
  | 'mini_game_completed'
  | 'pet_saved'
  | 'moss60_export'
  | 'moss60_verify'
  | 'moss60_import'
  | 'moss60_reimport';

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  payload?: Record<string, unknown>;
  timestamp: number;
};

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
    payload,
    timestamp: Date.now(),
  };

  const events = readStoredEvents();
  events.push(event);
  writeStoredEvents(events);

  return event;
}
