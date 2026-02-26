'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Gem, Play, Pause, RotateCcw, Dna, Shield, Layers } from 'lucide-react';
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

const CANVAS_W = 360;
const CANVAS_H = 360;
const FOV = 300;
const VIEW_DIST = 8;
const GROWTH_INTERVAL = 120;
const MAX_TICKS = 600;

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

interface ProjectedNode {
  sx: number;
  sy: number;
  depth: number;
  idx: number;
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

  if (!state.collapsed && state.completion < 1) {
    const frontierNodes = state.nodes.filter(n => n.alive && n.generation === state.generation);
    for (const fn of frontierNodes) {
      const p = proj(fn.pos);
      const pulseR = 4 + 3 * Math.sin(time * 0.005);
      ctx.strokeStyle = colors.nodeGlow;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(time * 0.004);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, pulseR, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const integrityHue = state.integrity > 0.6 ? 160 : state.integrity > 0.3 ? 45 : 0;
  const integrityPulse = 0.02 * Math.sin(time * 0.002);
  ctx.strokeStyle = `hsla(${integrityHue},70%,55%,${0.15 + integrityPulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(W, H) * 0.47 * state.integrity, 0, Math.PI * 2);
  ctx.stroke();

  if (state.collapsed) {
    ctx.fillStyle = 'rgba(255,50,50,0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6 + 0.2 * Math.sin(time * 0.005);
    ctx.fillText('LATTICE COLLAPSED', cx, cy);
    ctx.globalAlpha = 1;
  }
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

  const [growing, setGrowing] = useState(false);
  const [stats, setStats] = useState<LatticeStats | null>(null);
  const [showBP, setShowBP] = useState(true);
  const [showStress, setShowStress] = useState(false);
  const [shells, setShells] = useState<DetectedShell[]>([]);
  const [dnaActive, setDnaActive] = useState(false);
  const [latticeType, setLatticeType] = useState<LatticeType>('fcc');

  const initFromDna = useCallback((dnaStr?: string) => {
    const genome = dnaStr || '0'.repeat(60);
    const blueprint = buildBlueprint(genome);
    const initial = initLattice(blueprint);

    stateRef.current = initial;
    tickRef.current = 0;
    lastGrow.current = 0;

    setStats(getLatticeStats(initial));
    setShells([]);
    setDnaActive(!!dnaStr);
    setLatticeType(deriveLatticeType(genome));
    setGrowing(false);
  }, []);

  useEffect(() => {
    initFromDna(dna);
  }, [dna, initFromDna]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = LATTICE_COLORS[latticeType].bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

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

          const genome = dna || '0'.repeat(60);
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

      drawLattice(ctx, stateRef.current, time, showBP, showStress, shells);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [growing, showBP, showStress, shells, latticeType, dna]);

  const toggleGrowth = useCallback(() => setGrowing(g => !g), []);

  const reset = useCallback(() => {
    initFromDna(dna);
  }, [dna, initFromDna]);

  const colors = LATTICE_COLORS[latticeType];

  return (
    <div className="space-y-3">
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

        <div className="flex gap-1 text-[10px] font-mono">
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
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-xl border mx-auto block bg-[#020612]"
        style={{ borderColor: `${colors.edge}60` }}
      />

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

      {shells.length > 0 && (
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 font-mono mb-1">Emergent geometry detected</p>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {(() => {
              const counts = new Map<string, number>();
              for (const shell of shells) {
                counts.set(shell.type, (counts.get(shell.type) || 0) + 1);
              }

              return [...counts.entries()].map(([type, count]) => (
                <span
                  key={type}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                  style={{
                    color: colors.shell,
                    borderColor: `${colors.shell}40`,
                    backgroundColor: `${colors.shell}10`,
                  }}
                >
                  {SHELL_SYMBOLS[type] || '?'} {type} x{count}
                </span>
              ));
            })()}
          </div>
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
        {LATTICE_LABELS[latticeType]} lattice · DNA → blueprint scaffold → intelligent growth
        <br />
        Stress propagation prevents collapse · Platonic sub-shells emerge from structure
        {dnaActive && <><br />Each genome crystallises a unique lattice — the DNA holds the being</>}
      </p>
    </div>
  );
}
