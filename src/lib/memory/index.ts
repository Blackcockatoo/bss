/**
 * Memory System - Core Logic
 *
 * Captures, stores, and retrieves moments from the journey
 * between user and pet.
 */

import type {
  Moment,
  MomentType,
  MomentImportance,
  MemoryState,
  MemorySummary,
  MemoryFilter,
} from './types';
import { createDefaultMemoryState, MOMENT_TEMPLATES } from './types';

export * from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_MOMENTS = 500; // Keep memory manageable

/**
 * Capture a new moment
 */
export function captureMoment(
  state: MemoryState,
  type: MomentType,
  title: string,
  description: string,
  options?: {
    importance?: MomentImportance;
    metadata?: Moment['metadata'];
    userNote?: string;
  }
): MemoryState {
  const now = Date.now();

  const moment: Moment = {
    id: generateMomentId(),
    type,
    timestamp: now,
    title,
    description,
    importance: options?.importance || 'minor',
    metadata: options?.metadata,
    userNote: options?.userNote,
  };

  // Trim old minor moments if exceeding limit
  let moments = [...state.moments, moment];
  if (moments.length > MAX_MOMENTS) {
    // Keep all milestones and significant moments, trim minor/notable
    const important = moments.filter(m =>
      m.importance === 'milestone' || m.importance === 'significant' || m.pinned
    );
    const minor = moments
      .filter(m =>
        m.importance === 'minor' || (m.importance === 'notable' && !m.pinned)
      )
      .slice(-100); // Keep last 100 minor/notable moments
    moments = [...important, ...minor].sort((a, b) => a.timestamp - b.timestamp);
  }

  return {
    ...state,
    moments,
    firstMomentAt: state.firstMomentAt || now,
    lastMomentAt: now,
    totalMoments: state.totalMoments + 1,
  };
}

/**
 * Capture a moment from a template
 */
export function captureMomentFromTemplate(
  state: MemoryState,
  templateKey: string,
  overrides?: Partial<Moment>
): MemoryState {
  const template = MOMENT_TEMPLATES[templateKey];
  if (!template) {
    return state;
  }

  return captureMoment(
    state,
    template.type,
    overrides?.title || template.title,
    overrides?.description || template.description,
    {
      importance: overrides?.importance || template.importance,
      metadata: { ...template.metadata, ...overrides?.metadata },
      userNote: overrides?.userNote,
    }
  );
}

/**
 * Add a user note to a moment
 */
export function addNoteToMoment(
  state: MemoryState,
  momentId: string,
  note: string
): MemoryState {
  const moments = state.moments.map(m => {
    if (m.id !== momentId) return m;
    return { ...m, userNote: note };
  });

  return { ...state, moments };
}

/**
 * Create a standalone note/reflection
 */
export function createNote(
  state: MemoryState,
  note: string,
  title?: string
): MemoryState {
  return captureMoment(
    state,
    'note',
    title || 'A thought',
    note,
    {
      importance: 'minor',
      userNote: note,
    }
  );
}

/**
 * Pin/unpin a moment
 */
export function togglePinMoment(state: MemoryState, momentId: string): MemoryState {
  const moment = state.moments.find(m => m.id === momentId);
  if (!moment) return state;

  const isPinned = state.pinnedMomentIds.includes(momentId);
  const pinnedMomentIds = isPinned
    ? state.pinnedMomentIds.filter(id => id !== momentId)
    : [...state.pinnedMomentIds, momentId];

  const moments = state.moments.map(m => {
    if (m.id !== momentId) return m;
    return { ...m, pinned: !isPinned };
  });

  return { ...state, moments, pinnedMomentIds };
}

/**
 * Get moments with optional filtering
 */
export function getMoments(state: MemoryState, filter?: MemoryFilter): Moment[] {
  let moments = [...state.moments];

  if (filter?.types && filter.types.length > 0) {
    moments = moments.filter(m => filter.types!.includes(m.type));
  }

  if (filter?.importance && filter.importance.length > 0) {
    moments = moments.filter(m => filter.importance!.includes(m.importance));
  }

  if (filter?.pinnedOnly) {
    moments = moments.filter(m => m.pinned);
  }

  if (filter?.startDate) {
    moments = moments.filter(m => m.timestamp >= filter.startDate!);
  }

  if (filter?.endDate) {
    moments = moments.filter(m => m.timestamp <= filter.endDate!);
  }

  // Sort by timestamp descending (newest first)
  return moments.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get memory summary statistics
 */
export function getMemorySummary(state: MemoryState): MemorySummary {
  const now = Date.now();
  const firstMoment = state.firstMomentAt || now;
  const totalDaysTogether = Math.floor((now - firstMoment) / DAY_MS) + 1;

  const countByType = (type: MomentType) =>
    state.moments.filter(m => m.type === type).length;

  return {
    totalDaysTogether,
    totalMoments: state.totalMoments,
    milestoneCount: state.moments.filter(m => m.importance === 'milestone').length,
    evolutionCount: countByType('evolution'),
    achievementCount: countByType('achievement'),
    moodCheckInCount: countByType('mood_checkin'),
    habitCompletionCount: countByType('habit_completed'),
    noteCount: countByType('note'),
  };
}

/**
 * Get moments grouped by date (for timeline view)
 */
export function getMomentsByDate(
  state: MemoryState,
  filter?: MemoryFilter
): Map<string, Moment[]> {
  const moments = getMoments(state, filter);
  const grouped = new Map<string, Moment[]>();

  for (const moment of moments) {
    const date = new Date(moment.timestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(moment);
  }

  return grouped;
}

/**
 * Get recent moments (last N days)
 */
export function getRecentMoments(state: MemoryState, days = 7): Moment[] {
  const cutoff = Date.now() - days * DAY_MS;
  return getMoments(state, { startDate: cutoff });
}

/**
 * Check if a milestone moment already exists (to avoid duplicates)
 */
export function hasMoment(state: MemoryState, templateKey: string): boolean {
  const template = MOMENT_TEMPLATES[templateKey];
  if (!template) return false;

  return state.moments.some(m =>
    m.type === template.type &&
    m.metadata?.evolutionState === template.metadata?.evolutionState &&
    m.metadata?.bondLevel === template.metadata?.bondLevel &&
    m.metadata?.streakDays === template.metadata?.streakDays
  );
}

/**
 * Export moments for sharing (privacy-controlled)
 */
export function exportMemory(
  state: MemoryState,
  options?: {
    includeNotes?: boolean;
    milestonesOnly?: boolean;
  }
): string {
  let moments = [...state.moments];

  if (options?.milestonesOnly) {
    moments = moments.filter(m =>
      m.importance === 'milestone' || m.importance === 'significant'
    );
  }

  const exportData = moments.map(m => ({
    type: m.type,
    timestamp: m.timestamp,
    title: m.title,
    description: m.description,
    importance: m.importance,
    userNote: options?.includeNotes ? m.userNote : undefined,
  }));

  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate a unique moment ID
 */
function generateMomentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `moment-${timestamp}-${random}`;
}
