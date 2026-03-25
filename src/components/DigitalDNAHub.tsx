"use client";

/**
 * DigitalDNAHub — All-Ages Interactive DNA Learning Hub
 *
 * Five interactive modes that turn three core number sequences into
 * geometry, colour and sound. Works with touch, stylus, trackpad and mouse.
 *
 * Mode overview (teacher reference):
 *  spiral   – Three.js 3-D double-helix. Drag to rotate, pinch to zoom,
 *             hover/tap glowing nodes to hear their note.
 *  mandala  – 2-D paint canvas with rotational symmetry. Every stroke is
 *             mirrored (harmony × times) and plays a tone.
 *  triangle – 60-step perimeter instrument built from a 10-24-26 triangle.
 *             Tap or drag the edge points to trace playable note paths.
 *  sound    – Bar-chart piano. Tap any bar to play its DNA note, or play
 *             the full sequence as a melody.
 *  journey  – Guided step-by-step setup that feeds all other modes.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { PatternQuestBoard } from "@/components/PatternQuestBoard";
import * as THREE from "three";
import * as Tone from "tone";
import { saveDnaImprint } from "@/lib/dnaImprint";
import { buildDigitalDNARevealModel } from "@/lib/digitalDnaReveal";
import {
  buildLessonQuestSummary,
  createEmptyQuestModeCounts,
  evaluateQuestPack,
  getLessonCompletionRequirements,
  getQuestPackById,
  selectQuestPack,
  useEducationStore,
} from "@/lib/education";
import { markJourneyRouteCompleted } from "@/lib/journeyProgress";
import {
  MOSS_DIGIT_COLORS as COLORS,
  MOSS_DIGIT_SHAPES,
  MOSS_LEARNING_COLORS as LEARNING_COLORS,
  MOSS_SCALE as SCALE,
  MOSS_STRAND_META,
  MOSS_STRANDS as SEEDS,
  type MossStrandKey,
} from "@/lib/moss60/strandSequences";
import { FULL_STRAND_PACKETS } from "@/lib/moss60/strandPackets";
import { detectWebGLSupport } from "@/lib/renderSupport";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonContext {
  lessonId: string;
  studentAlias: string;
  prePrompt: string | null;
  postPrompt: string | null;
}

type SeedKey = MossStrandKey;
type ModeKey = "spiral" | "mandala" | "sound" | "triangle" | "pentagon" | "hexagon" | "decagon" | "circle" | "journey";
type ToolTransform = "raw" | "reverse" | "orbit";
type SequenceSource = "core" | "packet";
type MiniPathMode = "story" | "build";
type TriangleSide = "vertical" | "base" | "diagonal";
type PolygonSide = "side" | number; // Generic for pentagon, hexagon, decagon

interface ToolkitSettingsSnapshot {
  selectedSeed: SeedKey;
  activeMode: ModeKey;
  sequenceSource: SequenceSource;
  selectedPacketIndex: number;
  miniPathMode: MiniPathMode;
  miniPathStartIndex: number;
  miniPathLength: number;
  harmony: number;
  tempo: number;
  toolStartIndex: number;
  toolWindowSize: number;
  toolTransform: ToolTransform;
  toolFocusBand: "all" | "odd" | "even";
}

interface SavedToolkitPreset extends ToolkitSettingsSnapshot {
  id: string;
  name: string;
}

interface PaintPoint {
  x: number;
  y: number;
}

interface TrianglePoint {
  x: number;
  y: number;
}

interface TrianglePerimeterStep {
  index: number;
  unit: number;
  side: TriangleSide;
  x: number;
  y: number;
}

interface PolygonPoint {
  x: number;
  y: number;
}

interface PolygonPerimeterStep {
  index: number;
  unit: number;
  side: number;
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PIXEL_RATIO = 2;
const MIN_SURFACE = 260; // px — minimum canvas dimension on any axis
const MAX_PAINT_POINTS = 6000;
const INTERACTION_THROTTLE_MS = 34; // ~29 fps interaction sampling
const TOOLKIT_STORAGE_KEY = "digital-dna-toolkit-settings-v1";
const MAX_SAVED_TOOL_PRESETS = 6;
const MAX_NOTE_BOARD = 180;
const DEFAULT_NOTE_BOARD_CAPACITY = 48;
const TRACE_SNAP_RADIUS = 28;
const TRIANGLE_VIEWBOX = { width: 900, height: 460 } as const;
const TRIANGLE_VERTICES = {
  top: { x: 160, y: 90 },
  left: { x: 160, y: 330 },
  right: { x: 736, y: 330 },
} as const satisfies Record<string, TrianglePoint>;
const TRIANGLE_SIDE_UNITS = {
  vertical: 10,
  base: 24,
  diagonal: 26,
} as const satisfies Record<TriangleSide, number>;
const TRIANGLE_SIDE_ACCENTS = {
  vertical: "#38BDF8",
  base: "#F59E0B",
  diagonal: "#A855F7",
} as const satisfies Record<TriangleSide, string>;

// Pentagon: 5 sides × 12 steps = 60
const PENTAGON_VIEWBOX = { width: 900, height: 900 } as const;
const PENTAGON_CENTER = { x: 450, y: 450 } as const;
const PENTAGON_RADIUS = 300;
const PENTAGON_STEPS_PER_SIDE = 12;
const PENTAGON_COLORS = [
  "#38BDF8", // cyan
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // emerald
  "#8B5CF6", // violet
] as const;

// Hexagon: 6 sides × 10 steps = 60
const HEXAGON_VIEWBOX = { width: 900, height: 900 } as const;
const HEXAGON_CENTER = { x: 450, y: 450 } as const;
const HEXAGON_RADIUS = 300;
const HEXAGON_STEPS_PER_SIDE = 10;
const HEXAGON_COLORS = [
  "#38BDF8", // cyan
  "#F59E0B", // amber
  "#EC4899", // pink
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#F97316", // orange
] as const;

// Decagon: 10 sides × 6 steps = 60
const DECAGON_VIEWBOX = { width: 900, height: 900 } as const;
const DECAGON_CENTER = { x: 450, y: 450 } as const;
const DECAGON_RADIUS = 300;
const DECAGON_STEPS_PER_SIDE = 6;
const DECAGON_COLORS = [
  "#38BDF8", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6",
  "#F97316", "#06B6D4", "#EF4444", "#14B8A6", "#6366F1",
] as const;

// Circle: 60 points around the circumference
const CIRCLE_VIEWBOX = { width: 900, height: 900 } as const;
const CIRCLE_CENTER = { x: 450, y: 450 } as const;
const CIRCLE_RADIUS = 300;
const CIRCLE_POINTS = 60;
const CIRCLE_COLOR = "#06B6D4"; // cyan

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Map a digit 0-9 to its musical note in the pentatonic-ish scale. */
function digitToNote(digit: number): string {
  return SCALE[clamp(Math.round(digit), 0, SCALE.length - 1)];
}

/** Map a digit 0-9 to the main colour palette. */
function digitToColor(digit: number): string {
  return COLORS[clamp(Math.round(digit), 0, COLORS.length - 1)];
}

/** Map a digit 0-9 to the bright learning colour palette. */
function digitToLearningColor(digit: number): string {
  return LEARNING_COLORS[
    clamp(Math.round(digit), 0, LEARNING_COLORS.length - 1)
  ];
}

function transformToolSequence(
  digits: number[],
  transform: ToolTransform,
  harmony: number,
): number[] {
  if (transform === "reverse") return [...digits].reverse();
  if (transform === "orbit")
    return digits.map((digit, index) => (digit + harmony + index) % 10);
  return digits;
}

function countDigits(digits: number[]): number[] {
  const counts = Array.from({ length: 10 }, () => 0);
  for (const digit of digits) {
    counts[clamp(digit, 0, 9)] += 1;
  }
  return counts;
}

function getWrappedDigits(
  digits: number[],
  start: number,
  length: number,
  step = 1,
) {
  if (!digits.length || length <= 0) return [];

  return Array.from({ length }, (_, index) => {
    const safeIndex = (start + index * step) % digits.length;
    return digits[(safeIndex + digits.length) % digits.length];
  });
}

function buildMiniPathString(
  seed: SeedKey,
  mode: MiniPathMode,
  chamberIndex: number,
  start: number,
  length: number,
): string {
  if (mode === "build") {
    return getWrappedDigits(
      SEEDS[seed].split("").map(Number),
      start,
      length,
    ).join("");
  }

  const chamberSet = FULL_STRAND_PACKETS[seed];
  return (
    chamberSet.chambers[clamp(chamberIndex, 0, chamberSet.chambers.length - 1)]
      ?.pentad ?? chamberSet.strand
  );
}

function pointBetween(start: TrianglePoint, end: TrianglePoint, t: number) {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function buildTrianglePerimeterSteps(): TrianglePerimeterStep[] {
  const edges: Array<{
    side: TriangleSide;
    start: TrianglePoint;
    end: TrianglePoint;
    count: number;
  }> = [
    {
      side: "vertical",
      start: TRIANGLE_VERTICES.top,
      end: TRIANGLE_VERTICES.left,
      count: TRIANGLE_SIDE_UNITS.vertical,
    },
    {
      side: "base",
      start: TRIANGLE_VERTICES.left,
      end: TRIANGLE_VERTICES.right,
      count: TRIANGLE_SIDE_UNITS.base,
    },
    {
      side: "diagonal",
      start: TRIANGLE_VERTICES.right,
      end: TRIANGLE_VERTICES.top,
      count: TRIANGLE_SIDE_UNITS.diagonal,
    },
  ];

  let index = 0;

  return edges.flatMap((edge) =>
    Array.from({ length: edge.count }, (_, stepIndex) => {
      const t = (stepIndex + 0.5) / edge.count;
      const point = pointBetween(edge.start, edge.end, t);
      const step: TrianglePerimeterStep = {
        index,
        unit: index + 1,
        side: edge.side,
        x: point.x,
        y: point.y,
      };
      index += 1;
      return step;
    }),
  );
}

const TRIANGLE_PERIMETER_STEPS = buildTrianglePerimeterSteps();

function buildPentagonPerimeterSteps(): PolygonPerimeterStep[] {
  const vertices: PolygonPoint[] = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return {
      x: PENTAGON_CENTER.x + PENTAGON_RADIUS * Math.cos(angle),
      y: PENTAGON_CENTER.y + PENTAGON_RADIUS * Math.sin(angle),
    };
  });

  let index = 0;
  return vertices.flatMap((start, sideIndex) => {
    const end = vertices[(sideIndex + 1) % vertices.length];
    return Array.from({ length: PENTAGON_STEPS_PER_SIDE }, (_, stepIndex) => {
      const t = (stepIndex + 0.5) / PENTAGON_STEPS_PER_SIDE;
      const point = pointBetween(start as TrianglePoint, end as TrianglePoint, t);
      const step: PolygonPerimeterStep = {
        index,
        unit: index + 1,
        side: sideIndex,
        x: point.x,
        y: point.y,
      };
      index += 1;
      return step;
    });
  });
}

function buildHexagonPerimeterSteps(): PolygonPerimeterStep[] {
  const vertices: PolygonPoint[] = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 6;
    return {
      x: HEXAGON_CENTER.x + HEXAGON_RADIUS * Math.cos(angle),
      y: HEXAGON_CENTER.y + HEXAGON_RADIUS * Math.sin(angle),
    };
  });

  let index = 0;
  return vertices.flatMap((start, sideIndex) => {
    const end = vertices[(sideIndex + 1) % vertices.length];
    return Array.from({ length: HEXAGON_STEPS_PER_SIDE }, (_, stepIndex) => {
      const t = (stepIndex + 0.5) / HEXAGON_STEPS_PER_SIDE;
      const point = pointBetween(start as TrianglePoint, end as TrianglePoint, t);
      const step: PolygonPerimeterStep = {
        index,
        unit: index + 1,
        side: sideIndex,
        x: point.x,
        y: point.y,
      };
      index += 1;
      return step;
    });
  });
}

function buildDecagonPerimeterSteps(): PolygonPerimeterStep[] {
  const vertices: PolygonPoint[] = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 10;
    return {
      x: DECAGON_CENTER.x + DECAGON_RADIUS * Math.cos(angle),
      y: DECAGON_CENTER.y + DECAGON_RADIUS * Math.sin(angle),
    };
  });

  let index = 0;
  return vertices.flatMap((start, sideIndex) => {
    const end = vertices[(sideIndex + 1) % vertices.length];
    return Array.from({ length: DECAGON_STEPS_PER_SIDE }, (_, stepIndex) => {
      const t = (stepIndex + 0.5) / DECAGON_STEPS_PER_SIDE;
      const point = pointBetween(start as TrianglePoint, end as TrianglePoint, t);
      const step: PolygonPerimeterStep = {
        index,
        unit: index + 1,
        side: sideIndex,
        x: point.x,
        y: point.y,
      };
      index += 1;
      return step;
    });
  });
}

function buildCirclePerimeterSteps(): PolygonPerimeterStep[] {
  return Array.from({ length: CIRCLE_POINTS }, (_, i) => {
    const angle = (i * 2 * Math.PI) / CIRCLE_POINTS;
    return {
      index: i,
      unit: i + 1,
      side: 0,
      x: CIRCLE_CENTER.x + CIRCLE_RADIUS * Math.cos(angle),
      y: CIRCLE_CENTER.y + CIRCLE_RADIUS * Math.sin(angle),
    };
  });
}

const PENTAGON_PERIMETER_STEPS = buildPentagonPerimeterSteps();
const HEXAGON_PERIMETER_STEPS = buildHexagonPerimeterSteps();
const DECAGON_PERIMETER_STEPS = buildDecagonPerimeterSteps();
const CIRCLE_PERIMETER_STEPS = buildCirclePerimeterSteps();

/**
 * Set up a canvas for HiDPI/Retina screens.
 * Sets both the CSS display size (style) and the physical pixel buffer (width/height attrs).
 * Returns a context + logical dimensions object, or null if ctx unavailable.
 *
 * IMPORTANT: call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` is included so all
 * subsequent draw calls use CSS-pixel coordinates — no need to multiply by dpr.
 */
function setupHiDpiCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): { ctx: CanvasRenderingContext2D; width: number; height: number } | null {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  canvas.style.display = "block"; // prevent inline-element baseline gap
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

/** Translate a PointerEvent into canvas-local coordinates, clamped to the canvas bounds. */
function localPointFromEvent(
  canvas: HTMLCanvasElement,
  e: PointerEvent,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp(e.clientX - rect.left, 0, rect.width),
    y: clamp(e.clientY - rect.top, 0, rect.height),
  };
}

function localSvgPointFromEvent(
  svg: SVGSVGElement,
  e: ReactPointerEvent<SVGSVGElement>,
): { x: number; y: number } | null {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;

  const point = svg.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;

  const localPoint = point.matrixTransform(matrix.inverse());
  return { x: localPoint.x, y: localPoint.y };
}

function closestTraceStepIndex(
  svg: SVGSVGElement,
  e: ReactPointerEvent<SVGSVGElement>,
  steps: Array<{ index: number; x: number; y: number }>,
  maxDistance = TRACE_SNAP_RADIUS,
): number | null {
  const point = localSvgPointFromEvent(svg, e);
  if (!point) return null;

  let bestIndex: number | null = null;
  let bestDistanceSquared = maxDistance * maxDistance;

  for (const step of steps) {
    const dx = step.x - point.x;
    const dy = step.y - point.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared <= bestDistanceSquared) {
      bestIndex = step.index;
      bestDistanceSquared = distanceSquared;
    }
  }

  return bestIndex;
}

function releasePointerCaptureIfNeeded(
  svg: SVGSVGElement,
  pointerId: number,
): void {
  if (svg.hasPointerCapture?.(pointerId)) {
    svg.releasePointerCapture?.(pointerId);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DigitalDNAHub({
  lessonContext,
}: { lessonContext?: LessonContext }) {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [webglSupport] = useState(() => detectWebGLSupport());
  const initialMode: ModeKey = webglSupport.supported ? "spiral" : "journey";
  const [activeMode, setActiveMode] = useState<ModeKey>(initialMode);
  const [selectedSeed, setSelectedSeed] = useState<SeedKey>("red");
  const [sequenceSource, setSequenceSource] = useState<SequenceSource>("core");
  const [selectedPacketIndex, setSelectedPacketIndex] = useState(0);
  const [miniPathMode, setMiniPathMode] = useState<MiniPathMode>("story");
  const [miniPathStartIndex, setMiniPathStartIndex] = useState(0);
  const [miniPathLength, setMiniPathLength] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false); // display-only; logic uses ref
  const [harmony, setHarmony] = useState(7);
  const [tempo, setTempo] = useState(120);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [paintedPattern, setPaintedPattern] = useState<PaintPoint[]>([]);
  const [toolStartIndex, setToolStartIndex] = useState(0);
  const [toolWindowSize, setToolWindowSize] = useState(12);
  const [toolTransform, setToolTransform] = useState<ToolTransform>("raw");
  const [toolFocusBand, setToolFocusBand] = useState<"all" | "odd" | "even">(
    "all",
  );
  const [presetDraftName, setPresetDraftName] = useState("");
  const [savedToolPresets, setSavedToolPresets] = useState<
    SavedToolkitPreset[]
  >([]);
  const [toolkitHydrated, setToolkitHydrated] = useState(false);
  const [soundSource, setSoundSource] = useState<"toolkit" | "triangle" | "pentagon" | "hexagon" | "decagon" | "circle">(
    "toolkit",
  );
  // Triangle state
  const [triangleTrace, setTriangleTrace] = useState<number[]>([]);
  const [triangleHoveredStep, setTriangleHoveredStep] = useState<number | null>(
    null,
  );
  const [triangleActiveStep, setTriangleActiveStep] = useState<number | null>(
    null,
  );
  const [isTriangleTracing, setIsTriangleTracing] = useState(false);
  // Pentagon state
  const [pentagonTrace, setPentagonTrace] = useState<number[]>([]);
  const [pentagonHoveredStep, setPentagonHoveredStep] = useState<number | null>(
    null,
  );
  const [pentagonActiveStep, setPentagonActiveStep] = useState<number | null>(
    null,
  );
  const [isPentagonTracing, setIsPentagonTracing] = useState(false);
  // Hexagon state
  const [hexagonTrace, setHexagonTrace] = useState<number[]>([]);
  const [hexagonHoveredStep, setHexagonHoveredStep] = useState<number | null>(
    null,
  );
  const [hexagonActiveStep, setHexagonActiveStep] = useState<number | null>(
    null,
  );
  const [isHexagonTracing, setIsHexagonTracing] = useState(false);
  // Decagon state
  const [decagonTrace, setDecagonTrace] = useState<number[]>([]);
  const [decagonHoveredStep, setDecagonHoveredStep] = useState<number | null>(
    null,
  );
  const [decagonActiveStep, setDecagonActiveStep] = useState<number | null>(
    null,
  );
  const [isDecagonTracing, setIsDecagonTracing] = useState(false);
  // Circle state
  const [circleTrace, setCircleTrace] = useState<number[]>([]);
  const [circleHoveredStep, setCircleHoveredStep] = useState<number | null>(
    null,
  );
  const [circleActiveStep, setCircleActiveStep] = useState<number | null>(
    null,
  );
  const [isCircleTracing, setIsCircleTracing] = useState(false);
  const [noteBoardCapacity, setNoteBoardCapacity] = useState(
    DEFAULT_NOTE_BOARD_CAPACITY,
  );
  const [noteBoard, setNoteBoard] = useState<Array<number | null>>(() =>
    Array.from({ length: DEFAULT_NOTE_BOARD_CAPACITY }, () => null),
  );
  const [dragOverBoardIndex, setDragOverBoardIndex] = useState<number | null>(
    null,
  );

  // Lesson flow
  const [showPostPrompt, setShowPostPrompt] = useState(false);
  const [postResponse, setPostResponse] = useState("");
  const [preAcknowledged, setPreAcknowledged] = useState(
    !lessonContext?.prePrompt,
  );

  // Session tracking
  const [sessionInteractions, setSessionInteractions] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [visitedModes, setVisitedModes] = useState<ModeKey[]>([initialMode]);
  const [modeInteractions, setModeInteractions] = useState(() =>
    createEmptyQuestModeCounts(),
  );
  const [mandalaStrokeCount, setMandalaStrokeCount] = useState(0);
  const [mandalaHarmonyChangeCount, setMandalaHarmonyChangeCount] = useState(0);
  const [triangleMaxTraceSteps, setTriangleMaxTraceSteps] = useState(0);
  const [triangleVisitedSides, setTriangleVisitedSides] = useState<
    TriangleSide[]
  >([]);
  const [trianglePlaybackCount, setTrianglePlaybackCount] = useState(0);
  const [pentagonMaxTraceSteps, setPentagonMaxTraceSteps] = useState(0);
  const [pentagonPlaybackCount, setPentagonPlaybackCount] = useState(0);
  const [hexagonMaxTraceSteps, setHexagonMaxTraceSteps] = useState(0);
  const [hexagonPlaybackCount, setHexagonPlaybackCount] = useState(0);
  const [decagonMaxTraceSteps, setDecagonMaxTraceSteps] = useState(0);
  const [decagonPlaybackCount, setDecagonPlaybackCount] = useState(0);
  const [circleMaxTraceSteps, setCircleMaxTraceSteps] = useState(0);
  const [circlePlaybackCount, setCirclePlaybackCount] = useState(0);
  const [soundPlaybackCount, setSoundPlaybackCount] = useState(0);
  const [soundTempoChangeCount, setSoundTempoChangeCount] = useState(0);
  const [soundTransformChangeCount, setSoundTransformChangeCount] = useState(0);
  const [completionFeedback, setCompletionFeedback] = useState<string | null>(
    null,
  );

  // ── Store actions ─────────────────────────────────────────────────────────
  const incrementDnaInteraction = useEducationStore(
    (s) => s.incrementDnaInteraction,
  );
  const initProgress = useEducationStore((s) => s.initProgress);
  const recordPostResponse = useEducationStore((s) => s.recordPostResponse);
  const saveQuestSummary = useEducationStore((s) => s.saveQuestSummary);
  const completeLessonWithFlair = useEducationStore(
    (s) => s.completeLessonWithFlair,
  );
  const lessonProgress = useEducationStore((s) => s.lessonProgress);
  const queuedLessons = useEducationStore((s) => s.queue);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null); // Three.js spiral
  const surfaceCanvasRef = useRef<HTMLCanvasElement>(null); // mandala canvas
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const paintedPatternRef = useRef<PaintPoint[]>([]);
  const lessonInteractionRef = useRef(0);
  const sessionInteractionRef = useRef(0);
  const lastInteractionMsRef = useRef(0);
  const dragDigitRef = useRef<number | null>(null);
  const dragBoardIndexRef = useRef<number | null>(null);
  const triangleTraceRef = useRef<number[]>([]);
  const pentagonTraceRef = useRef<number[]>([]);
  const hexagonTraceRef = useRef<number[]>([]);
  const decagonTraceRef = useRef<number[]>([]);
  const circleTraceRef = useRef<number[]>([]);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const toolkitSectionRef = useRef<HTMLElement>(null);

  /**
   * FIX: audioInitialized is tracked in a ref (not only state) so that
   * ensureAudio's useCallback has zero dependencies and therefore a stable
   * reference across renders. Previously, listing `audioInitialized` in the
   * dependency array caused a new `ensureAudio` function object on every audio
   * start, which re-ran all four canvas effects and cleared their animation loops.
   */
  const audioInitializedRef = useRef(false);

  // ── Interaction utilities ─────────────────────────────────────────────────

  const pulseHaptic = useCallback((duration = 10) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  }, []);

  const trackLessonInteraction = useCallback(() => {
    if (!lessonContext) return;
    lessonInteractionRef.current += 1;
    if (lessonInteractionRef.current % 5 === 0) {
      incrementDnaInteraction(
        lessonContext.lessonId,
        lessonContext.studentAlias,
      );
    }
  }, [lessonContext, incrementDnaInteraction]);

  // Flush remaining lesson interactions on unmount
  useEffect(() => {
    return () => {
      if (lessonContext && lessonInteractionRef.current % 5 !== 0) {
        incrementDnaInteraction(
          lessonContext.lessonId,
          lessonContext.studentAlias,
        );
      }
    };
  }, [lessonContext, incrementDnaInteraction]);

  /** Throttled interaction counter — force=true bypasses the throttle. */
  const registerInteraction = useCallback(
    (force = false) => {
      const now = performance.now();
      if (
        !force &&
        now - lastInteractionMsRef.current < INTERACTION_THROTTLE_MS
      )
        return;
      lastInteractionMsRef.current = now;
      sessionInteractionRef.current += 1;
      setSessionInteractions(sessionInteractionRef.current);
      setModeInteractions((current) => ({
        ...current,
        [activeMode]: current[activeMode] + 1,
      }));
      trackLessonInteraction();
    },
    [activeMode, trackLessonInteraction],
  );

  const currentPacket = FULL_STRAND_PACKETS[selectedSeed];
  const activePacketChamber =
    currentPacket.chambers[
      clamp(selectedPacketIndex, 0, currentPacket.chambers.length - 1)
    ];
  const activeMiniPathString = buildMiniPathString(
    selectedSeed,
    miniPathMode,
    selectedPacketIndex,
    miniPathStartIndex,
    miniPathLength,
  );

  /** Returns the digit array for the currently selected strand source. */
  const getSequence = useCallback(
    () =>
      (sequenceSource === "packet" ? activeMiniPathString : SEEDS[selectedSeed])
        .split("")
        .map(Number),
    [activeMiniPathString, selectedSeed, sequenceSource],
  );

  // ── Audio ─────────────────────────────────────────────────────────────────

  /**
   * FIX: No dependencies → always the same function reference.
   * Uses audioInitializedRef to avoid listing `audioInitialized` as a dep,
   * which previously re-created the callback and invalidated all canvas effects.
   */
  const ensureAudio = useCallback(async () => {
    if (Tone.context.state !== "running") await Tone.start();
    if (!audioInitializedRef.current) {
      audioInitializedRef.current = true;
      setAudioReady(true);
    }
  }, []);

  const playChord = useCallback((digits: number[]) => {
    if (!synthRef.current) return;
    synthRef.current.triggerAttackRelease(digits.map(digitToNote), "8n");
  }, []);

  const playDigit = useCallback(
    async (digit: number) => {
      await ensureAudio();
      playChord([digit]);
      if (activeMode === "sound") {
        setSoundPlaybackCount((count) => count + 1);
      }
      registerInteraction();
    },
    [activeMode, ensureAudio, playChord, registerInteraction],
  );

  // Initialise PolySynth + Reverb once on mount
  useEffect(() => {
    if (typeof window === "undefined" || synthRef.current) return;
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.08, decay: 0.2, sustain: 0.3, release: 0.8 },
    }).toDestination();
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).toDestination();
    synth.connect(reverb);
    synthRef.current = synth;
  }, []);

  // Track visited modes for quest progress
  useEffect(() => {
    setVisitedModes((prev) =>
      prev.includes(activeMode) ? prev : [...prev, activeMode],
    );
  }, [activeMode]);

  useEffect(() => {
    if (activeMode !== "spiral" || webglSupport.supported) {
      return;
    }

    setActiveMode(webglSupport.fallbackMode);
  }, [activeMode, webglSupport]);

  useEffect(() => {
    setNoteBoard((current) => {
      const resized = current.slice(0, noteBoardCapacity);
      while (resized.length < noteBoardCapacity) {
        resized.push(null);
      }
      return resized;
    });
  }, [noteBoardCapacity]);

  const lessonProgressEntry = useMemo(() => {
    if (!lessonContext) return null;

    return (
      lessonProgress.find(
        (progress) =>
          progress.lessonId === lessonContext.lessonId &&
          progress.studentAlias === lessonContext.studentAlias,
      ) ?? null
    );
  }, [lessonContext, lessonProgress]);

  useEffect(() => {
    if (!lessonContext) return;
    initProgress(lessonContext.lessonId, lessonContext.studentAlias);
  }, [initProgress, lessonContext]);

  useEffect(() => {
    if (!lessonContext) return;
    setPostResponse(lessonProgressEntry?.postResponse ?? "");
  }, [lessonContext, lessonProgressEntry?.postResponse]);

  const updateHarmony = useCallback(
    (nextValue: number) => {
      if (nextValue === harmony) return;

      if (activeMode === "mandala") {
        setMandalaHarmonyChangeCount((count) => count + 1);
      }

      setHarmony(nextValue);
      registerInteraction(true);
    },
    [activeMode, harmony, registerInteraction],
  );

  const updateTempo = useCallback(
    (nextValue: number) => {
      if (nextValue === tempo) return;

      if (activeMode === "sound") {
        setSoundTempoChangeCount((count) => count + 1);
      }

      setTempo(nextValue);
      registerInteraction(true);
    },
    [activeMode, registerInteraction, tempo],
  );

  const updateToolTransform = useCallback(
    (nextValue: ToolTransform) => {
      if (nextValue === toolTransform) return;

      if (activeMode === "sound") {
        setSoundTransformChangeCount((count) => count + 1);
      }

      setToolTransform(nextValue);
      registerInteraction(true);
    },
    [activeMode, registerInteraction, toolTransform],
  );

  /** Play the full 60-digit DNA sequence as a melody. */
  const playSequence = useCallback(async () => {
    await ensureAudio();
    setIsPlaying(true);
    setPlayCount((c) => c + 1);

    if (activeMode === "sound") {
      setSoundPlaybackCount((count) => count + 1);
    }

    const sequence = getSequence();
    const now = Tone.now();
    const interval = 60 / tempo;

    sequence.slice(0, 60).forEach((digit, i) => {
      synthRef.current?.triggerAttackRelease(
        digitToNote(digit),
        interval * 0.8,
        now + i * interval,
      );
    });

      setTimeout(
        () => setIsPlaying(false),
        sequence.slice(0, 60).length * interval * 1000,
      );
      registerInteraction(true);
  }, [activeMode, ensureAudio, getSequence, tempo, registerInteraction]);

  const playCustomSequence = useCallback(
    async (digits: number[]) => {
      if (!digits.length) return;

      await ensureAudio();
      setIsPlaying(true);
      setPlayCount((c) => c + 1);

      if (activeMode === "sound") {
        setSoundPlaybackCount((count) => count + 1);
      }

      if (activeMode === "triangle") {
        setTrianglePlaybackCount((count) => count + 1);
      }

      if (activeMode === "pentagon") {
        setPentagonPlaybackCount((count) => count + 1);
      }

      if (activeMode === "hexagon") {
        setHexagonPlaybackCount((count) => count + 1);
      }

      if (activeMode === "decagon") {
        setDecagonPlaybackCount((count) => count + 1);
      }

      if (activeMode === "circle") {
        setCirclePlaybackCount((count) => count + 1);
      }

      const now = Tone.now();
      const interval = 60 / tempo;
      const release = Math.max(interval * 0.45, 0.12);

      digits.forEach((digit, index) => {
        synthRef.current?.triggerAttackRelease(
          digitToNote(digit),
          release,
          now + index * interval * 0.6,
        );
      });

      setTimeout(
        () => setIsPlaying(false),
        Math.max(220, digits.length * interval * 650),
      );
      registerInteraction(true);
    },
    [activeMode, ensureAudio, tempo, registerInteraction],
  );

  const clearNoteBoard = useCallback(() => {
    setNoteBoard(Array.from({ length: noteBoardCapacity }, () => null));
    setDragOverBoardIndex(null);
    registerInteraction(true);
  }, [noteBoardCapacity, registerInteraction]);

  const loadNoteBoard = useCallback(
    (digits: number[]) => {
      setNoteBoard(
        Array.from(
          { length: noteBoardCapacity },
          (_, index) => digits[index] ?? null,
        ),
      );
      setDragOverBoardIndex(null);
      registerInteraction(true);
    },
    [noteBoardCapacity, registerInteraction],
  );

  const playNoteBoard = useCallback(() => {
    const digits = noteBoard.filter((digit): digit is number => digit !== null);
    if (!digits.length) return;
    void playCustomSequence(digits);
  }, [noteBoard, playCustomSequence]);

  const clearBoardSlot = useCallback(
    (index: number) => {
      setNoteBoard((current) => {
        if (index < 0 || index >= current.length) return current;
        const next = [...current];
        next[index] = null;
        return next;
      });
      registerInteraction(true);
    },
    [registerInteraction],
  );

  const handleBoardDrop = useCallback(
    (targetIndex: number) => {
      setNoteBoard((current) => {
        if (targetIndex < 0 || targetIndex >= current.length) return current;

        const next = [...current];
        const sourceIndex = dragBoardIndexRef.current;

        if (
          sourceIndex !== null &&
          sourceIndex >= 0 &&
          sourceIndex < next.length
        ) {
          const sourceDigit = next[sourceIndex];
          const targetDigit = next[targetIndex];
          next[targetIndex] = sourceDigit;
          next[sourceIndex] = targetDigit;
          return next;
        }

        if (dragDigitRef.current !== null) {
          next[targetIndex] = dragDigitRef.current;
        }

        return next;
      });

      dragDigitRef.current = null;
      dragBoardIndexRef.current = null;
      setDragOverBoardIndex(null);
      registerInteraction(true);
    },
    [registerInteraction],
  );

  // ── Keep paint ref in sync with state ────────────────────────────────────
  useEffect(() => {
    paintedPatternRef.current = paintedPattern;
  }, [paintedPattern]);

  const clearPaintedPattern = useCallback(() => {
    paintedPatternRef.current = [];
    setPaintedPattern([]);
    registerInteraction(true);
  }, [registerInteraction]);

  const sequence = useMemo(() => getSequence(), [getSequence]);
  const currentToolkitSettings = useMemo<ToolkitSettingsSnapshot>(
    () => ({
      selectedSeed,
      activeMode,
      sequenceSource,
      selectedPacketIndex,
      miniPathMode,
      miniPathStartIndex,
      miniPathLength,
      harmony,
      tempo,
      toolStartIndex,
      toolWindowSize,
      toolTransform,
      toolFocusBand,
    }),
    [
      selectedSeed,
      activeMode,
      sequenceSource,
      selectedPacketIndex,
      miniPathMode,
      miniPathStartIndex,
      miniPathLength,
      harmony,
      tempo,
      toolStartIndex,
      toolWindowSize,
      toolTransform,
      toolFocusBand,
    ],
  );

  const applyToolkitSettings = useCallback(
    (settings: ToolkitSettingsSnapshot) => {
      setSelectedSeed(settings.selectedSeed);
      setActiveMode(
        (settings.activeMode as string) === "particles"
          ? "triangle"
          : settings.activeMode,
      );
      setSequenceSource(settings.sequenceSource ?? "core");
      setSelectedPacketIndex(Math.max(0, settings.selectedPacketIndex ?? 0));
      setMiniPathMode(settings.miniPathMode ?? "story");
      setMiniPathStartIndex(Math.max(0, settings.miniPathStartIndex ?? 0));
      setMiniPathLength(clamp(settings.miniPathLength ?? 5, 1, 60));
      setHarmony(clamp(settings.harmony, 3, 12));
      setTempo(clamp(settings.tempo, 60, 180));
      setToolStartIndex(Math.max(0, settings.toolStartIndex));
      setToolWindowSize(clamp(settings.toolWindowSize, 6, 20));
      setToolTransform(settings.toolTransform);
      setToolFocusBand(settings.toolFocusBand);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(TOOLKIT_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        settings?: ToolkitSettingsSnapshot;
        presets?: SavedToolkitPreset[];
      };

      if (parsed.settings) applyToolkitSettings(parsed.settings);
      if (Array.isArray(parsed.presets)) {
        setSavedToolPresets(parsed.presets.slice(0, MAX_SAVED_TOOL_PRESETS));
      }
    } catch {
      // Ignore malformed local data and keep defaults.
    } finally {
      setToolkitHydrated(true);
    }
  }, [applyToolkitSettings]);

  useEffect(() => {
    if (typeof window === "undefined" || !toolkitHydrated) return;

    window.localStorage.setItem(
      TOOLKIT_STORAGE_KEY,
      JSON.stringify({
        settings: currentToolkitSettings,
        presets: savedToolPresets,
      }),
    );
  }, [currentToolkitSettings, savedToolPresets, toolkitHydrated]);

  const filteredSequence = useMemo(() => {
    if (toolFocusBand === "odd")
      return sequence.filter((_, index) => index % 2 === 1);
    if (toolFocusBand === "even")
      return sequence.filter((_, index) => index % 2 === 0);
    return sequence;
  }, [sequence, toolFocusBand]);
  const effectiveWindowSize = Math.min(
    toolWindowSize,
    Math.max(filteredSequence.length, 1),
  );
  const maxToolStartIndex = Math.max(
    0,
    filteredSequence.length - effectiveWindowSize,
  );

  useEffect(() => {
    setToolStartIndex((current) => clamp(current, 0, maxToolStartIndex));
  }, [maxToolStartIndex]);

  const explorationWindow = useMemo(
    () =>
      filteredSequence.slice(
        toolStartIndex,
        toolStartIndex + effectiveWindowSize,
      ),
    [filteredSequence, toolStartIndex, effectiveWindowSize],
  );
  const transformedWindow = useMemo(
    () => transformToolSequence(explorationWindow, toolTransform, harmony),
    [explorationWindow, toolTransform, harmony],
  );
  const frequencyMap = useMemo(
    () =>
      Array.from({ length: 10 }, (_, digit) => ({
        digit,
        count: explorationWindow.filter((value) => value === digit).length,
      })),
    [explorationWindow],
  );
  const dominantDigit = useMemo(() => {
    return frequencyMap.reduce(
      (best, entry) => (entry.count > best.count ? entry : best),
      frequencyMap[0],
    );
  }, [frequencyMap]);
  const revealModel = useMemo(() => buildDigitalDNARevealModel(), []);
  const currentSeedMeta = MOSS_STRAND_META[selectedSeed];
  const miniPathMaxLength = SEEDS[selectedSeed].length;
  const trianglePerimeterDigits = useMemo(
    () => getWrappedDigits(sequence, 0, 60),
    [sequence],
  );
  const triangleSteps = useMemo(
    () =>
      TRIANGLE_PERIMETER_STEPS.map((step, index) => ({
        ...step,
        digit: trianglePerimeterDigits[index] ?? 0,
        note: digitToNote(trianglePerimeterDigits[index] ?? 0),
        color: digitToLearningColor(trianglePerimeterDigits[index] ?? 0),
      })),
    [trianglePerimeterDigits],
  );
  const triangleTraceDigits = useMemo(
    () =>
      triangleTrace
        .map((stepIndex) => triangleSteps[stepIndex]?.digit)
        .filter((digit): digit is number => typeof digit === "number"),
    [triangleSteps, triangleTrace],
  );
  const triangleTraceStepSet = useMemo(
    () => new Set(triangleTrace),
    [triangleTrace],
  );
  const triangleTracePolyline = useMemo(
    () =>
      triangleTrace
        .map((stepIndex) => triangleSteps[stepIndex])
        .filter(Boolean)
        .map((step) => `${step.x},${step.y}`)
        .join(" "),
    [triangleSteps, triangleTrace],
  );

  // Pentagon computed memos
  const pentagonSteps = useMemo(
    () =>
      PENTAGON_PERIMETER_STEPS.map((step, index) => ({
        ...step,
        digit: trianglePerimeterDigits[index] ?? 0,
        note: digitToNote(trianglePerimeterDigits[index] ?? 0),
        color: digitToLearningColor(trianglePerimeterDigits[index] ?? 0),
      })),
    [trianglePerimeterDigits],
  );
  const pentagonTraceDigits = useMemo(
    () =>
      pentagonTrace
        .map((stepIndex) => pentagonSteps[stepIndex]?.digit)
        .filter((digit): digit is number => typeof digit === "number"),
    [pentagonSteps, pentagonTrace],
  );
  const pentagonTraceStepSet = useMemo(
    () => new Set(pentagonTrace),
    [pentagonTrace],
  );
  const pentagonTracePolyline = useMemo(
    () =>
      pentagonTrace
        .map((stepIndex) => pentagonSteps[stepIndex])
        .filter(Boolean)
        .map((step) => `${step.x},${step.y}`)
        .join(" "),
    [pentagonSteps, pentagonTrace],
  );

  // Hexagon computed memos
  const hexagonSteps = useMemo(
    () =>
      HEXAGON_PERIMETER_STEPS.map((step, index) => ({
        ...step,
        digit: trianglePerimeterDigits[index] ?? 0,
        note: digitToNote(trianglePerimeterDigits[index] ?? 0),
        color: digitToLearningColor(trianglePerimeterDigits[index] ?? 0),
      })),
    [trianglePerimeterDigits],
  );
  const hexagonTraceDigits = useMemo(
    () =>
      hexagonTrace
        .map((stepIndex) => hexagonSteps[stepIndex]?.digit)
        .filter((digit): digit is number => typeof digit === "number"),
    [hexagonSteps, hexagonTrace],
  );
  const hexagonTraceStepSet = useMemo(
    () => new Set(hexagonTrace),
    [hexagonTrace],
  );
  const hexagonTracePolyline = useMemo(
    () =>
      hexagonTrace
        .map((stepIndex) => hexagonSteps[stepIndex])
        .filter(Boolean)
        .map((step) => `${step.x},${step.y}`)
        .join(" "),
    [hexagonSteps, hexagonTrace],
  );

  // Decagon computed memos
  const decagonSteps = useMemo(
    () =>
      DECAGON_PERIMETER_STEPS.map((step, index) => ({
        ...step,
        digit: trianglePerimeterDigits[index] ?? 0,
        note: digitToNote(trianglePerimeterDigits[index] ?? 0),
        color: digitToLearningColor(trianglePerimeterDigits[index] ?? 0),
      })),
    [trianglePerimeterDigits],
  );
  const decagonTraceDigits = useMemo(
    () =>
      decagonTrace
        .map((stepIndex) => decagonSteps[stepIndex]?.digit)
        .filter((digit): digit is number => typeof digit === "number"),
    [decagonSteps, decagonTrace],
  );
  const decagonTraceStepSet = useMemo(
    () => new Set(decagonTrace),
    [decagonTrace],
  );
  const decagonTracePolyline = useMemo(
    () =>
      decagonTrace
        .map((stepIndex) => decagonSteps[stepIndex])
        .filter(Boolean)
        .map((step) => `${step.x},${step.y}`)
        .join(" "),
    [decagonSteps, decagonTrace],
  );

  // Circle computed memos
  const circleSteps = useMemo(
    () =>
      CIRCLE_PERIMETER_STEPS.map((step, index) => ({
        ...step,
        digit: trianglePerimeterDigits[index] ?? 0,
        note: digitToNote(trianglePerimeterDigits[index] ?? 0),
        color: digitToLearningColor(trianglePerimeterDigits[index] ?? 0),
      })),
    [trianglePerimeterDigits],
  );
  const circleTraceDigits = useMemo(
    () =>
      circleTrace
        .map((stepIndex) => circleSteps[stepIndex]?.digit)
        .filter((digit): digit is number => typeof digit === "number"),
    [circleSteps, circleTrace],
  );
  const circleTraceStepSet = useMemo(
    () => new Set(circleTrace),
    [circleTrace],
  );
  const circleTracePolyline = useMemo(
    () =>
      circleTrace
        .map((stepIndex) => circleSteps[stepIndex])
        .filter(Boolean)
        .map((step) => `${step.x},${step.y}`)
        .join(" "),
    [circleSteps, circleTrace],
  );

  const toolkitSoundSequence = transformedWindow.length
    ? transformedWindow
    : sequence.slice(0, 60);
  const soundLabSequence =
    soundSource === "triangle" && triangleTraceDigits.length
      ? triangleTraceDigits
      : soundSource === "pentagon" && pentagonTraceDigits.length
        ? pentagonTraceDigits
        : soundSource === "hexagon" && hexagonTraceDigits.length
          ? hexagonTraceDigits
          : soundSource === "decagon" && decagonTraceDigits.length
            ? decagonTraceDigits
            : soundSource === "circle" && circleTraceDigits.length
              ? circleTraceDigits
              : toolkitSoundSequence;
  const soundSourceLabel =
    soundSource === "triangle" ? "Triangle Trace"
    : soundSource === "pentagon" ? "Pentagon Trace"
    : soundSource === "hexagon" ? "Hexagon Trace"
    : soundSource === "decagon" ? "Decagon Trace"
    : soundSource === "circle" ? "Circle Trace"
    : "Toolkit Phrase";
  const recommendedModeId = webglSupport.supported ? "spiral" : "journey";
  const noteBoardDigits = useMemo(
    () => noteBoard.filter((digit): digit is number => digit !== null),
    [noteBoard],
  );
  const boardPaletteDigits = useMemo(
    () => soundLabSequence.slice(0, 24),
    [soundLabSequence],
  );
  const activeSourceSummary =
    sequenceSource === "packet"
      ? miniPathMode === "build"
        ? `Build your own mini path · start ${miniPathStartIndex + 1} · ${activeMiniPathString.length} digits · ${activeMiniPathString}`
        : `${activePacketChamber.positionLabel} o'clock · ${activePacketChamber.name} · ${activeMiniPathString}`
      : `${sequence.length} digit core strand`;
  const activeLessonEntry = useMemo(() => {
    if (!lessonContext) return null;

    return (
      queuedLessons.find((lesson) => lesson.id === lessonContext.lessonId) ??
      null
    );
  }, [lessonContext, queuedLessons]);
  const selectedQuestPack = useMemo(() => {
    if (activeLessonEntry) {
      return selectQuestPack({
        focusArea: activeLessonEntry.focusArea,
        dnaMode: activeLessonEntry.dnaMode,
      });
    }

    if (activeMode === "mandala") return getQuestPackById("symmetry-studio");
    if (activeMode === "triangle") return getQuestPackById("triangle-trace");
    if (activeMode === "pentagon") return getQuestPackById("pentagon-trace");
    if (activeMode === "hexagon") return getQuestPackById("hexagon-trace");
    if (activeMode === "decagon") return getQuestPackById("decagon-trace");
    if (activeMode === "circle") return getQuestPackById("circle-trace");
    if (activeMode === "sound") return getQuestPackById("sound-path");

    return getQuestPackById("pattern-basics");
  }, [activeLessonEntry, activeMode]);
  const persistedCompletedQuestIds = useMemo(
    () =>
      lessonProgressEntry?.questSummary?.packId === selectedQuestPack.id
        ? lessonProgressEntry.questSummary.completedQuestIds
        : [],
    [lessonProgressEntry?.questSummary, selectedQuestPack.id],
  );
  const questProgress = useMemo(
    () =>
      evaluateQuestPack(
        selectedQuestPack,
        {
          activeMode,
          visitedModes,
          sessionInteractions,
          playCount,
          modeInteractions,
          mandalaStrokeCount,
          mandalaHarmonyChangeCount,
          triangleTraceSteps: triangleMaxTraceSteps,
          triangleVisitedSides: triangleVisitedSides.length,
          trianglePlaybackCount,
          soundPlaybackCount,
          soundTempoChangeCount,
          soundTransformChangeCount,
          reflectionSubmitted: Boolean(lessonProgressEntry?.postResponse?.trim()),
        },
        persistedCompletedQuestIds,
      ),
    [
      activeMode,
      lessonProgressEntry?.postResponse,
      mandalaHarmonyChangeCount,
      mandalaStrokeCount,
      modeInteractions,
      persistedCompletedQuestIds,
      playCount,
      selectedQuestPack,
      sessionInteractions,
      soundPlaybackCount,
      soundTempoChangeCount,
      soundTransformChangeCount,
      triangleMaxTraceSteps,
      trianglePlaybackCount,
      triangleVisitedSides.length,
      visitedModes,
    ],
  );
  const currentQuestSummary = useMemo(
    () => buildLessonQuestSummary(questProgress),
    [questProgress],
  );
  const lessonCompletionRequirements = useMemo(() => {
    if (!activeLessonEntry) {
      return { ready: true, missingRequirements: [] };
    }

    return getLessonCompletionRequirements(activeLessonEntry, {
      ...(lessonProgressEntry ?? {
        lessonId: activeLessonEntry.id,
        studentAlias: lessonContext?.studentAlias ?? "",
        status: "active",
        startedAt: null,
        completedAt: null,
        timeSpentMs: 0,
        preResponse: null,
        postResponse: null,
        dnaInteractions: 0,
        patternHash: null,
        questSummary: null,
      }),
      questSummary: currentQuestSummary,
    });
  }, [
    activeLessonEntry,
    currentQuestSummary,
    lessonContext?.studentAlias,
    lessonProgressEntry,
  ]);
  const isLessonCompleted = lessonProgressEntry?.status === "completed";

  useEffect(() => {
    if (!lessonContext || isLessonCompleted) return;
    saveQuestSummary(
      lessonContext.lessonId,
      lessonContext.studentAlias,
      currentQuestSummary,
    );
  }, [
    currentQuestSummary,
    isLessonCompleted,
    lessonContext,
    saveQuestSummary,
  ]);

  useEffect(() => {
    saveDnaImprint({
      selectedSeed,
      resonanceClass: revealModel.resonanceClass,
      liveMutationSeed: revealModel.liveMutationSeed,
      dominantLattice: revealModel.dominantLattice,
      completedMode: activeMode,
      updatedAt: Date.now(),
    });
    markJourneyRouteCompleted("dna");
  }, [
    activeMode,
    revealModel.dominantLattice,
    revealModel.liveMutationSeed,
    revealModel.resonanceClass,
    selectedSeed,
  ]);

  const completeLesson = useCallback(
    (nextResponse?: string) => {
      if (!lessonContext) return;

      const trimmedResponse = nextResponse?.trim();
      const hasSavedReflection = Boolean(lessonProgressEntry?.postResponse?.trim());

      setCompletionFeedback(null);

      if (!questProgress.readyToComplete) {
        setCompletionFeedback(
          lessonCompletionRequirements.missingRequirements[0] ??
            "Complete 2 core quests on the Pattern Quest Board.",
        );
        return;
      }

      if (lessonContext.postPrompt && !trimmedResponse && !hasSavedReflection) {
        setShowPostPrompt(true);
        return;
      }

      if (trimmedResponse) {
        recordPostResponse(
          lessonContext.lessonId,
          lessonContext.studentAlias,
          trimmedResponse,
        );
      }

      saveQuestSummary(
        lessonContext.lessonId,
        lessonContext.studentAlias,
        currentQuestSummary,
      );

      const result = completeLessonWithFlair(
        lessonContext.lessonId,
        lessonContext.studentAlias,
      );

      if (!result.completed) {
        setCompletionFeedback(
          result.missingRequirements.join(" ") ||
            "Finish the required quest work before completing the lesson.",
        );
        if (
          lessonContext.postPrompt &&
          result.missingRequirements.includes("Submit the lesson reflection.")
        ) {
          setShowPostPrompt(true);
        }
        return;
      }

      setShowPostPrompt(false);
      setCompletionFeedback("Lesson complete. Quest evidence saved.");
    },
    [
      completeLessonWithFlair,
      currentQuestSummary,
      lessonCompletionRequirements.missingRequirements,
      lessonContext,
      lessonProgressEntry?.postResponse,
      questProgress.readyToComplete,
      recordPostResponse,
      saveQuestSummary,
    ],
  );

  const strandRoster = useMemo(() => {
    return (Object.entries(SEEDS) as [SeedKey, string][]).map(
      ([key, strand]) => {
        const digits = strand.split("").map(Number);
        const counts = countDigits(digits);
        const dominant = counts.reduce((bestDigit, count, digit, allCounts) => {
          return count > allCounts[bestDigit] ? digit : bestDigit;
        }, 0);

        return {
          key,
          ...MOSS_STRAND_META[key],
          digits,
          counts,
          dominantDigit: dominant,
          dominantCount: counts[dominant],
          dominantNote: digitToNote(dominant),
          sample: digits.slice(0, 8).join(" "),
        };
      },
    );
  }, []);

  const ownershipChart = useMemo(() => {
    return Array.from({ length: 10 }, (_, digit) => {
      const owners = strandRoster.map((strand) => ({
        label: strand.shortLabel,
        count: strand.counts[digit],
        accent: strand.accent,
      }));
      const topCount = Math.max(...owners.map((owner) => owner.count));
      const leaders = owners.filter(
        (owner) => owner.count === topCount && owner.count > 0,
      );

      return {
        digit,
        note: digitToNote(digit),
        color: digitToLearningColor(digit),
        shape: MOSS_DIGIT_SHAPES[digit],
        leaders,
        topCount,
      };
    });
  }, [strandRoster]);

  const applyExplorationPreset = useCallback(
    (preset: "calm" | "spark" | "storm") => {
      if (preset === "calm") {
        setActiveMode("spiral");
        setHarmony(5);
        setTempo(84);
        setToolTransform("raw");
      } else if (preset === "spark") {
        setActiveMode("mandala");
        setHarmony(7);
        setTempo(120);
        setToolTransform("reverse");
      } else {
        setActiveMode("triangle");
        setHarmony(12);
        setTempo(148);
        setToolTransform("orbit");
      }

      registerInteraction(true);
    },
    [registerInteraction],
  );

  const saveToolkitPreset = useCallback(() => {
    const trimmed = presetDraftName.trim();
    if (!trimmed) return;

    const nextPreset: SavedToolkitPreset = {
      id: `${Date.now()}`,
      name: trimmed,
      ...currentToolkitSettings,
    };

    setSavedToolPresets((current) =>
      [nextPreset, ...current].slice(0, MAX_SAVED_TOOL_PRESETS),
    );
    setPresetDraftName("");
    registerInteraction(true);
  }, [presetDraftName, currentToolkitSettings, registerInteraction]);

  const loadToolkitPreset = useCallback(
    (preset: SavedToolkitPreset) => {
      applyToolkitSettings(preset);
      registerInteraction(true);
    },
    [applyToolkitSettings, registerInteraction],
  );

  const deleteToolkitPreset = useCallback(
    (presetId: string) => {
      setSavedToolPresets((current) =>
        current.filter((preset) => preset.id !== presetId),
      );
      registerInteraction(true);
    },
    [registerInteraction],
  );

  useEffect(() => {
    triangleTraceRef.current = triangleTrace;
  }, [triangleTrace]);

  useEffect(() => {
    pentagonTraceRef.current = pentagonTrace;
  }, [pentagonTrace]);

  useEffect(() => {
    hexagonTraceRef.current = hexagonTrace;
  }, [hexagonTrace]);

  useEffect(() => {
    decagonTraceRef.current = decagonTrace;
  }, [decagonTrace]);

  useEffect(() => {
    circleTraceRef.current = circleTrace;
  }, [circleTrace]);

  useEffect(() => {
    if (!isTriangleTracing && !isPentagonTracing && !isHexagonTracing && !isDecagonTracing && !isCircleTracing) return;

    const stopTrace = () => {
      setIsTriangleTracing(false);
      setIsPentagonTracing(false);
      setIsHexagonTracing(false);
      setIsDecagonTracing(false);
      setIsCircleTracing(false);
    };

    window.addEventListener("pointerup", stopTrace);
    window.addEventListener("pointercancel", stopTrace);
    return () => {
      window.removeEventListener("pointerup", stopTrace);
      window.removeEventListener("pointercancel", stopTrace);
    };
  }, [isTriangleTracing, isPentagonTracing, isHexagonTracing, isDecagonTracing, isCircleTracing]);

  const startTriangleTrace = useCallback(
    (stepIndex: number) => {
      const step = triangleSteps[stepIndex];
      if (!step) return;

      triangleTraceRef.current = [stepIndex];
      setTriangleTrace([stepIndex]);
      setTriangleMaxTraceSteps((count) => Math.max(count, 1));
      setTriangleVisitedSides((current) =>
        current.includes(step.side) ? current : [...current, step.side],
      );
      setTriangleHoveredStep(stepIndex);
      setTriangleActiveStep(stepIndex);
      setIsTriangleTracing(true);
      pulseHaptic(8);
      registerInteraction(true);
      void playDigit(step.digit);
    },
    [playDigit, pulseHaptic, registerInteraction, triangleSteps],
  );

  const extendTriangleTrace = useCallback(
    (stepIndex: number) => {
      if (!isTriangleTracing) return;
      const step = triangleSteps[stepIndex];
      const lastStep =
        triangleTraceRef.current[triangleTraceRef.current.length - 1];
      if (!step || lastStep === stepIndex) return;

      const nextTrace = [...triangleTraceRef.current, stepIndex];
      triangleTraceRef.current = nextTrace;
      setTriangleTrace(nextTrace);
      setTriangleMaxTraceSteps((count) => Math.max(count, nextTrace.length));
      setTriangleVisitedSides((current) =>
        current.includes(step.side) ? current : [...current, step.side],
      );
      setTriangleHoveredStep(stepIndex);
      setTriangleActiveStep(stepIndex);
      registerInteraction();
      void playDigit(step.digit);
    },
    [isTriangleTracing, playDigit, registerInteraction, triangleSteps],
  );

  const clearTriangleTrace = useCallback(() => {
    triangleTraceRef.current = [];
    setTriangleTrace([]);
    setTriangleHoveredStep(null);
    setTriangleActiveStep(null);
    setIsTriangleTracing(false);
    registerInteraction(true);
  }, [registerInteraction]);

  // Pentagon handlers
  const startPentagonTrace = useCallback(
    (stepIndex: number) => {
      const step = pentagonSteps[stepIndex];
      if (!step) return;

      pentagonTraceRef.current = [stepIndex];
      setPentagonTrace([stepIndex]);
      setPentagonMaxTraceSteps((count) => Math.max(count, 1));
      setPentagonHoveredStep(stepIndex);
      setPentagonActiveStep(stepIndex);
      setIsPentagonTracing(true);
      pulseHaptic(8);
      registerInteraction(true);
      void playDigit(step.digit);
    },
    [playDigit, pulseHaptic, registerInteraction, pentagonSteps],
  );

  const extendPentagonTrace = useCallback(
    (stepIndex: number) => {
      if (!isPentagonTracing) return;
      const step = pentagonSteps[stepIndex];
      const lastStep =
        pentagonTraceRef.current[pentagonTraceRef.current.length - 1];
      if (!step || lastStep === stepIndex) return;

      const nextTrace = [...pentagonTraceRef.current, stepIndex];
      pentagonTraceRef.current = nextTrace;
      setPentagonTrace(nextTrace);
      setPentagonMaxTraceSteps((count) => Math.max(count, nextTrace.length));
      setPentagonHoveredStep(stepIndex);
      setPentagonActiveStep(stepIndex);
      registerInteraction();
      void playDigit(step.digit);
    },
    [isPentagonTracing, playDigit, registerInteraction, pentagonSteps],
  );

  const clearPentagonTrace = useCallback(() => {
    pentagonTraceRef.current = [];
    setPentagonTrace([]);
    setPentagonHoveredStep(null);
    setPentagonActiveStep(null);
    setIsPentagonTracing(false);
    registerInteraction(true);
  }, [registerInteraction]);

  // Hexagon handlers
  const startHexagonTrace = useCallback(
    (stepIndex: number) => {
      const step = hexagonSteps[stepIndex];
      if (!step) return;

      hexagonTraceRef.current = [stepIndex];
      setHexagonTrace([stepIndex]);
      setHexagonMaxTraceSteps((count) => Math.max(count, 1));
      setHexagonHoveredStep(stepIndex);
      setHexagonActiveStep(stepIndex);
      setIsHexagonTracing(true);
      pulseHaptic(8);
      registerInteraction(true);
      void playDigit(step.digit);
    },
    [playDigit, pulseHaptic, registerInteraction, hexagonSteps],
  );

  const extendHexagonTrace = useCallback(
    (stepIndex: number) => {
      if (!isHexagonTracing) return;
      const step = hexagonSteps[stepIndex];
      const lastStep =
        hexagonTraceRef.current[hexagonTraceRef.current.length - 1];
      if (!step || lastStep === stepIndex) return;

      const nextTrace = [...hexagonTraceRef.current, stepIndex];
      hexagonTraceRef.current = nextTrace;
      setHexagonTrace(nextTrace);
      setHexagonMaxTraceSteps((count) => Math.max(count, nextTrace.length));
      setHexagonHoveredStep(stepIndex);
      setHexagonActiveStep(stepIndex);
      registerInteraction();
      void playDigit(step.digit);
    },
    [isHexagonTracing, playDigit, registerInteraction, hexagonSteps],
  );

  const clearHexagonTrace = useCallback(() => {
    hexagonTraceRef.current = [];
    setHexagonTrace([]);
    setHexagonHoveredStep(null);
    setHexagonActiveStep(null);
    setIsHexagonTracing(false);
    registerInteraction(true);
  }, [registerInteraction]);

  // Decagon handlers
  const startDecagonTrace = useCallback(
    (stepIndex: number) => {
      const step = decagonSteps[stepIndex];
      if (!step) return;

      decagonTraceRef.current = [stepIndex];
      setDecagonTrace([stepIndex]);
      setDecagonMaxTraceSteps((count) => Math.max(count, 1));
      setDecagonHoveredStep(stepIndex);
      setDecagonActiveStep(stepIndex);
      setIsDecagonTracing(true);
      pulseHaptic(8);
      registerInteraction(true);
      void playDigit(step.digit);
    },
    [playDigit, pulseHaptic, registerInteraction, decagonSteps],
  );

  const extendDecagonTrace = useCallback(
    (stepIndex: number) => {
      if (!isDecagonTracing) return;
      const step = decagonSteps[stepIndex];
      const lastStep =
        decagonTraceRef.current[decagonTraceRef.current.length - 1];
      if (!step || lastStep === stepIndex) return;

      const nextTrace = [...decagonTraceRef.current, stepIndex];
      decagonTraceRef.current = nextTrace;
      setDecagonTrace(nextTrace);
      setDecagonMaxTraceSteps((count) => Math.max(count, nextTrace.length));
      setDecagonHoveredStep(stepIndex);
      setDecagonActiveStep(stepIndex);
      registerInteraction();
      void playDigit(step.digit);
    },
    [isDecagonTracing, playDigit, registerInteraction, decagonSteps],
  );

  const clearDecagonTrace = useCallback(() => {
    decagonTraceRef.current = [];
    setDecagonTrace([]);
    setDecagonHoveredStep(null);
    setDecagonActiveStep(null);
    setIsDecagonTracing(false);
    registerInteraction(true);
  }, [registerInteraction]);

  // Circle handlers
  const startCircleTrace = useCallback(
    (stepIndex: number) => {
      const step = circleSteps[stepIndex];
      if (!step) return;

      circleTraceRef.current = [stepIndex];
      setCircleTrace([stepIndex]);
      setCircleMaxTraceSteps((count) => Math.max(count, 1));
      setCircleHoveredStep(stepIndex);
      setCircleActiveStep(stepIndex);
      setIsCircleTracing(true);
      pulseHaptic(8);
      registerInteraction(true);
      void playDigit(step.digit);
    },
    [playDigit, pulseHaptic, registerInteraction, circleSteps],
  );

  const extendCircleTrace = useCallback(
    (stepIndex: number) => {
      if (!isCircleTracing) return;
      const step = circleSteps[stepIndex];
      const lastStep =
        circleTraceRef.current[circleTraceRef.current.length - 1];
      if (!step || lastStep === stepIndex) return;

      const nextTrace = [...circleTraceRef.current, stepIndex];
      circleTraceRef.current = nextTrace;
      setCircleTrace(nextTrace);
      setCircleMaxTraceSteps((count) => Math.max(count, nextTrace.length));
      setCircleHoveredStep(stepIndex);
      setCircleActiveStep(stepIndex);
      registerInteraction();
      void playDigit(step.digit);
    },
    [isCircleTracing, playDigit, registerInteraction, circleSteps],
  );

  const clearCircleTrace = useCallback(() => {
    circleTraceRef.current = [];
    setCircleTrace([]);
    setCircleHoveredStep(null);
    setCircleActiveStep(null);
    setIsCircleTracing(false);
    registerInteraction(true);
  }, [registerInteraction]);

  // ══════════════════════════════════════════════════════════════════════════
  // 3-D Spiral (Three.js WebGL)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!canvasRef.current || activeMode !== "spiral" || !webglSupport.supported)
      return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    // Initial aspect ratio will be corrected by resize() immediately below
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 1000);
    camera.position.z = 22;

    /**
     * FIX: Pass `true` (default) so Three.js manages canvas.style.width/height.
     * Previously we called setSize(w, h, false) and manually set inline styles,
     * creating a timing race where styles were applied before the renderer existed.
     */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
    );
    // display:block prevents an inline-element baseline gap that can collapse
    // the parent container to 0 height before JS sets explicit dimensions.
    canvas.style.display = "block";

    // Lighting — three-point rig for vivid colour separation
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const pl1 = new THREE.PointLight(0xffd700, 2.2);
    pl1.position.set(10, 10, 10);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x44aaff, 1.4);
    pl2.position.set(-10, -10, 8);
    scene.add(pl2);
    const pl3 = new THREE.PointLight(0xff44cc, 0.9);
    pl3.position.set(0, 12, -12);
    scene.add(pl3);

    // Build helix geometry from the seed sequence.
    //
    // Visual structure (mirrors real DNA visualisations):
    //   • Backbone — one consistent glowing colour per strand, running
    //     along the length of the helix. Keeps each strand readable.
    //   • Base-pair cross-bridges — coloured by digit (learning palette),
    //     drawn between adjacent strands every few nodes. These are the
    //     "rungs" of the ladder and the source of vivid colour variety.
    //   • Nodes (spheres) — coloured + glowing per digit, animated emissive.
    //
    // One shared MeshPhongMaterial per digit (0-9) keeps per-frame updates
    // to 10 material changes instead of 420+.

    const sequence = getSequence();
    const group = new THREE.Group();
    const spheres: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>[] =
      [];

    // Node materials — one per digit, animated each frame
    const sharedMats = Array.from(
      { length: 10 },
      (_, d) =>
        new THREE.MeshPhongMaterial({
          color: new THREE.Color(digitToLearningColor(d)),
          emissive: new THREE.Color(digitToLearningColor(d)),
          emissiveIntensity: 0.6,
          shininess: 140,
          specular: new THREE.Color(0xffffff),
        }),
    );

    // Backbone colours — one distinct glowing colour per strand
    const STRAND_COLS = [
      0x44ddff, 0xff6699, 0x88ff55, 0xffcc22, 0xcc88ff, 0x22ffcc, 0xff8844,
      0x4488ff, 0xff44cc, 0x88ffdd,
    ];
    // One backbone material per strand (reused for every segment on that strand)
    const backboneMats = Array.from(
      { length: harmony },
      (_, h) =>
        new THREE.LineBasicMaterial({
          color: STRAND_COLS[h % STRAND_COLS.length],
          opacity: 0.75,
          transparent: true,
        }),
    );
    // One bridge material per digit (coloured base-pair rungs)
    const bridgeMats = Array.from(
      { length: 10 },
      (_, d) =>
        new THREE.LineBasicMaterial({
          color: new THREE.Color(digitToLearningColor(d)),
          opacity: 0.9,
          transparent: true,
        }),
    );

    // Build each strand and record world-space node positions for bridges
    const helixPositions: THREE.Vector3[][] = [];

    for (let helix = 0; helix < harmony; helix++) {
      const helixGroup = new THREE.Group();
      const angleOffset = (helix * Math.PI * 2) / harmony;
      const positions: THREE.Vector3[] = [];

      for (let i = 0; i < sequence.length; i++) {
        const digit = sequence[i];
        const t = i / 9;
        const radius = 3 + (digit / 10) * 2.4;
        const angle = angleOffset + t * Math.PI * 0.58;
        const pos = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          t - 10,
        );
        positions.push(pos);

        const geo = new THREE.SphereGeometry(0.18 + digit * 0.022, 16, 16);
        const sphere = new THREE.Mesh(geo, sharedMats[digit]);
        sphere.position.copy(pos);
        sphere.userData = { digit, index: i };
        spheres.push(sphere);
        helixGroup.add(sphere);

        // Backbone segment — consistent strand colour, NOT per-digit
        if (i > 0) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            positions[i - 1],
            pos,
          ]);
          helixGroup.add(new THREE.Line(lineGeo, backboneMats[helix]));
        }
      }

      helixPositions.push(positions);
      group.add(helixGroup);
    }

    // Cross-bridges between adjacent strands — these are the coloured "rungs"
    const bridgeStep = Math.max(2, Math.floor(sequence.length / 14));
    for (let h = 0; h < harmony; h++) {
      const next = (h + 1) % harmony;
      for (let i = 0; i < sequence.length; i += bridgeStep) {
        const a = helixPositions[h][i];
        const b = helixPositions[next][i];
        if (!a || !b) continue;
        const bridgeGeo = new THREE.BufferGeometry().setFromPoints([a, b]);
        group.add(new THREE.Line(bridgeGeo, bridgeMats[sequence[i]]));
      }
    }

    scene.add(group);

    // Starfield — fills the dark void around the helix
    const starCount = 700;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.09,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Responsive resize ─────────────────────────────────────────────────
    const resize = () => {
      const host = canvas.parentElement;
      if (!host) return;
      const w = Math.round(clamp(host.clientWidth, MIN_SURFACE, 980));
      const h = Math.round(
        clamp(Math.min(w * 0.72, window.innerHeight * 0.62), 280, 760),
      );
      // Three.js manages canvas style when updateStyle=true (the default)
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("resize", resize);

    // ── Interaction ───────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(2, 2); // off-screen default

    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;
    let hovered: THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshPhongMaterial
    > | null = null;
    let lastToneAt = 0;

    const setPointer = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
    };

    const probeSpheres = () => {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(spheres, false)[0]?.object as
        | THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>
        | undefined;

      if (hovered && hovered !== hit) {
        hovered.material.emissiveIntensity = 0.45;
        hovered = null;
      }
      if (!hit || hit.userData.digit === undefined) return;

      hovered = hit;
      hit.material.emissiveIntensity = 1.0;

      const now = performance.now();
      if (now - lastToneAt > 85) {
        lastToneAt = now;
        playChord([hit.userData.digit as number]);
        registerInteraction();
      }
    };

    const updatePinch = () => {
      if (pointers.size !== 2) {
        pinchDist = 0;
        return;
      }
      const [a, b] = Array.from(pointers.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) {
        camera.position.z = clamp(
          camera.position.z - (d - pinchDist) * 0.03,
          8,
          38,
        );
      }
      pinchDist = d;
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      void ensureAudio();
      setPointer(e.clientX, e.clientY);
      probeSpheres();
      registerInteraction(true);
      pulseHaptic(8);
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (prev) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 1) {
          targetRotY += (e.clientX - prev.x) * 0.005;
          targetRotX = clamp(
            targetRotX + (e.clientY - prev.y) * 0.003,
            -1.2,
            1.2,
          );
          registerInteraction();
        }
        updatePinch();
      }
      setPointer(e.clientX, e.clientY);
      probeSpheres();
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      updatePinch();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = clamp(camera.position.z + e.deltaY * 0.01, 8, 38);
    };

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ── Animation loop ────────────────────────────────────────────────────
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      rotX += (targetRotX - rotX) * 0.08;
      rotY += (targetRotY - rotY) * 0.08;
      group.rotation.y = t * 0.22 + rotY;
      group.rotation.x = Math.sin(t * 0.7) * 0.08 + rotX;

      // Group-level breathe pulse
      const pulse = 1 + Math.sin(t * 2.2) * 0.05;
      group.scale.set(pulse, pulse, pulse);

      // Per-digit emissive ripple — only 10 material updates per frame
      sharedMats.forEach((mat, d) => {
        mat.emissiveIntensity = 0.55 + Math.sin(t * 1.9 + d * 0.72) * 0.38;
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      scene.remove(group);
      group.traverse((obj) => {
        const o = obj as THREE.Object3D & { geometry?: THREE.BufferGeometry };
        o.geometry?.dispose();
        // Materials are shared; disposed below
      });
      sharedMats.forEach((m) => m.dispose());
      backboneMats.forEach((m) => m.dispose());
      bridgeMats.forEach((m) => m.dispose());
      scene.remove(stars);
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, [
    activeMode,
    selectedSeed,
    harmony,
    getSequence,
    playChord,
    ensureAudio,
    registerInteraction,
    pulseHaptic,
    webglSupport.supported,
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // Symmetry Studio (2-D paint canvas)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!surfaceCanvasRef.current || activeMode !== "mandala") return;

    const canvas = surfaceCanvasRef.current;
    let setup = setupHiDpiCanvas(canvas, 800, 800);
    if (!setup) return;

    let { ctx, width: W, height: H } = setup;
    let cx = W / 2,
      cy = H / 2;

    const pointers = new Map<
      number,
      { x: number; y: number; drawing: boolean }
    >();
    let lastToneAt = 0;
    const sequence = getSequence();

    const resize = () => {
      const host = canvas.parentElement;
      if (!host) return;
      const side = Math.round(
        clamp(
          Math.min(host.clientWidth, window.innerHeight * 0.62),
          MIN_SURFACE,
          860,
        ),
      );
      setup = setupHiDpiCanvas(canvas, side, side);
      if (!setup) return;
      ({ ctx, width: W, height: H } = setup);
      cx = W / 2;
      cy = H / 2;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("resize", resize);

    /** Paint a point with rotational symmetry (harmony-fold mirror). */
    const addSymmetricPaint = (x: number, y: number) => {
      const dx = x - cx,
        dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const base = Math.atan2(dy, dx);
      const step = (Math.PI * 2) / harmony;

      for (let i = 0; i < harmony; i++) {
        const a = base + step * i;
        paintedPatternRef.current.push({
          x: cx + Math.cos(a) * dist,
          y: cy + Math.sin(a) * dist,
        });
      }
      if (paintedPatternRef.current.length > MAX_PAINT_POINTS) {
        paintedPatternRef.current.splice(
          0,
          paintedPatternRef.current.length - MAX_PAINT_POINTS,
        );
      }

      const ringSpacing = Math.max(24, Math.min(W, H) / 11);
      const digit = Math.floor((dist / ringSpacing) % 10);
      const now = performance.now();
      if (now - lastToneAt > 95) {
        playChord([digit]);
        lastToneAt = now;
      }
      registerInteraction();
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      const pt = localPointFromEvent(canvas, e);
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { ...pt, drawing: true });
      void ensureAudio();
      addSymmetricPaint(pt.x, pt.y);
      pulseHaptic(8);
      registerInteraction(true);
    };
    const onMove = (e: PointerEvent) => {
      const s = pointers.get(e.pointerId);
      if (!s || !s.drawing) return;
      const pt = localPointFromEvent(canvas, e);
      pointers.set(e.pointerId, { ...pt, drawing: true });
      addSymmetricPaint(pt.x, pt.y);
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      setMandalaStrokeCount((count) => count + 1);
      setPaintedPattern([...paintedPatternRef.current]);
    };

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    let animId = 0;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      const now = performance.now() * 0.001; // seconds — drives all animations
      const rs = Math.max(24, Math.min(W, H) / 11);
      const seg = harmony * 12;

      // Deep background — vibrant purple centre fading to near-black
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.62);
      bg.addColorStop(0, "#1e1060");
      bg.addColorStop(0.4, "#0e0d38");
      bg.addColorStop(1, "#050818");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // DNA ring dots — two-pass bloom + time-animated size
      for (let ring = 0; ring < 7; ring++) {
        const r = (ring + 1) * rs;
        for (let i = 0; i < seg; i++) {
          const a = (i / seg) * Math.PI * 2 - Math.PI / 2;
          const digit = sequence[(ring * seg + i) % sequence.length];
          const nx = cx + Math.cos(a) * r;
          const ny = cy + Math.sin(a) * r;
          const color = digitToLearningColor(digit);

          // Animated size — each ring and position pulses at its own phase
          const base = 2.6 + digit * 0.5;
          const sz = base + Math.sin(now * 1.7 + ring * 0.65 + i * 0.09) * 0.9;

          // Halo pass — large dim bloom
          ctx.beginPath();
          ctx.arc(nx, ny, sz * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `${color}1a`; // ~10% opacity
          ctx.fill();

          // Core pass — vivid + glow
          ctx.beginPath();
          ctx.arc(nx, ny, sz, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowBlur = 18;
          ctx.shadowColor = color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Symmetry guide lines — animated opacity, ice-blue tint
      ctx.lineWidth = 1.3;
      for (let i = 0; i < harmony; i++) {
        const a1 = (i / harmony) * Math.PI * 2 - Math.PI / 2;
        const a2 =
          ((i + Math.max(2, Math.floor(harmony / 3))) / harmony) * Math.PI * 2 -
          Math.PI / 2;
        const alpha = (0.22 + Math.sin(now * 0.7 + i * 0.55) * 0.14).toFixed(2);
        ctx.strokeStyle = `rgba(160,220,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * rs * 1.6, cy + Math.sin(a1) * rs * 1.6);
        ctx.lineTo(cx + Math.cos(a2) * rs * 1.6, cy + Math.sin(a2) * rs * 1.6);
        ctx.stroke();
      }

      // User paint points — learning palette cycling, with glow
      paintedPatternRef.current.forEach((pt, idx) => {
        const color = digitToLearningColor(idx % 10);
        const alpha = 0.5 + (idx % harmony) / (harmony * 1.4);
        const hexAlpha = Math.floor(Math.min(alpha, 1) * 255)
          .toString(16)
          .padStart(2, "0");
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${hexAlpha}`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [
    activeMode,
    selectedSeed,
    harmony,
    getSequence,
    ensureAudio,
    playChord,
    registerInteraction,
    pulseHaptic,
    webglSupport.supported,
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // Mode metadata
  // ══════════════════════════════════════════════════════════════════════════

  const modes: {
    id: ModeKey;
    icon: string;
    label: string;
    desc: string;
    requiresWebgl?: boolean;
  }[] = [
    {
      id: "spiral",
      icon: "🌀",
      label: "DNA Helix",
      desc: "Drag · pinch · tap nodes",
      requiresWebgl: true,
    },
    {
      id: "mandala",
      icon: "🔮",
      label: "Symmetry Studio",
      desc: "Finger-paint symmetry",
    },
    {
      id: "triangle",
      icon: "📐",
      label: "Triangle Instrument",
      desc: "Trace the 60-step edge",
    },
    {
      id: "pentagon",
      icon: "⬠",
      label: "Pentagon Instrument",
      desc: "5 sides × 12 steps",
    },
    {
      id: "hexagon",
      icon: "⬡",
      label: "Hexagon Instrument",
      desc: "6 sides × 10 steps",
    },
    {
      id: "decagon",
      icon: "🔟",
      label: "Decagon Instrument",
      desc: "10 sides × 6 steps",
    },
    {
      id: "circle",
      icon: "⭕",
      label: "Circle Instrument",
      desc: "60 points on circle",
    },
    {
      id: "sound",
      icon: "🎵",
      label: "Sound Lab",
      desc: "Tap bars to play notes",
    },
    {
      id: "journey",
      icon: "🧭",
      label: "Guided Journey",
      desc: "All-ages setup guide",
    },
  ];
  const recommendedMode =
    modes.find((mode) => mode.id === recommendedModeId) ?? modes[modes.length - 1];
  const handleModeSelect = useCallback(
    (modeId: ModeKey) => {
      if (modeId === "spiral" && !webglSupport.supported) {
        setActiveMode(webglSupport.fallbackMode);
        return;
      }

      setActiveMode(modeId);
    },
    [webglSupport],
  );
  const selectableModes = modes.filter(
    (mode) => !mode.requiresWebgl || webglSupport.supported,
  );
  const scrollToElement = useCallback((element: HTMLElement | null) => {
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-amber-50 pb-32 sm:pb-16">
      {/* Ambient background glow — pointer-events-none so it never blocks input */}
      <div className="fixed inset-0 opacity-20 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent animate-pulse">
            ✨ Digital DNA ✨
          </h1>
          <p className="text-lg sm:text-2xl text-blue-300 font-light mb-2">
            All-Ages Learning Hub · Touch · Sound · Patterns
          </p>
          {lessonContext && (
            <p className="text-xs text-cyan-300 mt-1">
              Lesson mode — student:{" "}
              <strong>{lessonContext.studentAlias}</strong>
            </p>
          )}
          <p className="text-sm text-slate-400 italic mt-1">
            Works with fingers, stylus, trackpad, and mouse.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">
              Active strand:{" "}
              <strong className="text-white">{currentSeedMeta.label}</strong>
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-purple-100">
              Source:{" "}
              <strong className="text-white">
                {sequenceSource === "packet" ? "Mini Path" : "Core 60"}
              </strong>
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-200">
              Phrase: {soundLabSequence.length} digits
            </span>
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-amber-100">
              Transform: {toolTransform}
            </span>
          </div>
        </div>

        <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
          <div className="rounded-[1.5rem] border border-amber-500/20 bg-slate-950/92 p-3 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <label className="min-w-0">
                <span className="sr-only">Switch instrument</span>
                <select
                  value={activeMode}
                  onChange={(event) =>
                    handleModeSelect(event.target.value as ModeKey)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {selectableModes.map((mode) => (
                    <option key={`mobile-mode-${mode.id}`} value={mode.id}>
                      {mode.icon} {mode.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => scrollToElement(toolkitSectionRef.current)}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
              >
                Settings
              </button>
            </div>
            <button
              type="button"
              onClick={() => scrollToElement(modeSelectorRef.current)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300 transition-colors hover:bg-slate-800"
            >
              Open full mode switcher
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
              What can I do here?
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Start with <strong className="text-white">{recommendedMode.label}</strong>,
              then branch into the modes that fit your device. Every view reads
              the same strand and turns it into geometry, rhythm, or a playable
              path.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {modes.map((mode) => (
                <div
                  key={`summary-${mode.id}`}
                  className={`rounded-2xl border px-4 py-3 ${
                    mode.id === recommendedMode.id
                      ? "border-emerald-400/25 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/45"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    {mode.icon} {mode.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{mode.desc}</p>
                  {mode.requiresWebgl && !webglSupport.supported && (
                    <p className="mt-2 text-[11px] text-amber-200">
                      3D helix unavailable on this device
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-cyan-500/20 bg-cyan-950/15 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">
              Decode Guide
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Seed
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {currentSeedMeta.label}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  The seed chooses which strand story you are currently reading.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Harmony
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {harmony}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Harmony changes how many mirrored arms or repeating structures
                  the strand uses in each instrument.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Mutation seed
                </p>
                <p className="mt-2 font-mono text-lg font-semibold text-white">
                  {revealModel.liveMutationSeed}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  This short code is the visible handoff between the reveal card
                  and the deeper instruments below.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Dominant lattice
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {revealModel.dominantLattice}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  These anchors are the easiest places to start explaining what
                  the scene is showing.
                </p>
              </div>
            </div>
            {!webglSupport.supported && webglSupport.reason && (
              <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                {webglSupport.reason}
              </div>
            )}
          </section>
        </div>

        {/* ── Mode selector ─────────────────────────────────────────────────── */}
        <div
          ref={modeSelectorRef}
          className="mb-8 grid scroll-mt-28 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleModeSelect(mode.id)}
              disabled={mode.requiresWebgl && !webglSupport.supported}
              className={`group relative min-h-[104px] rounded-2xl px-3 py-3 transition-all duration-300 ${
                activeMode === mode.id
                  ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl shadow-amber-500/35 scale-[1.03]"
                  : mode.requiresWebgl && !webglSupport.supported
                    ? "cursor-not-allowed border border-slate-800 bg-slate-900/45 text-slate-500"
                    : "bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/40 hover:border-slate-500/60"
              }`}
            >
              <div className="text-3xl mb-1">{mode.icon}</div>
              <div className="text-sm font-bold leading-tight">
                {mode.label}
              </div>
              <div className="text-[11px] text-slate-300 mt-1 leading-tight">
                {mode.desc}
              </div>
              {mode.requiresWebgl && !webglSupport.supported && (
                <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-amber-200">
                  Guided fallback active
                </div>
              )}
              {activeMode === mode.id && (
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 blur opacity-25 -z-10" />
              )}
            </button>
          ))}
        </div>

        <div className="sticky top-3 z-30 mb-8 rounded-[1.75rem] border border-amber-600/30 bg-slate-950/92 px-3 py-3 sm:px-4 sm:py-4 shadow-2xl shadow-amber-500/15 backdrop-blur">
          {/* ── Mobile compact row ──────────────────────────────────────── */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className="flex items-center gap-1.5">
              {(["red", "blue", "black"] as SeedKey[]).map((seed) => (
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(seed)}
                  title={seed === "red" ? "Fire" : seed === "blue" ? "Water" : "Earth"}
                  className={`h-7 w-7 rounded-full transition-all ${
                    selectedSeed === seed
                      ? "scale-110 shadow-lg ring-2 ring-white/50"
                      : "opacity-60"
                  }`}
                  style={{
                    backgroundColor:
                      seed === "red" ? "#ef4444" : seed === "blue" ? "#3b82f6" : "#374151",
                  }}
                />
              ))}
            </div>
            <button
              onClick={playSequence}
              disabled={isPlaying}
              className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
                isPlaying
                  ? "bg-slate-700 text-slate-400"
                  : "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 active:scale-95"
              }`}
            >
              {isPlaying ? "Playing…" : "▶ Play"}
            </button>
            <button
              type="button"
              onClick={() => setShowMobileControls((v) => !v)}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300"
            >
              {showMobileControls ? "▲" : "▼"} Controls
            </button>
          </div>

          {/* ── Mobile expanded controls ─────────────────────────────── */}
          {showMobileControls && (
            <div className="mt-3 grid gap-3 sm:hidden">
              <div className="rounded-[1.25rem] border border-slate-700/80 bg-slate-900/80 px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Harmony</div>
                <div className="mt-2 flex justify-center gap-2">
                  {[3, 5, 7, 9, 12].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateHarmony(value)}
                      className={`h-9 w-9 rounded-full text-sm font-bold transition-colors ${
                        harmony === value
                          ? "bg-amber-400 text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-slate-700/80 bg-slate-900/80 px-4 py-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  <span>Tempo</span>
                  <span className="font-mono text-amber-300">{tempo} BPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={tempo}
                  onChange={(e) => updateTempo(parseInt(e.target.value, 10))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-400"
                />
              </div>
            </div>
          )}

          {/* ── Desktop full row ─────────────────────────────────────── */}
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-2">
              <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Seed
              </span>
              {(["red", "blue", "black"] as SeedKey[]).map((seed) => (
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(seed)}
                  title={
                    seed === "red"
                      ? "Fire"
                      : seed === "blue"
                        ? "Water"
                        : "Earth"
                  }
                  className={`h-9 w-9 rounded-full transition-all ${
                    selectedSeed === seed
                      ? "scale-110 shadow-lg ring-2 ring-white/50"
                      : "opacity-60 hover:opacity-90"
                  }`}
                  style={{
                    backgroundColor:
                      seed === "red"
                        ? "#ef4444"
                        : seed === "blue"
                          ? "#3b82f6"
                          : "#374151",
                  }}
                />
              ))}
            </div>

            <div className="rounded-[1.25rem] border border-slate-700/80 bg-slate-900/80 px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Harmony
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {[3, 5, 7, 9, 12].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateHarmony(value)}
                    className={`h-10 w-10 rounded-full text-sm font-bold transition-colors ${
                      harmony === value
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-[220px] flex-1 rounded-[1.25rem] border border-slate-700/80 bg-slate-900/80 px-4 py-3 sm:max-w-xs">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400">
                <span>Tempo</span>
                <span className="font-mono text-amber-300">{tempo} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                value={tempo}
                onChange={(e) => updateTempo(parseInt(e.target.value, 10))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-400"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.25rem] border border-slate-700/80 bg-slate-900/80 px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    audioReady ? "bg-emerald-400" : "bg-slate-600"
                  }`}
                />
                <span>{audioReady ? "Audio on" : "Tap to enable audio"}</span>
              </div>
              <button
                onClick={playSequence}
                disabled={isPlaying}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  isPlaying
                    ? "bg-slate-700 text-slate-400"
                    : "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:from-pink-500 hover:to-purple-500 active:scale-95"
                }`}
              >
                {isPlaying ? "Playing..." : "▶ Play Source"}
              </button>
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-[2rem] border border-purple-500/20 bg-slate-900/45 p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-purple-200/70">
                Sequence Source
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Play the full strand or a mini path
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Mini paths are the smaller strings you can swap fast, stretch to
                any length, and feed into the triangle instrument, phrase
                builder, and sound tools without losing the main DNA strand.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
              Active source: <strong>{activeSourceSummary}</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[260px,1fr]">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                Source mode
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  [
                    ["core", "Core 60"],
                    ["packet", "Mini Path"],
                  ] as [SequenceSource, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSequenceSource(value)}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      sequenceSource === value
                        ? "bg-purple-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Core 60 keeps the full strand. Mini Path swaps every mode to a
                smaller story string or a build-your-own slice.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                      Mini path mode
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Story picks or build your own
                    </h3>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
                    Current:{" "}
                    <strong className="text-white">
                      {miniPathMode === "build"
                        ? `${activeMiniPathString.length}-digit custom path`
                        : "Story pick"}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["story", "Story Picks"],
                      ["build", "Build Your Own"],
                    ] as [MiniPathMode, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setMiniPathMode(value);
                        setSequenceSource("packet");
                      }}
                      className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                        miniPathMode === value
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {miniPathMode === "build" && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,220px]">
                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <label
                            htmlFor="mini-path-start"
                            className="text-slate-300"
                          >
                            Start point
                          </label>
                          <span className="font-mono text-cyan-300">
                            {miniPathStartIndex + 1}
                          </span>
                        </div>
                        <input
                          id="mini-path-start"
                          type="range"
                          min="0"
                          max={Math.max(miniPathMaxLength - 1, 0)}
                          value={miniPathStartIndex}
                          onChange={(e) => {
                            setMiniPathStartIndex(parseInt(e.target.value, 10));
                            setSequenceSource("packet");
                          }}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <label
                            htmlFor="mini-path-length"
                            className="text-slate-300"
                          >
                            Mini path length
                          </label>
                          <span className="font-mono text-cyan-300">
                            {miniPathLength}
                          </span>
                        </div>
                        <input
                          id="mini-path-length"
                          type="range"
                          min="1"
                          max={miniPathMaxLength}
                          value={miniPathLength}
                          onChange={(e) => {
                            setMiniPathLength(parseInt(e.target.value, 10));
                            setSequenceSource("packet");
                          }}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-400"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-50">
                      <div className="text-[11px] uppercase tracking-[0.26em] text-amber-200/80">
                        Live mini path
                      </div>
                      <div className="mt-3 break-all font-mono text-lg text-white">
                        {activeMiniPathString}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-amber-100/80">
                        Wraps around the active strand, so you can choose any
                        start point and any length up to the full 60 digits.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                      {currentPacket.label}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Story path selector
                    </h3>
                  </div>
                  <div
                    className="rounded-xl border px-3 py-2 text-xs text-slate-200"
                    style={{
                      borderColor: `${activePacketChamber.color}55`,
                      backgroundColor: `${activePacketChamber.color}18`,
                    }}
                  >
                    {miniPathMode === "story"
                      ? `${activePacketChamber.positionLabel} o'clock`
                      : "Custom path"}{" "}
                    · {activeMiniPathString}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {currentPacket.chambers.map((chamber, index) => (
                    <button
                      key={`${currentPacket.key}-${chamber.positionLabel}`}
                      type="button"
                      onClick={() => {
                        setSelectedPacketIndex(index);
                        setMiniPathMode("story");
                        setSequenceSource("packet");
                      }}
                      className={`rounded-2xl border p-3 text-left transition-colors ${
                        selectedPacketIndex === index &&
                        sequenceSource === "packet" &&
                        miniPathMode === "story"
                          ? "border-white/25 bg-slate-900 text-white"
                          : "border-slate-700 bg-slate-900/75 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                      }`}
                      style={
                        selectedPacketIndex === index &&
                        sequenceSource === "packet" &&
                        miniPathMode === "story"
                          ? { boxShadow: `inset 0 0 0 1px ${chamber.color}66` }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {chamber.positionLabel}
                        </span>
                        <span
                          className="h-3 w-3 rounded-full border border-white/15"
                          style={{ backgroundColor: chamber.color }}
                        />
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {chamber.name}
                      </div>
                      <div className="mt-1 font-mono text-xs text-cyan-300">
                        {chamber.pentad}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {chamber.function}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2rem] border border-white/10 bg-slate-900/45 p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">
                Strand Roster
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Who owns what in this DNA music system
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Each strand has a different colour identity, signature number,
                lead note, and geometry bias. The chart underneath shows which
                strand dominates each digit.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Current owner focus: <strong>{currentSeedMeta.owner}</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {strandRoster.map((strand) => (
              <div
                key={strand.key}
                className={`rounded-[1.5rem] border bg-gradient-to-br ${strand.surface} p-5 ${strand.ring} ${
                  selectedSeed === strand.key ? "shadow-xl shadow-black/30" : ""
                }`}
                style={{
                  boxShadow:
                    selectedSeed === strand.key
                      ? `0 24px 60px ${strand.glow}`
                      : `0 18px 38px ${strand.glow.replace("0.45", "0.18")}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300/80">
                      {strand.owner}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {strand.label}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSeed(strand.key)}
                    className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-black/30"
                  >
                    Load
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200/90">
                  {strand.role}
                </p>
                <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Profile signal
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div
                      className="rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: `${strand.accent}66`,
                        backgroundColor: `${strand.accent}24`,
                      }}
                    >
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-100/70">
                        Colour
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <span
                          className="inline-block h-6 w-6 rounded-full border border-white/30"
                          style={{
                            backgroundColor: strand.accent,
                            boxShadow: `0 0 18px ${strand.glow}`,
                          }}
                        />
                        <span className="text-xl font-black text-white">
                          {strand.profileColorName}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Number
                      </div>
                      <div className="mt-2 text-3xl font-black text-white">
                        {strand.profileDigit}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Sound
                      </div>
                      <div className="mt-2 text-3xl font-black text-pink-300">
                        {strand.profileNote}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Shape
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-white">
                        <span className="text-3xl font-black">
                          {strand.profileShapeIcon}
                        </span>
                        <span className="text-xl font-black">
                          {strand.shape}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Pattern leader
                    </div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {strand.dominantDigit}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Measured note
                    </div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {strand.dominantNote}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Peak count
                    </div>
                    <div className="mt-1 text-xl font-bold text-white">
                      {strand.dominantCount} hits
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Opening phrase
                    </div>
                    <div className="mt-2 font-mono text-xs text-slate-200">
                      {strand.sample}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-slate-700/60 bg-slate-950/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.26em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Digit</th>
                  <th className="px-4 py-3">Colour</th>
                  <th className="px-4 py-3">Music note</th>
                  <th className="px-4 py-3">Shape</th>
                  <th className="px-4 py-3">Belongs most to</th>
                  <th className="px-4 py-3">Peak count</th>
                </tr>
              </thead>
              <tbody>
                {ownershipChart.map((row) => (
                  <tr
                    key={row.digit}
                    className="border-t border-slate-800/70 text-slate-200"
                    style={{
                      background:
                        row.topCount > 0
                          ? `linear-gradient(90deg, ${row.color}12, transparent 58%)`
                          : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg font-black text-white"
                        style={{
                          backgroundColor: `${row.color}22`,
                          borderColor: `${row.color}66`,
                          boxShadow: `0 0 20px ${row.color}20`,
                        }}
                      >
                        {row.digit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block h-6 w-6 rounded-full border border-white/25"
                          style={{
                            backgroundColor: row.color,
                            boxShadow: `0 0 20px ${row.color}55`,
                          }}
                        />
                        <span className="font-mono text-sm font-semibold text-white">
                          {row.color}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-sm font-black text-pink-300">
                        {row.note}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm font-black text-cyan-100">
                        {row.shape}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.leaders.map((leader) => (
                          <span
                            key={`${row.digit}-${leader.label}`}
                            className="rounded-full border px-3 py-1 text-xs font-black text-white"
                            style={{
                              backgroundColor: `${leader.accent}26`,
                              borderColor: `${leader.accent}55`,
                              boxShadow: `0 0 14px ${leader.accent}20`,
                            }}
                          >
                            {leader.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-lg font-black text-cyan-300">
                      {row.topCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          ref={toolkitSectionRef}
          className="mb-8 scroll-mt-28 rounded-[2rem] border border-amber-500/20 bg-slate-900/45 p-4 sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">
                Exploration Toolkit
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Slice, remix, save, and replay the strongest parts
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                This is the upgraded music hub layer pulled from the newer build
                and tightened up for this app. It lets you probe smaller phrases
                instead of blasting the whole strand every time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void playCustomSequence(transformedWindow)}
              disabled={isPlaying || transformedWindow.length === 0}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                isPlaying || transformedWindow.length === 0
                  ? "bg-slate-800 text-slate-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95"
              }`}
            >
              {isPlaying ? "Playing phrase..." : "Play toolkit phrase"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_1.2fr_0.95fr]">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                Custom settings
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <label htmlFor="tool-start" className="text-slate-300">
                      Start position
                    </label>
                    <span className="font-mono text-cyan-300">
                      {toolStartIndex + 1}
                    </span>
                  </div>
                  <input
                    id="tool-start"
                    type="range"
                    min="0"
                    max={maxToolStartIndex}
                    value={toolStartIndex}
                    onChange={(e) =>
                      setToolStartIndex(parseInt(e.target.value, 10))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <label htmlFor="tool-window" className="text-slate-300">
                      Window size
                    </label>
                    <span className="font-mono text-cyan-300">
                      {effectiveWindowSize} digits
                    </span>
                  </div>
                  <input
                    id="tool-window"
                    type="range"
                    min="6"
                    max="20"
                    value={toolWindowSize}
                    onChange={(e) =>
                      setToolWindowSize(parseInt(e.target.value, 10))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-400"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">
                    Pattern transform
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["raw", "Raw"],
                        ["reverse", "Reverse"],
                        ["orbit", "Orbit"],
                      ] as [ToolTransform, string][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateToolTransform(value)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          toolTransform === value
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">Index focus</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["all", "All"],
                        ["odd", "Odd"],
                        ["even", "Even"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setToolFocusBand(value)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          toolFocusBand === value
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Saved presets
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={presetDraftName}
                      onChange={(e) => setPresetDraftName(e.target.value)}
                      placeholder="Name this setup"
                      className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={saveToolkitPreset}
                      disabled={!presetDraftName.trim()}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        presetDraftName.trim()
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      Save
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {savedToolPresets.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Saved toolkit setups stay on this device for quick
                        return visits.
                      </p>
                    ) : (
                      savedToolPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => loadToolkitPreset(preset)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="truncate text-sm font-semibold text-white">
                              {preset.name}
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                              {preset.selectedSeed} seed ·{" "}
                              {preset.toolWindowSize} digits ·{" "}
                              {preset.toolTransform}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteToolkitPreset(preset.id)}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300/80">
                    Sequence scope
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">
                    Interactive phrase window
                  </h3>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-right text-xs text-slate-400">
                  <div>Dominant digit</div>
                  <div className="mt-1 text-lg font-bold text-amber-300">
                    {dominantDigit?.digit ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {transformedWindow.map((digit, index) => (
                  <button
                    key={`${digit}-${index}`}
                    type="button"
                    onClick={() => void playDigit(digit)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95"
                    style={{ backgroundColor: digitToLearningColor(digit) }}
                    title={`Play digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Pitch lane
                  </p>
                  <p className="mt-1 text-lg font-semibold text-pink-300">
                    {transformedWindow
                      .slice(0, 4)
                      .map(digitToNote)
                      .join(" · ") || "Ready"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Unique tones
                  </p>
                  <p className="mt-1 text-lg font-semibold text-cyan-300">
                    {new Set(transformedWindow).size}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Window energy
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">
                    {transformedWindow.length
                      ? Math.round(
                          (transformedWindow.reduce(
                            (sum, digit) => sum + digit,
                            0,
                          ) /
                            transformedWindow.length) *
                            10,
                        )
                      : 0}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setSoundSource("toolkit");
                    setActiveMode("sound");
                  }}
                  className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-4 py-3 text-sm font-semibold text-pink-200 transition-colors hover:bg-pink-500/20"
                >
                  Send to Sound Lab
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode("mandala")}
                  className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-200 transition-colors hover:bg-purple-500/20"
                >
                  Paint this rhythm
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                  Digit balance
                </p>
                <div className="mt-4 space-y-2">
                  {frequencyMap.map(({ digit, count }) => (
                    <div key={digit} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Digit {digit}</span>
                        <span>{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${explorationWindow.length ? (count / explorationWindow.length) * 100 : 0}%`,
                            backgroundColor: digitToLearningColor(digit),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                  Preset launchpad
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    {
                      id: "calm",
                      label: "Calm orbit",
                      copy: "Low focus helix pass",
                    },
                    {
                      id: "spark",
                      label: "Studio spark",
                      copy: "Balanced symmetry sketch",
                    },
                    {
                      id: "storm",
                      label: "Triangle glow",
                      copy: "Fast perimeter trace run",
                    },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        applyExplorationPreset(
                          preset.id as "calm" | "spark" | "storm",
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-left transition-colors hover:border-amber-400/50 hover:bg-slate-800"
                    >
                      <div className="text-sm font-semibold text-white">
                        {preset.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {preset.copy}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <PatternQuestBoard
          progress={questProgress}
          activeMode={activeMode}
          isLessonMode={Boolean(lessonContext)}
          isCompleted={Boolean(isLessonCompleted)}
          missingRequirements={lessonCompletionRequirements.missingRequirements}
          onJumpToMode={(mode) => setActiveMode(mode as ModeKey)}
        />

        {completionFeedback && (
          <div className="mb-8 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {completionFeedback}
          </div>
        )}

        <section className="mb-8 rounded-[2rem] border border-amber-500/20 bg-slate-900/45 p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-amber-200/70">
                Phrase Builder
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Capture a phrase, remix it, and stretch it into a longer board
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Pull in the toolkit phrase or the currently active sound path,
                then drag digits around to build a custom playback board.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-slate-200 sm:text-right">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
                Toolkit phrase: <strong>{toolkitSoundSequence.length}</strong>
              </div>
              <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-3">
                Active phrase: <strong>{soundLabSequence.length}</strong> ·{" "}
                {soundSourceLabel}
              </div>
            </div>
          </div>

          <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                      Remix bench
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Drag notes into your own play board
                    </h3>
                  </div>
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {noteBoardDigits.length}/{noteBoardCapacity} notes loaded
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[300px,1fr]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <label
                          htmlFor="note-board-capacity"
                          className="text-slate-300"
                        >
                          Board size
                        </label>
                        <span className="font-mono text-cyan-300">
                          {noteBoardCapacity}
                        </span>
                      </div>
                      <input
                        id="note-board-capacity"
                        type="range"
                        min="12"
                        max={MAX_NOTE_BOARD}
                        step="6"
                        value={noteBoardCapacity}
                        onChange={(e) =>
                          setNoteBoardCapacity(parseInt(e.target.value, 10))
                        }
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
                      />
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Start small, then scale the board up to 180 notes when
                        you want a longer phrase.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        type="button"
                        onClick={() => loadNoteBoard(toolkitSoundSequence)}
                        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
                      >
                        Load toolkit phrase
                      </button>
                      <button
                        type="button"
                        onClick={() => loadNoteBoard(soundLabSequence)}
                        className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-100 transition-colors hover:bg-purple-500/20"
                      >
                        Load active phrase
                      </button>
                      <button
                        type="button"
                        onClick={playNoteBoard}
                        disabled={isPlaying || noteBoardDigits.length === 0}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                          isPlaying || noteBoardDigits.length === 0
                            ? "bg-slate-800 text-slate-500"
                            : "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:brightness-110"
                        }`}
                      >
                        {isPlaying ? "Board playing..." : "Play note board"}
                      </button>
                      <button
                        type="button"
                        onClick={clearNoteBoard}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition-colors hover:bg-rose-500/20"
                      >
                        Clear board
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Drag extras from the active phrase
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {boardPaletteDigits.map((digit, index) => (
                          <button
                            key={`${digit}-${index}-palette`}
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              dragDigitRef.current = digit;
                              dragBoardIndexRef.current = null;
                              event.dataTransfer.effectAllowed = "copy";
                              event.dataTransfer.setData(
                                "text/plain",
                                `${digit}`,
                              );
                            }}
                            onClick={() => void playDigit(digit)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-slate-950 shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95"
                            style={{
                              backgroundColor: digitToLearningColor(digit),
                            }}
                          >
                            {digit}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Drop zone
                      </p>
                      <p className="text-xs text-slate-500">
                        Drag from the toolkit palette or active phrase. Drag
                        between slots to reorder. Double click a slot to clear
                        it.
                      </p>
                    </div>

                    <div className="max-h-[30rem] overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8 2xl:grid-cols-10">
                        {noteBoard.map((digit, index) => (
                          <button
                            key={`note-board-${index}`}
                            type="button"
                            draggable={digit !== null}
                            onDragStart={(event) => {
                              if (digit === null) return;
                              dragDigitRef.current = digit;
                              dragBoardIndexRef.current = index;
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData(
                                "text/plain",
                                `${digit}`,
                              );
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverBoardIndex(index);
                            }}
                            onDragLeave={() => {
                              if (dragOverBoardIndex === index) {
                                setDragOverBoardIndex(null);
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleBoardDrop(index);
                            }}
                            onDoubleClick={() => clearBoardSlot(index)}
                            onClick={() => {
                              if (digit !== null) {
                                void playDigit(digit);
                              }
                            }}
                            className={`relative flex min-h-[54px] flex-col items-center justify-center rounded-xl border text-center transition-colors ${
                              digit === null
                                ? "border-dashed border-slate-700 bg-slate-950/80 text-slate-600"
                                : "border-white/10 text-slate-950 shadow-lg"
                            } ${
                              dragOverBoardIndex === index
                                ? "border-cyan-400 bg-cyan-500/10"
                                : ""
                            }`}
                            style={
                              digit !== null
                                ? {
                                    backgroundColor:
                                      digitToLearningColor(digit),
                                  }
                                : undefined
                            }
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                              {index + 1}
                            </span>
                            <span className="mt-1 text-lg font-bold leading-none">
                              {digit ?? "·"}
                            </span>
                            <span className="mt-1 text-[9px] uppercase tracking-[0.18em] opacity-80">
                              {digit !== null ? digitToNote(digit) : "drop"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            Active mode panels
            NOTE: backdrop-blur-sm has been removed from all canvas container
            divs. It creates a GPU stacking-context conflict that blanks WebGL
            and 2-D canvas output in many Chrome/Safari/driver combinations.
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-10">
          {/* ── Spiral ──────────────────────────────────────────────────── */}
          {activeMode === "spiral" && (
            <div className="bg-slate-900/60 rounded-3xl p-4 sm:p-8 border border-blue-800/30">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  🌀 DNA Helix Explorer
                </h2>
                <p className="text-blue-300 text-sm sm:text-base">
                  Drag to rotate · pinch to zoom · hover/tap glowing spheres for
                  notes
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">
                  Guide tip: harmony controls how many helix arms are visible
                </p>
              </div>
              {/*
                FIX: Canvas wrapper has an explicit min-height so the container
                never collapses to zero before Three.js sets the canvas dimensions.
                The canvas itself has no w-full class — Three.js manages width/height
                directly via renderer.setSize(w, h, true).
              */}
              <div
                className="flex justify-center"
                style={{ minHeight: "300px" }}
              >
                <canvas
                  ref={canvasRef}
                  className="rounded-xl shadow-2xl shadow-blue-900/60 border border-blue-700/30"
                  style={{ display: "block" }}
                />
              </div>
            </div>
          )}

          {/* ── Mandala ─────────────────────────────────────────────────── */}
          {activeMode === "mandala" && (
            <div className="bg-slate-900/60 rounded-3xl p-4 sm:p-8 border border-purple-800/30">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  🔮 Symmetry Studio
                </h2>
                <p className="text-purple-300 text-sm sm:text-base">
                  Press and glide to paint mirrored geometry with instant tones
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">
                  Guide tip: raise harmony to create more symmetry arms
                </p>
              </div>
              <div
                className="flex justify-center"
                style={{ minHeight: "300px" }}
              >
                <canvas
                  ref={surfaceCanvasRef}
                  className="rounded-xl shadow-2xl shadow-purple-900/60 border border-purple-700/30"
                />
              </div>
              <div className="text-center mt-5">
                <button
                  onClick={clearPaintedPattern}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/40 transition-all active:scale-95"
                >
                  ✨ Clear Pattern
                </button>
              </div>
            </div>
          )}

          {/* ── Triangle Instrument ─────────────────────────────────────── */}
          {activeMode === "triangle" && (
            <div className="rounded-3xl border border-cyan-800/30 bg-slate-900/60 p-4 sm:p-8">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  📐 Triangle Instrument
                </h2>
                <p className="text-cyan-300 text-sm sm:text-base">
                  Trace the 60-step edge of a 10-24-26 triangle to turn shape
                  into melody.
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">
                  Tap single points or drag the perimeter to draw a playable
                  phrase.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-3xl border border-slate-700/60 bg-slate-950/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      Vertical 10
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      Base 24
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      Diagonal 26
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                      Perimeter 60
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_60%)] p-4">
                    <svg
                      viewBox={`0 0 ${TRIANGLE_VIEWBOX.width} ${TRIANGLE_VIEWBOX.height}`}
                      className="w-full"
                      style={{ touchAction: "none" }}
                      onPointerDown={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          triangleSteps,
                        );
                        if (idx === null) return;
                        event.preventDefault();
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        startTriangleTrace(idx);
                      }}
                      onPointerLeave={() => setTriangleHoveredStep(null)}
                      onPointerUp={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsTriangleTracing(false);
                      }}
                      onPointerCancel={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsTriangleTracing(false);
                      }}
                      onPointerMove={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          triangleSteps,
                        );
                        setTriangleHoveredStep(idx);
                        if (idx !== null) {
                          extendTriangleTrace(idx);
                        }
                      }}
                    >
                      <polygon
                        points={`${TRIANGLE_VERTICES.top.x},${TRIANGLE_VERTICES.top.y} ${TRIANGLE_VERTICES.left.x},${TRIANGLE_VERTICES.left.y} ${TRIANGLE_VERTICES.right.x},${TRIANGLE_VERTICES.right.y}`}
                        fill="rgba(15,23,42,0.5)"
                        stroke="rgba(148,163,184,0.4)"
                        strokeWidth="3"
                      />
                      <line
                        x1={TRIANGLE_VERTICES.top.x}
                        y1={TRIANGLE_VERTICES.top.y}
                        x2={TRIANGLE_VERTICES.left.x}
                        y2={TRIANGLE_VERTICES.left.y}
                        stroke={TRIANGLE_SIDE_ACCENTS.vertical}
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0.82"
                      />
                      <line
                        x1={TRIANGLE_VERTICES.left.x}
                        y1={TRIANGLE_VERTICES.left.y}
                        x2={TRIANGLE_VERTICES.right.x}
                        y2={TRIANGLE_VERTICES.right.y}
                        stroke={TRIANGLE_SIDE_ACCENTS.base}
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0.82"
                      />
                      <line
                        x1={TRIANGLE_VERTICES.right.x}
                        y1={TRIANGLE_VERTICES.right.y}
                        x2={TRIANGLE_VERTICES.top.x}
                        y2={TRIANGLE_VERTICES.top.y}
                        stroke={TRIANGLE_SIDE_ACCENTS.diagonal}
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0.82"
                      />

                      {triangleTracePolyline && (
                        <polyline
                          points={triangleTracePolyline}
                          fill="none"
                          stroke="#F8FAFC"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      )}

                      <text
                        x={TRIANGLE_VERTICES.top.x - 48}
                        y={
                          (TRIANGLE_VERTICES.top.y + TRIANGLE_VERTICES.left.y) /
                          2
                        }
                        fill={TRIANGLE_SIDE_ACCENTS.vertical}
                        fontSize="18"
                        fontWeight="700"
                      >
                        10
                      </text>
                      <text
                        x={
                          (TRIANGLE_VERTICES.left.x +
                            TRIANGLE_VERTICES.right.x) /
                            2 -
                          10
                        }
                        y={TRIANGLE_VERTICES.left.y + 42}
                        fill={TRIANGLE_SIDE_ACCENTS.base}
                        fontSize="18"
                        fontWeight="700"
                      >
                        24
                      </text>
                      <text
                        x={
                          (TRIANGLE_VERTICES.top.x +
                            TRIANGLE_VERTICES.right.x) /
                            2 +
                          34
                        }
                        y={
                          (TRIANGLE_VERTICES.top.y +
                            TRIANGLE_VERTICES.right.y) /
                            2 -
                          18
                        }
                        fill={TRIANGLE_SIDE_ACCENTS.diagonal}
                        fontSize="18"
                        fontWeight="700"
                      >
                        26
                      </text>

                      {triangleSteps.map((step) => {
                        const isHovered = triangleHoveredStep === step.index;
                        const isActive = triangleActiveStep === step.index;
                        const isTraced = triangleTraceStepSet.has(step.index);
                        const radius = isActive
                          ? 13
                          : isHovered
                            ? 12
                            : isTraced
                              ? 11
                              : 9.5;

                        return (
                          <g
                            key={`triangle-step-${step.index}`}
                            data-step={step.index}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={step.x}
                              cy={step.y}
                              r={radius + 8}
                              fill="transparent"
                            />
                            <circle
                              cx={step.x}
                              cy={step.y}
                              r={radius}
                              fill={step.color}
                              stroke={
                                isActive || isTraced
                                  ? "#F8FAFC"
                                  : "rgba(15,23,42,0.8)"
                              }
                              strokeWidth={isActive ? 3 : 2}
                              opacity={isHovered || isActive ? 1 : 0.94}
                            />
                            <text
                              x={step.x}
                              y={step.y + 2.5}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontWeight="700"
                              fill="#020617"
                            >
                              {step.digit}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                      Triangle phrase
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Perimeter
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          60
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Trace
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          {triangleTraceDigits.length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        Active phrase
                      </div>
                      <p className="mt-2 min-h-[3rem] font-mono text-xs leading-6 text-cyan-200">
                        {triangleTraceDigits.length
                          ? triangleTraceDigits.join(" · ")
                          : "Trace the edge to capture a phrase."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(trianglePerimeterDigits)
                      }
                      disabled={isPlaying}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play perimeter"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(triangleTraceDigits)
                      }
                      disabled={isPlaying || triangleTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying || triangleTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play traced path"}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadNoteBoard(triangleTraceDigits)}
                      disabled={triangleTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        triangleTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                      }`}
                    >
                      Send traced path to note board
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoundSource("triangle");
                        setActiveMode("sound");
                      }}
                      disabled={triangleTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        triangleTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-pink-500/30 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20"
                      }`}
                    >
                      Send traced path to Sound Lab
                    </button>
                    <button
                      type="button"
                      onClick={clearTriangleTrace}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                    >
                      Clear trace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Pentagon Instrument ──────────────────────────────────────── */}
          {activeMode === "pentagon" && (
            <div className="rounded-3xl border border-pink-800/30 bg-slate-900/60 p-4 sm:p-8">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  ⬠ Pentagon Instrument
                </h2>
                <p className="text-cyan-300 text-sm sm:text-base">
                  Trace the 60-step edge of a regular pentagon to turn shape into melody.
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">
                  5 sides × 12 steps each = 60 total points
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-3xl border border-slate-700/60 bg-slate-950/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      5 Sides
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      12 Steps Each
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                      Perimeter 60
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_60%)] p-4">
                    <svg
                      viewBox={`0 0 ${PENTAGON_VIEWBOX.width} ${PENTAGON_VIEWBOX.height}`}
                      className="w-full"
                      style={{ touchAction: "none" }}
                      onPointerDown={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          pentagonSteps,
                        );
                        if (idx === null) return;
                        event.preventDefault();
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        startPentagonTrace(idx);
                      }}
                      onPointerLeave={() => setPentagonHoveredStep(null)}
                      onPointerUp={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsPentagonTracing(false);
                      }}
                      onPointerCancel={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsPentagonTracing(false);
                      }}
                      onPointerMove={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          pentagonSteps,
                        );
                        setPentagonHoveredStep(idx);
                        if (idx !== null) {
                          extendPentagonTrace(idx);
                        }
                      }}
                    >
                      <polygon
                        points={Array.from({ length: 5 }, (_, i) => {
                          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                          return `${PENTAGON_CENTER.x + PENTAGON_RADIUS * Math.cos(angle)},${PENTAGON_CENTER.y + PENTAGON_RADIUS * Math.sin(angle)}`;
                        }).join(" ")}
                        fill="rgba(15,23,42,0.5)"
                        stroke="rgba(148,163,184,0.4)"
                        strokeWidth="3"
                      />
                      {Array.from({ length: 5 }, (_, i) => {
                        const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                        const a2 = (((i + 1) % 5) * 2 * Math.PI) / 5 - Math.PI / 2;
                        return (
                          <line
                            key={`pent-side-${i}`}
                            x1={PENTAGON_CENTER.x + PENTAGON_RADIUS * Math.cos(a1)}
                            y1={PENTAGON_CENTER.y + PENTAGON_RADIUS * Math.sin(a1)}
                            x2={PENTAGON_CENTER.x + PENTAGON_RADIUS * Math.cos(a2)}
                            y2={PENTAGON_CENTER.y + PENTAGON_RADIUS * Math.sin(a2)}
                            stroke={PENTAGON_COLORS[i]}
                            strokeWidth="10"
                            strokeLinecap="round"
                            opacity="0.82"
                          />
                        );
                      })}

                      {pentagonTracePolyline && (
                        <polyline
                          points={pentagonTracePolyline}
                          fill="none"
                          stroke="#F8FAFC"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      )}

                      {Array.from({ length: 5 }, (_, i) => {
                        const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                        const a2 = (((i + 1) % 5) * 2 * Math.PI) / 5 - Math.PI / 2;
                        const mx = (Math.cos(a1) + Math.cos(a2)) / 2;
                        const my = (Math.sin(a1) + Math.sin(a2)) / 2;
                        const len = Math.sqrt(mx * mx + my * my);
                        const labelX = PENTAGON_CENTER.x + (PENTAGON_RADIUS + 30) * (mx / len);
                        const labelY = PENTAGON_CENTER.y + (PENTAGON_RADIUS + 30) * (my / len);
                        return (
                          <text
                            key={`pent-label-${i}`}
                            x={labelX}
                            y={labelY}
                            fill={PENTAGON_COLORS[i]}
                            fontSize="18"
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            12
                          </text>
                        );
                      })}

                      {pentagonSteps.map((step) => {
                        const isHovered = pentagonHoveredStep === step.index;
                        const isActive = pentagonActiveStep === step.index;
                        const isTraced = pentagonTraceStepSet.has(step.index);
                        const radius = isActive ? 13 : isHovered ? 12 : isTraced ? 11 : 9.5;

                        return (
                          <g
                            key={`pentagon-step-${step.index}`}
                            data-step={step.index}
                            className="cursor-pointer"
                          >
                            <circle cx={step.x} cy={step.y} r={radius + 8} fill="transparent" />
                            <circle
                              cx={step.x}
                              cy={step.y}
                              r={radius}
                              fill={step.color}
                              stroke={isActive || isTraced ? "#F8FAFC" : "rgba(15,23,42,0.8)"}
                              strokeWidth={isActive ? 3 : 2}
                              opacity={isHovered || isActive ? 1 : 0.94}
                            />
                            <text
                              x={step.x}
                              y={step.y + 2.5}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontWeight="700"
                              fill="#020617"
                            >
                              {step.digit}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                      Pentagon phrase
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Perimeter
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          60
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Trace
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          {pentagonTraceDigits.length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        Active phrase
                      </div>
                      <p className="mt-2 min-h-[3rem] font-mono text-xs leading-6 text-cyan-200">
                        {pentagonTraceDigits.length
                          ? pentagonTraceDigits.join(" · ")
                          : "Trace the edge to capture a phrase."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(trianglePerimeterDigits)
                      }
                      disabled={isPlaying}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play perimeter"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(pentagonTraceDigits)
                      }
                      disabled={isPlaying || pentagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying || pentagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play traced path"}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadNoteBoard(pentagonTraceDigits)}
                      disabled={pentagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        pentagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                      }`}
                    >
                      Send traced path to note board
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoundSource("pentagon");
                        setActiveMode("sound");
                      }}
                      disabled={pentagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        pentagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-pink-500/30 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20"
                      }`}
                    >
                      Send traced path to Sound Lab
                    </button>
                    <button
                      type="button"
                      onClick={clearPentagonTrace}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                    >
                      Clear trace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Hexagon Instrument ───────────────────────────────────────── */}
          {activeMode === "hexagon" && (
            <div className="rounded-3xl border border-emerald-800/30 bg-slate-900/60 p-4 sm:p-8">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  ⬡ Hexagon Instrument
                </h2>
                <p className="text-cyan-300 text-sm sm:text-base">
                  Trace the 60-step edge of a regular hexagon to turn shape into melody.
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">
                  6 sides × 10 steps each = 60 total points
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-3xl border border-slate-700/60 bg-slate-950/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      6 Sides
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      10 Steps Each
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                      Perimeter 60
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_60%)] p-4">
                    <svg
                      viewBox={`0 0 ${HEXAGON_VIEWBOX.width} ${HEXAGON_VIEWBOX.height}`}
                      className="w-full"
                      style={{ touchAction: "none" }}
                      onPointerDown={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          hexagonSteps,
                        );
                        if (idx === null) return;
                        event.preventDefault();
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        startHexagonTrace(idx);
                      }}
                      onPointerLeave={() => setHexagonHoveredStep(null)}
                      onPointerUp={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsHexagonTracing(false);
                      }}
                      onPointerCancel={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsHexagonTracing(false);
                      }}
                      onPointerMove={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          hexagonSteps,
                        );
                        setHexagonHoveredStep(idx);
                        if (idx !== null) {
                          extendHexagonTrace(idx);
                        }
                      }}
                    >
                      <polygon
                        points={Array.from({ length: 6 }, (_, i) => {
                          const angle = (i * 2 * Math.PI) / 6;
                          return `${HEXAGON_CENTER.x + HEXAGON_RADIUS * Math.cos(angle)},${HEXAGON_CENTER.y + HEXAGON_RADIUS * Math.sin(angle)}`;
                        }).join(" ")}
                        fill="rgba(15,23,42,0.5)"
                        stroke="rgba(148,163,184,0.4)"
                        strokeWidth="3"
                      />
                      {Array.from({ length: 6 }, (_, i) => {
                        const a1 = (i * 2 * Math.PI) / 6;
                        const a2 = (((i + 1) % 6) * 2 * Math.PI) / 6;
                        return (
                          <line
                            key={`hex-side-${i}`}
                            x1={HEXAGON_CENTER.x + HEXAGON_RADIUS * Math.cos(a1)}
                            y1={HEXAGON_CENTER.y + HEXAGON_RADIUS * Math.sin(a1)}
                            x2={HEXAGON_CENTER.x + HEXAGON_RADIUS * Math.cos(a2)}
                            y2={HEXAGON_CENTER.y + HEXAGON_RADIUS * Math.sin(a2)}
                            stroke={HEXAGON_COLORS[i]}
                            strokeWidth="10"
                            strokeLinecap="round"
                            opacity="0.82"
                          />
                        );
                      })}

                      {hexagonTracePolyline && (
                        <polyline
                          points={hexagonTracePolyline}
                          fill="none"
                          stroke="#F8FAFC"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      )}

                      {Array.from({ length: 6 }, (_, i) => {
                        const a1 = (i * 2 * Math.PI) / 6;
                        const a2 = (((i + 1) % 6) * 2 * Math.PI) / 6;
                        const mx = (Math.cos(a1) + Math.cos(a2)) / 2;
                        const my = (Math.sin(a1) + Math.sin(a2)) / 2;
                        const len = Math.sqrt(mx * mx + my * my);
                        const labelX = HEXAGON_CENTER.x + (HEXAGON_RADIUS + 30) * (mx / len);
                        const labelY = HEXAGON_CENTER.y + (HEXAGON_RADIUS + 30) * (my / len);
                        return (
                          <text
                            key={`hex-label-${i}`}
                            x={labelX}
                            y={labelY}
                            fill={HEXAGON_COLORS[i]}
                            fontSize="18"
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            10
                          </text>
                        );
                      })}

                      {hexagonSteps.map((step) => {
                        const isHovered = hexagonHoveredStep === step.index;
                        const isActive = hexagonActiveStep === step.index;
                        const isTraced = hexagonTraceStepSet.has(step.index);
                        const radius = isActive ? 13 : isHovered ? 12 : isTraced ? 11 : 9.5;

                        return (
                          <g
                            key={`hexagon-step-${step.index}`}
                            data-step={step.index}
                            className="cursor-pointer"
                          >
                            <circle cx={step.x} cy={step.y} r={radius + 8} fill="transparent" />
                            <circle
                              cx={step.x}
                              cy={step.y}
                              r={radius}
                              fill={step.color}
                              stroke={isActive || isTraced ? "#F8FAFC" : "rgba(15,23,42,0.8)"}
                              strokeWidth={isActive ? 3 : 2}
                              opacity={isHovered || isActive ? 1 : 0.94}
                            />
                            <text
                              x={step.x}
                              y={step.y + 2.5}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontWeight="700"
                              fill="#020617"
                            >
                              {step.digit}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                      Hexagon phrase
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Perimeter
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          60
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Trace
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          {hexagonTraceDigits.length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        Active phrase
                      </div>
                      <p className="mt-2 min-h-[3rem] font-mono text-xs leading-6 text-cyan-200">
                        {hexagonTraceDigits.length
                          ? hexagonTraceDigits.join(" · ")
                          : "Trace the edge to capture a phrase."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(trianglePerimeterDigits)
                      }
                      disabled={isPlaying}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play perimeter"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(hexagonTraceDigits)
                      }
                      disabled={isPlaying || hexagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying || hexagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play traced path"}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadNoteBoard(hexagonTraceDigits)}
                      disabled={hexagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        hexagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                      }`}
                    >
                      Send traced path to note board
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoundSource("hexagon");
                        setActiveMode("sound");
                      }}
                      disabled={hexagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        hexagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-pink-500/30 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20"
                      }`}
                    >
                      Send traced path to Sound Lab
                    </button>
                    <button
                      type="button"
                      onClick={clearHexagonTrace}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                    >
                      Clear trace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Decagon Instrument ───────────────────────────────────────── */}
          {activeMode === "decagon" && (
            <div className="rounded-3xl border border-purple-800/30 bg-slate-900/60 p-4 sm:p-8">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  🔟 Decagon Instrument
                </h2>
                <p className="text-cyan-300 text-sm sm:text-base">
                  Trace the 60-step edge of a regular decagon to turn shape into melody.
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">
                  10 sides × 6 steps each = 60 total points
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-3xl border border-slate-700/60 bg-slate-950/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      10 Sides
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      6 Steps Each
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                      Perimeter 60
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_60%)] p-4">
                    <svg
                      viewBox={`0 0 ${DECAGON_VIEWBOX.width} ${DECAGON_VIEWBOX.height}`}
                      className="w-full"
                      style={{ touchAction: "none" }}
                      onPointerDown={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          decagonSteps,
                        );
                        if (idx === null) return;
                        event.preventDefault();
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        startDecagonTrace(idx);
                      }}
                      onPointerLeave={() => setDecagonHoveredStep(null)}
                      onPointerUp={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsDecagonTracing(false);
                      }}
                      onPointerCancel={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsDecagonTracing(false);
                      }}
                      onPointerMove={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          decagonSteps,
                        );
                        setDecagonHoveredStep(idx);
                        if (idx !== null) {
                          extendDecagonTrace(idx);
                        }
                      }}
                    >
                      <polygon
                        points={Array.from({ length: 10 }, (_, i) => {
                          const angle = (i * 2 * Math.PI) / 10;
                          return `${DECAGON_CENTER.x + DECAGON_RADIUS * Math.cos(angle)},${DECAGON_CENTER.y + DECAGON_RADIUS * Math.sin(angle)}`;
                        }).join(" ")}
                        fill="rgba(15,23,42,0.5)"
                        stroke="rgba(148,163,184,0.4)"
                        strokeWidth="3"
                      />
                      {Array.from({ length: 10 }, (_, i) => {
                        const a1 = (i * 2 * Math.PI) / 10;
                        const a2 = (((i + 1) % 10) * 2 * Math.PI) / 10;
                        return (
                          <line
                            key={`dec-side-${i}`}
                            x1={DECAGON_CENTER.x + DECAGON_RADIUS * Math.cos(a1)}
                            y1={DECAGON_CENTER.y + DECAGON_RADIUS * Math.sin(a1)}
                            x2={DECAGON_CENTER.x + DECAGON_RADIUS * Math.cos(a2)}
                            y2={DECAGON_CENTER.y + DECAGON_RADIUS * Math.sin(a2)}
                            stroke={DECAGON_COLORS[i]}
                            strokeWidth="10"
                            strokeLinecap="round"
                            opacity="0.82"
                          />
                        );
                      })}

                      {decagonTracePolyline && (
                        <polyline
                          points={decagonTracePolyline}
                          fill="none"
                          stroke="#F8FAFC"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      )}

                      {Array.from({ length: 10 }, (_, i) => {
                        const a1 = (i * 2 * Math.PI) / 10;
                        const a2 = (((i + 1) % 10) * 2 * Math.PI) / 10;
                        const mx = (Math.cos(a1) + Math.cos(a2)) / 2;
                        const my = (Math.sin(a1) + Math.sin(a2)) / 2;
                        const len = Math.sqrt(mx * mx + my * my);
                        const labelX = DECAGON_CENTER.x + (DECAGON_RADIUS + 30) * (mx / len);
                        const labelY = DECAGON_CENTER.y + (DECAGON_RADIUS + 30) * (my / len);
                        return (
                          <text
                            key={`dec-label-${i}`}
                            x={labelX}
                            y={labelY}
                            fill={DECAGON_COLORS[i]}
                            fontSize="16"
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            6
                          </text>
                        );
                      })}

                      {decagonSteps.map((step) => {
                        const isHovered = decagonHoveredStep === step.index;
                        const isActive = decagonActiveStep === step.index;
                        const isTraced = decagonTraceStepSet.has(step.index);
                        const radius = isActive ? 13 : isHovered ? 12 : isTraced ? 11 : 9.5;

                        return (
                          <g
                            key={`decagon-step-${step.index}`}
                            data-step={step.index}
                            className="cursor-pointer"
                          >
                            <circle cx={step.x} cy={step.y} r={radius + 8} fill="transparent" />
                            <circle
                              cx={step.x}
                              cy={step.y}
                              r={radius}
                              fill={step.color}
                              stroke={isActive || isTraced ? "#F8FAFC" : "rgba(15,23,42,0.8)"}
                              strokeWidth={isActive ? 3 : 2}
                              opacity={isHovered || isActive ? 1 : 0.94}
                            />
                            <text
                              x={step.x}
                              y={step.y + 2.5}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontWeight="700"
                              fill="#020617"
                            >
                              {step.digit}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                      Decagon phrase
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Perimeter
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          60
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Trace
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          {decagonTraceDigits.length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        Active phrase
                      </div>
                      <p className="mt-2 min-h-[3rem] font-mono text-xs leading-6 text-cyan-200">
                        {decagonTraceDigits.length
                          ? decagonTraceDigits.join(" · ")
                          : "Trace the edge to capture a phrase."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(trianglePerimeterDigits)
                      }
                      disabled={isPlaying}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play perimeter"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(decagonTraceDigits)
                      }
                      disabled={isPlaying || decagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying || decagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play traced path"}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadNoteBoard(decagonTraceDigits)}
                      disabled={decagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        decagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                      }`}
                    >
                      Send traced path to note board
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoundSource("decagon");
                        setActiveMode("sound");
                      }}
                      disabled={decagonTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        decagonTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-pink-500/30 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20"
                      }`}
                    >
                      Send traced path to Sound Lab
                    </button>
                    <button
                      type="button"
                      onClick={clearDecagonTrace}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                    >
                      Clear trace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Circle Instrument ────────────────────────────────────────── */}
          {activeMode === "circle" && (
            <div className="rounded-3xl border border-blue-800/30 bg-slate-900/60 p-4 sm:p-8">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  ⭕ Circle Instrument
                </h2>
                <p className="text-cyan-300 text-sm sm:text-base">
                  Trace 60 points around a circle to turn shape into melody.
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">
                  60 points equally spaced around the circumference
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-3xl border border-slate-700/60 bg-slate-950/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      1 Circle
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      60 Points
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                      Perimeter 60
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_60%)] p-4">
                    <svg
                      viewBox={`0 0 ${CIRCLE_VIEWBOX.width} ${CIRCLE_VIEWBOX.height}`}
                      className="w-full"
                      style={{ touchAction: "none" }}
                      onPointerDown={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          circleSteps,
                        );
                        if (idx === null) return;
                        event.preventDefault();
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        startCircleTrace(idx);
                      }}
                      onPointerLeave={() => setCircleHoveredStep(null)}
                      onPointerUp={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsCircleTracing(false);
                      }}
                      onPointerCancel={(event) => {
                        releasePointerCaptureIfNeeded(
                          event.currentTarget,
                          event.pointerId,
                        );
                        setIsCircleTracing(false);
                      }}
                      onPointerMove={(event) => {
                        const idx = closestTraceStepIndex(
                          event.currentTarget,
                          event,
                          circleSteps,
                        );
                        setCircleHoveredStep(idx);
                        if (idx !== null) {
                          extendCircleTrace(idx);
                        }
                      }}
                    >
                      <circle
                        cx={CIRCLE_CENTER.x}
                        cy={CIRCLE_CENTER.y}
                        r={CIRCLE_RADIUS}
                        fill="rgba(15,23,42,0.5)"
                        stroke={CIRCLE_COLOR}
                        strokeWidth="10"
                        opacity="0.9"
                      />

                      {circleTracePolyline && (
                        <polyline
                          points={circleTracePolyline}
                          fill="none"
                          stroke="#F8FAFC"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      )}

                      <text
                        x={CIRCLE_CENTER.x}
                        y={CIRCLE_CENTER.y}
                        fill={CIRCLE_COLOR}
                        fontSize="18"
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        60 pts
                      </text>

                      {circleSteps.map((step) => {
                        const isHovered = circleHoveredStep === step.index;
                        const isActive = circleActiveStep === step.index;
                        const isTraced = circleTraceStepSet.has(step.index);
                        const radius = isActive ? 13 : isHovered ? 12 : isTraced ? 11 : 9.5;

                        return (
                          <g
                            key={`circle-step-${step.index}`}
                            data-step={step.index}
                            className="cursor-pointer"
                          >
                            <circle cx={step.x} cy={step.y} r={radius + 8} fill="transparent" />
                            <circle
                              cx={step.x}
                              cy={step.y}
                              r={radius}
                              fill={step.color}
                              stroke={isActive || isTraced ? "#F8FAFC" : "rgba(15,23,42,0.8)"}
                              strokeWidth={isActive ? 3 : 2}
                              opacity={isHovered || isActive ? 1 : 0.94}
                            />
                            <text
                              x={step.x}
                              y={step.y + 2.5}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontWeight="700"
                              fill="#020617"
                            >
                              {step.digit}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                      Circle phrase
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Perimeter
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          60
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Trace
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          {circleTraceDigits.length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        Active phrase
                      </div>
                      <p className="mt-2 min-h-[3rem] font-mono text-xs leading-6 text-cyan-200">
                        {circleTraceDigits.length
                          ? circleTraceDigits.join(" · ")
                          : "Trace the edge to capture a phrase."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(trianglePerimeterDigits)
                      }
                      disabled={isPlaying}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play perimeter"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void playCustomSequence(circleTraceDigits)
                      }
                      disabled={isPlaying || circleTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPlaying || circleTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Play traced path"}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadNoteBoard(circleTraceDigits)}
                      disabled={circleTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        circleTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                      }`}
                    >
                      Send traced path to note board
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoundSource("circle");
                        setActiveMode("sound");
                      }}
                      disabled={circleTraceDigits.length === 0}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        circleTraceDigits.length === 0
                          ? "bg-slate-800 text-slate-500"
                          : "border border-pink-500/30 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20"
                      }`}
                    >
                      Send traced path to Sound Lab
                    </button>
                    <button
                      type="button"
                      onClick={clearCircleTrace}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                    >
                      Clear trace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Sound Lab ───────────────────────────────────────────────── */}
          {activeMode === "sound" && (
            <div className="bg-slate-900/60 rounded-3xl p-5 sm:p-10 border border-pink-800/30">
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-300 mb-2">
                  🎵 Sound Lab
                </h2>
                <p className="text-pink-300 text-base sm:text-lg mb-1">
                  Tap any bar to hear its DNA note, or play the selected toolkit
                  phrase as a melody.
                </p>
                <p className="text-slate-500 text-xs italic mb-6">
                  Guide tip: the toolkit window drives this chart live, so you
                  can test smaller loops without losing the main strand
                </p>
                <button
                  onClick={() => void playCustomSequence(soundLabSequence)}
                  disabled={isPlaying}
                  className={`px-8 py-4 sm:px-12 sm:py-5 rounded-2xl font-bold text-lg sm:text-2xl transition-all shadow-2xl ${
                    isPlaying
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-500/40 active:scale-95"
                  }`}
                >
                  {isPlaying ? "🎵 Playing..." : "▶ Play Selected Phrase"}
                </button>
                <p className="mt-3 text-xs text-cyan-300/80">
                  Source:{" "}
                  <span className="font-semibold text-cyan-200">
                    {soundSourceLabel}
                  </span>
                  .{" "}
                  {soundSource !== "toolkit" ? (
                    <>
                      Showing {soundLabSequence.length} digits traced around the{" "}
                      <span className="font-semibold text-cyan-200">
                        60-step {soundSource}
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Showing {soundLabSequence.length} digits with the{" "}
                      <span className="font-semibold text-cyan-200">
                        {toolTransform}
                      </span>{" "}
                      transform.
                    </>
                  )}
                </p>
              </div>

              {/*
                FIX: Use items-end on the grid so all bars align at the bottom
                (equalizer / bar-chart style). Previously bars grew from the top,
                making the chart look inverted.
                Each button uses flex-col-reverse so the note label sits below
                the bar regardless of bar height.
              */}
              <div
                className="grid grid-cols-10 gap-1 max-w-4xl mx-auto items-end"
                style={{ height: "170px" }}
              >
                {soundLabSequence.map((digit, i) => (
                  <button
                    key={i}
                    type="button"
                    className="flex flex-col items-center justify-end h-full group focus:outline-none focus:ring-2 focus:ring-pink-400/60 rounded"
                    onPointerDown={() => void playDigit(digit)}
                  >
                    <div
                      className="w-full rounded-t transition-all group-active:brightness-150 group-hover:brightness-125"
                      style={{
                        height: `${Math.max(8, (digit + 1) * 14)}px`,
                        backgroundColor: digitToColor(digit),
                        boxShadow: `0 0 6px 1px ${digitToColor(digit)}66`,
                      }}
                    />
                    <div className="text-[8px] text-slate-500 mt-0.5 leading-none shrink-0">
                      {digitToNote(digit)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Guided Journey ──────────────────────────────────────────── */}
          {activeMode === "journey" && (
            <div className="bg-slate-900/60 rounded-3xl p-5 sm:p-10 border border-amber-800/30">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-300 mb-2 text-center">
                  🧭 Guided Journey
                </h2>
                <p className="text-center text-slate-400 text-sm mb-8 italic">
                  Setup wizard — configure parameters, then launch any activity
                  mode
                </p>

                <div className="space-y-5">
                  <JourneyStep
                    step={1}
                    icon="🌱"
                    title="Awaken the Seed"
                    desc="Choose which DNA strand the class will explore"
                  >
                    <div className="flex gap-3 justify-center flex-wrap">
                      {(["red", "black", "blue"] as SeedKey[]).map((seed) => (
                        <button
                          key={seed}
                          onClick={() => setSelectedSeed(seed)}
                          className={`px-6 py-3 rounded-xl font-bold transition-all ${
                            selectedSeed === seed
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/40 scale-105"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {seed === "red"
                            ? "🔴 Fire"
                            : seed === "blue"
                              ? "🔵 Water"
                              : "⚫ Earth"}
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">
                      Each seed is a unique 60-digit number sequence with its
                      own colour and sound fingerprint.
                    </p>
                  </JourneyStep>

                  <JourneyStep
                    step={2}
                    icon="🎼"
                    title="Set the Rhythm"
                    desc="Controls melody playback speed in Sound Lab"
                  >
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="60"
                        max="180"
                        value={tempo}
                        onChange={(e) => updateTempo(parseInt(e.target.value, 10))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-amber-400"
                      />
                      <div className="text-center text-2xl font-bold text-amber-400 font-mono">
                        {tempo} BPM
                      </div>
                    </div>
                  </JourneyStep>

                  <JourneyStep
                    step={3}
                    icon="🔢"
                    title="Harmony Number"
                    desc="Sets symmetry arms in Studio mode and helix count in Spiral"
                  >
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[3, 5, 7, 9, 12].map((num) => (
                        <button
                          key={num}
                          onClick={() => updateHarmony(num)}
                          className={`w-14 h-14 rounded-full font-bold text-lg transition-all ${
                            harmony === num
                              ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/40 scale-110"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  <JourneyStep
                    step={4}
                    icon="🚀"
                    title="Launch a Mode"
                    desc="Send the class into their activity path"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          mode: "spiral",
                          label: "🌀 Enter Helix",
                          cls: "from-blue-600   to-blue-700   shadow-blue-500/40",
                        },
                        {
                          mode: "mandala",
                          label: "🔮 Paint Studio",
                          cls: "from-purple-600 to-purple-700 shadow-purple-500/40",
                        },
                        {
                          mode: "triangle",
                          label: "📐 Triangle Instrument",
                          cls: "from-cyan-600   to-teal-700   shadow-cyan-500/40",
                        },
                        {
                          mode: "sound",
                          label: "🎵 Sound Lab",
                          cls: "from-pink-600   to-pink-700   shadow-pink-500/40",
                        },
                      ].map(({ mode, label, cls }) => (
                        <button
                          key={mode}
                          onClick={() => setActiveMode(mode as ModeKey)}
                          className={`px-4 py-3 bg-gradient-to-br ${cls} rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── About section ────────────────────────────────────────────────── */}
        <div className="mt-10 text-center">
          <details className="bg-slate-900/40 rounded-xl p-5 sm:p-6 border border-slate-700/30 text-left">
            <summary className="cursor-pointer text-lg font-bold text-amber-300 hover:text-amber-200 transition-colors text-center list-none">
              📖 About This Experience
            </summary>
            <div className="mt-5 text-slate-300 space-y-3 max-w-3xl mx-auto text-sm sm:text-base">
              <p>
                <strong className="text-amber-400">Digital DNA</strong> turns
                three core number sequences into geometry and sound you can
                explore with touch, stylus, or mouse. Every digit is
                simultaneously a{" "}
                <strong className="text-blue-400">shape + colour</strong> and a{" "}
                <strong className="text-pink-400">musical note</strong>.
              </p>
              <p>
                The <strong className="text-cyan-300">strand roster</strong> and
                <strong className="text-amber-300"> ownership chart</strong> now
                show who owns each dominant colour, note, number, and shape, so
                the system reads like a playable score instead of hidden lore.
              </p>
              <p>
                Use the{" "}
                <strong className="text-purple-400">Guided Journey</strong> as
                an all-ages setup guide before launching any interactive mode.
                The seed, harmony, tempo, and toolkit phrase settings all carry
                over.
              </p>
              <p className="text-slate-500 text-xs">
                Sessions auto-track: modes visited, total interactions, and
                melody plays.
              </p>
            </div>
          </details>
        </div>

        {/* ── Lesson overlays ──────────────────────────────────────────────── */}

        {/* Finish lesson button */}
        {lessonContext && preAcknowledged && !showPostPrompt && (
          <div className="fixed right-4 z-50 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-6">
            <button
              type="button"
              onClick={() => completeLesson()}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
              Finish Lesson
            </button>
          </div>
        )}

        {/* Pre-prompt modal */}
        {lessonContext?.prePrompt && !preAcknowledged && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
            <div className="max-w-md mx-4 rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 space-y-4 shadow-2xl">
              <p className="text-lg font-semibold text-cyan-200">
                Before you begin&hellip;
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {lessonContext.prePrompt}
              </p>
              <button
                type="button"
                onClick={() => setPreAcknowledged(true)}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all active:scale-95"
              >
                Got it, let&apos;s explore!
              </button>
            </div>
          </div>
        )}

        {/* Post-prompt modal */}
        {showPostPrompt && lessonContext?.postPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
            <div className="max-w-md mx-4 rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 space-y-4 shadow-2xl">
              <p className="text-lg font-semibold text-emerald-200">
                Reflect on your exploration
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {lessonContext.postPrompt}
              </p>
              <textarea
                value={postResponse}
                onChange={(e) => setPostResponse(e.target.value)}
                placeholder="Share your thoughts…"
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="button"
                onClick={() => {
                  completeLesson(postResponse);
                }}
                disabled={!postResponse.trim()}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all active:scale-95"
              >
                Submit &amp; Complete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── JourneyStep sub-component ────────────────────────────────────────────────

function JourneyStep({
  step,
  icon,
  title,
  desc,
  children,
}: {
  step: number;
  icon: string;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl sm:text-5xl shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-widest">
            Step {step}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-1 leading-tight">
            {title}
          </h3>
          <p className="text-blue-300 text-sm sm:text-base leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
