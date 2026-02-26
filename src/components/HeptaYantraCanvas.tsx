'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  timestamp: number;
}

type YantraPattern = 'triangle' | 'hexagram' | 'heptagram' | 'spiral' | 'cross' | 'circle' | 'unknown';

interface YantraResult {
  pattern: YantraPattern;
  confidence: number;
  residueActivation: number[]; // Which Jewble residues (0-59) get activated
  energy: number; // Energy bonus for pet
  message: string;
}

interface HeptaYantraCanvasProps {
  size?: number;
  onYantraComplete?: (result: YantraResult) => void;
  jewbleDigits?: { red: number[]; blue: number[]; black: number[] };
  className?: string;
}

const YANTRA_MESSAGES: Record<YantraPattern, string[]> = {
  triangle: [
    'The fire element awakens.',
    'Tejas rises through your offering.',
    'Three points align in sacred geometry.',
  ],
  hexagram: [
    'As above, so below.',
    'The Star of Balance emerges.',
    'Six directions harmonize.',
  ],
  heptagram: [
    'The seven-fold seal activates.',
    'HeptaCode resonance detected.',
    'The mystic heptagram unlocks hidden frequencies.',
  ],
  spiral: [
    'The golden spiral unfolds.',
    'Evolution spirals inward.',
    'Kundalini stirs in response.',
  ],
  cross: [
    'Four elements intersect.',
    'The crossroads of possibility.',
    'Cardinal directions anchor the field.',
  ],
  circle: [
    'Unity complete, the wheel turns.',
    'Wholeness radiates outward.',
    'The eternal cycle continues.',
  ],
  unknown: [
    'An unknown sigil... the field watches.',
    'Chaotic energy disperses.',
    'The pattern seeks meaning.',
  ],
};

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function analyzePattern(strokes: Stroke[]): YantraResult {
  const allPoints = strokes.flatMap(s => s.points);
  if (allPoints.length < 10) {
    return {
      pattern: 'unknown',
      confidence: 0,
      residueActivation: [],
      energy: 1,
      message: YANTRA_MESSAGES.unknown[0],
    };
  }

  const center = centroid(allPoints);
  const distances = allPoints.map(p => distance(p, center));
  const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const distVariance = distances.reduce((a, d) => a + (d - avgDist) ** 2, 0) / distances.length;
  const distStdDev = Math.sqrt(distVariance);

  // Calculate angles from center to detect shape
  const angles = allPoints.map(p => Math.atan2(p.y - center.y, p.x - center.x));
  const sortedAngles = [...angles].sort((a, b) => a - b);

  // Detect number of distinct angular clusters (vertices)
  const angleThreshold = Math.PI / 12; // 15 degrees
  let vertices = 1;
  for (let i = 1; i < sortedAngles.length; i++) {
    if (sortedAngles[i] - sortedAngles[i - 1] > angleThreshold) {
      vertices++;
    }
  }

  // Circularity check (low variance = circle)
  const circularity = 1 - Math.min(1, distStdDev / avgDist);

  // Detect spiral by checking if radius increases/decreases consistently
  let spiralScore = 0;
  if (allPoints.length > 20) {
    const windowSize = Math.floor(allPoints.length / 10);
    let increasing = 0;
    let decreasing = 0;
    for (let i = windowSize; i < allPoints.length; i++) {
      const prevDist = distance(allPoints[i - windowSize], center);
      const currDist = distance(allPoints[i], center);
      if (currDist > prevDist) increasing++;
      else if (currDist < prevDist) decreasing++;
    }
    const total = increasing + decreasing;
    spiralScore = total > 0 ? Math.max(increasing, decreasing) / total : 0;
  }

  // Cross detection - check for perpendicular strokes
  let crossScore = 0;
  if (strokes.length >= 2) {
    const strokeAngles = strokes.map(s => {
      if (s.points.length < 2) return 0;
      const first = s.points[0];
      const last = s.points[s.points.length - 1];
      return Math.atan2(last.y - first.y, last.x - first.x);
    });
    for (let i = 0; i < strokeAngles.length; i++) {
      for (let j = i + 1; j < strokeAngles.length; j++) {
        const angleDiff = Math.abs(strokeAngles[i] - strokeAngles[j]);
        const normalizedDiff = Math.min(angleDiff, Math.PI - angleDiff);
        if (Math.abs(normalizedDiff - Math.PI / 2) < Math.PI / 8) {
          crossScore += 0.5;
        }
      }
    }
  }

  // Determine pattern
  let pattern: YantraPattern = 'unknown';
  let confidence = 0;

  if (circularity > 0.85) {
    pattern = 'circle';
    confidence = circularity;
  } else if (spiralScore > 0.7) {
    pattern = 'spiral';
    confidence = spiralScore;
  } else if (crossScore >= 1) {
    pattern = 'cross';
    confidence = Math.min(1, crossScore);
  } else if (vertices >= 6 && vertices <= 8) {
    if (vertices === 7) {
      pattern = 'heptagram';
      confidence = 0.9;
    } else {
      pattern = 'hexagram';
      confidence = 0.8;
    }
  } else if (vertices >= 3 && vertices <= 4) {
    pattern = 'triangle';
    confidence = 0.75;
  } else {
    pattern = 'unknown';
    confidence = 0.3;
  }

  // Generate residue activations based on pattern
  const residueActivation: number[] = [];
  const seed = allPoints.length + strokes.length * 7;

  switch (pattern) {
    case 'triangle':
      // Activate every 20th residue (3 points)
      residueActivation.push(0, 20, 40);
      break;
    case 'hexagram':
      // Activate every 10th residue (6 points)
      for (let i = 0; i < 60; i += 10) residueActivation.push(i);
      break;
    case 'heptagram':
      // Activate 7 residues based on seed
      for (let i = 0; i < 7; i++) {
        residueActivation.push((seed + i * 8 + Math.floor(i * 8.57)) % 60);
      }
      break;
    case 'spiral':
      // Activate sequential residues
      const start = seed % 60;
      for (let i = 0; i < 12; i++) {
        residueActivation.push((start + i * 5) % 60);
      }
      break;
    case 'cross':
      // Activate cardinal directions
      residueActivation.push(0, 15, 30, 45);
      break;
    case 'circle':
      // Activate all multiples of 6
      for (let i = 0; i < 60; i += 6) residueActivation.push(i);
      break;
    default:
      // Random activation
      for (let i = 0; i < 4; i++) {
        residueActivation.push((seed * (i + 1)) % 60);
      }
  }

  // Calculate energy based on pattern and confidence
  const energyMap: Record<YantraPattern, number> = {
    triangle: 5,
    hexagram: 8,
    heptagram: 12,
    spiral: 7,
    cross: 6,
    circle: 10,
    unknown: 2,
  };

  const energy = Math.round(energyMap[pattern] * confidence);
  const messages = YANTRA_MESSAGES[pattern];
  const message = messages[Math.floor(seed % messages.length)];

  return {
    pattern,
    confidence,
    residueActivation,
    energy,
    message,
  };
}

export function HeptaYantraCanvas({
  size = 300,
  onYantraComplete,
  jewbleDigits,
  className,
}: HeptaYantraCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastResult, setLastResult] = useState<YantraResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Draw background grid and Jewble residue markers
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.42;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Draw outer circle guide
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Draw 60 residue tick marks
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const innerR = radius * 0.9;
      const outerR = radius;
      const isMajor = i % 10 === 0;

      ctx.lineWidth = isMajor ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * innerR,
        centerY + Math.sin(angle) * innerR
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * outerR,
        centerY + Math.sin(angle) * outerR
      );
      ctx.stroke();
    }

    // Draw Jewble digit markers if provided
    if (jewbleDigits) {
      const drawDigits = (digits: number[], color: string, ringRadius: number) => {
        digits.forEach(d => {
          const angle = (d / 60) * Math.PI * 2 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * ringRadius;
          const y = centerY + Math.sin(angle) * ringRadius;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      };

      drawDigits(jewbleDigits.red, 'rgba(251, 113, 133, 0.7)', radius * 0.35);
      drawDigits(jewbleDigits.blue, 'rgba(56, 189, 248, 0.7)', radius * 0.55);
      drawDigits(jewbleDigits.black, 'rgba(167, 139, 250, 0.7)', radius * 0.75);
    }

    // Draw activated residues from last result
    if (lastResult && showResult) {
      lastResult.residueActivation.forEach(r => {
        const angle = (r / 60) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [size, jewbleDigits, lastResult, showResult]);

  // Draw all strokes
  const drawStrokes = useCallback((ctx: CanvasRenderingContext2D) => {
    const allStrokes = [...strokes, { points: currentStroke, timestamp: Date.now() }];

    allStrokes.forEach((stroke, strokeIndex) => {
      if (stroke.points.length < 2) return;

      const gradient = ctx.createLinearGradient(
        stroke.points[0].x,
        stroke.points[0].y,
        stroke.points[stroke.points.length - 1].x,
        stroke.points[stroke.points.length - 1].y
      );
      gradient.addColorStop(0, '#22d3ee');
      gradient.addColorStop(0.5, '#a855f7');
      gradient.addColorStop(1, '#ec4899');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p0 = stroke.points[i - 1];
        const p1 = stroke.points[i];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }

      ctx.stroke();
    });
  }, [strokes, currentStroke]);

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);
    drawStrokes(ctx);
  }, [drawBackground, drawStrokes]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setShowResult(false);
    const point = getCanvasPoint(e);
    setCurrentStroke([point]);
  }, [getCanvasPoint]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    setCurrentStroke(prev => [...prev, point]);
  }, [isDrawing, getCanvasPoint]);

  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);

    if (currentStroke.length > 5) {
      setStrokes(prev => [...prev, { points: currentStroke, timestamp: Date.now() }]);
    }
    setCurrentStroke([]);
  }, [isDrawing, currentStroke]);

  const handleClear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
    setLastResult(null);
    setShowResult(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (strokes.length === 0) return;

    const result = analyzePattern(strokes);
    setLastResult(result);
    setShowResult(true);
    onYantraComplete?.(result);
  }, [strokes, onYantraComplete]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-xl border border-cyan-700/30 touch-none cursor-crosshair"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Pattern guide overlay */}
        <div className="absolute top-2 left-2 text-[10px] text-cyan-400/70 uppercase tracking-wider">
          Draw Yantra
        </div>

        {/* Stroke counter */}
        <div className="absolute top-2 right-2 text-[10px] text-slate-400">
          {strokes.length} stroke{strokes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/80 active:bg-slate-600/80 transition"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={strokes.length === 0}
          className={cn(
            'flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition',
            strokes.length > 0
              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 active:from-cyan-600 active:to-purple-600'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          )}
        >
          Offer Yantra
        </button>
      </div>

      {/* Result display */}
      {showResult && lastResult && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-semibold capitalize">
              {lastResult.pattern === 'unknown' ? 'Unknown Sigil' : `${lastResult.pattern} Detected`}
            </span>
            <span className="text-xs text-slate-400">
              {Math.round(lastResult.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm text-amber-100">{lastResult.message}</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <span>+{lastResult.energy} energy</span>
            <span>{lastResult.residueActivation.length} residues activated</span>
          </div>
        </div>
      )}

      {/* Pattern hints */}
      <div className="text-[10px] text-slate-500 text-center">
        Try: Triangle, Hexagram, Heptagram, Spiral, Cross, or Circle
      </div>
    </div>
  );
}

export default HeptaYantraCanvas;
