"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Hand, MousePointer2, Unlock } from "lucide-react";
import { clamp } from "./canvasUtils";
import { createDnaModeRenderer } from "./renderers";
import type {
  AdvancedDnaControlsState,
  DnaModeRenderer,
  DnaVisualModel,
  PerformanceProfile,
  VisualInteraction,
} from "./types";

export type AdvancedDNACanvasHandle = {
  exportPng: () => void;
  resetView: () => void;
  canvas: () => HTMLCanvasElement | null;
};

type AdvancedDNACanvasProps = {
  model: DnaVisualModel;
  controls: AdvancedDnaControlsState;
  performance: PerformanceProfile;
  reducedMotion: boolean;
  resetViewToken: number;
};

const INITIAL_INTERACTION: VisualInteraction = {
  yaw: 0.16,
  pitch: -0.08,
  zoom: 1,
  distortion: 0,
  focusGroup: null,
  pulseStartedAt: -1,
  pointerX: 0.5,
  pointerY: 0.5,
};

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, "image/png");
}

export const AdvancedDNACanvas = forwardRef<
  AdvancedDNACanvasHandle,
  AdvancedDNACanvasProps
>(function AdvancedDNACanvas(
  {
    model,
    controls,
    performance: performanceProfile,
    reducedMotion,
    resetViewToken,
  },
  forwardedRef,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rendererRef = useRef<DnaModeRenderer | null>(null);
  const controlsRef = useRef(controls);
  const modelRef = useRef(model);
  const performanceRef = useRef(performanceProfile);
  const reducedMotionRef = useRef(reducedMotion);
  const interactionRef = useRef<VisualInteraction>({ ...INITIAL_INTERACTION });
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const animationTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastDrawTimeRef = useRef(0);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef(0);
  const [touchEngaged, setTouchEngaged] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    performanceRef.current = performanceProfile;
  }, [performanceProfile]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const resetView = useCallback(() => {
    interactionRef.current = { ...INITIAL_INTERACTION };
    rendererRef.current?.reset();
  }, []);

  useImperativeHandle(
    forwardedRef,
    () => ({
      exportPng: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const mode =
          controlsRef.current.mode === "fourD"
            ? "4d"
            : controlsRef.current.mode;
        downloadCanvas(
          canvas,
          `metapet-${mode}-${modelRef.current.fingerprint.toLowerCase()}.png`,
        );
      },
      resetView,
      canvas: () => canvasRef.current,
    }),
    [resetView],
  );

  useEffect(() => {
    resetView();
  }, [resetView, resetViewToken]);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const renderFrame = useCallback((timestamp: number, forcedDelta?: number) => {
    const ctx = ctxRef.current;
    const renderer = rendererRef.current;
    const { width, height } = dimensionsRef.current;
    if (!ctx || !renderer || !width || !height) return;

    const nowDelta = lastFrameTimeRef.current
      ? Math.min(
          0.075,
          Math.max(0, (timestamp - lastFrameTimeRef.current) / 1000),
        )
      : 0;
    const delta = forcedDelta ?? nowDelta;
    lastFrameTimeRef.current = timestamp;
    if (controlsRef.current.playing && !document.hidden) {
      animationTimeRef.current += delta;
    }

    renderer.render({
      ctx,
      width,
      height,
      time: animationTimeRef.current,
      delta,
      controls: controlsRef.current,
      interaction: interactionRef.current,
      performance: performanceRef.current,
      reducedMotion: reducedMotionRef.current,
    });
  }, []);

  // One renderer instance at a time; mode changes dispose the previous mode.
  useEffect(() => {
    rendererRef.current?.dispose();
    rendererRef.current = createDnaModeRenderer(
      controls.mode,
      modelRef.current,
      controls.animationNonce,
    );
    lastDrawTimeRef.current = 0;
    renderFrame(performance.now(), 0);
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [controls.animationNonce, controls.mode, model.fingerprint, renderFrame]);

  // Vitals and mutation history can update behavior without resetting trails/phase.
  useEffect(() => {
    rendererRef.current?.updateModel(model);
    renderFrame(performance.now(), 0);
  }, [model, renderFrame]);

  // HiDPI sizing is shared by all modes and responds to fullscreen/layout changes.
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      fallbackRef.current?.classList.remove("hidden");
      return;
    }
    ctxRef.current = context;
    fallbackRef.current?.classList.add("hidden");

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(280, Math.round(rect.width));
      const height = Math.max(320, Math.round(rect.height));
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        performanceRef.current.dprCap,
      );
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimensionsRef.current = { width, height };
      rendererRef.current?.reset();
      renderFrame(performance.now(), 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      ctxRef.current = null;
    };
  }, [performanceProfile.dprCap, renderFrame]);

  // A single RAF owner survives mode switches; hidden tabs cancel it completely.
  useEffect(() => {
    let animationFrame = 0;
    let active = true;
    const minimumFrameMs = 1000 / performanceProfile.targetFps;

    const tick = (timestamp: number) => {
      if (!active || document.hidden) return;
      if (timestamp - lastDrawTimeRef.current >= minimumFrameMs) {
        renderFrame(timestamp);
        lastDrawTimeRef.current = timestamp;
      }
      animationFrame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (
        !active ||
        document.hidden ||
        !controlsRef.current.playing ||
        animationFrame
      )
        return;
      lastFrameTimeRef.current = performance.now();
      animationFrame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (controls.playing) start();
    else renderFrame(performance.now(), 0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [controls.playing, performanceProfile.targetFps, renderFrame]);

  // Control changes redraw a paused still without creating a second loop.
  useEffect(() => {
    if (!controls.playing) renderFrame(performance.now(), 0);
  }, [controls, performanceProfile, renderFrame]);

  const localPoint = useCallback((event: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, nx: 0.5, ny: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    return {
      x,
      y,
      nx: rect.width ? x / rect.width : 0.5,
      ny: rect.height ? y / rect.height : 0.5,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pointers = pointersRef.current;

    const focusFromPoint = (nx: number, ny: number) => {
      if (controlsRef.current.mode === "cascade") {
        return clamp(Math.floor(nx * 12), 0, 11);
      }
      const angle =
        (Math.atan2(ny - 0.5, nx - 0.5) + Math.PI * 2.5) % (Math.PI * 2);
      return Math.floor((angle / (Math.PI * 2)) * 12) % 12;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" && !touchEngaged) return;
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture?.(event.pointerId);
      const point = localPoint(event);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      interactionRef.current.pointerX = point.nx;
      interactionRef.current.pointerY = point.ny;
      interactionRef.current.focusGroup = focusFromPoint(point.nx, point.ny);
      interactionRef.current.pulseStartedAt = animationTimeRef.current;
      renderFrame(performance.now(), 0);
    };
    const updatePinch = () => {
      if (pointers.size !== 2) {
        pinchDistanceRef.current = 0;
        return;
      }
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistanceRef.current > 0) {
        interactionRef.current.zoom = clamp(
          interactionRef.current.zoom * (distance / pinchDistanceRef.current),
          0.62,
          1.72,
        );
      }
      pinchDistanceRef.current = distance;
    };
    const onPointerMove = (event: PointerEvent) => {
      const point = localPoint(event);
      const previous = pointers.get(event.pointerId);
      interactionRef.current.pointerX = point.nx;
      interactionRef.current.pointerY = point.ny;
      interactionRef.current.distortion = (point.nx - 0.5) * 0.8;

      if (previous) {
        const dx = event.clientX - previous.x;
        const dy = event.clientY - previous.y;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 1) {
          interactionRef.current.yaw += dx * 0.008;
          interactionRef.current.pitch = clamp(
            interactionRef.current.pitch + dy * 0.006,
            -1.15,
            1.15,
          );
        }
        updatePinch();
      } else if (event.pointerType === "mouse") {
        interactionRef.current.yaw +=
          ((point.nx - 0.5) * 0.7 - interactionRef.current.yaw) * 0.035;
        interactionRef.current.pitch +=
          ((point.ny - 0.5) * 0.35 - interactionRef.current.pitch) * 0.035;
      }
      if (!controlsRef.current.playing) renderFrame(performance.now(), 0);
    };
    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture?.(event.pointerId);
      }
      updatePinch();
    };
    const onWheel = (event: WheelEvent) => {
      // Page scrolling wins until the user has explicitly focused the instrument.
      if (document.activeElement !== canvas) return;
      event.preventDefault();
      interactionRef.current.zoom = clamp(
        interactionRef.current.zoom - event.deltaY * 0.0012,
        0.62,
        1.72,
      );
      if (!controlsRef.current.playing) renderFrame(performance.now(), 0);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      pointers.clear();
    };
  }, [localPoint, renderFrame, touchEngaged]);

  return (
    <div
      ref={hostRef}
      className="relative h-[clamp(360px,62vh,720px)] min-h-[360px] w-full overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#01050d] shadow-[inset_0_0_80px_rgba(0,0,0,0.7),0_22px_70px_rgba(0,0,0,0.35)] sm:min-h-[480px]"
      data-advanced-dna-stage
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
        style={{ touchAction: touchEngaged ? "none" : "pan-y pinch-zoom" }}
        aria-label={`${controls.mode === "fourD" ? "4D" : controls.mode} visualisation of ${model.petName}'s DNA. Drag to change the view, tap to pulse a gene group, and focus then scroll to zoom.`}
      />

      <div
        ref={fallbackRef}
        className="absolute inset-0 hidden flex items-center justify-center bg-slate-950 p-6 text-center"
        role="status"
      >
        <div>
          <p className="text-lg font-bold text-white">
            Canvas rendering is unavailable
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            The DNA fingerprint is {model.fingerprint}. Try a current browser or
            use the existing 2D DNA instruments above.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
        <div className="rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300 backdrop-blur-sm">
          {model.fingerprint}
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-400 backdrop-blur-sm">
          {controls.playing ? "Live" : "Paused"}
        </div>
      </div>

      {coarsePointer && !touchEngaged && (
        <button
          type="button"
          onClick={() => setTouchEngaged(true)}
          className="absolute bottom-4 left-1/2 inline-flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-xl border border-cyan-300/40 bg-slate-950/92 px-4 py-3 text-sm font-bold text-cyan-100 shadow-xl"
          aria-label="Engage touch controls for the DNA visualisation"
        >
          <Hand size={18} aria-hidden /> Engage touch field
        </button>
      )}
      {coarsePointer && touchEngaged && (
        <button
          type="button"
          onClick={() => setTouchEngaged(false)}
          className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-600 bg-slate-950/90 px-3 py-2 text-xs font-bold text-slate-200 shadow-xl"
          aria-label="Release touch field and restore page scrolling"
        >
          <Unlock size={16} aria-hidden /> Release scroll
        </button>
      )}

      {!coarsePointer && (
        <div className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-2 rounded-lg border border-white/10 bg-slate-950/65 px-2.5 py-1.5 text-[10px] text-slate-400 sm:flex">
          <MousePointer2 size={13} aria-hidden /> Drag · tap · focus + wheel
        </div>
      )}
    </div>
  );
});
