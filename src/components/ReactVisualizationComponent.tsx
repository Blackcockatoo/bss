'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Gem, Play, Pause, RotateCcw, Dna, Shield, Layers, TreePine, Activity, CircleDot } from 'lucide-react';
import {
  type Vec3,
  type LatticeState,
  rotateX,
  rotateY,
  project,
  getLatticeStats,
  deriveLatticeType,
} from '../lib/lattice-math';
import { generateFractalTree, type FractalTree } from '../lib/fractal-grammar';
import {
  initResonanceField, resonanceTick, detectStandingWaves,
  getResonanceColor, getResonanceIntensity,
  type ResonanceFieldState, type StandingWavePattern,
} from '../lib/resonance-field';
import { encodeCrystal, type CrystalFingerprint } from '../lib/crystal-codec';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

const CANVAS_W = 360;
const CANVAS_H = 360;
const FOV = 300;
const VIEW_DIST = 8;

// ── Fractal depth color palette ─────────────────────────────────────────────
function fractalDepthColor(depth: number, maxDepth: number): string {
  const t = maxDepth > 0 ? depth / maxDepth : 0;
  // green (120) → cyan (180) → blue (240) → purple (280)
  const hue = 120 + t * 160;
  const light = 55 - t * 15;
  return `hsl(${hue}, 75%, ${light}%)`;
}

// ── Digit color palette (base-7) for Memory barcode ─────────────────────────
const DIGIT_COLORS = [
  '#475569', // 0 — slate (terminal)
  '#3b82f6', // 1 — blue (chain)
  '#22d3ee', // 2 — cyan (trigonal)
  '#10b981', // 3 — emerald (tetrahedral)
  '#eab308', // 4 — yellow (pentagonal)
  '#f97316', // 5 — orange (phi / golden)
  '#ef4444', // 6 — red (pi / transcendental)
];

// ── drawFractal ─────────────────────────────────────────────────────────────
function drawFractal(
  ctx: CanvasRenderingContext2D,
  tree: FractalTree,
  time: number,
) {
  const W = CANVAS_W;
  const H = CANVAS_H;
  const cx = W / 2;
  const cy = H / 2;
  ctx.fillStyle = '#020d08';
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  const ry = time * 0.0005;
  const rx = 0.35;
  // Project all fractal nodes
  const projected = tree.nodes.map((n, i) => {
    let p = n.pos;
    p = rotateY(p, ry);
    p = rotateX(p, rx);
    const { sx, sy, depth } = project(p, cx, cy, FOV, VIEW_DIST);
    return { sx, sy, depth, idx: i };
  });
  // Draw edges (back to front)
  for (const edge of tree.edges) {
    const pa = projected[edge.a];
    const pb = projected[edge.b];
    if (!pa || !pb) continue;
    const avgDepth = (pa.depth + pb.depth) * 0.5;
    const depthAlpha = Math.max(0.15, Math.min(1, FOV / (avgDepth * 50)));
    ctx.strokeStyle = fractalDepthColor(edge.depth, tree.maxDepth);
    ctx.lineWidth = Math.max(0.5, 2.5 - edge.depth * 0.4);
    ctx.globalAlpha = depthAlpha * 0.85;
    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.lineTo(pb.sx, pb.sy);
    ctx.stroke();
  }
  // Draw nodes
  projected.sort((a, b) => b.depth - a.depth);
  for (const p of projected) {
    const node = tree.nodes[p.idx];
    const depthFactor = Math.max(0.3, Math.min(1.2, FOV / (p.depth * 45)));
    const baseR = Math.max(1, 3 - node.depth * 0.4);
    const r = baseR * depthFactor;
    const color = fractalDepthColor(node.depth, tree.maxDepth);
    if (node.depth === 0) {
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = color;
    ctx.globalAlpha = depthFactor * 0.9;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, Math.max(0.8, r), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ── drawResonance ───────────────────────────────────────────────────────────
function drawResonance(
  ctx: CanvasRenderingContext2D,
  latticeState: LatticeState,
  resField: ResonanceFieldState,
  waves: StandingWavePattern[],
  time: number,
) {
  const W = CANVAS_W;
  const H = CANVAS_H;
  const cx = W / 2;
  const cy = H / 2;
  ctx.fillStyle = '#050010';
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  const ry = time * 0.0003;
  const rx = time * 0.0002 + 0.3;
  // Map lattice node positions by ID
  const posMap = new Map<number, Vec3>();
  for (const n of latticeState.nodes) {
    if (n.alive) posMap.set(n.id, n.pos);
  }
  // Map resonance nodes by nodeId
  const resMap = new Map<number, (typeof resField.nodes)[number]>();
  for (const rn of resField.nodes) resMap.set(rn.nodeId, rn);
  // Project resonance nodes
  const projected = new Map<number, { sx: number; sy: number; depth: number }>();
  for (const rn of resField.nodes) {
    const pos = posMap.get(rn.nodeId);
    if (!pos) continue;
    let p = rotateY(pos, ry);
    p = rotateX(p, rx);
    const { sx, sy, depth } = project(p, cx, cy, FOV, VIEW_DIST);
    projected.set(rn.nodeId, { sx, sy, depth });
  }
  // Draw edges
  for (const edge of resField.edges) {
    const pa = projected.get(edge.a);
    const pb = projected.get(edge.b);
    if (!pa || !pb) continue;
    const avgDepth = (pa.depth + pb.depth) * 0.5;
    const depthAlpha = Math.max(0.1, Math.min(1, FOV / (avgDepth * 50)));
    if (edge.resonating) {
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.3 + edge.flowRate * 3})`;
      ctx.lineWidth = 1.5 + edge.flowRate * 4;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
    } else {
      ctx.strokeStyle = `rgba(100, 80, 160, ${0.15 + edge.coupling * 0.2})`;
      ctx.lineWidth = 0.6;
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = depthAlpha * 0.7;
    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.lineTo(pb.sx, pb.sy);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // Draw standing wave arcs
  if (waves.length > 0) {
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'hsl(45, 90%, 60%)';
    ctx.shadowBlur = 10;
    for (const wave of waves) {
      const pts = wave.nodeIds
        .map(id => projected.get(id))
        .filter(Boolean) as { sx: number; sy: number; depth: number }[];
      if (pts.length < 2) continue;
      ctx.strokeStyle = `hsla(45, 90%, 60%, ${0.15 + wave.amplitude * 0.4})`;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const midX = (prev.sx + curr.sx) / 2;
        const midY = (prev.sy + curr.sy) / 2 - 20 - wave.amplitude * 15;
        ctx.quadraticCurveTo(midX, midY, curr.sx, curr.sy);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  // Draw nodes (pulsing)
  for (const rn of resField.nodes) {
    const p = projected.get(rn.nodeId);
    if (!p) continue;
    const depthFactor = Math.max(0.3, Math.min(1.2, FOV / (p.depth * 45)));
    const intensity = getResonanceIntensity(rn);
    const r = (2.5 + rn.amplitude * 4) * depthFactor;
    const pulse = 1 + intensity * 0.3 * Math.sin(time * 0.008 + rn.phase);
    const color = getResonanceColor(rn);
    if (rn.resonant) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 6 + rn.harmonicRank * 2;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = color;
    ctx.globalAlpha = depthFactor * 0.9;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, Math.max(1, r * pulse), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ── drawMemory ──────────────────────────────────────────────────────────────
function drawMemory(
  ctx: CanvasRenderingContext2D,
  fp: CrystalFingerprint,
  dna: string,
  time: number,
) {
  const W = CANVAS_W;
  const H = CANVAS_H;
  const cx = W / 2;
  const cy = H / 2;
  ctx.fillStyle = '#040208';
  ctx.globalAlpha = 0.12;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  const rotation = time * 0.0001;
  const digits = dna.split('').map(d => Math.min(6, parseInt(d, 10) || 0));
  const seq = fp.coordSequence;
  if (seq.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No crystal data — grow scaffold first', cx, cy);
    return;
  }
  const outerR = 140;
  const innerR = 90;
  const barcodeR = 115;
  // Draw outer ring — original DNA
  const dnaCount = Math.min(digits.length, 60);
  const dnaAngleStep = (Math.PI * 2) / dnaCount;
  for (let i = 0; i < dnaCount; i++) {
    const angle = rotation + i * dnaAngleStep - Math.PI / 2;
    const digit = digits[i];
    const barH = 6 + (digit / 6) * 14;
    ctx.strokeStyle = DIGIT_COLORS[digit];
    ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * outerR) / dnaCount - 1);
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(angle) * outerR,
      cy + Math.sin(angle) * outerR,
    );
    ctx.lineTo(
      cx + Math.cos(angle) * (outerR + barH),
      cy + Math.sin(angle) * (outerR + barH),
    );
    ctx.stroke();
  }
  // Draw barcode ring — coordination sequence
  const seqCount = Math.min(seq.length, 120);
  const seqAngleStep = (Math.PI * 2) / seqCount;
  for (let i = 0; i < seqCount; i++) {
    const angle = rotation + i * seqAngleStep - Math.PI / 2;
    const coordDigit = Math.min(6, seq[i]);
    const barH = 4 + (coordDigit / 6) * 18;
    ctx.strokeStyle = DIGIT_COLORS[coordDigit];
    ctx.lineWidth = Math.max(1, (Math.PI * 2 * barcodeR) / seqCount - 0.5);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(angle) * (barcodeR - barH / 2),
      cy + Math.sin(angle) * (barcodeR - barH / 2),
    );
    ctx.lineTo(
      cx + Math.cos(angle) * (barcodeR + barH / 2),
      cy + Math.sin(angle) * (barcodeR + barH / 2),
    );
    ctx.stroke();
  }
  // Draw inner ring — decoded DNA
  const decoded = fp.decodedDna.split('').map(d => Math.min(6, parseInt(d, 10) || 0));
  const decCount = Math.min(decoded.length, 60);
  const decAngleStep = (Math.PI * 2) / decCount;
  for (let i = 0; i < decCount; i++) {
    const angle = rotation + i * decAngleStep - Math.PI / 2;
    const digit = decoded[i];
    const barH = 4 + (digit / 6) * 10;
    ctx.strokeStyle = DIGIT_COLORS[digit];
    ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * innerR) / decCount - 1);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(angle) * (innerR - barH),
      cy + Math.sin(angle) * (innerR),
    );
    ctx.lineTo(
      cx + Math.cos(angle) * innerR,
      cy + Math.sin(angle) * innerR,
    );
    ctx.stroke();
  }
  // Guide circles
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#8888aa';
  ctx.lineWidth = 0.5;
  for (const r of [innerR, barcodeR, outerR]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Center info
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(fp.symmetryClass.toUpperCase(), cx, cy - 18);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(`entropy ${fp.entropy.toFixed(2)} bits`, cx, cy);
  ctx.fillText(`confidence ${Math.round(fp.confidence * 100)}%`, cx, cy + 14);
  ctx.fillStyle = '#64748b';
  ctx.font = '9px monospace';
  ctx.fillText(`checksum ${(fp.checksum >>> 0).toString(16).slice(0, 8)}`, cx, cy + 30);
}

interface ProjectedNode {
  sx: number;
  sy: number;
  depth: number;
  idx: number;
}

type VisualMode = 'scaffold' | 'fractal' | 'resonance' | 'memory';

interface ReactVisualizationComponentProps {
  dna?: string;
  latticeState?: LatticeState;
}

export function ReactVisualizationComponent({ dna, latticeState }: ReactVisualizationComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [mode, setMode] = useState<VisualMode>('fractal');
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Fractal state
  const [fractalTree, setFractalTree] = useState<FractalTree | null>(null);

  // Resonance state
  const [resonanceField, setResonanceField] = useState<ResonanceFieldState | null>(null);
  const [standingWaves, setStandingWaves] = useState<StandingWavePattern[]>([]);

  // Memory state
  const [fingerprint, setFingerprint] = useState<CrystalFingerprint | null>(null);

  // Initialize visualizations — deferred to avoid synchronous setState cascade
  useEffect(() => {
    const genome = dna || '0'.repeat(60);

    const id = requestAnimationFrame(() => {
      // Initialize fractal
      const tree = generateFractalTree(genome);
      setFractalTree(tree);

      // Initialize resonance if lattice available
      if (latticeState) {
        const nodeIds = latticeState.nodes.filter(n => n.alive).map(n => n.id);
        const dnaDigits = nodeIds.map((_, i) => parseInt(genome[i % genome.length], 10) || 0);
        const edgePairs = latticeState.edges.map(e => [e.a, e.b] as [number, number]);
        const resField = initResonanceField(nodeIds, dnaDigits, edgePairs);
        setResonanceField(resField);
      }

      // Initialize memory/fingerprint
      if (latticeState) {
        const result = encodeCrystal(latticeState, genome);
        setFingerprint(result.fingerprint);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [dna, latticeState]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      if (playing) {
        setTime(t => t + 1);
      }

      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Render based on mode
      if (mode === 'fractal' && fractalTree) {
        drawFractal(ctx, fractalTree, time);
      } else if (mode === 'resonance' && resonanceField && latticeState) {
        drawResonance(ctx, latticeState, resonanceField, standingWaves, time);
      } else if (mode === 'memory' && fingerprint) {
        drawMemory(ctx, fingerprint, dna || '0'.repeat(60), time);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, time, playing, fractalTree, resonanceField, standingWaves, latticeState, fingerprint, dna]);

  const handleModeChange = (newMode: VisualMode) => {
    setMode(newMode);
    setTime(0);
  };

  const togglePlayPause = () => {
    setPlaying(p => !p);
  };

  const reset = () => {
    setTime(0);
    setPlaying(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Gem className="w-4 h-4" />
          Multi-Mode Visualizer
        </h3>
      </div>

      <Tabs value={mode} onValueChange={(v) => handleModeChange(v as VisualMode)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fractal" className="flex gap-1 text-xs">
            <TreePine className="w-3 h-3" /> Fractal
          </TabsTrigger>
          <TabsTrigger value="resonance" className="flex gap-1 text-xs">
            <Activity className="w-3 h-3" /> Resonance
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex gap-1 text-xs">
            <CircleDot className="w-3 h-3" /> Memory
          </TabsTrigger>
          <TabsTrigger value="scaffold" className="flex gap-1 text-xs">
            <Layers className="w-3 h-3" /> Scaffold
          </TabsTrigger>
        </TabsList>

        <TabsContent value={mode} className="space-y-3">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-xl border border-slate-700/60 mx-auto block bg-[#0a0a0a]"
          />

          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={togglePlayPause}
              className="gap-1.5 text-xs"
            >
              {playing ? (
                <>
                  <Pause className="w-3 h-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Play
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={reset} className="gap-1.5 text-xs">
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          </div>

          <div className="text-center text-[10px] text-zinc-500 font-mono">
            {mode === 'fractal' && 'L-system fractal generation from DNA grammar rules'}
            {mode === 'resonance' && 'Standing waves and harmonic resonance through lattice'}
            {mode === 'memory' && 'Crystal topology barcode — 3 rings of encoded information'}
            {mode === 'scaffold' && 'Lattice scaffold structure and growth dynamics'}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
        DNA transforms into geometry. Each visualization reveals a different aspect:
        <br />
        fractal structure · resonance patterns · encoded memory · crystal scaffold
      </p>
    </div>
  );
}
