'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Gem, Play, Pause, RotateCcw, Dna, Shield, Layers, TreePine, Radio, Database } from 'lucide-react';
import {
  type Vec3,
  type LatticeState,
  type LatticeStats,
  type LatticeType,
  type DetectedShell,
  rotateX,
  rotateY,
  project,
  buildBlueprint,
  initLattice,
  growthTick,
  detectPlatonicShells,
  getLatticeStats,
  deriveLatticeType,
} from '../lib/lattice-math';
import { generateFractalTree, deriveFractalConfig, type FractalTree } from '../lib/fractal-grammar';
import {
  initResonanceField,
  resonanceTick,
  detectStandingWaves,
  getResonanceColor,
  getResonanceIntensity,
  type ResonanceFieldState,
  type StandingWavePattern,
} from '../lib/resonance-field';
import { encodeCrystal, readCrystalMemory, type CrystalFingerprint } from '../lib/crystal-codec';

const CANVAS_W = 360;
const CANVAS_H = 360;
const FOV = 300;
const VIEW_DIST = 8;
const GROWTH_INTERVAL = 120;
const MAX_TICKS = 600;

type VisualMode = 'scaffold' | 'fractal' | 'resonance' | 'memory';

const LATTICE_COLORS: Record<
  LatticeType,
  {
    node: string;
    nodeGlow: string;
    edge: string;
    edgeHL: string;
    stress: string;
    blueprint: string;
    shell: string;
    bg: string;
  }
> = {
  fcc: {
    node: '#67e8f9',
    nodeGlow: '#22d3ee',
    edge: '#164e63',
    edgeHL: '#06b6d4',
    stress: '#ef4444',
    blueprint: '#1e3a5f',
    shell: '#fbbf24',
    bg: '#020c1b',
  },
  bcc: {
    node: '#a78bfa',
    nodeGlow: '#8b5cf6',
    edge: '#3b1f6e',
    edgeHL: '#7c3aed',
    stress: '#f87171',
    blueprint: '#2e1065',
    shell: '#f59e0b',
    bg: '#0a0520',
  },
  hcp: {
    node: '#34d399',
    nodeGlow: '#10b981',
    edge: '#064e3b',
    edgeHL: '#059669',
    stress: '#fb923c',
    blueprint: '#022c22',
    shell: '#e879f9',
    bg: '#011a0e',
  },
  icosahedral: {
    node: '#fb923c',
    nodeGlow: '#f97316',
    edge: '#7c2d12',
    edgeHL: '#ea580c',
    stress: '#ef4444',
    blueprint: '#431407',
    shell: '#67e8f9',
    bg: '#120800',
  },
};

const LATTICE_LABELS: Record<LatticeType, string> = {
  fcc: 'Face-Centered Cubic',
  bcc: 'Body-Centered Cubic',
  hcp: 'Hexagonal Close-Packed',
  icosahedral: 'Icosahedral Quasicrystal',
};

const SHELL_SYMBOLS: Record<string, string> = {
  tetrahedron: '△',
  cube: '□',
  octahedron: '◇',
  icosahedron: '⬡',
  dodecahedron: '⬠',
};

const DIGIT_COLORS = ['#334155', '#3b82f6', '#22d3ee', '#10b981', '#eab308', '#f97316', '#ef4444'];

interface ProjectedNode {
  sx: number;
  sy: number;
  depth: number;
  idx: number;
}

function drawFractal(ctx: CanvasRenderingContext2D, tree: FractalTree, time: number) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  ctx.fillStyle = '#020d08';
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalAlpha = 1;

  const ry = time * 0.0005;
  const rx = 0.3;

  const projected = tree.nodes.map((n, idx) => {
    let p = n.pos;
    p = rotateY(p, ry);
    p = rotateX(p, rx);
    const { sx, sy, depth } = project(p, cx, cy, FOV, VIEW_DIST);
    return { sx, sy, depth, idx };
  });

  for (const edge of tree.edges) {
    const pa = projected[edge.a];
    const pb = projected[edge.b];
    if (!pa || !pb) continue;

    const alpha = Math.max(0.15, Math.min(0.9, FOV / (((pa.depth + pb.depth) / 2) * 55)));
    const hue = 120 - edge.depth * 20;
    ctx.strokeStyle = `hsl(${hue}, 70%, 55%)`;
    ctx.lineWidth = Math.max(0.5, 2.2 - edge.depth * 0.3);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.lineTo(pb.sx, pb.sy);
    ctx.stroke();
  }

  projected.sort((a, b) => b.depth - a.depth);
  for (const p of projected) {
    const node = tree.nodes[p.idx];
    const depthFactor = Math.max(0.35, Math.min(1.2, FOV / (p.depth * 45)));
    const r = Math.max(0.9, (3.2 - node.depth * 0.35) * depthFactor);
    const hue = 120 - node.depth * 20;
    ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
    ctx.globalAlpha = depthFactor * 0.9;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawResonance(
  ctx: CanvasRenderingContext2D,
  latticeState: LatticeState,
  resField: ResonanceFieldState,
  waves: StandingWavePattern[],
  time: number,
) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  ctx.fillStyle = '#050010';
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalAlpha = 1;

  const ry = time * 0.00035;
  const rx = time * 0.0002 + 0.3;

  const posMap = new Map<number, Vec3>();
  for (const node of latticeState.nodes) {
    if (node.alive) posMap.set(node.id, node.pos);
  }

  const projected = new Map<number, { sx: number; sy: number; depth: number }>();
  for (const node of resField.nodes) {
    const pos = posMap.get(node.nodeId);
    if (!pos) continue;

    let p = rotateY(pos, ry);
    p = rotateX(p, rx);
    projected.set(node.nodeId, project(p, cx, cy, FOV, VIEW_DIST));
  }

  for (const edge of resField.edges) {
    const pa = projected.get(edge.a);
    const pb = projected.get(edge.b);
    if (!pa || !pb) continue;

    const depthAlpha = Math.max(0.1, Math.min(1, FOV / ((((pa.depth + pb.depth) / 2) * 50))));
    if (edge.resonating) {
      ctx.strokeStyle = `rgba(251, 191, 36, ${Math.min(1, 0.25 + edge.flowRate * 4)})`;
      ctx.lineWidth = 1.3 + edge.flowRate * 3;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
    } else {
      ctx.strokeStyle = 'rgba(100, 80, 160, 0.2)';
      ctx.lineWidth = 0.7;
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = depthAlpha * 0.7;
    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.lineTo(pb.sx, pb.sy);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  if (waves.length > 0) {
    ctx.lineWidth = 1.4;
    ctx.shadowColor = 'hsl(45, 90%, 60%)';
    ctx.shadowBlur = 8;

    for (const wave of waves) {
      const pts = wave.nodeIds.map(id => projected.get(id)).filter(Boolean) as { sx: number; sy: number }[];
      if (pts.length < 2) continue;
      ctx.strokeStyle = `hsla(45, 90%, 60%, ${0.2 + wave.amplitude * 0.4})`;
      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const mx = (prev.sx + curr.sx) / 2;
        const my = (prev.sy + curr.sy) / 2 - 20 - wave.amplitude * 12;
        ctx.quadraticCurveTo(mx, my, curr.sx, curr.sy);
      }
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
  for (const node of resField.nodes) {
    const p = projected.get(node.nodeId);
    if (!p) continue;

    const intensity = getResonanceIntensity(node);
    const pulse = 1 + intensity * 0.3 * Math.sin(time * 0.008 + node.phase);
    const radius = (3 + node.amplitude * 4) * pulse;

    ctx.fillStyle = getResonanceColor(node);
    if (node.resonant) {
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = Math.max(0.35, Math.min(1, FOV / (p.depth * 45)));
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawMemory(ctx: CanvasRenderingContext2D, fingerprint: CrystalFingerprint, dna: string, time: number) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  ctx.fillStyle = '#040208';
  ctx.globalAlpha = 0.14;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalAlpha = 1;

  const rotation = time * 0.0001;
  const seq = fingerprint.coordSequence;
  if (seq.length === 0) return;

  const digits = dna.split('').map(d => Math.min(6, parseInt(d, 10) || 0));
  const decoded = fingerprint.decodedDna.split('').map(d => Math.min(6, parseInt(d, 10) || 0));

  const outerR = 140;
  const innerR = 88;
  const centerR = 130;

  const drawRingBars = (values: number[], radius: number, maxHeight: number, alpha: number) => {
    const n = Math.max(1, values.length);
    const step = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const value = Math.min(6, values[i] ?? 0);
      const angle = rotation + i * step - Math.PI / 2;
      const h = 4 + (value / 6) * maxHeight;
      ctx.strokeStyle = DIGIT_COLORS[value];
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(1, ((Math.PI * 2 * radius) / n) * 0.7);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (radius - h * 0.5), cy + Math.sin(angle) * (radius - h * 0.5));
      ctx.lineTo(cx + Math.cos(angle) * (radius + h * 0.5), cy + Math.sin(angle) * (radius + h * 0.5));
      ctx.stroke();
    }
  };

  drawRingBars(digits.slice(0, 60), outerR, 16, 0.4);
  drawRingBars(seq.slice(0, 120), centerR, 20, 0.75);
  drawRingBars(decoded.slice(0, 60), innerR, 12, 0.55);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c4b5fd';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(fingerprint.symmetryClass.toUpperCase(), cx, cy - 16);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(`entropy ${fingerprint.entropy.toFixed(2)}`, cx, cy);
  ctx.fillText(`confidence ${Math.round(fingerprint.confidence * 100)}%`, cx, cy + 14);
}

function drawLattice(
  ctx: CanvasRenderingContext2D,
  state: LatticeState,
  time: number,
  showBlueprint: boolean,
  showStress: boolean,
  shells: DetectedShell[],
) {
  const W = CANVAS_W;
  const H = CANVAS_H;
  const cx = W / 2;
  const cy = H / 2;
  const type = state.blueprint.type;
  const colors = LATTICE_COLORS[type];

  ctx.fillStyle = colors.bg;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  const ry = time * 0.0004;
  const rx = time * 0.00025 + 0.3;

  type StateNode = LatticeState['nodes'][number];
  const nodeMap = new Map<number, StateNode>();
  for (const n of state.nodes) {
    nodeMap.set(n.id, n);
  }

  const projected: ProjectedNode[] = [];
  for (let i = 0; i < state.nodes.length; i++) {
    const n = state.nodes[i];
    if (!n.alive) continue;
    let p = n.pos;
    p = rotateY(p, ry);
    p = rotateX(p, rx);
    const { sx, sy, depth } = project(p, cx, cy, FOV, VIEW_DIST);
    projected.push({ sx, sy, depth, idx: i });
  }

  const builtTargetIds = new Set(state.nodes.filter(n => n.alive).map(n => n.targetId));
  const ghostProjected: { sx: number; sy: number; depth: number; bpIdx: number }[] = [];

  if (showBlueprint) {
    for (let i = 0; i < state.blueprint.targetNodes.length; i++) {
      if (builtTargetIds.has(i)) continue;
      let p = state.blueprint.targetNodes[i];
      p = rotateY(p, ry);
      p = rotateX(p, rx);
      const { sx, sy, depth } = project(p, cx, cy, FOV, VIEW_DIST);
      ghostProjected.push({ sx, sy, depth, bpIdx: i });
    }
  }

  const proj = (v: Vec3) => {
    let p = rotateY(v, ry);
    p = rotateX(p, rx);
    return project(p, cx, cy, FOV, VIEW_DIST);
  };

  if (showBlueprint) {
    ctx.strokeStyle = colors.blueprint;
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.2;
    for (const [a, b] of state.blueprint.targetEdges) {
      if (builtTargetIds.has(a) && builtTargetIds.has(b)) continue;
      const pa = proj(state.blueprint.targetNodes[a]);
      const pb = proj(state.blueprint.targetNodes[b]);
      ctx.beginPath();
      ctx.moveTo(pa.sx, pa.sy);
      ctx.lineTo(pb.sx, pb.sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (shells.length > 0) {
    ctx.strokeStyle = colors.shell;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.35 + 0.1 * Math.sin(time * 0.003);
    ctx.shadowColor = colors.shell;
    ctx.shadowBlur = 8;

    for (const shell of shells) {
      const shellPts = shell.nodeIds
        .map(id => {
          const n = nodeMap.get(id);
          return n ? proj(n.pos) : null;
        })
        .filter(Boolean) as { sx: number; sy: number; depth: number }[];

      for (let i = 0; i < shellPts.length; i++) {
        for (let j = i + 1; j < shellPts.length; j++) {
          ctx.beginPath();
          ctx.moveTo(shellPts[i].sx, shellPts[i].sy);
          ctx.lineTo(shellPts[j].sx, shellPts[j].sy);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  const nodeScreenPos = new Map<number, { sx: number; sy: number; depth: number }>();
  for (const p of projected) {
    const n = state.nodes[p.idx];
    nodeScreenPos.set(n.id, p);
  }

  for (const edge of state.edges) {
    const pa = nodeScreenPos.get(edge.a);
    const pb = nodeScreenPos.get(edge.b);
    if (!pa || !pb) continue;

    const avgDepth = (pa.depth + pb.depth) * 0.5;
    const depthAlpha = Math.max(0.1, Math.min(1, FOV / (avgDepth * 50)));

    if (showStress && edge.load > 0.5) {
      const t = Math.min(1, (edge.load - 0.5) * 2);
      const r = Math.round(255 * t);
      const g = Math.round(255 * (1 - t * 0.6));
      ctx.strokeStyle = `rgb(${r},${g},50)`;
      ctx.lineWidth = 1.2 + edge.load;
    } else if (edge.reinforced) {
      ctx.strokeStyle = colors.edgeHL;
      ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = colors.edge;
      ctx.lineWidth = 0.8;
    }

    ctx.globalAlpha = depthAlpha * 0.7;
    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.lineTo(pb.sx, pb.sy);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  if (showBlueprint) {
    for (const g of ghostProjected) {
      const depthAlpha = Math.max(0.08, Math.min(0.3, FOV / (g.depth * 60)));
      ctx.fillStyle = colors.blueprint;
      ctx.globalAlpha = depthAlpha;
      ctx.beginPath();
      ctx.arc(g.sx, g.sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  projected.sort((a, b) => b.depth - a.depth);
  for (const p of projected) {
    const node = state.nodes[p.idx];
    const depthFactor = Math.max(0.3, Math.min(1.2, FOV / (p.depth * 45)));
    const baseR = 2 + (node.coordination / 12) * 2.5;
    const r = baseR * depthFactor;

    const age = state.generation - node.generation;
    const pulse = age < 5 ? 1 + (5 - age) * 0.15 * Math.sin(time * 0.01) : 1;

    let fillColor = colors.node;
    if (showStress && node.stress > 0.6) {
      const t = Math.min(1, (node.stress - 0.6) * 2.5);
      fillColor = `rgb(${Math.round(255 * t + 100 * (1 - t))},${Math.round(200 * (1 - t))},${Math.round(80 * (1 - t))})`;
    }

    if (node.coordination >= 6) {
      ctx.shadowColor = colors.nodeGlow;
      ctx.shadowBlur = 6 + node.coordination;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = fillColor;
    ctx.globalAlpha = depthFactor * 0.85;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, Math.max(1, r * pulse), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

interface CrystallineLatticeProps {
  dna?: string;
}

export function CrystallineLattice({ dna }: CrystallineLatticeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef<LatticeState | null>(null);
  const tickRef = useRef(0);
  const lastGrow = useRef(0);
  const fractalRef = useRef<FractalTree | null>(null);
  const resFieldRef = useRef<ResonanceFieldState | null>(null);
  const standingWavesRef = useRef<StandingWavePattern[]>([]);

  const [mode, setMode] = useState<VisualMode>('scaffold');
  const [growing, setGrowing] = useState(false);
  const [stats, setStats] = useState<LatticeStats | null>(null);
  const [showBP, setShowBP] = useState(true);
  const [showStress, setShowStress] = useState(false);
  const [shells, setShells] = useState<DetectedShell[]>([]);
  const [dnaActive, setDnaActive] = useState(false);
  const [latticeType, setLatticeType] = useState<LatticeType>('fcc');
  const [fingerprint, setFingerprint] = useState<CrystalFingerprint | null>(null);

  // State mirrors for ref values displayed in JSX (avoids reading refs during render)
  const [fractalSnapshot, setFractalSnapshot] = useState<{ nodeCount: number; maxDepth: number; ruleSignature: string } | null>(null);
  const [resFieldSnapshot, setResFieldSnapshot] = useState<{ globalEnergy: number; resonanceRatio: number; harmonicOrder: number } | null>(null);
  const [standingWaveCount, setStandingWaveCount] = useState(0);
  const [crystalMemory, setCrystalMemory] = useState('—');

  const genome = dna || '0'.repeat(60);
  const fractalConfig = deriveFractalConfig(genome);

  const initFromDna = useCallback((dnaStr?: string) => {
    const sequence = dnaStr || '0'.repeat(60);
    const blueprint = buildBlueprint(sequence);
    const initial = initLattice(blueprint);

    stateRef.current = initial;
    tickRef.current = 0;
    lastGrow.current = 0;
    const tree = generateFractalTree(sequence);
    fractalRef.current = tree;
    resFieldRef.current = null;
    standingWavesRef.current = [];
    setFingerprint(null);

    setStats(getLatticeStats(initial));
    setShells([]);
    setDnaActive(!!dnaStr);
    setLatticeType(deriveLatticeType(sequence));
    setGrowing(false);
    setFractalSnapshot(tree ? { nodeCount: tree.nodes.length, maxDepth: tree.maxDepth, ruleSignature: tree.ruleSignature } : null);
    setResFieldSnapshot(null);
    setStandingWaveCount(0);
    setCrystalMemory(initial ? readCrystalMemory(initial).slice(0, 24) : '—');
  }, []);

  // Sync lattice when the dna prop changes — intentionally sets state from effect
  // eslint-disable-next-line react-hooks/set-state-in-effect -- prop-driven initialization
  useEffect(() => { initFromDna(dna); }, [dna, initFromDna]);

  useEffect(() => {
    if (mode === 'resonance' && stateRef.current) {
      const state = stateRef.current;
      const nodeIds = state.nodes.filter(n => n.alive).map(n => n.id);
      const dnaDigits = nodeIds.map((_, i) => parseInt(genome[i % genome.length], 10) || 0);
      const edgePairs = state.edges.map(e => [e.a, e.b] as [number, number]);
      const field = initResonanceField(nodeIds, dnaDigits, edgePairs);
      resFieldRef.current = field;
      standingWavesRef.current = [];
      setResFieldSnapshot({ globalEnergy: field.globalEnergy, resonanceRatio: field.resonanceRatio, harmonicOrder: field.harmonicOrder });
      setStandingWaveCount(0);
    }
  }, [mode, genome]);

  useEffect(() => {
    if (mode === 'memory' && stateRef.current) {
      const result = encodeCrystal(stateRef.current, genome);
      setFingerprint(result.fingerprint);
    }
  }, [mode, genome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const state = stateRef.current;
      if (!state) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (growing && !state.collapsed && state.completion < 1 && tickRef.current < MAX_TICKS) {
        if (time - lastGrow.current > GROWTH_INTERVAL) {
          lastGrow.current = time;
          tickRef.current += 1;

          const next = growthTick(state, genome, tickRef.current);
          stateRef.current = next;

          if (tickRef.current % 5 === 0) {
            setStats(getLatticeStats(next));
            setShells(detectPlatonicShells(next));
          }

          if (next.completion >= 1 || next.collapsed) {
            setGrowing(false);
            setStats(getLatticeStats(next));
            setShells(detectPlatonicShells(next));
          }
        }
      }

      switch (mode) {
        case 'scaffold':
          drawLattice(ctx, state, time, showBP, showStress, shells);
          break;
        case 'fractal':
          if (fractalRef.current) drawFractal(ctx, fractalRef.current, time);
          break;
        case 'resonance':
          if (resFieldRef.current) {
            resFieldRef.current = resonanceTick(resFieldRef.current, 0.1);
            const waves = detectStandingWaves(resFieldRef.current);
            standingWavesRef.current = waves;
            drawResonance(ctx, state, resFieldRef.current, waves, time);
            // Sync snapshot to state every ~30 frames for UI display
            if (tickRef.current % 30 === 0) {
              const rf = resFieldRef.current;
              setResFieldSnapshot({ globalEnergy: rf.globalEnergy, resonanceRatio: rf.resonanceRatio, harmonicOrder: rf.harmonicOrder });
              setStandingWaveCount(waves.length);
            }
          }
          break;
        case 'memory':
          if (fingerprint) drawMemory(ctx, fingerprint, genome, time);
          break;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [growing, showBP, showStress, shells, mode, genome, fingerprint]);

  const toggleGrowth = useCallback(() => setGrowing(g => !g), []);
  const reset = useCallback(() => initFromDna(dna), [dna, initFromDna]);

  const colors = LATTICE_COLORS[latticeType];

  return (
    <Tabs value={mode} onValueChange={value => setMode(value as VisualMode)} className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Gem className="w-4 h-4" style={{ color: colors.node }} />
            Crystalline Lattice
            {dnaActive && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                style={{
                  color: colors.node,
                  backgroundColor: `${colors.edge}20`,
                  borderColor: `${colors.edge}60`,
                }}
              >
                <Dna className="w-3 h-3" /> DNA-blueprint
              </span>
            )}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
            {LATTICE_LABELS[latticeType]} · symmetry={stats?.symmetryOrder ?? '—'}
          </p>
        </div>

        <TabsList className="grid grid-cols-4 h-auto">
          <TabsTrigger value="scaffold" className="text-[10px] gap-1">
            <Gem className="w-3 h-3" /> Scaffold
          </TabsTrigger>
          <TabsTrigger value="fractal" className="text-[10px] gap-1">
            <TreePine className="w-3 h-3" /> Fractal
          </TabsTrigger>
          <TabsTrigger value="resonance" className="text-[10px] gap-1">
            <Radio className="w-3 h-3" /> Resonance
          </TabsTrigger>
          <TabsTrigger value="memory" className="text-[10px] gap-1">
            <Database className="w-3 h-3" /> Memory
          </TabsTrigger>
        </TabsList>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-xl border mx-auto block bg-[#020612]"
        style={{ borderColor: `${colors.edge}60` }}
      />

      <TabsContent value="scaffold" className="space-y-3 mt-0">
        <div className="flex gap-1 text-[10px] font-mono justify-end">
          <button
            onClick={() => setShowBP(b => !b)}
            className={`px-2 py-1 rounded transition-colors ${
              showBP
                ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
            title="Show blueprint scaffold"
          >
            <Layers className="w-3 h-3 inline mr-0.5" />BP
          </button>
          <button
            onClick={() => setShowStress(s => !s)}
            className={`px-2 py-1 rounded transition-colors ${
              showStress
                ? 'text-red-300 bg-red-500/15 border border-red-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
            title="Show structural stress"
          >
            <Shield className="w-3 h-3 inline mr-0.5" />Stress
          </button>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            onClick={toggleGrowth}
            className="gap-1.5 text-xs"
            style={growing ? { backgroundColor: `${colors.nodeGlow}cc` } : undefined}
          >
            {growing ? (
              <>
                <Pause className="w-3 h-3" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> {(stats?.completion ?? 0) >= 1 ? 'Complete' : 'Grow'}
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="gap-1.5 text-xs">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: 'Nodes', value: stats.nodeCount, color: colors.node },
              { label: 'Edges', value: stats.edgeCount, color: colors.nodeGlow },
              { label: 'Avg Coord', value: stats.avgCoord, color: colors.node },
              {
                label: 'Integrity',
                value: `${Math.round(stats.integrity * 100)}%`,
                color: stats.integrity > 0.6 ? '#34d399' : stats.integrity > 0.3 ? '#fbbf24' : '#ef4444',
              },
              {
                label: 'Completion',
                value: `${Math.round(stats.completion * 100)}%`,
                color: stats.completion >= 1 ? '#34d399' : colors.node,
              },
              {
                label: 'Max Stress',
                value: stats.maxStress,
                color: stats.maxStress > 0.7 ? '#ef4444' : stats.maxStress > 0.4 ? '#fbbf24' : '#34d399',
              },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-slate-700/60 bg-slate-900/40 py-1.5 px-1">
                <p className="text-sm font-mono font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5 leading-none">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="fractal" className="mt-0">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            { label: 'Nodes', value: fractalSnapshot?.nodeCount ?? 0, color: '#34d399' },
            { label: 'Max Depth', value: fractalSnapshot?.maxDepth ?? 0, color: '#22d3ee' },
            { label: 'Rule Signature', value: fractalSnapshot?.ruleSignature ?? '—', color: '#c4b5fd' },
            { label: 'Generations', value: fractalConfig.generations, color: '#86efac' },
            { label: 'Branch Angle', value: `${Math.round((fractalConfig.branchAngle * 180) / Math.PI)}°`, color: '#67e8f9' },
            { label: 'Length Decay', value: fractalConfig.lengthDecay.toFixed(2), color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 py-1.5 px-1">
              <p className="text-xs font-mono font-bold truncate" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-none">{s.label}</p>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="resonance" className="mt-0">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { label: 'Global Energy', value: resFieldSnapshot ? resFieldSnapshot.globalEnergy.toFixed(2) : '—' },
            { label: 'Resonance Ratio', value: resFieldSnapshot ? `${Math.round(resFieldSnapshot.resonanceRatio * 100)}%` : '—' },
            { label: 'Harmonic Order', value: resFieldSnapshot?.harmonicOrder ?? '—' },
            { label: 'Standing Waves', value: standingWaveCount },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-violet-800/40 bg-violet-950/20 py-1.5 px-1">
              <p className="text-xs font-mono font-bold text-amber-300">{s.value}</p>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-none">{s.label}</p>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="memory" className="mt-0">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            { label: 'Symmetry Class', value: fingerprint?.symmetryClass ?? '—' },
            { label: 'Entropy', value: fingerprint ? fingerprint.entropy.toFixed(2) : '—' },
            { label: 'Confidence', value: fingerprint ? `${Math.round(fingerprint.confidence * 100)}%` : '—' },
            { label: 'Checksum', value: fingerprint ? (fingerprint.checksum >>> 0).toString(16).slice(0, 8) : '—' },
            { label: 'Node Count', value: fingerprint?.nodeCount ?? '—' },
            { label: 'Topology Hash', value: fingerprint ? `${fingerprint.topologyHash.slice(0, 16)}…` : '—' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-fuchsia-800/40 bg-fuchsia-950/20 py-1.5 px-1">
              <p className="text-xs font-mono font-bold text-fuchsia-300 truncate">{s.value}</p>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-none">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 text-center font-mono mt-2">crystal-memory: {crystalMemory}</p>
      </TabsContent>
    </Tabs>
  );
}
