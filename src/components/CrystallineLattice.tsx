'use client';

/**
 * CrystallineLattice — DNA-Seeded Intelligent 3D Lattice Growth
 *
 * A unified crystalline intelligence engine that merges three systems:
 *
 *   1. LATTICE SCAFFOLD  — Bravais lattice blueprint from DNA
 *        (FCC / BCC / HCP / Icosahedral) with intelligent growth
 *
 *   2. FRACTAL BRANCHING — L-system grammar where each DNA digit is a
 *        production rule, growing organic fractal branches that extend
 *        beyond the rigid scaffold into complex geometric formations
 *
 *   3. HARMONIC RESONANCE — Standing waves propagate through the lattice;
 *        nodes that resonate strengthen, nodes that don't get pruned.
 *        The genome *sounds* through the crystal structure.
 *
 *   4. CRYSTAL CODEC — The lattice topology IS the DNA. Encode/decode
 *        between genome and structure. Crystal memory — the lattice
 *        remembers its genome through its topology.
 *
 * The DNA acts as the foundational blueprint — the code that instructs
 * the crystal how to hold its being without collapsing.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import {
  Gem, Play, Pause, RotateCcw, Dna, Shield, Layers,
  AudioWaveform, Fingerprint, TreePine,
} from 'lucide-react';
import {
  type Vec3,
  type LatticeState,
  type LatticeStats,
  type LatticeType,
  type DetectedShell,
  v3, v3add, v3scale, v3len,
  rotateX, rotateY,
  project,
  buildBlueprint,
  initLattice,
  growthTick,
  detectPlatonicShells,
  getLatticeStats,
  deriveLatticeType,
} from '../lib/lattice-math';
import {
  type FractalTree,
  type FractalNode as FractalNodeType,
  generateFractalTree,
} from '../lib/fractal-grammar';
import {
  type ResonanceFieldState,
  type ResonanceNode,
  type StandingWavePattern,
  initResonanceField,
  resonanceTick,
  detectStandingWaves,
  getResonanceColor,
  getResonanceIntensity,
} from '../lib/resonance-field';
import {
  type CrystalFingerprint,
  encodeCrystal,
  readCrystalMemory,
} from '../lib/crystal-codec';

// ── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 380;
const CANVAS_H = 380;
const FOV      = 320;
const VIEW_DIST = 8;
const GROWTH_INTERVAL = 100;
const MAX_TICKS = 600;

// ── Visual mode ──────────────────────────────────────────────────────────────
type VisualMode = 'lattice' | 'fractal' | 'resonance' | 'codec';

const MODE_LABELS: Record<VisualMode, string> = {
  lattice:   'Scaffold',
  fractal:   'Fractal',
  resonance: 'Resonance',
  codec:     'Memory',
};

// ── Color palettes by lattice type ───────────────────────────────────────────
const LATTICE_COLORS: Record<LatticeType, {
  node: string;     nodeGlow: string;
  edge: string;     edgeHL: string;
  stress: string;   blueprint: string;
  shell: string;    bg: string;
  fractal: string;  resonance: string;
}> = {
  fcc: {
    node: '#67e8f9', nodeGlow: '#22d3ee',
    edge: '#164e63', edgeHL: '#06b6d4',
    stress: '#ef4444', blueprint: '#1e3a5f',
    shell: '#fbbf24', bg: '#020c1b',
    fractal: '#34d399', resonance: '#f59e0b',
  },
  bcc: {
    node: '#a78bfa', nodeGlow: '#8b5cf6',
    edge: '#3b1f6e', edgeHL: '#7c3aed',
    stress: '#f87171', blueprint: '#2e1065',
    shell: '#f59e0b', bg: '#0a0520',
    fractal: '#67e8f9', resonance: '#fb923c',
  },
  hcp: {
    node: '#34d399', nodeGlow: '#10b981',
    edge: '#064e3b', edgeHL: '#059669',
    stress: '#fb923c', blueprint: '#022c22',
    shell: '#e879f9', bg: '#011a0e',
    fractal: '#a78bfa', resonance: '#fbbf24',
  },
  icosahedral: {
    node: '#fb923c', nodeGlow: '#f97316',
    edge: '#7c2d12', edgeHL: '#ea580c',
    stress: '#ef4444', blueprint: '#431407',
    shell: '#67e8f9', bg: '#120800',
    fractal: '#34d399', resonance: '#a78bfa',
  },
};

const LATTICE_LABELS: Record<LatticeType, string> = {
  fcc:         'Face-Centered Cubic',
  bcc:         'Body-Centered Cubic',
  hcp:         'Hexagonal Close-Packed',
  icosahedral: 'Icosahedral Quasicrystal',
};

const SHELL_SYMBOLS: Record<string, string> = {
  tetrahedron:  '△',
  cube:         '□',
  octahedron:   '◇',
  icosahedron:  '⬡',
  dodecahedron: '⬠',
};

// ── Drawing helpers ──────────────────────────────────────────────────────────

function drawLatticeMode(
  ctx: CanvasRenderingContext2D,
  state: LatticeState,
  time: number,
  showBlueprint: boolean,
  showStress: boolean,
  shells: DetectedShell[],
  colors: typeof LATTICE_COLORS.fcc,
) {
  const W = CANVAS_W, H = CANVAS_H;
  const cx = W / 2, cy = H / 2;
  const ry = time * 0.0004, rx = time * 0.00025 + 0.3;

  type LNode = typeof state.nodes[0];
  const nodeMap = new Map<number, LNode>();
  for (const n of state.nodes) nodeMap.set(n.id, n);

  const proj = (v: Vec3) => {
    let p = rotateY(v, ry);
    p = rotateX(p, rx);
    return project(p, cx, cy, FOV, VIEW_DIST);
  };

  // Project materialised nodes
  interface PN { sx: number; sy: number; depth: number; idx: number }
  const projected: PN[] = [];
  for (let i = 0; i < state.nodes.length; i++) {
    const n = state.nodes[i];
    if (!n.alive) continue;
    const { sx, sy, depth } = proj(n.pos);
    projected.push({ sx, sy, depth, idx: i });
  }

  const builtIds = new Set(state.nodes.filter(n => n.alive).map(n => n.id));

  // Blueprint ghost edges
  if (showBlueprint) {
    ctx.strokeStyle = colors.blueprint;
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.18;
    for (const [a, b] of state.blueprint.targetEdges) {
      if (builtIds.has(a) && builtIds.has(b)) continue;
      const pa = proj(state.blueprint.targetNodes[a]);
      const pb = proj(state.blueprint.targetNodes[b]);
      ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
    }

    // Ghost nodes
    for (let i = 0; i < state.blueprint.targetNodes.length; i++) {
      if (builtIds.has(i)) continue;
      const g = proj(state.blueprint.targetNodes[i]);
      const da = Math.max(0.06, Math.min(0.25, FOV / (g.depth * 60)));
      ctx.fillStyle = colors.blueprint;
      ctx.globalAlpha = da;
      ctx.beginPath(); ctx.arc(g.sx, g.sy, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  // Platonic shell wireframes
  if (shells.length > 0) {
    ctx.strokeStyle = colors.shell;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.30 + 0.1 * Math.sin(time * 0.003);
    ctx.shadowColor = colors.shell;
    ctx.shadowBlur = 8;
    for (const shell of shells) {
      const pts = shell.nodeIds.map(id => nodeMap.has(id) ? proj(nodeMap.get(id)!.pos) : null)
        .filter(Boolean) as { sx: number; sy: number }[];
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          ctx.beginPath(); ctx.moveTo(pts[i].sx, pts[i].sy); ctx.lineTo(pts[j].sx, pts[j].sy); ctx.stroke();
        }
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
  }

  // Materialised edges
  const nodeScreenPos = new Map<number, { sx: number; sy: number; depth: number }>();
  for (const p of projected) nodeScreenPos.set(state.nodes[p.idx].id, p);

  for (const edge of state.edges) {
    const pa = nodeScreenPos.get(edge.a), pb = nodeScreenPos.get(edge.b);
    if (!pa || !pb) continue;
    const avgD = (pa.depth + pb.depth) * 0.5;
    const da = Math.max(0.1, Math.min(1, FOV / (avgD * 50)));

    if (showStress && edge.load > 0.5) {
      const t = Math.min(1, (edge.load - 0.5) * 2);
      ctx.strokeStyle = `rgb(${Math.round(255 * t)},${Math.round(255 * (1 - t * 0.6))},50)`;
      ctx.lineWidth = 1.2 + edge.load;
    } else if (edge.reinforced) {
      ctx.strokeStyle = colors.edgeHL; ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = colors.edge; ctx.lineWidth = 0.8;
    }
    ctx.globalAlpha = da * 0.7;
    ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Materialised nodes (depth-sorted)
  projected.sort((a, b) => b.depth - a.depth);
  for (const p of projected) {
    const node = state.nodes[p.idx];
    const df = Math.max(0.3, Math.min(1.2, FOV / (p.depth * 45)));
    const r = (2.0 + (node.coordination / 12) * 2.5) * df;
    const age = state.generation - node.generation;
    const pulse = age < 5 ? 1 + (5 - age) * 0.15 * Math.sin(time * 0.01) : 1;

    let fill: string;
    if (showStress && node.stress > 0.6) {
      const t = Math.min(1, (node.stress - 0.6) * 2.5);
      fill = `rgb(${Math.round(255 * t + 100 * (1 - t))},${Math.round(200 * (1 - t))},${Math.round(80 * (1 - t))})`;
    } else {
      fill = colors.node;
    }

    if (node.coordination >= 6) { ctx.shadowColor = colors.nodeGlow; ctx.shadowBlur = 6 + node.coordination; }
    else ctx.shadowBlur = 0;

    ctx.fillStyle = fill;
    ctx.globalAlpha = df * 0.85;
    ctx.beginPath(); ctx.arc(p.sx, p.sy, Math.max(1, r * pulse), 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;

  // Growth wavefront
  if (!state.collapsed && state.completion < 1) {
    for (const fn of state.nodes.filter(n => n.alive && n.generation === state.generation)) {
      const p = proj(fn.pos);
      ctx.strokeStyle = colors.nodeGlow;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(time * 0.004);
      ctx.beginPath(); ctx.arc(p.sx, p.sy, 4 + 3 * Math.sin(time * 0.005), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  // Integrity ring
  const ih = state.integrity > 0.6 ? 160 : state.integrity > 0.3 ? 45 : 0;
  ctx.strokeStyle = `hsla(${ih},70%,55%,${0.15 + 0.02 * Math.sin(time * 0.002)})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.47 * state.integrity, 0, Math.PI * 2); ctx.stroke();

  if (state.collapsed) {
    ctx.fillStyle = 'rgba(255,50,50,0.08)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6 + 0.2 * Math.sin(time * 0.005);
    ctx.fillText('LATTICE COLLAPSED', cx, cy); ctx.globalAlpha = 1;
  }
}

function drawFractalMode(
  ctx: CanvasRenderingContext2D,
  tree: FractalTree,
  time: number,
  colors: typeof LATTICE_COLORS.fcc,
) {
  const W = CANVAS_W, H = CANVAS_H;
  const cx = W / 2, cy = H * 0.85; // base at bottom
  const ry = time * 0.0003, rx = 0.15;
  const scale = 55;

  const proj = (v: Vec3) => {
    let p = rotateY(v, ry);
    p = rotateX(p, rx);
    return project(p, cx, cy - H * 0.35, FOV * 0.8, VIEW_DIST);
  };

  // Edges (branches)
  for (const e of tree.edges) {
    const pa = proj(tree.nodes[e.a].pos);
    const pb = proj(tree.nodes[e.b].pos);
    const depthFade = Math.max(0.15, 1 - e.depth * 0.15);
    const width = Math.max(0.5, 3 - e.depth * 0.5);

    // Color shifts with depth
    const hue = 140 + e.depth * 25;
    ctx.strokeStyle = `hsla(${hue},65%,55%,${depthFade * 0.8})`;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
  }

  // Nodes
  const projNodes = tree.nodes.map((n, i) => ({ ...proj(n.pos), idx: i }));
  projNodes.sort((a, b) => b.depth - a.depth);

  for (const p of projNodes) {
    const node = tree.nodes[p.idx];
    const r = Math.max(1, 3.5 - node.depth * 0.5);
    const hue = 160 + node.dnaDigit * 20;
    const pulse = 1 + 0.15 * Math.sin(time * 0.005 + node.depth * 0.8);

    if (node.depth === 0) {
      ctx.shadowColor = colors.fractal; ctx.shadowBlur = 12;
    } else if (node.depth <= 1) {
      ctx.shadowColor = colors.fractal; ctx.shadowBlur = 6;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = `hsl(${hue},70%,${55 + node.dnaDigit * 3}%)`;
    ctx.globalAlpha = Math.max(0.3, 1 - node.depth * 0.12);
    ctx.beginPath(); ctx.arc(p.sx, p.sy, r * pulse, 0, Math.PI * 2); ctx.fill();
  }

  ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;

  // Branch depth rings
  for (let d = 1; d <= tree.maxDepth; d++) {
    const ringR = d * 25;
    ctx.strokeStyle = `hsla(${140 + d * 25},40%,40%,${0.06})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(cx, cy - H * 0.35, ringR, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawResonanceMode(
  ctx: CanvasRenderingContext2D,
  state: LatticeState,
  resField: ResonanceFieldState,
  waves: StandingWavePattern[],
  time: number,
  colors: typeof LATTICE_COLORS.fcc,
) {
  const W = CANVAS_W, H = CANVAS_H;
  const cx = W / 2, cy = H / 2;
  const ry = time * 0.0003, rx = time * 0.0002 + 0.3;

  const proj = (v: Vec3) => {
    let p = rotateY(v, ry);
    p = rotateX(p, rx);
    return project(p, cx, cy, FOV, VIEW_DIST);
  };

  // Build resonance node lookup
  const resMap = new Map<number, ResonanceNode>();
  for (const rn of resField.nodes) resMap.set(rn.nodeId, rn);

  // Draw resonating edges with glow
  const nodeScreenPos = new Map<number, { sx: number; sy: number; depth: number }>();
  for (const n of state.nodes) {
    if (!n.alive) continue;
    const p = proj(n.pos);
    nodeScreenPos.set(n.id, p);
  }

  for (const edge of resField.edges) {
    const pa = nodeScreenPos.get(edge.a), pb = nodeScreenPos.get(edge.b);
    if (!pa || !pb) continue;

    if (edge.resonating) {
      ctx.strokeStyle = colors.resonance;
      ctx.lineWidth = 1.5 + edge.coupling * 2;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 0.006);
      ctx.shadowColor = colors.resonance;
      ctx.shadowBlur = 8;
    } else {
      const flow = Math.min(1, edge.flowRate * 5);
      ctx.strokeStyle = `hsla(200,40%,${30 + flow * 20}%,${0.2 + flow * 0.3})`;
      ctx.lineWidth = 0.6 + flow;
      ctx.shadowBlur = 0;
    }
    ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;

  // Draw nodes with resonance colors
  const sortedNodes = state.nodes.filter(n => n.alive)
    .map(n => ({ node: n, proj: nodeScreenPos.get(n.id)! }))
    .filter(x => x.proj)
    .sort((a, b) => b.proj.depth - a.proj.depth);

  for (const { node, proj: p } of sortedNodes) {
    const rn = resMap.get(node.id);
    if (!rn) continue;

    const intensity = getResonanceIntensity(rn);
    const df = Math.max(0.3, Math.min(1.2, FOV / (p.depth * 45)));
    const baseR = 2 + intensity * 4;
    const r = baseR * df;

    const resColor = getResonanceColor(rn);

    if (rn.resonant) {
      ctx.shadowColor = colors.resonance;
      ctx.shadowBlur = 6 + rn.harmonicRank * 4;
    } else {
      ctx.shadowBlur = 0;
    }

    // Pulsing amplitude ring
    if (rn.amplitude > 0.4) {
      const ringR = r + rn.amplitude * 6 * Math.abs(Math.sin(rn.phase));
      ctx.strokeStyle = resColor;
      ctx.lineWidth = 0.4;
      ctx.globalAlpha = 0.2;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, ringR, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.fillStyle = resColor;
    ctx.globalAlpha = df * 0.85;
    ctx.beginPath(); ctx.arc(p.sx, p.sy, Math.max(1, r), 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;

  // Standing wave pattern visualisation
  if (waves.length > 0) {
    for (let w = 0; w < Math.min(waves.length, 3); w++) {
      const wave = waves[w];
      const hue = 30 + w * 40;
      ctx.strokeStyle = `hsla(${hue},80%,60%,${0.08 + 0.04 * Math.sin(time * 0.003 + w)})`;
      ctx.lineWidth = 0.8;
      // Draw connecting arcs between wave nodes
      const wavePts = wave.nodeIds
        .map(id => nodeScreenPos.get(id))
        .filter(Boolean) as { sx: number; sy: number }[];
      for (let i = 0; i < wavePts.length - 1; i++) {
        const a = wavePts[i], b = wavePts[i + 1];
        const midX = (a.sx + b.sx) / 2 + Math.sin(time * 0.002 + w) * 8;
        const midY = (a.sy + b.sy) / 2 + Math.cos(time * 0.002 + w) * 8;
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy);
        ctx.quadraticCurveTo(midX, midY, b.sx, b.sy);
        ctx.stroke();
      }
    }
  }

  // Global energy ring
  const energyRatio = Math.min(1, resField.globalEnergy / (resField.nodes.length || 1));
  ctx.strokeStyle = `hsla(40,80%,55%,${0.1 + energyRatio * 0.15})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.47 * energyRatio, 0, Math.PI * 2); ctx.stroke();
}

function drawCodecMode(
  ctx: CanvasRenderingContext2D,
  fingerprint: CrystalFingerprint | null,
  crystalMemory: string,
  time: number,
  colors: typeof LATTICE_COLORS.fcc,
) {
  const W = CANVAS_W, H = CANVAS_H;
  const cx = W / 2, cy = H / 2;

  if (!fingerprint) return;

  // Draw the coordination sequence as a circular barcode
  const seq = fingerprint.coordSequence;
  const n = Math.min(seq.length, 60);
  const ringR = Math.min(W, H) * 0.38;

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const digit = seq[i];
    const barLen = 8 + digit * 6;
    const innerR = ringR - barLen / 2;
    const outerR = ringR + barLen / 2;

    const hue = digit * 40 + 160;
    const pulse = 1 + 0.1 * Math.sin(time * 0.003 + i * 0.15);

    ctx.strokeStyle = `hsla(${hue},65%,55%,${0.5 + digit * 0.07})`;
    ctx.lineWidth = Math.max(1, (Math.PI * 2 * ringR / n) * 0.7);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR * pulse, cy + Math.sin(angle) * innerR * pulse);
    ctx.lineTo(cx + Math.cos(angle) * outerR * pulse, cy + Math.sin(angle) * outerR * pulse);
    ctx.stroke();
  }

  // Inner crystal memory ring
  const memR = ringR * 0.55;
  for (let i = 0; i < crystalMemory.length; i++) {
    const angle = (i / crystalMemory.length) * Math.PI * 2 - Math.PI / 2;
    const digit = parseInt(crystalMemory[i], 10) || 0;
    const barLen = 4 + digit * 4;
    const innerR2 = memR - barLen / 2;
    const outerR2 = memR + barLen / 2;

    const hue = digit * 35 + 30;
    ctx.strokeStyle = `hsla(${hue},70%,50%,${0.3 + digit * 0.06})`;
    ctx.lineWidth = Math.max(1, (Math.PI * 2 * memR / crystalMemory.length) * 0.6);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR2, cy + Math.sin(angle) * innerR2);
    ctx.lineTo(cx + Math.cos(angle) * outerR2, cy + Math.sin(angle) * outerR2);
    ctx.stroke();
  }

  // Center info
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.node;
  ctx.globalAlpha = 0.8;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(fingerprint.symmetryClass.toUpperCase(), cx, cy - 18);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`entropy: ${fingerprint.entropy} bits`, cx, cy);
  ctx.fillText(`confidence: ${Math.round(fingerprint.confidence * 100)}%`, cx, cy + 14);
  ctx.fillText(`checksum: ${(fingerprint.checksum >>> 0).toString(16).slice(0, 8)}`, cx, cy + 28);
  ctx.globalAlpha = 1;

  // Outer label ring
  ctx.strokeStyle = `hsla(190,40%,40%,0.15)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(cx, cy, ringR + 20, 0, Math.PI * 2); ctx.stroke();

  // Rotating scan line
  const scanAngle = time * 0.001;
  ctx.strokeStyle = `hsla(180,80%,60%,0.15)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(scanAngle) * (ringR + 20), cy + Math.sin(scanAngle) * (ringR + 20));
  ctx.stroke();
}

// ── Component ────────────────────────────────────────────────────────────────

interface CrystallineLatticeProps {
  dna?: string;
}

export function CrystallineLattice({ dna }: CrystallineLatticeProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const stateRef   = useRef<LatticeState | null>(null);
  const tickRef    = useRef(0);
  const lastGrow   = useRef(0);
  const fractalRef = useRef<FractalTree | null>(null);
  const resRef     = useRef<ResonanceFieldState | null>(null);
  const lastResTick = useRef(0);

  const [mode,       setMode]       = useState<VisualMode>('lattice');
  const [growing,    setGrowing]    = useState(false);
  const [stats,      setStats]      = useState<LatticeStats | null>(null);
  const [showBP,     setShowBP]     = useState(true);
  const [showStress, setShowStress] = useState(false);
  const [shells,     setShells]     = useState<DetectedShell[]>([]);
  const [waves,      setWaves]      = useState<StandingWavePattern[]>([]);
  const [dnaActive,  setDnaActive]  = useState(false);
  const [latticeType, setLatticeType] = useState<LatticeType>('fcc');
  const [fingerprint, setFingerprint] = useState<CrystalFingerprint | null>(null);
  const [crystalMem, setCrystalMem] = useState('0'.repeat(60));
  const [resRatio,   setResRatio]   = useState(0);

  const modeRef = useRef<VisualMode>('lattice');
  modeRef.current = mode;

  // ── Initialise ─────────────────────────────────────────────────────────
  const initFromDna = useCallback((dnaStr?: string) => {
    const genome = dnaStr || '0'.repeat(60);
    const blueprint = buildBlueprint(genome);
    const initial = initLattice(blueprint, genome);
    stateRef.current = initial;
    tickRef.current = 0;
    lastGrow.current = 0;

    // Generate fractal tree
    fractalRef.current = generateFractalTree(genome);

    // Init resonance field (start empty — will populate as lattice grows)
    resRef.current = initResonanceField(
      [initial.nodes[0].id],
      [initial.nodes[0].dnaDigit],
      [],
    );
    lastResTick.current = 0;

    setStats(getLatticeStats(initial));
    setShells([]);
    setWaves([]);
    setDnaActive(!!dnaStr);
    setLatticeType(deriveLatticeType(genome));
    setGrowing(false);
    setFingerprint(null);
    setCrystalMem('0'.repeat(60));
    setResRatio(0);
  }, []);

  useEffect(() => { initFromDna(dna); }, [dna, initFromDna]);

  // ── Render loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = LATTICE_COLORS[latticeType].bg;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const loop = (time: number) => {
      const state = stateRef.current;
      if (!state) { rafRef.current = requestAnimationFrame(loop); return; }
      const colors = LATTICE_COLORS[latticeType];

      // ── Growth tick ──────────────────────────────────────────────────
      if (growing && !state.collapsed && state.completion < 1 && tickRef.current < MAX_TICKS) {
        if (time - lastGrow.current > GROWTH_INTERVAL) {
          lastGrow.current = time;
          tickRef.current++;
          const genome = dna || '0'.repeat(60);
          const next = growthTick(state, genome, tickRef.current);
          stateRef.current = next;

          // Update resonance field with new nodes
          const aliveNodes = next.nodes.filter(n => n.alive);
          const nodeIds = aliveNodes.map(n => n.id);
          const dnaDigits = aliveNodes.map(n => n.dnaDigit);
          const edgePairs: [number, number][] = next.edges.map(e => [e.a, e.b]);
          resRef.current = initResonanceField(nodeIds, dnaDigits, edgePairs);

          if (tickRef.current % 5 === 0) {
            setStats(getLatticeStats(next));
            setShells(detectPlatonicShells(next));
          }

          if (next.completion >= 1 || next.collapsed) {
            setGrowing(false);
            setStats(getLatticeStats(next));
            setShells(detectPlatonicShells(next));

            // Compute crystal fingerprint on completion
            const genome2 = dna || '0'.repeat(60);
            const enc = encodeCrystal(next, genome2);
            setFingerprint(enc.fingerprint);
            setCrystalMem(readCrystalMemory(next));
          }
        }
      }

      // ── Resonance tick (runs independently of growth) ────────────────
      if (resRef.current && time - lastResTick.current > 50) {
        lastResTick.current = time;
        resRef.current = resonanceTick(resRef.current, 0.08);
        if (modeRef.current === 'resonance' && tickRef.current % 10 === 0) {
          setWaves(detectStandingWaves(resRef.current));
          setResRatio(resRef.current.resonanceRatio);
        }
      }

      // ── Draw ─────────────────────────────────────────────────────────
      // Trail / clear
      ctx.fillStyle = colors.bg;
      ctx.globalAlpha = modeRef.current === 'codec' ? 0.3 : 0.15;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1.0;

      switch (modeRef.current) {
        case 'lattice':
          drawLatticeMode(ctx, stateRef.current!, time, showBP, showStress, shells, colors);
          break;
        case 'fractal':
          if (fractalRef.current) drawFractalMode(ctx, fractalRef.current, time, colors);
          break;
        case 'resonance':
          if (resRef.current) drawResonanceMode(ctx, stateRef.current!, resRef.current, waves, time, colors);
          break;
        case 'codec':
          drawCodecMode(ctx, fingerprint, crystalMem, time, colors);
          break;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [growing, showBP, showStress, shells, waves, latticeType, dna, fingerprint, crystalMem]);

  const toggleGrowth = useCallback(() => setGrowing(g => !g), []);
  const reset = useCallback(() => initFromDna(dna), [dna, initFromDna]);

  const colors = LATTICE_COLORS[latticeType];
  const fractal = fractalRef.current;

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Gem className="w-4 h-4" style={{ color: colors.node }} />
            Crystalline Lattice
            {dnaActive && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                style={{ color: colors.node, backgroundColor: colors.edge + '20', borderColor: colors.edge + '60' }}>
                <Dna className="w-3 h-3" /> DNA-blueprint
              </span>
            )}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
            {LATTICE_LABELS[latticeType]} · symmetry={stats?.symmetryOrder ?? '—'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 text-[10px] font-mono">
          {(['lattice', 'fractal', 'resonance', 'codec'] as VisualMode[]).map(m => {
            const icons: Record<VisualMode, typeof Gem> = {
              lattice: Layers, fractal: TreePine, resonance: AudioWaveform, codec: Fingerprint,
            };
            const Icon = icons[m];
            return (
              <button key={m} onClick={() => setMode(m)}
                className={`px-2 py-1 rounded transition-colors ${
                  mode === m
                    ? 'bg-cyan-500/15 border border-cyan-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
                style={mode === m ? { color: colors.node } : undefined}
              >
                <Icon className="w-3 h-3 inline mr-0.5" />{MODE_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle buttons (lattice mode) */}
      {mode === 'lattice' && (
        <div className="flex gap-1 justify-center text-[10px] font-mono">
          <button onClick={() => setShowBP(b => !b)}
            className={`px-2 py-1 rounded transition-colors ${
              showBP ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}>
            <Layers className="w-3 h-3 inline mr-0.5" />BP
          </button>
          <button onClick={() => setShowStress(s => !s)}
            className={`px-2 py-1 rounded transition-colors ${
              showStress ? 'text-red-300 bg-red-500/15 border border-red-500/30' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}>
            <Shield className="w-3 h-3 inline mr-0.5" />Stress
          </button>
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        className="rounded-xl border mx-auto block bg-[#020612]"
        style={{ borderColor: colors.edge + '60' }}
      />

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button size="sm" onClick={toggleGrowth} className="gap-1.5 text-xs"
          style={growing ? { backgroundColor: colors.nodeGlow + 'cc' } : undefined}>
          {growing
            ? <><Pause className="w-3 h-3" /> Pause</>
            : <><Play className="w-3 h-3" /> {(stats?.completion ?? 0) >= 1 ? 'Complete' : 'Grow'}</>}
        </Button>
        <Button size="sm" variant="outline" onClick={reset} className="gap-1.5 text-xs">
          <RotateCcw className="w-3 h-3" /> Reset
        </Button>
      </div>

      {/* Mode-specific stats */}
      {mode === 'lattice' && stats && (
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            { label: 'Nodes', value: stats.nodeCount, color: colors.node },
            { label: 'Edges', value: stats.edgeCount, color: colors.nodeGlow },
            { label: 'Avg Coord', value: stats.avgCoord, color: colors.node },
            { label: 'Integrity', value: `${Math.round(stats.integrity * 100)}%`,
              color: stats.integrity > 0.6 ? '#34d399' : stats.integrity > 0.3 ? '#fbbf24' : '#ef4444' },
            { label: 'Completion', value: `${Math.round(stats.completion * 100)}%`,
              color: stats.completion >= 1 ? '#34d399' : colors.node },
            { label: 'Max Stress', value: stats.maxStress,
              color: stats.maxStress > 0.7 ? '#ef4444' : stats.maxStress > 0.4 ? '#fbbf24' : '#34d399' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-slate-700/60 bg-slate-900/40 py-1.5 px-1">
              <p className="text-sm font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5 leading-none">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {mode === 'fractal' && fractal && (
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            { label: 'Nodes', value: fractal.nodes.length, color: colors.fractal },
            { label: 'Branches', value: fractal.edges.length, color: colors.nodeGlow },
            { label: 'Max Depth', value: fractal.maxDepth, color: colors.fractal },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-slate-700/60 bg-slate-900/40 py-1.5 px-1">
              <p className="text-sm font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5 leading-none">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {mode === 'resonance' && (
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            { label: 'Resonance', value: `${Math.round(resRatio * 100)}%`,
              color: resRatio > 0.5 ? '#fbbf24' : resRatio > 0.2 ? '#fb923c' : '#64748b' },
            { label: 'Waves', value: waves.length, color: colors.resonance },
            { label: 'Harmonic', value: resRef.current?.harmonicOrder ?? 0, color: colors.resonance },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-slate-700/60 bg-slate-900/40 py-1.5 px-1">
              <p className="text-sm font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5 leading-none">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {mode === 'codec' && fingerprint && (
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            { label: 'Symmetry', value: fingerprint.symmetryClass, color: colors.node },
            { label: 'Entropy', value: `${fingerprint.entropy}b`, color: colors.nodeGlow },
            { label: 'Confidence', value: `${Math.round(fingerprint.confidence * 100)}%`,
              color: fingerprint.confidence > 0.7 ? '#34d399' : '#fbbf24' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-slate-700/60 bg-slate-900/40 py-1.5 px-1">
              <p className="text-sm font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5 leading-none">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detected geometry */}
      {mode === 'lattice' && shells.length > 0 && (
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 font-mono mb-1">Emergent geometry detected</p>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {(() => {
              const counts = new Map<string, number>();
              for (const s of shells) counts.set(s.type, (counts.get(s.type) || 0) + 1);
              return [...counts.entries()].map(([type, count]) => (
                <span key={type} className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                  style={{ color: colors.shell, borderColor: colors.shell + '40', backgroundColor: colors.shell + '10' }}>
                  {SHELL_SYMBOLS[type] || '?'} {type} x{count}
                </span>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Standing waves */}
      {mode === 'resonance' && waves.length > 0 && (
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 font-mono mb-1">Standing wave patterns</p>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {waves.slice(0, 4).map((w, i) => (
              <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{ color: colors.resonance, borderColor: colors.resonance + '40', backgroundColor: colors.resonance + '10' }}>
                f={w.frequency.toFixed(2)} | {w.nodeIds.length} nodes | A={w.amplitude.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fractal rule signature */}
      {mode === 'fractal' && fractal && (
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 font-mono mb-1">L-system rule signature</p>
          <p className="text-[11px] font-mono tracking-wider" style={{ color: colors.fractal }}>
            {fractal.ruleSignature.split('').map((d, i) => {
              const rules = ['F', 'F[+F]', 'F[-F]', 'F[+F][-F]', 'FF', 'F[+F]F', 'F[&F][^F]'];
              return (
                <span key={i} className="inline-block mx-px" title={`digit ${d} → ${rules[parseInt(d, 10)] || 'F'}`}>
                  {d}
                </span>
              );
            })}
          </p>
        </div>
      )}

      {/* Info */}
      <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
        {mode === 'lattice' && <>
          {LATTICE_LABELS[latticeType]} · DNA → blueprint → intelligent growth<br />
          Stress propagation prevents collapse · Platonic sub-shells emerge
        </>}
        {mode === 'fractal' && <>
          L-system grammar · each DNA digit = production rule<br />
          Recursive rewriting → fractal branching in 3D space
        </>}
        {mode === 'resonance' && <>
          Harmonic oscillators · DNA digits → natural frequencies<br />
          Constructive interference = resonance · the genome sounds through the crystal
        </>}
        {mode === 'codec' && <>
          Crystal topology encodes DNA · coordination sequence = genome<br />
          The lattice remembers its DNA through its structure
        </>}
        {dnaActive && <><br />Each genome crystallises uniquely — the DNA holds the being</>}
      </p>
    </div>
  );
}
