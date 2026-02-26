/**
 * Time-based Theme Configurations
 *
 * Dynamic color palettes that shift throughout the day
 */

import type { TimeOfDay, TimeTheme } from '../types';

export const TIME_THEMES: Record<TimeOfDay, TimeTheme> = {
  dawn: {
    bg: 'from-orange-900 via-pink-900 to-purple-900',
    accent: '#FFB347',
    glow: 'rgba(255, 179, 71, 0.3)',
  },

  day: {
    bg: 'from-blue-900 via-cyan-900 to-teal-900',
    accent: '#4ECDC4',
    glow: 'rgba(78, 205, 196, 0.3)',
  },

  dusk: {
    bg: 'from-purple-900 via-indigo-900 to-blue-900',
    accent: '#B8A5D6',
    glow: 'rgba(184, 165, 214, 0.3)',
  },

  night: {
    bg: 'from-gray-900 via-blue-950 to-gray-900',
    accent: '#6B7FD7',
    glow: 'rgba(107, 127, 215, 0.3)',
  },
};

/**
 * Get current time of day based on local hour
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/**
 * Get theme for specific time of day
 */
export function getTimeTheme(timeOfDay: TimeOfDay): TimeTheme {
  return TIME_THEMES[timeOfDay];
}

/**
 * High contrast theme override
 */
export const HIGH_CONTRAST_THEME: TimeTheme = {
  bg: 'from-black via-gray-900 to-black',
  accent: '#FFFFFF',
  glow: 'rgba(255, 255, 255, 0.3)',
};
