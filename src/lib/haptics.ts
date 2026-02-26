/**
 * Haptic feedback utility for touch interactions
 * Provides vibration feedback for better user experience on mobile devices
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface HapticConfig {
  duration?: number;
  pattern?: number[];
}

const HAPTIC_PATTERNS: Record<HapticPattern, HapticConfig> = {
  light: { duration: 10 },
  medium: { duration: 20 },
  heavy: { duration: 30 },
  success: { pattern: [10, 50, 10] },
  warning: { pattern: [20, 100, 20] },
  error: { pattern: [30, 100, 30, 100, 30] },
  selection: { duration: 5 },
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param pattern - The haptic pattern to use
 * @param force - Force vibration even if user preferences might disable it
 */
export function triggerHaptic(pattern: HapticPattern = 'light', force = false): void {
  if (!isHapticSupported()) return;

  // Check for user preference to reduce motion (respect accessibility)
  if (!force && typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
  }

  const config = HAPTIC_PATTERNS[pattern];

  try {
    if (config.pattern) {
      navigator.vibrate(config.pattern);
    } else if (config.duration) {
      navigator.vibrate(config.duration);
    }
  } catch (error) {
    // Silently fail - haptics are a nice-to-have
    console.debug('Haptic feedback failed:', error);
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic(): void {
  if (isHapticSupported()) {
    navigator.vibrate(0);
  }
}

/**
 * Create a custom haptic pattern
 * @param pattern - Array of [vibrate, pause] durations in milliseconds
 */
export function triggerCustomHaptic(pattern: number[]): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.debug('Custom haptic feedback failed:', error);
  }
}
