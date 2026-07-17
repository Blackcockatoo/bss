"use client";

/**
 * Shared pointer interaction controller for the canonical Meta-Pet stage.
 *
 * Normalizes mouse/pen/touch Pointer Events into one interaction state
 * machine (see pointerSignals.ts) plus a small set of continuous overlay
 * values (lean, head-tilt bias, mouth/eyelid bias). The overlay is designed
 * to be added on top of the existing MovementPerformance frame — it never
 * drives its own animation loop for the pet itself, it only supplies
 * numbers for VisualDNAPet to blend in.
 *
 * Perf contract: raw pointer events only update refs. React state commits
 * are quantized and throttled to ~30fps (mirrors useMovementController's
 * commitProgress), so a fast flick across the stage does not cause a
 * render per event.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  classifySignal,
  nextInteractionState,
  type ClassifiedSignal,
  type InteractionState,
  type PointerFrame,
} from "./pointerSignals";

export interface InteractionOverlay {
  /** -1..1 lean toward the pointer, horizontal. */
  leanX: number;
  /** -1..1 lean toward the pointer, vertical. */
  leanY: number;
  /** Degrees, additive on top of the clip-driven head tilt. */
  headTiltBias: number;
  /** -1..1 additive mouth-curve nudge. */
  mouthBias: number;
  /** -1..1 additive eyelid nudge (positive = wider). */
  eyelidBias: number;
  /** 0..1 composite strength of the current interaction. */
  intensity: number;
}

const NEUTRAL_OVERLAY: InteractionOverlay = {
  leanX: 0,
  leanY: 0,
  headTiltBias: 0,
  mouthBias: 0,
  eyelidBias: 0,
  intensity: 0,
};

const COMMIT_INTERVAL_MS = 33;
const LEAN_SMOOTHING = 0.18;
const SETTLE_SMOOTHING = 0.08;
const GESTURE_WINDOW_MS = 4000;

export interface UsePointerInteractionOptions {
  reduceMotion: boolean;
  /** Freezes discrete-gesture side effects (e.g. sealed/system-critical pets). */
  sealed?: boolean;
  onGesture?: (
    gesture: "tap" | "hold" | "stroke" | "swipe" | "startle",
  ) => void;
  onStateChange?: (state: InteractionState) => void;
}

export interface UsePointerInteractionResult {
  state: InteractionState;
  overlay: InteractionOverlay;
  bind: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => void;
  };
}

interface RawTrack {
  rect: DOMRect | null;
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  lastT: number;
  isDown: boolean;
  pressStartedAt: number;
  pressStartX: number;
  pressStartY: number;
  lastDirSign: number;
  reversalCount: number;
  dwellStart: number;
  gestureTimestamps: number[];
  pointerType: string;
  releasedPressDuration: number | null;
  travelPx: number;
  pointerId: number | null;
}

function makeTrack(): RawTrack {
  return {
    rect: null,
    x: Infinity,
    y: Infinity,
    lastX: Infinity,
    lastY: Infinity,
    lastT: 0,
    isDown: false,
    pressStartedAt: 0,
    pressStartX: 0,
    pressStartY: 0,
    lastDirSign: 0,
    reversalCount: 0,
    dwellStart: 0,
    gestureTimestamps: [],
    pointerType: "mouse",
    releasedPressDuration: null,
    travelPx: 0,
    pointerId: null,
  };
}

export function usePointerInteraction(
  options: UsePointerInteractionOptions,
): UsePointerInteractionResult {
  const { reduceMotion, sealed = false, onGesture, onStateChange } = options;

  const trackRef = useRef<RawTrack>(makeTrack());
  const smoothedRef = useRef<InteractionOverlay>({ ...NEUTRAL_OVERLAY });
  const stateRef = useRef<InteractionState>("idle");
  const lastClassifiedRef = useRef<ClassifiedSignal | null>(null);

  const [state, setState] = useState<InteractionState>("idle");
  const [overlay, setOverlay] = useState<InteractionOverlay>(NEUTRAL_OVERLAY);

  const optionsRef = useRef({ sealed, onGesture, onStateChange });
  useEffect(() => {
    optionsRef.current = { sealed, onGesture, onStateChange };
  }, [sealed, onGesture, onStateChange]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (optionsRef.current.sealed) return;
    const track = trackRef.current;
    const target = event.currentTarget;
    target.setPointerCapture?.(event.pointerId);
    const rect = target.getBoundingClientRect();
    const now = performance.now();
    track.rect = rect;
    track.pointerId = event.pointerId;
    track.pointerType = event.pointerType || "mouse";
    track.isDown = true;
    track.pressStartedAt = now;
    track.pressStartX = event.clientX;
    track.pressStartY = event.clientY;
    track.lastX = event.clientX;
    track.lastY = event.clientY;
    track.lastT = now;
    track.lastDirSign = 0;
    track.reversalCount = 0;
    track.travelPx = 0;
    track.releasedPressDuration = null;
    track.x = event.clientX;
    track.y = event.clientY;
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const track = trackRef.current;
    if (track.pointerId !== null && event.pointerId !== track.pointerId && track.isDown) {
      return;
    }
    const now = performance.now();
    const rect = track.rect ?? event.currentTarget.getBoundingClientRect();
    track.rect = rect;

    if (track.isDown) {
      const dx = event.clientX - track.lastX;
      const dy = event.clientY - track.lastY;
      const dirSign = Math.sign(dx) || Math.sign(dy) || 0;
      if (dirSign !== 0 && track.lastDirSign !== 0 && dirSign !== track.lastDirSign) {
        track.reversalCount += 1;
      }
      if (dirSign !== 0) track.lastDirSign = dirSign;
      track.travelPx = Math.hypot(
        event.clientX - track.pressStartX,
        event.clientY - track.pressStartY,
      );
    } else {
      track.dwellStart = track.dwellStart || now;
    }

    track.lastX = event.clientX;
    track.lastY = event.clientY;
    track.lastT = now;
    track.x = event.clientX;
    track.y = event.clientY;
    track.pointerType = event.pointerType || track.pointerType;
  }, []);

  const finishPress = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const track = trackRef.current;
    if (!track.isDown) return;
    const now = performance.now();
    track.isDown = false;
    track.releasedPressDuration = now - track.pressStartedAt;
    track.gestureTimestamps.push(now);
    track.gestureTimestamps = track.gestureTimestamps.filter(
      (t) => now - t <= GESTURE_WINDOW_MS,
    );
    track.dwellStart = now;
    track.pointerId = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser; safe to ignore.
    }
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => finishPress(event),
    [finishPress],
  );
  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => finishPress(event),
    [finishPress],
  );
  const onPointerLeave = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Pointer capture keeps drags alive even if the cursor visually
      // leaves the element bounds; only treat this as a real exit when the
      // pointer isn't captured (no active press) so a jittery finger can't
      // cancel an in-progress hold/stroke.
      const track = trackRef.current;
      if (!track.isDown) {
        track.x = Infinity;
        track.y = Infinity;
        track.dwellStart = 0;
      }
    },
    [],
  );

  useEffect(() => {
    let raf = 0;
    let lastCommit = 0;
    const step = () => {
      const now = performance.now();
      const track = trackRef.current;
      const smoothing = reduceMotion ? 1 : track.isDown ? LEAN_SMOOTHING : SETTLE_SMOOTHING;

      let distance = Infinity;
      let leanTargetX = 0;
      let leanTargetY = 0;
      if (track.rect && Number.isFinite(track.x)) {
        const halfW = track.rect.width / 2 || 1;
        const halfH = track.rect.height / 2 || 1;
        const cx = track.rect.left + halfW;
        const cy = track.rect.top + halfH;
        const nx = (track.x - cx) / halfW;
        const ny = (track.y - cy) / halfH;
        distance = Math.hypot(nx, ny);
        leanTargetX = Math.max(-1, Math.min(1, nx));
        leanTargetY = Math.max(-1, Math.min(1, ny));
      }

      const dt = track.lastT ? Math.max(1, now - track.lastT) : 16;
      const velocity = track.isDown
        ? Math.hypot(track.x - track.lastX, track.y - track.lastY) / dt
        : 0;
      const dwellMs = track.dwellStart ? now - track.dwellStart : 0;
      const pressDuration = track.isDown ? now - track.pressStartedAt : 0;

      const frame: PointerFrame = {
        isDown: track.isDown,
        distance,
        velocity,
        pressDuration,
        dwellMs,
        reversalCount: track.reversalCount,
        recentGestureCount: track.gestureTimestamps.length,
        pointerType: track.pointerType,
      };

      const classified = classifySignal(frame, track.releasedPressDuration, track.travelPx);
      const next = nextInteractionState(stateRef.current, frame);

      if (next !== stateRef.current) {
        const previous = stateRef.current;
        stateRef.current = next;
        optionsRef.current.onStateChange?.(next);
        if (!optionsRef.current.sealed) {
          if (next === "startled") optionsRef.current.onGesture?.("startle");
          else if (next === "stroked" && previous !== "stroked") {
            optionsRef.current.onGesture?.("stroke");
          } else if (next === "pleased" && previous !== "pleased") {
            optionsRef.current.onGesture?.("hold");
          }
        }
      }
      if (
        !optionsRef.current.sealed &&
        classified.isTap &&
        track.releasedPressDuration !== null &&
        lastClassifiedRef.current?.isTap !== true
      ) {
        optionsRef.current.onGesture?.("tap");
      }
      if (
        !optionsRef.current.sealed &&
        classified.isSwipe &&
        lastClassifiedRef.current?.isSwipe !== true
      ) {
        optionsRef.current.onGesture?.("swipe");
      }
      lastClassifiedRef.current = classified;
      if (track.releasedPressDuration !== null) track.releasedPressDuration = null;

      const s = smoothedRef.current;
      const active = next !== "idle" && next !== "settling";
      const decay = active ? 1 : 0;
      s.leanX += (leanTargetX * decay - s.leanX) * smoothing;
      s.leanY += (leanTargetY * decay - s.leanY) * smoothing;
      const headBiasTarget = active ? leanTargetX * 6 : 0;
      s.headTiltBias += (headBiasTarget - s.headTiltBias) * smoothing;
      const mouthTarget =
        next === "pleased" ? 0.35 : next === "startled" ? -0.25 : next === "stroked" ? 0.2 : 0;
      s.mouthBias += (mouthTarget - s.mouthBias) * smoothing;
      const eyelidTarget = next === "startled" ? 0.3 : next === "curious" ? 0.1 : 0;
      s.eyelidBias += (eyelidTarget - s.eyelidBias) * smoothing;
      s.intensity += (classified.intensity - s.intensity) * smoothing;

      if (now - lastCommit >= COMMIT_INTERVAL_MS || reduceMotion) {
        lastCommit = now;
        setOverlay((prev) =>
          prev.leanX === s.leanX &&
          prev.leanY === s.leanY &&
          prev.headTiltBias === s.headTiltBias &&
          prev.mouthBias === s.mouthBias &&
          prev.eyelidBias === s.eyelidBias &&
          prev.intensity === s.intensity
            ? prev
            : { ...s },
        );
        setState((prev) => (prev === stateRef.current ? prev : stateRef.current));
      }

      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [reduceMotion]);

  const bind = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
    }),
    [onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave],
  );

  return { state, overlay, bind };
}
