import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const htmlPath = path.resolve(process.cwd(), 'public/monkey-invaders.html');
const html = readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);

if (!scriptMatch) {
  throw new Error('Could not locate the Monkey Invaders inline script.');
}

const script = scriptMatch[1];
const phoneHintDismissMatch = script.match(/const PHONE_HINT_DISMISS_MS = (\d+);/);

if (!phoneHintDismissMatch) {
  throw new Error('Could not locate PHONE_HINT_DISMISS_MS in Monkey Invaders.');
}

const phoneHintDismissMs = Number(phoneHintDismissMatch[1]);

function extractSection(startMarker: string, endMarker: string) {
  const start = script.indexOf(startMarker);
  const end = script.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    throw new Error(`Could not extract section between ${startMarker} and ${endMarker}.`);
  }

  return script.slice(start, end).trim();
}

const bindHoldSource = extractSection('function bindHold(button, keyCode) {', 'function gameLoop(');
const setPhoneHintVisibleSource = extractSection('function setPhoneHintVisible(visible) {', 'function clearPhoneHintTimer() {');
const clearPhoneHintTimerSource = extractSection('function clearPhoneHintTimer() {', 'function schedulePhoneHintDismiss() {');
const schedulePhoneHintDismissSource = extractSection('function schedulePhoneHintDismiss() {', 'function updatePhoneHint() {');
const updatePhoneHintSource = extractSection('function updatePhoneHint() {', 'function getTopReserve() {');

type EventHandler = (event?: { pointerId?: number; preventDefault?: () => void }) => void;

function createWindowMock() {
  const listeners: Record<string, EventHandler[]> = Object.create(null);

  return {
    PointerEvent: function PointerEvent() {},
    listeners,
    addEventListener(type: string, handler: EventHandler) {
      (listeners[type] ||= []).push(handler);
    },
    removeEventListener(type: string, handler: EventHandler) {
      listeners[type] = (listeners[type] || []).filter((candidate) => candidate !== handler);
    },
    dispatch(type: string, event: { pointerId?: number; preventDefault?: () => void } = {}) {
      for (const handler of [...(listeners[type] || [])]) {
        handler(event);
      }
    },
    listenerCount(type: string) {
      return (listeners[type] || []).length;
    },
  };
}

function createButtonMock() {
  const listeners: Record<string, EventHandler[]> = Object.create(null);
  let pressed = false;

  return {
    listeners,
    setPointerCapture: vi.fn(),
    classList: {
      toggle(name: string, value: boolean) {
        if (name === 'pressed') {
          pressed = value;
        }
      },
    },
    addEventListener(type: string, handler: EventHandler) {
      (listeners[type] ||= []).push(handler);
    },
    dispatch(type: string, event: { pointerId?: number; preventDefault?: () => void } = {}) {
      for (const handler of [...(listeners[type] || [])]) {
        handler(event);
      }
    },
    isPressed() {
      return pressed;
    },
  };
}

function createPointerEvent(pointerId: number) {
  return {
    pointerId,
    preventDefault() {},
  };
}

function createBindHoldHarness(windowMock: ReturnType<typeof createWindowMock>, keys: Record<string, boolean>) {
  return new Function('window', 'keys', 'ensureAudio', 'triggerHaptic', `return (${bindHoldSource});`)(
    windowMock,
    keys,
    vi.fn(),
    vi.fn(),
  ) as (button: ReturnType<typeof createButtonMock>, keyCode: string) => void;
}

function createPhoneHintHarness(options: { hasTouch: boolean; width: number; height: number }) {
  const phoneHint = {
    style: {
      display: 'none',
    },
  };
  const fitGameToScreen = vi.fn();
  const windowMock = {
    innerWidth: options.width,
    innerHeight: options.height,
    setTimeout,
    clearTimeout,
  };

  return new Function(
    'deps',
    `
      let { window, phoneHint, hasTouch, fitGameToScreen } = deps;
      let phoneHintTimer = null;
      let phoneHintShownOnce = false;
      let phoneHintDismissed = false;
      const PHONE_HINT_DISMISS_MS = ${phoneHintDismissMs};

      ${setPhoneHintVisibleSource}
      ${clearPhoneHintTimerSource}
      ${schedulePhoneHintDismissSource}
      ${updatePhoneHintSource}

      return {
        updatePhoneHint,
        fitGameToScreen,
        getDisplay: () => phoneHint.style.display,
        getState: () => ({
          phoneHintTimer,
          phoneHintShownOnce,
          phoneHintDismissed,
        }),
        setViewport: (width, height) => {
          window.innerWidth = width;
          window.innerHeight = height;
        },
      };
    `,
  )({
    window: windowMock,
    phoneHint,
    hasTouch: options.hasTouch,
    fitGameToScreen,
  }) as {
    updatePhoneHint: () => void;
    fitGameToScreen: ReturnType<typeof vi.fn>;
    getDisplay: () => string;
    getState: () => {
      phoneHintTimer: ReturnType<typeof setTimeout> | null;
      phoneHintShownOnce: boolean;
      phoneHintDismissed: boolean;
    };
    setViewport: (width: number, height: number) => void;
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Monkey Invaders smoke checks', () => {
  it('releases held touch buttons after matching global pointer release', () => {
    for (const keyCode of ['ArrowLeft', 'ArrowRight', 'Space']) {
      const keys: Record<string, boolean> = {};
      const windowMock = createWindowMock();
      const bindHold = createBindHoldHarness(windowMock, keys);
      const button = createButtonMock();

      bindHold(button, keyCode);

      expect(button.listeners.lostpointercapture).toHaveLength(1);

      button.dispatch('pointerdown', createPointerEvent(7));
      expect(keys[keyCode]).toBe(true);
      expect(button.isPressed()).toBe(true);
      expect(windowMock.listenerCount('pointerup')).toBe(1);
      expect(windowMock.listenerCount('pointercancel')).toBe(1);

      windowMock.dispatch('pointerup', createPointerEvent(9));
      expect(keys[keyCode]).toBe(true);

      windowMock.dispatch('pointerup', createPointerEvent(7));
      expect(keys[keyCode]).toBe(false);
      expect(button.isPressed()).toBe(false);
      expect(windowMock.listenerCount('pointerup')).toBe(0);
      expect(windowMock.listenerCount('pointercancel')).toBe(0);
    }
  });

  it('shows the touch hint once in landscape and auto-dismisses it', () => {
    vi.useFakeTimers();

    const harness = createPhoneHintHarness({
      hasTouch: true,
      width: 812,
      height: 375,
    });

    harness.updatePhoneHint();

    expect(harness.getDisplay()).toBe('block');
    expect(harness.getState().phoneHintShownOnce).toBe(true);
    expect(harness.getState().phoneHintDismissed).toBe(false);
    expect(phoneHintDismissMs).toBeGreaterThanOrEqual(4000);
    expect(phoneHintDismissMs).toBeLessThanOrEqual(6000);

    vi.advanceTimersByTime(phoneHintDismissMs + 1);

    expect(harness.getDisplay()).toBe('none');
    expect(harness.getState().phoneHintDismissed).toBe(true);
    expect(harness.fitGameToScreen).toHaveBeenCalledTimes(1);

    harness.setViewport(375, 812);
    harness.updatePhoneHint();

    expect(harness.getDisplay()).toBe('none');
  });

  it('keeps compact mobile control CSS and onboarding copy in place', () => {
    expect(html).toContain('@media (max-width: 430px)');
    expect(html).toContain('@media (max-width: 360px)');
    expect(html).toContain("width: 84px;");
    expect(html).toContain("width: 72px;");
    expect(html).toContain("font-size: 10px;");
    expect(html).toContain('Hold ◀/▶ to move, hold 🍌 to fire. Landscape recommended.');
  });

  it('freezes player input during level transitions before boss spawns', () => {
    expect(script).toMatch(/function updateMonkey\(dt\) \{\r?\n\s+if \(levelTransition\) return;/);
    expect(script).toContain('keys.Space = false;');
    expect(script).toContain('groundBananas = [];');
  });
});
