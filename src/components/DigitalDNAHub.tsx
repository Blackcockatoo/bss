'use client';

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
 *  particles– Physics particle field. Touch pulls constellations; multiple
 *             simultaneous touch points create interference patterns.
 *  sound    – Bar-chart piano. Tap any bar to play its DNA note, or play
 *             the full sequence as a melody.
 *  journey  – Guided step-by-step setup that feeds all other modes.
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import * as THREE from 'three';
import * as Tone from 'tone';
import { useEducationStore } from '@/lib/education';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonContext {
  lessonId: string;
  studentAlias: string;
  prePrompt: string | null;
  postPrompt: string | null;
}

type SeedKey = 'red' | 'black' | 'blue';
type ModeKey = 'spiral' | 'mandala' | 'sound' | 'particles' | 'journey';

interface PaintPoint { x: number; y: number }

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  digit: number;
  color: string;
  size: number;
  mass: number;
}



// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Three core number sequences — each encodes a unique DNA strand that
 * drives every visual and sonic output in the hub.
 */
const SEEDS: Record<SeedKey, string> = {
  red:   '113031491493585389543778774590997079619617525721567332336510',
  black: '011235831459437077415617853819099875279651673033695493257291',
  blue:  '012776329785893036118967145479098334781325217074992143965631',
};

/** Musical scale — each digit 0-9 maps to a note via index. */
const SCALE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'] as const;

/**
 * Colour palette for the 3-D helix spheres, mandala dots, and particle field.
 * Ordered so digit 0 = deep indigo, digit 9 = warm salmon.
 */
const COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483', '#8b5cf6',
  '#ffd700', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181',
] as const;

/**
 * Bright palette for dark canvas backgrounds — distinct from COLORS because
 * the main palette's first four entries (#1a1a2e … #533483) are effectively
 * invisible at low alpha on dark surfaces. Used by helix, mandala, particles.
 */
const LEARNING_COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
  '#38bdf8', '#4ade80', '#facc15', '#fb923c', '#e879f9',
] as const;

const MAX_PIXEL_RATIO     = 2;
const MIN_SURFACE         = 260;  // px — minimum canvas dimension on any axis
const MAX_PAINT_POINTS    = 6000;
const INTERACTION_THROTTLE_MS = 34; // ~29 fps interaction sampling


// ─── Canvas helper types ─────────────────────────────────────────────────────

interface Ripple {
  x: number; y: number;
  radius: number;
  speed: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

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
  return LEARNING_COLORS[clamp(Math.round(digit), 0, LEARNING_COLORS.length - 1)];
}

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
  canvas.style.display = 'block'; // prevent inline-element baseline gap
  canvas.style.width   = `${width}px`;
  canvas.style.height  = `${height}px`;
  canvas.width  = Math.floor(width  * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext('2d');
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
    y: clamp(e.clientY - rect.top,  0, rect.height),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DigitalDNAHub({ lessonContext }: { lessonContext?: LessonContext }) {

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeMode,    setActiveMode]    = useState<ModeKey>('spiral');
  const [selectedSeed,  setSelectedSeed]  = useState<SeedKey>('red');
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [audioReady,    setAudioReady]    = useState(false);  // display-only; logic uses ref
  const [consciousness, setConsciousness] = useState(50);
  const [harmony,       setHarmony]       = useState(7);
  const [tempo,         setTempo]         = useState(120);
  const [paintedPattern, setPaintedPattern] = useState<PaintPoint[]>([]);

  // Lesson flow
  const [showPostPrompt,  setShowPostPrompt]  = useState(false);
  const [postResponse,    setPostResponse]    = useState('');
  const [preAcknowledged, setPreAcknowledged] = useState(!lessonContext?.prePrompt);

  // Mission tracking
  const [sessionInteractions, setSessionInteractions] = useState(0);
  const [playCount,           setPlayCount]           = useState(0);
  const [visitedModes,        setVisitedModes]        = useState<ModeKey[]>(['spiral']);

  // ── Store actions ─────────────────────────────────────────────────────────
  const incrementDnaInteraction = useEducationStore((s) => s.incrementDnaInteraction);
  const recordPostResponse      = useEducationStore((s) => s.recordPostResponse);
  const completeLesson          = useEducationStore((s) => s.completeLesson);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const canvasRef             = useRef<HTMLCanvasElement>(null);  // Three.js spiral
  const surfaceCanvasRef      = useRef<HTMLCanvasElement>(null);  // 2-D modes
  const synthRef              = useRef<Tone.PolySynth | null>(null);
  const particlesRef          = useRef<Particle[]>([]);
  const paintedPatternRef     = useRef<PaintPoint[]>([]);
  const lessonInteractionRef  = useRef(0);
  const sessionInteractionRef = useRef(0);
  const lastInteractionMsRef  = useRef(0);

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
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }, []);

  const trackLessonInteraction = useCallback(() => {
    if (!lessonContext) return;
    lessonInteractionRef.current += 1;
    if (lessonInteractionRef.current % 5 === 0) {
      incrementDnaInteraction(lessonContext.lessonId, lessonContext.studentAlias);
    }
  }, [lessonContext, incrementDnaInteraction]);

  // Flush remaining lesson interactions on unmount
  useEffect(() => {
    return () => {
      if (lessonContext && lessonInteractionRef.current % 5 !== 0) {
        incrementDnaInteraction(lessonContext.lessonId, lessonContext.studentAlias);
      }
    };
  }, [lessonContext, incrementDnaInteraction]);

  /** Throttled interaction counter — force=true bypasses the throttle. */
  const registerInteraction = useCallback((force = false) => {
    const now = performance.now();
    if (!force && now - lastInteractionMsRef.current < INTERACTION_THROTTLE_MS) return;
    lastInteractionMsRef.current = now;
    sessionInteractionRef.current += 1;
    setSessionInteractions(sessionInteractionRef.current);
    trackLessonInteraction();
  }, [trackLessonInteraction]);

  /** Returns the digit array for the currently selected seed. */
  const getSequence = useCallback(
    () => SEEDS[selectedSeed].split('').map(Number),
    [selectedSeed],
  );

  // ── Audio ─────────────────────────────────────────────────────────────────

  /**
   * FIX: No dependencies → always the same function reference.
   * Uses audioInitializedRef to avoid listing `audioInitialized` as a dep,
   * which previously re-created the callback and invalidated all canvas effects.
   */
  const ensureAudio = useCallback(async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    if (!audioInitializedRef.current) {
      audioInitializedRef.current = true;
      setAudioReady(true);
    }
  }, []);

  const playChord = useCallback((digits: number[]) => {
    if (!synthRef.current) return;
    synthRef.current.triggerAttackRelease(digits.map(digitToNote), '8n');
  }, []);

  const playDigit = useCallback(async (digit: number) => {
    await ensureAudio();
    playChord([digit]);
    registerInteraction();
  }, [ensureAudio, playChord, registerInteraction]);

  // Initialise PolySynth + Reverb once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || synthRef.current) return;
    const synth  = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope:   { attack: 0.08, decay: 0.2, sustain: 0.3, release: 0.8 },
    }).toDestination();
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).toDestination();
    synth.connect(reverb);
    synthRef.current = synth;
  }, []);

  // Track visited modes for mission card
  useEffect(() => {
    setVisitedModes((prev) => prev.includes(activeMode) ? prev : [...prev, activeMode]);
  }, [activeMode]);

  /** Play the full 60-digit DNA sequence as a melody. */
  const playSequence = useCallback(async () => {
    await ensureAudio();
    setIsPlaying(true);
    setPlayCount((c) => c + 1);

    const sequence = getSequence();
    const now      = Tone.now();
    const interval = 60 / tempo;

    sequence.slice(0, 60).forEach((digit, i) => {
      synthRef.current?.triggerAttackRelease(
        digitToNote(digit),
        interval * 0.8,
        now + i * interval,
      );
    });

    setTimeout(() => setIsPlaying(false), sequence.slice(0, 60).length * interval * 1000);
    registerInteraction(true);
  }, [ensureAudio, getSequence, tempo, registerInteraction]);

  // ── Keep paint ref in sync with state ────────────────────────────────────
  useEffect(() => { paintedPatternRef.current = paintedPattern; }, [paintedPattern]);

  const clearPaintedPattern = useCallback(() => {
    paintedPatternRef.current = [];
    setPaintedPattern([]);
    registerInteraction(true);
  }, [registerInteraction]);

  // ══════════════════════════════════════════════════════════════════════════
  // 3-D Spiral (Three.js WebGL)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!canvasRef.current || activeMode !== 'spiral') return;

    const canvas = canvasRef.current;
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    // Initial aspect ratio will be corrected by resize() immediately below
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 1000);
    camera.position.z = 22;

    /**
     * FIX: Pass `true` (default) so Three.js manages canvas.style.width/height.
     * Previously we called setSize(w, h, false) and manually set inline styles,
     * creating a timing race where styles were applied before the renderer existed.
     */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    // display:block prevents an inline-element baseline gap that can collapse
    // the parent container to 0 height before JS sets explicit dimensions.
    canvas.style.display = 'block';

    // Lighting — three-point rig for vivid colour separation
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const pl1 = new THREE.PointLight(0xffd700, 2.2); pl1.position.set(10,  10,  10); scene.add(pl1);
    const pl2 = new THREE.PointLight(0x44aaff, 1.4); pl2.position.set(-10, -10,   8); scene.add(pl2);
    const pl3 = new THREE.PointLight(0xff44cc, 0.9); pl3.position.set(0,   12, -12); scene.add(pl3);

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
    const group    = new THREE.Group();
    const spheres: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>[] = [];

    // Node materials — one per digit, animated each frame
    const sharedMats = Array.from({ length: 10 }, (_, d) =>
      new THREE.MeshPhongMaterial({
        color:             new THREE.Color(digitToLearningColor(d)),
        emissive:          new THREE.Color(digitToLearningColor(d)),
        emissiveIntensity: 0.6,
        shininess:         140,
        specular:          new THREE.Color(0xffffff),
      })
    );

    // Backbone colours — one distinct glowing colour per strand
    const STRAND_COLS = [0x44ddff, 0xff6699, 0x88ff55, 0xffcc22, 0xcc88ff, 0x22ffcc, 0xff8844, 0x4488ff, 0xff44cc, 0x88ffdd];
    // One backbone material per strand (reused for every segment on that strand)
    const backboneMats = Array.from({ length: harmony }, (_, h) =>
      new THREE.LineBasicMaterial({ color: STRAND_COLS[h % STRAND_COLS.length], opacity: 0.75, transparent: true })
    );
    // One bridge material per digit (coloured base-pair rungs)
    const bridgeMats = Array.from({ length: 10 }, (_, d) =>
      new THREE.LineBasicMaterial({ color: new THREE.Color(digitToLearningColor(d)), opacity: 0.9, transparent: true })
    );

    // Build each strand and record world-space node positions for bridges
    const helixPositions: THREE.Vector3[][] = [];

    for (let helix = 0; helix < harmony; helix++) {
      const helixGroup  = new THREE.Group();
      const angleOffset = (helix * Math.PI * 2) / harmony;
      const positions: THREE.Vector3[] = [];

      for (let i = 0; i < sequence.length; i++) {
        const digit  = sequence[i];
        const t      = i / 9;
        const radius = 3 + (digit / 10) * 2.4;
        const angle  = angleOffset + t * Math.PI * 0.58;
        const pos    = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, t - 10);
        positions.push(pos);

        const geo    = new THREE.SphereGeometry(0.18 + digit * 0.022, 16, 16);
        const sphere = new THREE.Mesh(geo, sharedMats[digit]);
        sphere.position.copy(pos);
        sphere.userData = { digit, index: i };
        spheres.push(sphere);
        helixGroup.add(sphere);

        // Backbone segment — consistent strand colour, NOT per-digit
        if (i > 0) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([positions[i - 1], pos]);
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
    const starPos   = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, sizeAttenuation: true });
    const stars   = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Responsive resize ─────────────────────────────────────────────────
    const resize = () => {
      const host = canvas.parentElement;
      if (!host) return;
      const w = Math.round(clamp(host.clientWidth, MIN_SURFACE, 980));
      const h = Math.round(clamp(
        Math.min(w * 0.72, window.innerHeight * 0.62),
        280, 760,
      ));
      // Three.js manages canvas style when updateStyle=true (the default)
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    // ── Interaction ───────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2(2, 2); // off-screen default

    const pointers   = new Map<number, { x: number; y: number }>();
    let pinchDist    = 0;
    let targetRotX   = 0;
    let targetRotY   = 0;
    let rotX         = 0;
    let rotY         = 0;
    let hovered: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> | null = null;
    let lastToneAt   = 0;

    const setPointer = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      pointer.x =  ((clientX - r.left) / r.width)  * 2 - 1;
      pointer.y = -((clientY - r.top)  / r.height) * 2 + 1;
    };

    const probeSpheres = () => {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(spheres, false)[0]
        ?.object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> | undefined;

      if (hovered && hovered !== hit) { hovered.material.emissiveIntensity = 0.45; hovered = null; }
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
      if (pointers.size !== 2) { pinchDist = 0; return; }
      const [a, b] = Array.from(pointers.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) {
        camera.position.z = clamp(camera.position.z - (d - pinchDist) * 0.03, 8, 38);
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
          targetRotX  = clamp(targetRotX + (e.clientY - prev.y) * 0.003, -1.2, 1.2);
          registerInteraction();
        }
        updatePinch();
      }
      setPointer(e.clientX, e.clientY);
      probeSpheres();
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      updatePinch();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = clamp(camera.position.z + e.deltaY * 0.01, 8, 38);
    };

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown',   onDown);
    canvas.addEventListener('pointermove',   onMove);
    canvas.addEventListener('pointerup',     onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel',         onWheel, { passive: false });

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
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown',   onDown);
      canvas.removeEventListener('pointermove',   onMove);
      canvas.removeEventListener('pointerup',     onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel',         onWheel);
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
  }, [activeMode, selectedSeed, harmony, getSequence, playChord, ensureAudio, registerInteraction, pulseHaptic]);

  // ══════════════════════════════════════════════════════════════════════════
  // Symmetry Studio (2-D paint canvas)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!surfaceCanvasRef.current || activeMode !== 'mandala') return;

    const canvas   = surfaceCanvasRef.current;
    let setup      = setupHiDpiCanvas(canvas, 800, 800);
    if (!setup) return;

    let { ctx, width: W, height: H } = setup;
    let cx = W / 2, cy = H / 2;

    const pointers  = new Map<number, { x: number; y: number; drawing: boolean }>();
    let lastToneAt  = 0;
    const sequence  = getSequence();

    const resize = () => {
      const host = canvas.parentElement;
      if (!host) return;
      const side = Math.round(clamp(
        Math.min(host.clientWidth, window.innerHeight * 0.62),
        MIN_SURFACE, 860,
      ));
      setup = setupHiDpiCanvas(canvas, side, side);
      if (!setup) return;
      ({ ctx, width: W, height: H } = setup);
      cx = W / 2; cy = H / 2;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    /** Paint a point with rotational symmetry (harmony-fold mirror). */
    const addSymmetricPaint = (x: number, y: number) => {
      const dx   = x - cx, dy = y - cy;
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
        paintedPatternRef.current.splice(0, paintedPatternRef.current.length - MAX_PAINT_POINTS);
      }

      const ringSpacing = Math.max(24, Math.min(W, H) / 11);
      const digit = Math.floor((dist / ringSpacing) % 10);
      const now   = performance.now();
      if (now - lastToneAt > 95) { playChord([digit]); lastToneAt = now; }
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
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      setPaintedPattern([...paintedPatternRef.current]);
    };

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown',   onDown);
    canvas.addEventListener('pointermove',   onMove);
    canvas.addEventListener('pointerup',     onUp);
    canvas.addEventListener('pointercancel', onUp);

    let animId = 0;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      const now = performance.now() * 0.001; // seconds — drives all animations
      const rs  = Math.max(24, Math.min(W, H) / 11);
      const seg = harmony * 12;

      // Deep background — vibrant purple centre fading to near-black
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.62);
      bg.addColorStop(0,   '#1e1060');
      bg.addColorStop(0.4, '#0e0d38');
      bg.addColorStop(1,   '#050818');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // DNA ring dots — two-pass bloom + time-animated size
      for (let ring = 0; ring < 7; ring++) {
        const r = (ring + 1) * rs;
        for (let i = 0; i < seg; i++) {
          const a     = (i / seg) * Math.PI * 2 - Math.PI / 2;
          const digit = sequence[(ring * seg + i) % sequence.length];
          const nx    = cx + Math.cos(a) * r;
          const ny    = cy + Math.sin(a) * r;
          const color = digitToLearningColor(digit);

          // Animated size — each ring and position pulses at its own phase
          const base   = 2.6 + digit * 0.5;
          const sz     = base + Math.sin(now * 1.7 + ring * 0.65 + i * 0.09) * 0.9;

          // Halo pass — large dim bloom
          ctx.beginPath();
          ctx.arc(nx, ny, sz * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `${color}1a`; // ~10% opacity
          ctx.fill();

          // Core pass — vivid + glow
          ctx.beginPath();
          ctx.arc(nx, ny, sz, 0, Math.PI * 2);
          ctx.fillStyle   = color;
          ctx.shadowBlur  = 18;
          ctx.shadowColor = color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Symmetry guide lines — animated opacity, ice-blue tint
      ctx.lineWidth = 1.3;
      for (let i = 0; i < harmony; i++) {
        const a1    = (i / harmony) * Math.PI * 2 - Math.PI / 2;
        const a2    = ((i + Math.max(2, Math.floor(harmony / 3))) / harmony) * Math.PI * 2 - Math.PI / 2;
        const alpha = (0.22 + Math.sin(now * 0.7 + i * 0.55) * 0.14).toFixed(2);
        ctx.strokeStyle = `rgba(160,220,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * rs * 1.6, cy + Math.sin(a1) * rs * 1.6);
        ctx.lineTo(cx + Math.cos(a2) * rs * 1.6, cy + Math.sin(a2) * rs * 1.6);
        ctx.stroke();
      }

      // User paint points — learning palette cycling, with glow
      paintedPatternRef.current.forEach((pt, idx) => {
        const color    = digitToLearningColor(idx % 10);
        const alpha    = 0.5 + (idx % harmony) / (harmony * 1.4);
        const hexAlpha = Math.floor(Math.min(alpha, 1) * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle   = `${color}${hexAlpha}`;
        ctx.shadowBlur  = 14;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown',   onDown);
      canvas.removeEventListener('pointermove',   onMove);
      canvas.removeEventListener('pointerup',     onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [activeMode, selectedSeed, harmony, getSequence, ensureAudio, playChord, registerInteraction, pulseHaptic]);

  // ══════════════════════════════════════════════════════════════════════════
  // Particle Field (2-D physics canvas)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!surfaceCanvasRef.current || activeMode !== 'particles') return;

    const canvas  = surfaceCanvasRef.current;
    let setup     = setupHiDpiCanvas(canvas, 800, 800);
    if (!setup) return;

    let { ctx, width: W, height: H } = setup;
    const sequence  = getSequence();
    const pointers  = new Map<number, { x: number; y: number; strength: number }>();
    const ripples: Ripple[] = [];

    const rebuildParticles = () => {
      const count = clamp(Math.round((W * H) / 4800), 100, 240);
      particlesRef.current = Array.from({ length: count }, (_, i) => {
        const digit = sequence[i % sequence.length];
        return {
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
          // Use the bright learning palette — the main COLORS palette is too dark
          // (entries 0-3 are near-black, invisible on a dark canvas)
          digit, color: digitToLearningColor(digit),
          size: 2.2 + digit * 0.38, mass: digit + 1,
        };
      });
    };

    const resize = () => {
      const host = canvas.parentElement;
      if (!host) return;
      const side = Math.round(clamp(
        Math.min(host.clientWidth, window.innerHeight * 0.62),
        MIN_SURFACE, 900,
      ));
      setup = setupHiDpiCanvas(canvas, side, side);
      if (!setup) return;
      ({ ctx, width: W, height: H } = setup);
      rebuildParticles();
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    /** Spawn a coloured ripple ring — colour is driven by the DNA digit at that point. */
    const spawnRipple = (x: number, y: number, digit: number, intensity = 1) => {
      ripples.push({
        x, y,
        radius: 6, speed: 1.8 + intensity * 0.9,
        alpha: 0.82, color: digitToLearningColor(digit), lineWidth: 2.4,
      });
    };

    const digitAt = (x: number) =>
      sequence[Math.floor((x / Math.max(1, W)) * sequence.length) % sequence.length];

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      const pt    = localPointFromEvent(canvas, e);
      const digit = digitAt(pt.x);
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { ...pt, strength: Math.max(0.3, e.pressure || 0.8) });
      void ensureAudio().then(() => playChord([digit]));
      pulseHaptic(9);
      spawnRipple(pt.x, pt.y, digit, 1.4);
      registerInteraction(true);
    };
    const onMove = (e: PointerEvent) => {
      const pt = localPointFromEvent(canvas, e);
      if (e.pointerType === 'mouse' && !pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { ...pt, strength: 0.45 });
      }
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { ...pt, strength: Math.max(0.25, e.pressure || 0.6) });
      registerInteraction();
    };
    const onUp = (e: PointerEvent) => {
      const upPt  = localPointFromEvent(canvas, e);
      const digit = digitAt(upPt.x);
      spawnRipple(upPt.x, upPt.y, digit, 0.9);
      pointers.delete(e.pointerId);
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') pointers.delete(e.pointerId);
    };

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown',   onDown);
    canvas.addEventListener('pointermove',   onMove);
    canvas.addEventListener('pointerup',     onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave',  onLeave);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Lower alpha → longer ghost trails (0.07 keeps ~93% of previous frame)
      ctx.fillStyle = 'rgba(8,11,28,0.07)';
      ctx.fillRect(0, 0, W, H);

      const t = performance.now() * 0.001;

      // Lemniscate (figure-8) idle attractor — more organic than a plain circle
      const idleSin = Math.sin(t * 0.38);
      const attractors = pointers.size
        ? Array.from(pointers.values())
        : [{
            x: W / 2 + Math.sin(t * 0.38) * W * 0.26,
            y: H / 2 + Math.sin(t * 0.76) * H * 0.20 * idleSin,
            strength: 0.38,
          }];

      // ── Physics + draw particles ────────────────────────────────────────
      for (const p of particlesRef.current) {
        for (const a of attractors) {
          const dx = a.x - p.x, dy = a.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 280) {
            const sd    = Math.max(dist, 0.0001);
            const force = ((280 - dist) / 280) * 0.088 * a.strength * (0.5 + consciousness / 100);
            p.vx += (dx / sd) * force / p.mass;
            p.vy += (dy / sd) * force / p.mass;
          }
        }

        // Gentle centering drift so particles never cluster at edges forever
        p.vx += (W / 2 - p.x) * 0.00008;
        p.vy += (H / 2 - p.y) * 0.00008;

        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.983; p.vy *= 0.983;
        if (p.x < 0 || p.x > W) p.vx *= -0.88;
        if (p.y < 0 || p.y > H) p.vy *= -0.88;
        p.x = clamp(p.x, 0, W); p.y = clamp(p.y, 0, H);

        // Core glow — two-pass bloom: large dim halo + bright centre
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle   = `${p.color}28`; // 16% opacity halo
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = 14;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Constellation lines — alpha fades with distance ─────────────────
      const pts       = particlesRef.current;
      const LINE_DIST = 115;
      ctx.lineWidth = 0.9;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < LINE_DIST) {
            const alpha = ((1 - d / LINE_DIST) * 0.55).toFixed(2);
            ctx.strokeStyle = `rgba(180,220,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // ── Coloured ripple rings ───────────────────────────────────────────
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed; r.alpha -= 0.016; r.lineWidth *= 0.993;
        if (r.alpha <= 0.02) { ripples.splice(i, 1); continue; }
        const hexAlpha = Math.floor(r.alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${r.color}${hexAlpha}`;
        ctx.lineWidth   = r.lineWidth;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = r.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown',   onDown);
      canvas.removeEventListener('pointermove',   onMove);
      canvas.removeEventListener('pointerup',     onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave',  onLeave);
    };
  }, [activeMode, selectedSeed, consciousness, getSequence, ensureAudio, playChord, registerInteraction, pulseHaptic]);

  // ══════════════════════════════════════════════════════════════════════════
  // Mission cards & mode metadata
  // ══════════════════════════════════════════════════════════════════════════

  const missionCards = [
    {
      id: 'modes',      title: 'Explore 3 Modes',
      progress: `${Math.min(visitedModes.length, 3)}/3`,
      done: visitedModes.length >= 3,
    },
    {
      id: 'touches',    title: 'Make 40 Touches',
      progress: `${Math.min(sessionInteractions, 40)}/40`,
      done: sessionInteractions >= 40,
    },
    {
      id: 'melody',     title: 'Play a DNA Melody',
      progress: playCount > 0 ? 'Done ✓' : 'Pending',
      done: playCount > 0,
    },
  ];

  const modes: { id: ModeKey; icon: string; label: string; desc: string }[] = [
    { id: 'spiral',    icon: '🌀', label: 'DNA Helix',      desc: 'Drag · pinch · tap nodes' },
    { id: 'mandala',   icon: '🔮', label: 'Symmetry Studio', desc: 'Finger-paint symmetry'    },
    { id: 'particles', icon: '✨', label: 'Particle Field',  desc: 'Guide constellations'     },
    { id: 'sound',     icon: '🎵', label: 'Sound Lab',   desc: 'Tap bars to play notes'   },
    { id: 'journey',   icon: '🧭', label: 'Guided Journey', desc: 'All-ages setup guide'   },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-amber-50 pb-40">

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
              Lesson mode — student: <strong>{lessonContext.studentAlias}</strong>
            </p>
          )}
          <p className="text-sm text-slate-400 italic mt-1">
            Works with fingers, stylus, trackpad, and mouse.
          </p>
        </div>

        {/* ── Mission cards ────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {missionCards.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border px-4 py-3 transition-colors ${
                m.done
                  ? 'border-emerald-400/60 bg-emerald-500/10'
                  : 'border-slate-700/60 bg-slate-900/40'
              }`}
            >
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">
                {m.done ? '✓ Completed' : 'Learning Mission'}
              </div>
              <div className="text-sm font-semibold text-amber-100">{m.title}</div>
              <div className="text-xs mt-1 text-cyan-300 font-mono">{m.progress}</div>
            </div>
          ))}
        </div>

        {/* ── Mode selector ─────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`group relative min-h-[104px] rounded-2xl px-3 py-3 transition-all duration-300 ${
                activeMode === mode.id
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl shadow-amber-500/35 scale-[1.03]'
                  : 'bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/40 hover:border-slate-500/60'
              }`}
            >
              <div className="text-3xl mb-1">{mode.icon}</div>
              <div className="text-sm font-bold leading-tight">{mode.label}</div>
              <div className="text-[11px] text-slate-300 mt-1 leading-tight">{mode.desc}</div>
              {activeMode === mode.id && (
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 blur opacity-25 -z-10" />
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            Active mode panels
            NOTE: backdrop-blur-sm has been removed from all canvas container
            divs. It creates a GPU stacking-context conflict that blanks WebGL
            and 2-D canvas output in many Chrome/Safari/driver combinations.
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-10">

          {/* ── Spiral ──────────────────────────────────────────────────── */}
          {activeMode === 'spiral' && (
            <div className="bg-slate-900/60 rounded-3xl p-4 sm:p-8 border border-blue-800/30">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  🌀 DNA Helix Explorer
                </h2>
                <p className="text-blue-300 text-sm sm:text-base">
                  Drag to rotate · pinch to zoom · hover/tap glowing spheres for notes
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
              <div className="flex justify-center" style={{ minHeight: '300px' }}>
                <canvas
                  ref={canvasRef}
                  className="rounded-xl shadow-2xl shadow-blue-900/60 border border-blue-700/30"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* ── Mandala ─────────────────────────────────────────────────── */}
          {activeMode === 'mandala' && (
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
              <div className="flex justify-center" style={{ minHeight: '300px' }}>
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

          {/* ── Particles ───────────────────────────────────────────────── */}
          {activeMode === 'particles' && (
            <div className="bg-slate-900/60 rounded-3xl p-4 sm:p-8 border border-cyan-800/30">
              <div className="text-center mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  ✨ Particle Field
                </h2>
                <p className="text-cyan-300 text-sm sm:text-base">
                  Touch to pull constellations · multiple fingers create interference waves
                </p>
              </div>

              <div className="flex justify-center" style={{ minHeight: '300px' }}>
                <canvas
                  ref={surfaceCanvasRef}
                  className="rounded-xl shadow-2xl shadow-cyan-900/60 border border-cyan-700/30"
                />
              </div>

              {/* Focus bar — right below the canvas for immediate access */}
              <div className="mt-6 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="consciousness-slider" className="text-sm font-semibold text-cyan-300">
                    ✦ Focus
                  </label>
                  <span className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
                    {consciousness}%
                  </span>
                </div>
                <input
                  id="consciousness-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={consciousness}
                  onChange={(e) => setConsciousness(parseInt(e.target.value, 10))}
                  className="w-full h-4 rounded-full appearance-none cursor-pointer bg-slate-700 accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-0.5">
                  <span>Calm drift</span>
                  <span>Particles respond more strongly to touch →</span>
                  <span>Full pull</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Sound Lab ───────────────────────────────────────────────── */}
          {activeMode === 'sound' && (
            <div className="bg-slate-900/60 rounded-3xl p-5 sm:p-10 border border-pink-800/30">
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-300 mb-2">
                  🎵 Sound Lab
                </h2>
                <p className="text-pink-300 text-base sm:text-lg mb-1">
                  Tap any bar to hear its DNA note, or play the full sequence as a melody.
                </p>
                <p className="text-slate-500 text-xs italic mb-6">
                  Guide tip: change the Seed (bottom bar) to hear different DNA sound patterns
                </p>
                <button
                  onClick={playSequence}
                  disabled={isPlaying}
                  className={`px-8 py-4 sm:px-12 sm:py-5 rounded-2xl font-bold text-lg sm:text-2xl transition-all shadow-2xl ${
                    isPlaying
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-500/40 active:scale-95'
                  }`}
                >
                  {isPlaying ? '🎵 Playing...' : '▶ Play Full DNA Melody'}
                </button>
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
                style={{ height: '170px' }}
              >
                {getSequence().slice(0, 60).map((digit, i) => (
                  <button
                    key={i}
                    type="button"
                    className="flex flex-col items-center justify-end h-full group focus:outline-none focus:ring-2 focus:ring-pink-400/60 rounded"
                    onPointerDown={() => void playDigit(digit)}
                  >
                    <div
                      className="w-full rounded-t transition-all group-active:brightness-150 group-hover:brightness-125"
                      style={{
                        height:          `${Math.max(8, (digit + 1) * 14)}px`,
                        backgroundColor: digitToColor(digit),
                        boxShadow:       `0 0 6px 1px ${digitToColor(digit)}66`,
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
          {activeMode === 'journey' && (
            <div className="bg-slate-900/60 rounded-3xl p-5 sm:p-10 border border-amber-800/30">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-300 mb-2 text-center">
                  🧭 Guided Journey
                </h2>
                <p className="text-center text-slate-400 text-sm mb-8 italic">
                  Setup wizard — configure parameters, then launch any activity mode
                </p>

                <div className="space-y-5">

                  <JourneyStep step={1} icon="🌱" title="Awaken the Seed" desc="Choose which DNA strand the class will explore">
                    <div className="flex gap-3 justify-center flex-wrap">
                      {(['red', 'black', 'blue'] as SeedKey[]).map((seed) => (
                        <button
                          key={seed}
                          onClick={() => setSelectedSeed(seed)}
                          className={`px-6 py-3 rounded-xl font-bold transition-all ${
                            selectedSeed === seed
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/40 scale-105'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {seed === 'red' ? '🔴 Fire' : seed === 'blue' ? '🔵 Water' : '⚫ Earth'}
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">
                      Each seed is a unique 60-digit number sequence with its own colour and sound fingerprint.
                    </p>
                  </JourneyStep>

                  <JourneyStep step={2} icon="🎼" title="Set the Rhythm" desc="Controls melody playback speed in Sound Lab">
                    <div className="space-y-2">
                      <input
                        type="range" min="60" max="180" value={tempo}
                        onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-amber-400"
                      />
                      <div className="text-center text-2xl font-bold text-amber-400 font-mono">{tempo} BPM</div>
                    </div>
                  </JourneyStep>

                  <JourneyStep step={3} icon="✨" title="Focus Level" desc="How strongly touch pulls the particle field — higher = more dramatic">
                    <div className="space-y-2">
                      <input
                        type="range" min="0" max="100" value={consciousness}
                        onChange={(e) => setConsciousness(parseInt(e.target.value, 10))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-cyan-400"
                      />
                      <div className="text-center text-2xl font-bold text-cyan-400 font-mono">{consciousness}%</div>
                    </div>
                  </JourneyStep>

                  <JourneyStep step={4} icon="🔢" title="Harmony Number" desc="Sets symmetry arms in Studio mode and helix count in Spiral">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[3, 5, 7, 9, 12].map((num) => (
                        <button
                          key={num}
                          onClick={() => setHarmony(num)}
                          className={`w-14 h-14 rounded-full font-bold text-lg transition-all ${
                            harmony === num
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/40 scale-110'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  <JourneyStep step={5} icon="🚀" title="Launch a Mode" desc="Send the class into their activity path">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { mode: 'spiral',    label: '🌀 Enter Helix',      cls: 'from-blue-600   to-blue-700   shadow-blue-500/40'   },
                        { mode: 'mandala',   label: '🔮 Paint Studio',    cls: 'from-purple-600 to-purple-700 shadow-purple-500/40' },
                        { mode: 'particles', label: '✨ Guide Particles',  cls: 'from-cyan-600   to-cyan-700   shadow-cyan-500/40'   },
                        { mode: 'sound',     label: '🎵 Sound Lab',     cls: 'from-pink-600   to-pink-700   shadow-pink-500/40'   },
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

        {/* ── Fixed bottom control bar ─────────────────────────────────────── */}
        <div className="fixed left-1/2 z-40 w-[min(96vw,62rem)] -translate-x-1/2 rounded-2xl border border-amber-600/30 bg-slate-900/95 px-3 py-3 shadow-2xl shadow-amber-500/20 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:rounded-full md:px-7 md:py-4 md:w-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 md:flex-nowrap md:gap-6">

            {/* Seed selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-400">Seed</span>
              {(['red', 'blue', 'black'] as SeedKey[]).map((seed) => (
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(seed)}
                  title={seed === 'red' ? 'Fire' : seed === 'blue' ? 'Water' : 'Earth'}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all ${
                    selectedSeed === seed
                      ? 'scale-110 shadow-lg ring-2 ring-white/50'
                      : 'opacity-55 hover:opacity-90'
                  }`}
                  style={{
                    backgroundColor: seed === 'red' ? '#ef4444' : seed === 'blue' ? '#3b82f6' : '#374151',
                  }}
                />
              ))}
            </div>

            <div className="h-7 w-px bg-slate-700 hidden md:block" />

            {/* Harmony display */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-400">Harmony</span>
              <span className="text-amber-400 font-bold font-mono">{harmony}</span>
            </div>

            <div className="h-7 w-px bg-slate-700 hidden md:block" />

            {/* Focus slider — always accessible in the bottom bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-400 shrink-0">✦ Focus {consciousness}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={consciousness}
                onChange={(e) => setConsciousness(parseInt(e.target.value, 10))}
                title="Focus level — particle attraction strength"
                className="w-24 sm:w-32 h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-cyan-400"
              />
            </div>

            <div className="h-7 w-px bg-slate-700 hidden md:block" />

            {/* Audio status */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`inline-block w-2 h-2 rounded-full ${audioReady ? 'bg-emerald-400' : 'bg-slate-600'}`}
              />
              <span>{audioReady ? 'Audio on' : 'Tap to enable audio'}</span>
            </div>

            <div className="h-7 w-px bg-slate-700 hidden md:block" />

            {/* Play button */}
            <button
              onClick={playSequence}
              disabled={isPlaying}
              className={`px-5 py-2 rounded-full font-bold transition-all ${
                isPlaying
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-500/30 active:scale-95'
              }`}
            >
              {isPlaying ? '🎵 Playing' : '▶ Play'}
            </button>

          </div>
        </div>

        {/* ── About section ────────────────────────────────────────────────── */}
        <div className="mt-10 text-center">
          <details className="bg-slate-900/40 rounded-xl p-5 sm:p-6 border border-slate-700/30 text-left">
            <summary className="cursor-pointer text-lg font-bold text-amber-300 hover:text-amber-200 transition-colors text-center list-none">
              📖 About This Experience
            </summary>
            <div className="mt-5 text-slate-300 space-y-3 max-w-3xl mx-auto text-sm sm:text-base">
              <p>
                <strong className="text-amber-400">Digital DNA</strong> turns three core number
                sequences into geometry and sound you can explore with touch, stylus, or mouse.
                Every digit is simultaneously a <strong className="text-blue-400">shape + colour</strong> and
                a <strong className="text-pink-400">musical note</strong>.
              </p>
              <p>
                Use the <strong className="text-purple-400">Guided Journey</strong> as an all-ages
                setup guide before launching any interactive mode. The seed, harmony,
                awareness level, and tempo all carry over.
              </p>
              <p className="text-slate-500 text-xs">
                Sessions auto-track: modes visited, total interactions, and melody plays.
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
              onClick={() => {
                if (lessonContext.postPrompt) {
                  setShowPostPrompt(true);
                } else {
                  completeLesson(lessonContext.lessonId, lessonContext.studentAlias);
                }
              }}
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
              <p className="text-lg font-semibold text-cyan-200">Before you begin&hellip;</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{lessonContext.prePrompt}</p>
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
              <p className="text-lg font-semibold text-emerald-200">Reflect on your exploration</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{lessonContext.postPrompt}</p>
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
                  if (postResponse.trim()) {
                    recordPostResponse(lessonContext.lessonId, lessonContext.studentAlias, postResponse.trim());
                  }
                  completeLesson(lessonContext.lessonId, lessonContext.studentAlias);
                  setShowPostPrompt(false);
                }}
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

/**
 * Reusable step card used in the Guided Journey mode.
 * Keeps the numbered step header consistent and reduces repetition.
 */
function JourneyStep({
  step, icon, title, desc, children,
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
          <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-widest">Step {step}</div>
          <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-1 leading-tight">{title}</h3>
          <p className="text-blue-300 text-sm sm:text-base leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
