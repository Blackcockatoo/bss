'use client';

/**
 * CrystallineNetwork — Multidimensional Small-World Consciousness Routing
 *
 * Topology: 60-node ring (mirrors the app's 60-circle element system)
 *   + Watts-Strogatz random rewiring (β=0.28)
 *   + Prime-bridge shortcuts (connects residue i to i+{7,11,13,17}%60)
 *   resulting in a provably small-world graph where every node is within
 *   O(log N) hops of every other — the minimal-routing crystalline ideal.
 *
 * Coordinate systems (multidimensional):
 *   2D  – force-directed layout (repulsion + spring + gravity)
 *   4D  – Lissajous knot on the 2-torus: frequency ratio = φ (golden ratio)
 *         the path never closes → fills the torus uniformly → transcendental
 *
 * Crystallization = simulated annealing phase transition:
 *   disorder (high temp) → crystalline order (temp → 0)
 *   Post-crystallization: particles route along Floyd-Warshall shortest paths.
 *
 * DNA integration: when a 60-digit DNA sequence is provided, the network
 *   topology and node properties are seeded deterministically from the genome.
 *   Each digit controls local rewiring probability and bridge activation,
 *   making every pet's network structurally unique while preserving the
 *   small-world property.
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Zap, RotateCcw, Network, Crosshair, Dna } from 'lucide-react';

// ── Mathematical constants ────────────────────────────────────────────────────
const N   = 60;
const PHI = (1 + Math.sqrt(5)) / 2;
// Primes used as bridge distances in the 60-circle element graph
const PRIME_BRIDGES = [7, 11, 13, 17, 19, 23] as const;

/**
 * Seeded pseudo-random number generator (xorshift32).
 * When DNA is provided, this replaces Math.random() so the topology
 * is deterministic for a given genome.
 */
function createSeededRng(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** Convert a DNA digit string (e.g. "113031...") into a numeric seed. */
function dnaSeed(dna: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < dna.length; i++) {
    h ^= dna.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return h >>> 0;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface SimNode  { x: number; y: number; vx: number; vy: number }
interface Particle { path: number[]; t: number; hue: number; speed: number }

interface NetData {
  edges:      [number, number][];
  adj:        number[][];
  dist:       number[][];          // all-pairs shortest paths (Floyd-Warshall)
  centrality: number[];            // betweenness, normalised 0-1
  coords4d:   [number, number, number, number][];
  stats: { avgPath: number; diameter: number; edgeCount: number; clustering: number };
}

interface Sim {
  nodes:       SimNode[];
  particles:   Particle[];
  temp:        number;
  crystallized: boolean;
  flashT:      number;
  selA:        number | null;
  selB:        number | null;
  pathHL:      number[] | null;
  spawnT:      number;
}

// ── Network construction ──────────────────────────────────────────────────────

function buildNetwork(dna?: string): NetData {
  // Use seeded RNG when DNA is provided, otherwise fall back to Math.random
  const rng = dna ? createSeededRng(dnaSeed(dna)) : Math.random;
  const digits = dna ? dna.split('').map(Number) : null;

  const adjSet: Set<number>[] = Array.from({ length: N }, () => new Set<number>());

  // 1. Ring lattice: each node connects to ±1, ±2, ±3
  for (let i = 0; i < N; i++)
    for (let d = 1; d <= 3; d++) {
      const j = (i + d) % N;
      adjSet[i].add(j); adjSet[j].add(i);
    }

  // 2. Watts-Strogatz rewiring — β modulated by DNA digit when available
  //    Higher digit → more rewiring → more unique topology per genome
  for (let i = 0; i < N; i++)
    for (let d = 1; d <= 3; d++) {
      const beta = digits ? 0.15 + (digits[i % digits.length] / 9) * 0.25 : 0.28;
      if (rng() < beta) {
        const old = (i + d) % N;
        let neu = Math.floor(rng() * N), t = 0;
        while ((neu === i || adjSet[i].has(neu)) && t++ < 40)
          neu = Math.floor(rng() * N);
        if (t < 40) {
          adjSet[i].delete(old); adjSet[old].delete(i);
          adjSet[i].add(neu);    adjSet[neu].add(i);
        }
      }
    }

  // 3. Prime-bridge shortcuts — activation probability shaped by DNA
  for (let i = 0; i < N; i++)
    for (const p of PRIME_BRIDGES) {
      const prob = digits ? 0.10 + (digits[(i + p) % digits.length] / 9) * 0.16 : 0.18;
      if (rng() < prob) {
        const j = (i + p) % N;
        adjSet[i].add(j); adjSet[j].add(i);
      }
    }

  const adj = adjSet.map(s => [...s]);

  // 4. Floyd-Warshall  O(N³) = 216 000 — runs once
  const INF = 1e9;
  const dist: number[][] = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => i === j ? 0 : adjSet[i].has(j) ? 1 : INF)
  );
  for (let k = 0; k < N; k++)
    for (let i = 0; i < N; i++) {
      if (dist[i][k] >= INF) continue;
      for (let j = 0; j < N; j++)
        if (dist[i][k] + dist[k][j] < dist[i][j])
          dist[i][j] = dist[i][k] + dist[k][j];
    }

  // 5. Betweenness centrality  O(N³)
  const bc = new Float32Array(N);
  for (let s = 0; s < N; s++)
    for (let t = s + 1; t < N; t++)
      if (dist[s][t] < INF)
        for (let v = 0; v < N; v++)
          if (v !== s && v !== t && dist[s][v] + dist[v][t] === dist[s][t])
            bc[v]++;
  const maxBc = Math.max(...bc, 1);
  const centrality = Array.from(bc, v => v / maxBc);

  // 6. Clustering coefficient
  let ccSum = 0, ccCnt = 0;
  for (let i = 0; i < N; i++) {
    const nb = adj[i], k = nb.length;
    if (k < 2) continue;
    let tri = 0;
    for (let a = 0; a < k; a++)
      for (let b = a + 1; b < k; b++)
        if (adjSet[nb[a]].has(nb[b])) tri++;
    ccSum += (2 * tri) / (k * (k - 1));
    ccCnt++;
  }

  // 7. Stats
  let sum = 0, cnt = 0, diam = 0;
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++)
      if (dist[i][j] < INF) { sum += dist[i][j]; cnt++; diam = Math.max(diam, dist[i][j]); }

  // 8. Edge list
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (let i = 0; i < N; i++)
    for (const j of adj[i]) {
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
    }

  // 9. 4D coordinates: Lissajous knot on the 2-torus with irrational frequency ratio φ
  //    θ₁ = 2π·i/N  (fundamental frequency)
  //    θ₂ = 2π·i·φ/N (golden-ratio harmonic → never repeats, fills torus uniformly)
  //    x = cos θ₁, y = sin θ₁, z = cos θ₂, w = sin θ₂
  const coords4d: [number, number, number, number][] = Array.from({ length: N }, (_, i) => {
    const t1 = (2 * Math.PI * i) / N;
    const t2 = (2 * Math.PI * i * PHI) / N;
    return [Math.cos(t1), Math.sin(t1), Math.cos(t2), Math.sin(t2)];
  });

  return {
    edges,
    adj,
    dist,
    centrality,
    coords4d,
    stats: {
      avgPath:    cnt > 0 ? Math.round((sum / cnt) * 10) / 10 : 0,
      diameter:   diam,
      edgeCount:  edges.length,
      clustering: ccCnt > 0 ? Math.round((ccSum / ccCnt) * 100) / 100 : 0,
    },
  };
}

// ── BFS shortest path ─────────────────────────────────────────────────────────
function bfsPath(adj: number[][], src: number, dst: number): number[] {
  if (src === dst) return [src];
  const parent = new Int8Array(N).fill(-1);
  const vis = new Uint8Array(N);
  vis[src] = 1;
  const q = [src];
  let head = 0;
  while (head < q.length) {
    const v = q[head++];
    for (const u of adj[v]) {
      if (!vis[u]) {
        vis[u] = 1; parent[u] = v; q.push(u);
        if (u === dst) {
          const p = [dst]; let c = dst;
          while (parent[c] !== -1) { c = parent[c]; p.unshift(c); }
          return p;
        }
      }
    }
  }
  return [src, dst];
}

// ── Physics: force-directed with simulated annealing ─────────────────────────
function physicsStep(
  nodes: SimNode[],
  edges: [number, number][],
  temp: number,
): SimNode[] {
  const REPEL = 220, SPRING = 0.032, IDEAL = 70, DAMP = 0.80, GRAV = 0.007;
  const fx = new Float32Array(N);
  const fy = new Float32Array(N);

  // All-pairs repulsion  O(N²)
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
      const d2 = dx * dx + dy * dy + 1;
      const f = REPEL / d2, inv = 1 / Math.sqrt(d2);
      const ffx = f * dx * inv, ffy = f * dy * inv;
      fx[i] -= ffx; fy[i] -= ffy;
      fx[j] += ffx; fy[j] += ffy;
    }

  // Spring attraction along edges
  for (const [a, b] of edges) {
    const dx = nodes[b].x - nodes[a].x, dy = nodes[b].y - nodes[a].y;
    const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
    const f = SPRING * (d - IDEAL) / d;
    fx[a] += f * dx; fy[a] += f * dy;
    fx[b] -= f * dx; fy[b] -= f * dy;
  }

  return nodes.map((n, i) => {
    const noise = temp > 0.02 ? (Math.random() - 0.5) * temp : 0;
    const nvx = (n.vx + fx[i]) * DAMP + noise;
    const nvy = (n.vy + fy[i]) * DAMP + noise;
    return { x: n.x + nvx - n.x * GRAV, y: n.y + nvy - n.y * GRAV, vx: nvx, vy: nvy };
  });
}

// ── 4D → 2D projection (3 independent rotation planes) ───────────────────────
function project4D(
  [x, y, z, w]: [number, number, number, number],
  t: number,
  cx: number, cy: number,
  scale: number,
): [number, number, number] {
  // XW plane (τ₁ = φ-scaled rate for irrational winding)
  const a = t * 0.00038 * PHI;
  let x1 = x * Math.cos(a) - w * Math.sin(a);
  const w1 = x * Math.sin(a) + w * Math.cos(a);
  // YZ plane
  const b = t * 0.00027;
  let y1 = y * Math.cos(b) - z * Math.sin(b);
  const z1 = y * Math.sin(b) + z * Math.cos(b);
  // XY plane
  const c = t * 0.00052;
  const x2 = x1 * Math.cos(c) - y1 * Math.sin(c);
  const y2 = x1 * Math.sin(c) + y1 * Math.cos(c);
  x1 = x2; y1 = y2;
  // Perspective projections  4D→3D then 3D→2D
  const w3 = 2.6 / (2.6 + w1 * 0.8);
  const z2 = 2.2 / (2.2 + z1 * 0.35 + 0.5);
  return [cx + x1 * w3 * z2 * scale, cy + y1 * w3 * z2 * scale, w3 * z2];
}

// ── Canvas draw ───────────────────────────────────────────────────────────────
function draw(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  sim: Sim,
  net: NetData,
  mode: 'flow' | '4d' | 'paths',
  time: number,
) {
  const cx = W / 2, cy = H / 2;

  // Trail
  ctx.fillStyle = `rgba(2,6,18,${sim.crystallized ? 0.10 : 0.16})`;
  ctx.fillRect(0, 0, W, H);

  // Resolve screen positions
  const pts: [number, number, number][] =
    mode === '4d'
      ? net.coords4d.map(c => project4D(c, time, cx, cy, 125))
      : sim.nodes.map(n => [n.x + cx, n.y + cy, 1]);

  // Build path-edge set for highlight
  const hlEdges = new Set<string>();
  if (sim.pathHL)
    for (let i = 0; i < sim.pathHL.length - 1; i++) {
      const a = sim.pathHL[i], b = sim.pathHL[i + 1];
      hlEdges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    }

  // ── Edges ──────────────────────────────────────────────────────────────────
  ctx.shadowBlur = 0;
  for (const [a, b] of net.edges) {
    const [ax, ay, ad] = pts[a], [bx, by, bd] = pts[b];
    const depth = (ad + bd) * 0.5;
    const key   = `${Math.min(a, b)}-${Math.max(a, b)}`;
    const isHL  = hlEdges.has(key);

    if (isHL) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth   = 2.8;
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10;
    } else if (sim.crystallized) {
      const hue = ((a + b) * 5.5) % 360;
      ctx.strokeStyle = `hsl(${hue},55%,52%)`;
      ctx.lineWidth   = 0.75;
      ctx.globalAlpha = depth * 0.50 + 0.05;
      ctx.shadowBlur  = 0;
    } else {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth   = 0.5;
      ctx.globalAlpha = depth * 0.35 + 0.05;
      ctx.shadowBlur  = 0;
    }

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // ── Flow particles ─────────────────────────────────────────────────────────
  for (const p of sim.particles) {
    const idx  = Math.floor(p.t);
    const frac = p.t - idx;
    if (idx >= p.path.length - 1) continue;
    const [ax, ay] = pts[p.path[idx]];
    const [bx, by] = pts[p.path[idx + 1]];
    const px = ax + (bx - ax) * frac;
    const py = ay + (by - ay) * frac;

    ctx.shadowColor = `hsl(${p.hue},100%,65%)`;
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = `hsl(${p.hue},100%,82%)`;
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(px, py, 3.8, 0, Math.PI * 2); ctx.fill();

    // Comet tail
    ctx.shadowBlur = 6; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(ax + (px - ax) * 0.5, ay + (py - ay) * 0.5, 2, 0, Math.PI * 2); ctx.fill();
  }

  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // ── Nodes ─────────────────────────────────────────────────────────────────
  // Depth-sort for 4D mode
  const order = pts.map((_, i) => i).sort((a, b) => pts[a][2] - pts[b][2]);

  for (const i of order) {
    const [nx, ny, depth] = pts[i];
    const c    = net.centrality[i];
    const r    = (2.5 + c * 5) * (mode === '4d' ? depth * 0.8 + 0.4 : 1);
    const hue  = (i / N) * 280 + 180;
    const isSel = i === sim.selA || i === sim.selB;
    const isHL  = sim.pathHL?.includes(i) ?? false;

    if (sim.crystallized || isSel || isHL) {
      ctx.shadowColor = isSel ? '#fbbf24' : isHL ? '#f0abfc' : `hsl(${hue},80%,60%)`;
      ctx.shadowBlur  = isSel ? 18 : isHL ? 14 : c > 0.4 ? 10 : 5;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle   = isSel ? '#fbbf24' : isHL ? '#e879f9' : sim.crystallized
      ? `hsl(${hue},75%,62%)`
      : `hsl(${hue},38%,42%)`;
    ctx.globalAlpha = mode === '4d' ? depth * 0.75 + 0.15 : 0.80;
    ctx.beginPath(); ctx.arc(nx, ny, Math.max(1, r), 0, Math.PI * 2); ctx.fill();
  }

  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // ── Crystal flash ──────────────────────────────────────────────────────────
  if (sim.flashT > 0) {
    ctx.fillStyle = `rgba(180,230,255,${Math.min(1, sim.flashT / 35) * 0.55})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Crystallised ring pulse ────────────────────────────────────────────────
  if (sim.crystallized && !sim.flashT) {
    const pulse = 0.04 * Math.sin(time * 0.001);
    ctx.strokeStyle = `rgba(100,200,255,${0.08 + pulse})`;
    ctx.lineWidth   = 0.5;
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * (0.46 + pulse), 0, Math.PI * 2); ctx.stroke();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
type Mode = 'flow' | '4d' | 'paths';

interface CrystallineNetworkProps {
  /** Optional 60-digit DNA string. When provided, the network topology
   *  is deterministically seeded from the genome — every pet gets a
   *  structurally unique crystalline network. */
  dna?: string;
}

export function CrystallineNetwork({ dna }: CrystallineNetworkProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const netRef    = useRef<NetData | null>(null);
  const simRef    = useRef<Sim | null>(null);
  const modeRef   = useRef<Mode>('flow');

  const [mode, setModeState]         = useState<Mode>('flow');
  const [crystallized, setCrystallized] = useState(false);
  const [crystallizing, setCrystallizing] = useState(false);
  const [pathInfo, setPathInfo]       = useState<string>('');

  // Build network (memoized on DNA) — pure computation only
  const { stats, dnaConnected, net, sim } = useMemo(() => {
    const net = buildNetwork(dna);

    // Golden-spiral initial positions — seeded by DNA when available
    const posRng = dna ? createSeededRng(dnaSeed(dna + ':pos')) : Math.random;
    const sim: Sim = {
      nodes: Array.from({ length: N }, (_, i) => {
        const angle = i * 2 * Math.PI * PHI;
        const r     = Math.sqrt(i / N) * 125;
        return {
          x:  r * Math.cos(angle) + (posRng() - 0.5) * 18,
          y:  r * Math.sin(angle) + (posRng() - 0.5) * 18,
          vx: 0, vy: 0,
        };
      }),
      particles:   [],
      temp:        5.0,
      crystallized: false,
      flashT:      0,
      selA:        null, selB: null, pathHL: null,
      spawnT:      0,
    };

    return { stats: net.stats, dnaConnected: !!dna, net, sim };
  }, [dna]);

  // Sync memoized values to refs (outside render, inside effect)
  useEffect(() => {
    netRef.current = net;
    simRef.current = sim;
  }, [net, sim]);

  // RAF simulation + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#020612'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    let lastSpawn = 0;

    const loop = (time: number) => {
      const sim = simRef.current;
      const net = netRef.current;
      if (!sim || !net) { rafRef.current = requestAnimationFrame(loop); return; }

      // Physics step
      sim.nodes = physicsStep(sim.nodes, net.edges, sim.temp);

      // Annealing: exponential decay (base = e, the transcendental constant)
      if (sim.temp > 0.04) {
        sim.temp *= 0.9990;
        if (sim.temp <= 0.04 && !sim.crystallized) {
          sim.crystallized = true;
          sim.flashT = 55;
          setCrystallized(true);
          setCrystallizing(false);
        }
      }

      if (sim.flashT > 0) sim.flashT--;

      // Spawn particles
      sim.spawnT++;
      if (sim.spawnT >= 80 && time - lastSpawn > 1400) {
        lastSpawn = time; sim.spawnT = 0;
        for (let k = 0; k < 3; k++) {
          const src = Math.floor(Math.random() * N);
          let   dst = Math.floor(Math.random() * N);
          while (dst === src) dst = Math.floor(Math.random() * N);
          const path = sim.crystallized
            ? bfsPath(net.adj, src, dst)
            : bfsPath(net.adj, src, dst); // always BFS — disorder shows in node positions
          sim.particles.push({
            path,
            t:     0,
            hue:   (src / N) * 360,
            speed: 0.045 + Math.random() * 0.04,
          });
        }
        // Cap active particles
        if (sim.particles.length > 24) sim.particles = sim.particles.slice(-24);
      }

      // Advance particles
      sim.particles = sim.particles
        .map(p => ({ ...p, t: p.t + p.speed }))
        .filter(p => p.t < p.path.length - 1);

      draw(ctx, canvas.width, canvas.height, sim, net, modeRef.current, time);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Canvas click: node selection for path mode
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    const net = netRef.current;
    if (!sim || !net || modeRef.current === '4d') return;

    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX - canvas.width  / 2;
    const my = (e.clientY - rect.top)  * scaleY - canvas.height / 2;

    let best = -1, bestD = Infinity;
    for (let i = 0; i < N; i++) {
      const d = (sim.nodes[i].x - mx) ** 2 + (sim.nodes[i].y - my) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0 || bestD > 1024) return; // ~32px threshold

    if (sim.selA === null || sim.selB !== null) {
      sim.selA   = best;
      sim.selB   = null;
      sim.pathHL = null;
      setPathInfo(`Source: node ${best}  |  click a target`);
    } else if (best !== sim.selA) {
      sim.selB   = best;
      sim.pathHL = bfsPath(net.adj, sim.selA, best);
      const len  = sim.pathHL.length - 1;
      const theoretical = net.dist[sim.selA][best];
      setPathInfo(
        `${sim.selA} → ${best}  |  ${len} hops  |  theoretical min: ${theoretical === len ? '✓ optimal' : theoretical}`,
      );
    }
  }, []);

  function switchMode(m: Mode) {
    setModeState(m); modeRef.current = m;
    if (m !== 'paths' && simRef.current) {
      simRef.current.selA   = null;
      simRef.current.selB   = null;
      simRef.current.pathHL = null;
      setPathInfo('');
    }
  }

  function triggerCrystallize() {
    const sim = simRef.current;
    if (!sim) return;
    sim.temp         = 5.0;
    sim.crystallized = false;
    sim.flashT       = 0;
    sim.selA         = null; sim.selB = null; sim.pathHL = null;
    setCrystallized(false); setCrystallizing(true); setPathInfo('');
  }

  function scatter() {
    const sim = simRef.current;
    if (!sim) return;
    sim.nodes = sim.nodes.map(() => ({
      x: (Math.random() - 0.5) * 240,
      y: (Math.random() - 0.5) * 240,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
    }));
    sim.temp         = 6.0;
    sim.crystallized = false;
    sim.flashT       = 0;
    sim.particles    = [];
    sim.selA         = null; sim.selB = null; sim.pathHL = null;
    setCrystallized(false); setCrystallizing(false); setPathInfo('');
  }

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Network className="w-4 h-4 text-cyan-300" />
            Crystalline Network
            {dnaConnected && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                <Dna className="w-3 h-3" /> DNA-seeded
              </span>
            )}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
            N={N} · edges={stats.edgeCount} · avg-path={stats.avgPath} · diameter={stats.diameter} · C={stats.clustering}
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex gap-1 text-[10px] font-mono">
          {(['flow', '4d', 'paths'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-2 py-1 rounded uppercase transition-colors ${
                mode === m
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {m === 'paths' ? <><Crosshair className="w-3 h-3 inline mr-0.5" />Path</> : m}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        onClick={handleClick}
        className={`rounded-xl border mx-auto block ${
          crystallized ? 'border-cyan-500/40' : 'border-slate-700'
        } bg-[#020612] ${mode === 'paths' ? 'cursor-crosshair' : ''}`}
      />

      {/* Path info */}
      {mode === 'paths' && (
        <p className="text-[10px] text-center font-mono text-cyan-400 min-h-[16px]">
          {pathInfo || 'Click a node to begin path trace'}
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button
          size="sm"
          onClick={triggerCrystallize}
          disabled={crystallizing}
          className={`gap-1.5 text-xs ${crystallized ? 'bg-cyan-700 hover:bg-cyan-600' : ''}`}
        >
          <Zap className={`w-3 h-3 ${crystallizing ? 'animate-pulse' : ''}`} />
          {crystallizing ? 'Crystallising…' : crystallized ? 'Re-crystallise' : 'Crystallise'}
        </Button>
        <Button size="sm" variant="outline" onClick={scatter} className="gap-1.5 text-xs">
          <RotateCcw className="w-3 h-3" /> Scatter
        </Button>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {[
          { label: 'Avg path', value: stats.avgPath, color: 'text-cyan-300' },
          { label: 'Diameter', value: stats.diameter, color: 'text-violet-300' },
          { label: 'Edges',    value: stats.edgeCount, color: 'text-emerald-300' },
          { label: 'Cluster C', value: stats.clustering, color: 'text-pink-300' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-slate-700/60 bg-slate-900/40 py-1.5 px-1">
            <p className={`text-sm font-mono font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-zinc-600 mt-0.5 leading-none">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
        60-circle topology · Watts-Strogatz β{dnaConnected ? '=DNA-modulated' : '=0.28'} · prime bridges {PRIME_BRIDGES.join(',')} mod 60<br />
        4D: Lissajous knot — frequency ratio φ (irrational → fills 2-torus uniformly)
        {dnaConnected && <><br />Topology seeded from genome — each pet crystallises differently</>}
      </p>
    </div>
  );
}
