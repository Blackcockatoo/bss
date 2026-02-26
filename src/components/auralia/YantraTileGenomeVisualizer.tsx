import React, { useEffect, useRef } from 'react';

type Field = {
  seed: string;
  red: string;
  black: string;
  blue: string;
  ring: number[];
  pulse: number[];
  hash: (msg: string) => bigint;
  prng: () => number;
  fib: (n: number) => bigint;
  lucas: (n: number) => bigint;
};

type Form = {
  name: string;
  baseColor: string;
  primaryGold: string;
  secondaryGold: string;
  tealAccent: string;
  eyeColor: string;
  glowColor: string;
  description: string;
};

type YantraTileGenomeVisualizerProps = {
  energy: number;        // 0-100
  curiosity: number;     // 0-100
  bond: number;          // 0-100
  red60: number;         // 0-100 (Spine Energy)
  blue60: number;        // 0-100 (Form Integrity)
  black60: number;       // 0-100 (Mystery Halo)
  field: Field;          // MossPrimeSeed field
  currentForm: Form;     // Guardian form state
  activatedPoints: Set<number>;  // Which sigils are activated
  onTileClick?: (tileIndex: number) => void;
  width?: number;        // Default 600
  height?: number;       // Default 400
  className?: string;
};

type Tile = {
  cx: number;
  cy: number;
  radius: number;
  phase: number;
  offset: number;
  sigilIndex: number;
};

// Fibonacci-60 cycle (mod 10)
const buildFib60 = (): number[] => {
  const digits: number[] = [];
  let a = 0;
  let b = 1;
  for (let i = 0; i < 60; i++) {
    digits.push(a % 10);
    const next = (a + b) % 10;
    a = b;
    b = next;
  }
  return digits;
};

const FIB60 = buildFib60();

// Lukas string [2,1,3,4,7,1,8,9,7,6,3,9] summing to 60
const LUKAS = [2, 1, 3, 4, 7, 1, 8, 9, 7, 6, 3, 9];
const LUKAS_BOUNDS = (() => {
  const bounds = [0];
  let s = 0;
  for (const d of LUKAS) {
    s += d;
    bounds.push(s);
  }
  return bounds;
})();

// Which Lukas sector (0-11) does index k (0-59) belong to?
const sectorForIndex = (k: number): number => {
  for (let s = 0; s < 12; s++) {
    if (k >= LUKAS_BOUNDS[s] && k < LUKAS_BOUNDS[s + 1]) return s;
  }
  return 11;
};

// Color palette for digits 0-9 (matching HTML and YantraMorphBackdrop)
const PALETTE = [
  '#0b3c5d', // 0: deep blue
  '#ff7f0e', // 1: orange
  '#2ca02c', // 2: green
  '#d62728', // 3: red
  '#9467bd', // 4: purple
  '#8c564b', // 5: brown
  '#e377c2', // 6: pink
  '#7f7f7f', // 7: grey
  '#bcbd22', // 8: yellow-green
  '#17becf'  // 9: cyan
];

// Utility: hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

// Utility: blend two hex colors
const blendColors = (color1: string, color2: string, ratio: number): string => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const r = Math.floor(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.floor(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.floor(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Utility: clamp value
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

// Calculate circle position for point i
const circlePos = (tile: Tile, i: number, timeShift: number): { x: number; y: number } => {
  const angle = (2 * Math.PI * (i + timeShift)) / 60;
  return {
    x: tile.cx + tile.radius * Math.cos(angle),
    y: tile.cy + tile.radius * Math.sin(angle)
  };
};

// Calculate triangle position for point i (20 points per edge)
const trianglePos = (tile: Tile, i: number): { x: number; y: number } => {
  const base = tile.radius * 2 * 0.85;
  const height = tile.radius * 2 * 0.85;
  const x0 = tile.cx - base / 2;
  const y0 = tile.cy + height / 2; // bottom-left

  let x: number, y: number;
  if (i < 20) {
    // Bottom edge
    const t = i / 19;
    x = x0 + base * t;
    y = y0;
  } else if (i < 40) {
    // Left edge
    const t = (i - 20) / 19;
    x = x0;
    y = y0 - height * t;
  } else {
    // Hypotenuse (right edge)
    const t = (i - 40) / 19;
    const x1 = x0;
    const y1 = y0 - height;
    const x2 = x0 + base;
    const y2 = y0;
    x = x1 + (x2 - x1) * t;
    y = y1 + (y2 - y1) * t;
  }
  return { x, y };
};

export const YantraTileGenomeVisualizer: React.FC<YantraTileGenomeVisualizerProps> = ({
  energy,
  curiosity,
  bond,
  red60,
  blue60,
  black60,
  field,
  currentForm,
  activatedPoints,
  onTileClick,
  width = 600,
  height = 400,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tilesRef = useRef<Tile[]>([]);

  // Determine tile count based on form
  const getTileCount = (formName: string): number => {
    if (formName === 'Celestial Voyager') return 12;
    if (formName === 'Wild Verdant') return 9;
    return 7; // Base for all other forms
  };

  const tileCount = getTileCount(currentForm.name);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI support
    const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(ratio, ratio);

    // Generate tile layout
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.32;
    const radiusVariance = (bond / 100) * 0.15; // Bond affects spread
    const radius = baseRadius * (1 + radiusVariance);

    tilesRef.current = Array.from({ length: tileCount }, (_, i) => {
      const angle = (2 * Math.PI * i) / tileCount - Math.PI / 2; // Start from top
      const wobble = Math.sin(i * 1.3) * 8; // Slight offset per tile

      return {
        cx: centerX + (radius + wobble) * Math.cos(angle),
        cy: centerY + (radius + wobble) * Math.sin(angle),
        radius: Math.min(width, height) * 0.08, // Tile size
        phase: i * Math.PI * 0.7, // Unique phase per tile
        offset: (i * 7) % 60, // Offset into Fibonacci-60 sequence
        sigilIndex: i % 7 // Which sigil this tile corresponds to
      };
    });

    // Animation loop
    let running = true;
    let rafId = 0;

    const drawFrame = (timestamp: number) => {
      if (!running) return;
      const t = timestamp / 1000; // Convert to seconds

      ctx.clearRect(0, 0, width, height);

      // Calculate genome-driven morph factor
      const baseMorph = 0.5 + 0.5 * Math.sin(t * 0.5); // Autonomous oscillation
      const genomeMorph = baseMorph * (0.5 + (red60 / 100) * 0.5); // Red-60 biases morph
      const stabilizedMorph = genomeMorph * (0.8 + (blue60 / 100) * 0.2); // Blue-60 reduces variance

      // Calculate vital-responsive values
      const energySpeed = 0.5 + (energy / 100) * 1.5; // 0.5x to 2x speed
      const curiosityOffset = (curiosity / 100) * 60; // Shifts Fibonacci sequence
      const bondBreathing = 1 + 0.15 * Math.sin(t * 1.2 + bond / 50); // Breathing effect

      // Black-60 controls glow/ring opacity
      const glowOpacity = black60 / 100;
      const ringOpacity = 0.05 + (black60 / 100) * 0.15;

      // Draw each tile
      for (const tile of tilesRef.current) {
        const adjustedRadius = tile.radius * bondBreathing;

        // Per-tile phase calculation
        const tilePhase = tile.phase + t * energySpeed;
        const timeShift = tilePhase / (2 * Math.PI);

        // Draw 3 rings (60, 108, 216 cycles)
        ctx.save();
        ctx.strokeStyle = `${currentForm.tealAccent}${Math.floor(ringOpacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 0.6;

        const r1 = adjustedRadius * 0.6;
        const r2 = adjustedRadius * 0.85;
        const r3 = adjustedRadius * 1.05;

        ctx.beginPath(); ctx.arc(tile.cx, tile.cy, r1, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(tile.cx, tile.cy, r2, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(tile.cx, tile.cy, r3, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        // Draw 60 Fibonacci points per tile
        for (let i = 0; i < 60; i++) {
          const k = (i + tile.offset + Math.floor(curiosityOffset)) % 60; // Fibonacci index
          const digit = FIB60[k];
          const sector = sectorForIndex(k); // Lukas sector 0-11
          const sectorDigit = LUKAS[sector];

          // Circle and triangle positions
          const cPos = circlePos({ ...tile, radius: adjustedRadius }, i, timeShift);
          const triPos = trianglePos({ ...tile, radius: adjustedRadius }, i);

          // Interpolate based on morph
          let x = cPos.x * (1 - stabilizedMorph) + triPos.x * stabilizedMorph;
          let y = cPos.y * (1 - stabilizedMorph) + triPos.y * stabilizedMorph;

          // Apply Lukas radial scaling (sector-based push/pull)
          const dx = x - tile.cx;
          const dy = y - tile.cy;
          const radialScale = 0.75 + 0.3 * (sectorDigit / 9);
          x = tile.cx + dx * radialScale;
          y = tile.cy + dy * radialScale;

          // Color: blend Fibonacci palette with form colors
          const baseColor = PALETTE[digit % PALETTE.length];
          const blendedColor = blendColors(baseColor, currentForm.tealAccent, 0.3);
          const rgb = hexToRgb(blendedColor);

          // Brightness pulse
          const pulse = 0.6 +
                        0.25 * Math.sin(t * 2 + digit + tile.phase) +
                        0.1 * ((sectorDigit - 5) / 5);

          const R = clamp(Math.floor(rgb.r * pulse), 0, 255);
          const G = clamp(Math.floor(rgb.g * pulse), 0, 255);
          const B = clamp(Math.floor(rgb.b * pulse), 0, 255);

          ctx.fillStyle = `rgb(${R},${G},${B})`;
          const size = 2 + (energy / 100) * 2;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // Draw activation glow if sigil is activated
        if (activatedPoints.has(tile.sigilIndex)) {
          ctx.save();
          ctx.strokeStyle = currentForm.primaryGold;
          ctx.lineWidth = 3;
          ctx.globalAlpha = glowOpacity * 0.8;
          ctx.beginPath();
          ctx.arc(tile.cx, tile.cy, adjustedRadius * 1.15, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [width, height, energy, curiosity, bond, red60, blue60, black60, currentForm, activatedPoints, tileCount]);

  // Handle canvas clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTileClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find which tile was clicked
    for (let i = 0; i < tilesRef.current.length; i++) {
      const tile = tilesRef.current[i];
      const dx = x - tile.cx;
      const dy = y - tile.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= tile.radius * 1.2) {
        onTileClick(i);
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className={`${className} cursor-pointer`}
      aria-label="Yantra genome tile visualizer - click tiles to activate sigils"
      role="img"
    />
  );
};

export default YantraTileGenomeVisualizer;
