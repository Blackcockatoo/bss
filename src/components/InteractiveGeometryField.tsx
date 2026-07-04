"use client";

/**
 * InteractiveGeometryField — a living geometry layer rendered around/behind
 * Auralia. Sixty-point breathing mandala with red/blue/black orbiters that
 * responds to touch like a gravity field, ripples on tap, spins with drag
 * inertia, can bloom into a mirrored black-wing form, and overlays
 * stage-specific geometry for each evolution state.
 *
 * Canvas-based so the whole field costs one draw call per frame, with
 * quality levels for mobile. All motion respects prefers-reduced-motion.
 */

import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { EvolutionState } from "@/evolution/types";

export type GeometryZone = "head" | "body" | "wing" | "aura";
export type GeometryQuality = "low" | "medium" | "high";

export interface InteractiveGeometryFieldProps {
  /** 0–100 stats shaping the field. */
  mood?: number;
  energy?: number;
  curiosity?: number;
  bond?: number;
  evolutionState?: EvolutionState;
  red60?: number;
  blue60?: number;
  black60?: number;
  reduceMotion?: boolean;
  quality?: GeometryQuality;
  /** Fired when the user taps a zone of the field. */
  onZoneTap?: (zone: GeometryZone) => void;
  /** Fired for gesture events, e.g. to feed a movement controller. */
  onGesture?: (gesture: "tap" | "hold" | "drag") => void;
  /** Increment to trigger the mirrored butterfly/black-wing bloom. */
  mirrorSignal?: number;
  className?: string;
  /** Accessible label for the interactive canvas. */
  ariaLabel?: string;
}

interface RippleState {
  x: number;
  y: number;
  age: number;
  zone: GeometryZone;
}

const QUALITY_NODE_COUNT: Record<GeometryQuality, number> = {
  low: 20,
  medium: 30,
  high: 60,
};
const MAX_RIPPLES = 5;
const RIPPLE_LIFE_MS = 900;
const HOLD_THRESHOLD_MS = 550;
const MIRROR_BLOOM_MS = 2400;
const GRAVITY_RADIUS_FACTOR = 0.45; // fraction of field radius
const NODE_FOLLOW_LERP = 0.08; // pull delay — smaller = lazier follow
const SPIN_FRICTION = 0.94;
const MAX_DPR = 2;

const B$S_COLORS = {
  red: "#FF4136",
  blue: "#4AA8FF",
  black: "#0B0B14",
  gold: "#F3D87A",
  line: "rgba(122, 156, 255, 0.35)",
};

function zoneAt(nx: number, ny: number): GeometryZone {
  // nx/ny are offsets from center normalized to field radius (−1..1+).
  const dist = Math.hypot(nx, ny);
  if (dist > 0.85) return "aura";
  if (ny < -0.35) return "head";
  if (Math.abs(nx) > 0.45) return "wing";
  return "body";
}

export const InteractiveGeometryField: React.FC<InteractiveGeometryFieldProps> = ({
  mood = 50,
  energy = 50,
  curiosity = 50,
  bond = 50,
  evolutionState = "GENETICS",
  red60 = 50,
  blue60 = 50,
  black60 = 50,
  reduceMotion = false,
  quality = "medium",
  onZoneTap,
  onGesture,
  mirrorSignal = 0,
  className,
  ariaLabel = "Interactive geometry field around Auralia",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable simulation state kept in refs so the rAF loop never re-renders.
  const sim = useRef({
    pointer: null as { x: number; y: number } | null,
    pointerDown: false,
    pointerDownAt: 0,
    pointerMoved: false,
    lastPointerAngle: 0,
    rotation: 0,
    angularVelocity: 0,
    ripples: [] as RippleState[],
    mirrorUntil: 0,
    holdFired: false,
    // Per-node displaced positions for lazy gravity follow.
    nodeOffsets: [] as Array<{ x: number; y: number }>,
    visible: true,
  });

  const inputs = useRef({
    mood,
    energy,
    curiosity,
    bond,
    evolutionState,
    red60,
    blue60,
    black60,
    reduceMotion,
    quality,
  });
  useEffect(() => {
    inputs.current = {
      mood,
      energy,
      curiosity,
      bond,
      evolutionState,
      red60,
      blue60,
      black60,
      reduceMotion,
      quality,
    };
  }, [mood, energy, curiosity, bond, evolutionState, red60, blue60, black60, reduceMotion, quality]);

  // External mirror trigger.
  const lastMirrorSignal = useRef(mirrorSignal);
  useEffect(() => {
    if (mirrorSignal !== lastMirrorSignal.current) {
      lastMirrorSignal.current = mirrorSignal;
      sim.current.mirrorUntil = performance.now() + MIRROR_BLOOM_MS;
    }
  }, [mirrorSignal]);

  const callbacks = useRef({ onZoneTap, onGesture });
  useEffect(() => {
    callbacks.current = { onZoneTap, onGesture };
  }, [onZoneTap, onGesture]);

  const toLocal = useCallback((e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const p = toLocal(e);
      if (!p) return;
      const s = sim.current;
      s.pointer = { x: p.x, y: p.y };
      s.pointerDown = true;
      s.pointerDownAt = performance.now();
      s.pointerMoved = false;
      s.holdFired = false;
      s.lastPointerAngle = Math.atan2(p.y - p.h / 2, p.x - p.w / 2);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [toLocal],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const p = toLocal(e);
      if (!p) return;
      const s = sim.current;
      const prev = s.pointer;
      s.pointer = { x: p.x, y: p.y };
      if (!s.pointerDown) return;
      if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) > 4) {
        if (!s.pointerMoved) callbacks.current.onGesture?.("drag");
        s.pointerMoved = true;
      }
      // Drag-to-spin: convert angular pointer motion into field rotation.
      const angle = Math.atan2(p.y - p.h / 2, p.x - p.w / 2);
      let delta = angle - s.lastPointerAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      if (s.pointerMoved && !inputs.current.reduceMotion) {
        s.rotation += delta;
        s.angularVelocity = delta;
      }
      s.lastPointerAngle = angle;
    },
    [toLocal],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const p = toLocal(e);
      const s = sim.current;
      const now = performance.now();
      if (s.pointerDown && p) {
        const wasHold = !s.pointerMoved && now - s.pointerDownAt >= HOLD_THRESHOLD_MS;
        const wasTap = !s.pointerMoved && !wasHold;
        if (wasTap) {
          const radius = Math.min(p.w, p.h) / 2;
          const zone = zoneAt(
            (p.x - p.w / 2) / radius,
            (p.y - p.h / 2) / radius,
          );
          if (s.ripples.length >= MAX_RIPPLES) s.ripples.shift();
          s.ripples.push({ x: p.x, y: p.y, age: 0, zone });
          callbacks.current.onZoneTap?.(zone);
          callbacks.current.onGesture?.("tap");
        }
      }
      s.pointerDown = false;
      s.pointer = null;
    },
    [toLocal],
  );

  // Main render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastTime = performance.now();
    let width = 0;
    let height = 0;

    const resize = () => {
      const host = canvas.parentElement;
      if (!host) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onVisibility = () => {
      sim.current.visible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const s = sim.current;
      if (!s.visible || width === 0) return;
      const dt = Math.min(64, now - lastTime);
      lastTime = now;

      const cfg = inputs.current;
      const nodeCount = QUALITY_NODE_COUNT[cfg.quality];
      if (s.nodeOffsets.length !== nodeCount) {
        s.nodeOffsets = Array.from({ length: nodeCount }, () => ({ x: 0, y: 0 }));
      }

      const cx = width / 2;
      const cy = height / 2;
      const fieldRadius = Math.min(width, height) * 0.42;
      const t = now / 1000;

      // Hold gesture → mirror bloom.
      if (
        s.pointerDown &&
        !s.pointerMoved &&
        !s.holdFired &&
        now - s.pointerDownAt >= HOLD_THRESHOLD_MS
      ) {
        s.holdFired = true;
        s.mirrorUntil = now + MIRROR_BLOOM_MS;
        callbacks.current.onGesture?.("hold");
      }

      // Spin inertia.
      if (!s.pointerDown && Math.abs(s.angularVelocity) > 0.0004) {
        s.rotation += s.angularVelocity * (dt / 16.7);
        s.angularVelocity *= SPIN_FRICTION;
      }

      ctx.clearRect(0, 0, width, height);

      const breathe = cfg.reduceMotion
        ? 0
        : Math.sin(t * (0.5 + cfg.energy / 200)) * 0.03;
      const ringRadius = fieldRadius * (0.82 + breathe + (cfg.bond / 100) * 0.06);
      const mirrorActive = now < s.mirrorUntil;
      const mirrorAmount = mirrorActive
        ? Math.sin(Math.min(1, (s.mirrorUntil - now) / MIRROR_BLOOM_MS) * Math.PI)
        : 0;

      const gravityRadius = fieldRadius * GRAVITY_RADIUS_FACTOR;
      const lerp = cfg.reduceMotion ? NODE_FOLLOW_LERP * 0.4 : NODE_FOLLOW_LERP;

      // ── 60-point ring nodes with gravity follow ─────────────────────
      const nodePositions: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < nodeCount; i++) {
        const baseAngle = (i / nodeCount) * Math.PI * 2 + s.rotation;
        let bx = cx + Math.cos(baseAngle) * ringRadius;
        let by = cy + Math.sin(baseAngle) * ringRadius;

        // Mirror bloom: fold the ring into two wing lobes.
        if (mirrorAmount > 0) {
          const side = Math.cos(baseAngle) >= 0 ? 1 : -1;
          const lobeX = cx + side * fieldRadius * 0.5;
          const lobeY = cy - fieldRadius * 0.1 + Math.sin(baseAngle * 2) * fieldRadius * 0.35;
          bx = bx + (lobeX + (bx - cx) * 0.3 - bx) * mirrorAmount;
          by = by + (lobeY - by) * mirrorAmount * 0.8;
        }

        // Gravity pull toward pointer with lazy follow.
        const offset = s.nodeOffsets[i];
        let targetX = 0;
        let targetY = 0;
        if (s.pointer) {
          const dx = s.pointer.x - bx;
          const dy = s.pointer.y - by;
          const dist = Math.hypot(dx, dy);
          if (dist < gravityRadius && dist > 0.001) {
            const pull = (1 - dist / gravityRadius) * gravityRadius * 0.35;
            targetX = (dx / dist) * pull;
            targetY = (dy / dist) * pull;
          }
        }
        offset.x += (targetX - offset.x) * lerp;
        offset.y += (targetY - offset.y) * lerp;
        nodePositions.push({ x: bx + offset.x, y: by + offset.y });
      }

      // Ring lines (connect neighbors; stretch toward finger happens
      // naturally since displaced nodes drag their edges).
      ctx.beginPath();
      for (let i = 0; i < nodeCount; i++) {
        const a = nodePositions[i];
        const b = nodePositions[(i + 1) % nodeCount];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.strokeStyle = B$S_COLORS.line;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Nodes.
      const nodeGlow = 0.35 + (cfg.mood / 100) * 0.4;
      for (let i = 0; i < nodeCount; i++) {
        const p = nodePositions[i];
        const pulse = cfg.reduceMotion
          ? 1
          : 1 + Math.sin(t * 2 + i * 0.7) * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle =
          i % 3 === 0
            ? `rgba(255, 65, 54, ${nodeGlow})`
            : i % 3 === 1
              ? `rgba(74, 168, 255, ${nodeGlow})`
              : `rgba(190, 190, 220, ${nodeGlow * 0.8})`;
        ctx.fill();
      }

      // ── Red/blue/black orbiters ──────────────────────────────────────
      const orbiters: Array<{ value: number; color: string; phase: number }> = [
        { value: cfg.red60, color: B$S_COLORS.red, phase: 0 },
        { value: cfg.blue60, color: B$S_COLORS.blue, phase: (Math.PI * 2) / 3 },
        { value: cfg.black60, color: "#8888AA", phase: (Math.PI * 4) / 3 },
      ];
      const orbitSpeed = cfg.reduceMotion ? 0.05 : 0.25 + cfg.curiosity / 400;
      for (const orb of orbiters) {
        const angle = t * orbitSpeed * Math.PI + orb.phase + s.rotation;
        const r = fieldRadius * (0.55 + (orb.value / 100) * 0.25);
        const ox = cx + Math.cos(angle) * r;
        const oy = cy + Math.sin(angle) * r * 0.92;
        ctx.beginPath();
        ctx.arc(ox, oy, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ── Inner breathing mandala ──────────────────────────────────────
      const petals = cfg.quality === "low" ? 4 : 6;
      ctx.strokeStyle = `rgba(243, 216, 122, ${0.12 + (cfg.bond / 100) * 0.15})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + s.rotation * 0.5 + (cfg.reduceMotion ? 0 : t * 0.1);
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          fieldRadius * 0.45 * (1 + breathe),
          fieldRadius * 0.16,
          a,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      // ── Evolution overlays ───────────────────────────────────────────
      drawEvolutionOverlay(ctx, cfg.evolutionState, cx, cy, fieldRadius, t, cfg.reduceMotion, cfg.quality);

      // ── Tap ripples ──────────────────────────────────────────────────
      for (const ripple of s.ripples) {
        ripple.age += dt;
      }
      s.ripples = s.ripples.filter((r) => r.age < RIPPLE_LIFE_MS);
      for (const ripple of s.ripples) {
        const p = ripple.age / RIPPLE_LIFE_MS;
        const rippleColor =
          ripple.zone === "head"
            ? B$S_COLORS.blue
            : ripple.zone === "wing"
              ? B$S_COLORS.red
              : ripple.zone === "aura"
                ? B$S_COLORS.gold
                : "#B9A6FF";
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, 8 + p * fieldRadius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = rippleColor;
        ctx.globalAlpha = (1 - p) * 0.6;
        ctx.lineWidth = 2 * (1 - p) + 0.5;
        ctx.stroke();
        // Aura taps get a second echo ring.
        if (ripple.zone === "aura" && !cfg.reduceMotion) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, 4 + p * fieldRadius * 0.3, 0, Math.PI * 2);
          ctx.globalAlpha = (1 - p) * 0.3;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const containerClass = useMemo(
    () => ["relative h-full w-full", className].filter(Boolean).join(" "),
    [className],
  );

  return (
    <div className={containerClass}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className="h-full w-full"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={(e) => {
          if (!sim.current.pointerDown) sim.current.pointer = null;
          else endPointer(e);
        }}
      />
    </div>
  );
};

function drawEvolutionOverlay(
  ctx: CanvasRenderingContext2D,
  stage: EvolutionState,
  cx: number,
  cy: number,
  radius: number,
  t: number,
  reduceMotion: boolean,
  quality: GeometryQuality,
): void {
  const anim = reduceMotion ? 0 : t;
  switch (stage) {
    case "GENETICS": {
      // DNA double spiral rising through the field.
      const steps = quality === "low" ? 14 : 24;
      ctx.lineWidth = 1;
      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const p = i / steps;
          const y = cy + radius * (0.8 - p * 1.6);
          const x =
            cx + Math.sin(p * Math.PI * 4 + anim + strand * Math.PI) * radius * 0.22;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle =
          strand === 0 ? "rgba(96, 165, 250, 0.4)" : "rgba(37, 99, 235, 0.3)";
        ctx.stroke();
      }
      break;
    }
    case "NEURO": {
      // Neural lattice with electric flicker.
      const nodes = quality === "low" ? 5 : 8;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes; i++) {
        const a1 = (i / nodes) * Math.PI * 2 + anim * 0.2;
        const a2 = ((i + 2.5) / nodes) * Math.PI * 2 - anim * 0.15;
        const flicker = reduceMotion ? 0.3 : 0.15 + Math.abs(Math.sin(t * 3 + i)) * 0.35;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * radius * 0.6, cy + Math.sin(a1) * radius * 0.6);
        ctx.lineTo(cx + Math.cos(a2) * radius * 0.35, cy + Math.sin(a2) * radius * 0.35);
        ctx.strokeStyle = `rgba(167, 139, 250, ${flicker})`;
        ctx.stroke();
      }
      break;
    }
    case "QUANTUM": {
      // Ghost copies at impossible offsets.
      const ghostOffset = reduceMotion ? radius * 0.05 : radius * (0.08 + Math.sin(t * 1.7) * 0.05);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + ghostOffset * side, cy - ghostOffset * 0.4 * side, radius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = side < 0 ? "rgba(244, 114, 182, 0.18)" : "rgba(74, 168, 255, 0.18)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      break;
    }
    case "SPECIATION": {
      // Full mandala / wing bloom.
      const rays = quality === "low" ? 8 : 12;
      ctx.lineWidth = 1;
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2 + anim * 0.05;
        const inner = radius * 0.3;
        const outer = radius * (0.9 + (reduceMotion ? 0 : Math.sin(t * 1.2 + i) * 0.04));
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.strokeStyle = "rgba(243, 216, 122, 0.28)";
        ctx.stroke();
      }
      break;
    }
  }
}

export default InteractiveGeometryField;
