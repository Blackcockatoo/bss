"use client";

/**
 * React wiring for the touch-native nervous system.
 *
 * Raw pointer events are only ever written into refs. A single
 * `requestAnimationFrame` loop reads those refs, classifies the current
 * gesture, steps the pure state machine (`touchNervousSystem.ts`) and
 * commits a throttled (~30fps) snapshot into React state — the same
 * commit-throttling pattern `useMovementController` already uses for
 * `progress`, so the two systems impose comparable render cost.
 *
 * Mouse, touch and pen all flow through the same Pointer Events handlers
 * (no separate touch/mouse code paths), and `touchAction: "pan-y"` on the
 * stage element keeps normal vertical page scrolling alive.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BodyPerformanceState } from "@/pet/performance";
import { MovementPriority } from "@/pet/movement/movementVocabulary";
import {
  DEFAULT_INTERACTION_CONTEXT,
  classifyGesture,
  deriveInteractionOverlay,
  normalizePointerPosition,
  reduceInteractionState,
  shouldApplyInteractionOverlay,
} from "./touchNervousSystem";
import type {
  InteractionContext,
  InteractionState,
  PointerKind,
  PointerRegion,
} from "./types";

export interface TouchNervousSystemInputs {
  /** Ref to the element whose bounding box defines the stage (div or SVG). */
  stageRef: React.RefObject<HTMLElement | SVGSVGElement | null>;
  /** Fraction of stage height treated as the face region. */
  faceFraction?: number;
  /** system-critical gate: sealed pets receive no interaction at all. */
  sealed?: boolean;
  reducedMotion?: boolean;
  /** 0..1, mirrors `living.trust` — softens/brightens the response. */
  trust?: number;
  /** 0..1, mirrors `living.stress` — lowers the irritation threshold. */
  stress?: number;
  /** `movement.active.clip.priority`, for the overlay priority gate. */
  activeClipPriority?: number;
  onGesture?: (gesture: "tap" | "hold" | "swipe") => void;
  /** Fired once per entry into `pleased` (rate-limited by the hook). */
  onAffection?: () => void;
}

export interface TouchNervousSystemApi {
  state: InteractionState;
  /** -1..1 smoothed gaze target, stage-relative (feeds pupil/gaze channels). */
  gaze: { x: number; y: number };
  pointerHandlers: {
    onPointerEnter: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
    onPointerLeave: (event: React.PointerEvent) => void;
  };
  /** Style to spread onto the stage element: preserves vertical scroll. */
  stageStyle: { touchAction: "pan-y" };
  /** Blends the current overlay onto a living-body baseline. Never mutates. */
  applyOverlay: (living: BodyPerformanceState) => BodyPerformanceState;
}

const SETTLE_MS_BY_PRIOR: Partial<Record<InteractionState, number>> = {
  pleased: 1100,
  irritated: 1500,
  overstimulated: 2200,
  startled: 500,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function blendOverlay(
  living: BodyPerformanceState,
  overlay: ReturnType<typeof deriveInteractionOverlay>,
): BodyPerformanceState {
  if (overlay.weight <= 0.001) return living;
  const w = overlay.weight;
  return {
    ...living,
    eyelidOpen: clamp(living.eyelidOpen + overlay.eyelidOpenDelta * w, 0.04, 1.15),
    browTension: clamp(living.browTension + overlay.browTensionDelta * w, 0, 1),
    mouthCurve: clamp(living.mouthCurve + overlay.mouthCurveDelta * w, -1, 1),
    headTilt: clamp(living.headTilt + overlay.headTiltDelta * w, -18, 18),
    gazeTracking: clamp(living.gazeTracking + overlay.gazeTrackingDelta * w, 0, 1),
    proximity: clamp(living.proximity + overlay.proximityDelta * w, 0, 1),
    auraCohesion: clamp(living.auraCohesion + overlay.auraCohesionDelta * w, 0, 1),
    auraTurbulence: clamp(living.auraTurbulence + overlay.auraTurbulenceDelta * w, 0, 1),
    bounce: clamp(living.bounce + overlay.bounceDelta * w, 0, 1),
  };
}

export function useTouchNervousSystem(
  inputs: TouchNervousSystemInputs,
): TouchNervousSystemApi {
  const {
    stageRef,
    faceFraction = 0.45,
    sealed = false,
    reducedMotion = false,
    trust = 0.5,
    stress = 0,
    activeClipPriority = MovementPriority.IdleBreathing,
    onGesture,
    onAffection,
  } = inputs;

  const [state, setState] = useState<InteractionState>("idle");
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [overlay, setOverlay] = useState(() =>
    deriveInteractionOverlay("idle", 0, DEFAULT_INTERACTION_CONTEXT),
  );

  const stateRef = useRef<InteractionState>("idle");
  const contextRef = useRef<InteractionContext>({ ...DEFAULT_INTERACTION_CONTEXT });
  const contactRef = useRef<{
    active: boolean;
    startAt: number;
    startX: number;
    startY: number;
    pointerId: number | null;
    pointerType: PointerKind;
  } | null>(null);
  const lastSampleRef = useRef<{ t: number; x: number; y: number; region: PointerRegion } | null>(
    null,
  );
  const velocityRef = useRef({ velocity: 0, direction: 0 });
  const runFiredRef = useRef({ tap: false, hold: false, stroke: false, swipe: false });
  const settleStartRef = useRef<{ at: number; from: InteractionState; durationMs: number } | null>(
    null,
  );
  const affectionFiredRef = useRef(false);
  const rawPointRef = useRef({ clientX: 0, clientY: 0, region: "outside" as PointerRegion });

  // Keep gating inputs current without retriggering the rAF effect.
  const gateRef = useRef({ sealed, reducedMotion, trust, stress, activeClipPriority });
  useEffect(() => {
    gateRef.current = { sealed, reducedMotion, trust, stress, activeClipPriority };
    contextRef.current.trust = trust;
    contextRef.current.stress = stress;
  }, [sealed, reducedMotion, trust, stress, activeClipPriority]);

  const dispatch = useCallback(
    (type: Parameters<typeof reduceInteractionState>[1]["type"], at: number, region?: PointerRegion) => {
      const result = reduceInteractionState(
        stateRef.current,
        { type, at, region },
        contextRef.current,
      );
      if (result.state !== stateRef.current) {
        if (result.state === "settling") {
          const prior = stateRef.current;
          settleStartRef.current = {
            at,
            from: prior,
            durationMs: SETTLE_MS_BY_PRIOR[prior] ?? 700,
          };
        }
        if (result.state === "pleased" && !affectionFiredRef.current) {
          affectionFiredRef.current = true;
          onAffection?.();
        }
        if (result.state !== "pleased") {
          affectionFiredRef.current = false;
        }
        stateRef.current = result.state;
      }
      contextRef.current = result.context;
    },
    [onAffection],
  );

  const onPointerEnter = useCallback(
    (event: React.PointerEvent) => {
      if (gateRef.current.sealed) return;
      rawPointRef.current = { clientX: event.clientX, clientY: event.clientY, region: "outside" };
      dispatch("pointer-near", performance.now());
    },
    [dispatch],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    rawPointRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      region: rawPointRef.current.region,
    };
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (gateRef.current.sealed) return;
      (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
      const now = performance.now();
      contactRef.current = {
        active: true,
        startAt: now,
        startX: event.clientX,
        startY: event.clientY,
        pointerId: event.pointerId,
        pointerType: (event.pointerType as PointerKind) || "unknown",
      };
      runFiredRef.current = { tap: false, hold: false, stroke: false, swipe: false };
      lastSampleRef.current = { t: now, x: event.clientX, y: event.clientY, region: "outside" };
      dispatch("contact-start", now);
    },
    [dispatch],
  );

  const endContact = useCallback(
    (event: React.PointerEvent, released: boolean) => {
      const contact = contactRef.current;
      if (!contact) return;
      const now = performance.now();
      if (released) {
        const distance = Math.hypot(event.clientX - contact.startX, event.clientY - contact.startY);
        const duration = now - contact.startAt;
        const window = classifyGesture({
          duration,
          distance,
          velocity: velocityRef.current.velocity,
          direction: velocityRef.current.direction,
          contact: false,
          released: true,
        });
        if (window.isTap) {
          onGesture?.("tap");
          dispatch("gesture-tap", now);
        }
      }
      (event.currentTarget as Element).releasePointerCapture?.(contact.pointerId ?? event.pointerId);
      contactRef.current = null;
      dispatch("contact-end", now);
    },
    [dispatch, onGesture],
  );

  const onPointerUp = useCallback((event: React.PointerEvent) => endContact(event, true), [
    endContact,
  ]);
  const onPointerCancel = useCallback((event: React.PointerEvent) => endContact(event, false), [
    endContact,
  ]);
  const onPointerLeave = useCallback(
    (event: React.PointerEvent) => {
      if (contactRef.current) {
        endContact(event, false);
        return;
      }
      dispatch("pointer-leave", performance.now());
    },
    [dispatch, endContact],
  );

  // ── rAF loop: smoothing + throttled commits ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    let lastCommit = 0;

    const step = () => {
      raf = window.requestAnimationFrame(step);
      const now = performance.now();

      const rect = stageRef.current?.getBoundingClientRect();
      const point = rawPointRef.current;
      if (rect) {
        const normalized = normalizePointerPosition(point.clientX, point.clientY, {
          rect,
          faceFraction,
        });
        rawPointRef.current = { ...point, region: normalized.region };

        // Smooth velocity/direction from the last committed sample.
        const last = lastSampleRef.current;
        if (last) {
          const dt = Math.max(1, now - last.t);
          const dx = point.clientX - last.x;
          const dy = point.clientY - last.y;
          const instVelocity = Math.hypot(dx, dy) / dt;
          const instDirection = Math.atan2(dy, dx);
          velocityRef.current = {
            velocity: velocityRef.current.velocity * 0.6 + instVelocity * 0.4,
            direction: instDirection,
          };
        }
        lastSampleRef.current = { t: now, x: point.clientX, y: point.clientY, region: normalized.region };

        if (now - lastCommit >= 30) {
          setGaze((current) => {
            const nx = Math.round(normalized.stageX * 60) / 60;
            const ny = Math.round(normalized.stageY * 60) / 60;
            return current.x === nx && current.y === ny ? current : { x: nx, y: ny };
          });
        }
      }

      const contact = contactRef.current;
      if (contact) {
        const distance = Math.hypot(point.clientX - contact.startX, point.clientY - contact.startY);
        const duration = now - contact.startAt;
        const window = classifyGesture({
          duration,
          distance,
          velocity: velocityRef.current.velocity,
          direction: velocityRef.current.direction,
          contact: true,
          released: false,
        });
        const fired = runFiredRef.current;
        if (window.isFastSwipe) {
          onGesture?.("swipe");
          dispatch("gesture-fast-swipe", now, point.region);
          fired.swipe = true;
        } else if (window.isSlowStroke && !fired.stroke) {
          fired.stroke = true;
          dispatch("gesture-slow-stroke", now, point.region);
        } else if (window.isHold && !fired.hold && !fired.stroke) {
          fired.hold = true;
          onGesture?.("hold");
          dispatch("gesture-hold", now, point.region);
        }
      }

      // Settling decay, computed locally so the overlay eases to zero
      // instead of cutting off abruptly.
      const settle = settleStartRef.current;
      if (stateRef.current === "settling" && settle) {
        const elapsed = now - settle.at;
        if (elapsed >= settle.durationMs) {
          settleStartRef.current = null;
          dispatch("settle-complete", now);
        } else {
          const priorOverlay = deriveInteractionOverlay(
            settle.from,
            0.4,
            contextRef.current,
          );
          contextRef.current.lastWeight = priorOverlay.weight * (1 - elapsed / settle.durationMs);
        }
      } else if (stateRef.current !== "settling") {
        dispatch("settle-tick", now, point.region);
      }

      if (now - lastCommit >= 30) {
        lastCommit = now;
        setState((current) => (current === stateRef.current ? current : stateRef.current));
        const gate = gateRef.current;
        const nextOverlay = shouldApplyInteractionOverlay(
          gate.activeClipPriority,
          MovementPriority.TouchReaction,
        )
          ? deriveInteractionOverlay(
              stateRef.current,
              velocityRef.current.velocity,
              contextRef.current,
            )
          : { ...deriveInteractionOverlay(stateRef.current, 0, contextRef.current), weight: 0 };
        setOverlay((current) =>
          current.weight === nextOverlay.weight &&
          current.mouthCurveDelta === nextOverlay.mouthCurveDelta &&
          current.headTiltDelta === nextOverlay.headTiltDelta
            ? current
            : nextOverlay,
        );
      }
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [dispatch, faceFraction, onGesture, stageRef]);

  const pointerHandlers = useMemo(
    () => ({ onPointerEnter, onPointerMove, onPointerDown, onPointerUp, onPointerCancel, onPointerLeave }),
    [onPointerEnter, onPointerMove, onPointerDown, onPointerUp, onPointerCancel, onPointerLeave],
  );

  const applyOverlay = useCallback(
    (living: BodyPerformanceState) => blendOverlay(living, overlay),
    [overlay],
  );

  return {
    state,
    gaze,
    pointerHandlers,
    stageStyle: { touchAction: "pan-y" },
    applyOverlay,
  };
}
