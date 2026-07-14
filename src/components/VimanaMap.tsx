'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Compass, MapPin, Radar, Sparkles } from 'lucide-react';

import { useStore } from '@/lib/store';
import type { VimanaDiscoveryStage, VimanaFieldType, VimanaNode } from '@/lib/vimana';
import { discoveryStageRank, isVimanaNodeDiscovered } from '@/lib/vimana';

import { Button } from './ui/button';

const VIEWBOX = { width: 900, height: 560, paddingX: 120, paddingY: 88 };

type FieldVisual = {
  label: string;
  colour: string;
  glow: string;
  textClass: string;
  pillClass: string;
  reward: string;
};

const SIGNAL_VISUAL: FieldVisual = {
  label: 'Signal',
  colour: '#64748b',
  glow: '#94a3b8',
  textClass: 'text-slate-300',
  pillClass: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  reward: 'Field data concealed',
};

const FIELD_VISUALS: Record<VimanaFieldType, FieldVisual> = {
  calm: {
    label: 'Calm',
    colour: '#2dd4bf',
    glow: '#67e8f9',
    textClass: 'text-teal-200',
    pillClass: 'border-teal-400/35 bg-teal-500/10 text-teal-200',
    reward: 'Mood resonance',
  },
  neuro: {
    label: 'Neuro',
    colour: '#a78bfa',
    glow: '#c4b5fd',
    textClass: 'text-violet-200',
    pillClass: 'border-violet-400/35 bg-violet-500/10 text-violet-200',
    reward: 'Energy resonance',
  },
  quantum: {
    label: 'Quantum',
    colour: '#f59e0b',
    glow: '#f9a8d4',
    textClass: 'text-amber-200',
    pillClass: 'border-amber-400/35 bg-amber-500/10 text-amber-200',
    reward: 'Mood + energy resonance',
  },
  earth: {
    label: 'Earth',
    colour: '#84cc16',
    glow: '#86efac',
    textClass: 'text-lime-200',
    pillClass: 'border-lime-400/35 bg-lime-500/10 text-lime-200',
    reward: 'Hygiene resonance',
  },
};

const STAGE_LABEL: Record<VimanaDiscoveryStage, string> = {
  unknown: 'Unknown',
  detected: 'Detected',
  scanned: 'Scanned',
  explored: 'Explored',
  mastered: 'Mastered',
};

const STAGE_HINT: Record<VimanaDiscoveryStage, string> = {
  unknown: 'Find the signal before its field can be read.',
  detected: 'A route is visible. Scan the signal to reveal the field.',
  scanned: 'The field is mapped. Enter it to deepen the sample.',
  explored: 'Repeat the scan to stabilise and master the field.',
  mastered: 'This field is fully stabilised and permanently charted.',
};

const STAGE_ACTION: Record<VimanaDiscoveryStage, string> = {
  unknown: 'Detect Signal',
  detected: 'Scan Signal',
  scanned: 'Enter Field',
  explored: 'Deep Scan',
  mastered: 'Mastered',
};

type PositionedNode = { node: VimanaNode; x: number; y: number; depth: number };
type RouteSegment = { key: string; source: PositionedNode; target: PositionedNode };

function nodeDisplayName(node: VimanaNode): string {
  return node.label ?? (isVimanaNodeDiscovered(node) ? node.id : 'Unidentified Signal');
}

function shortNodeName(node: VimanaNode): string {
  const label = nodeDisplayName(node);
  return label.length > 19 ? `${label.slice(0, 17)}…` : label;
}

function projectNodes(nodes: VimanaNode[]): PositionedNode[] {
  if (nodes.length === 0) return [];
  const projected = nodes.map((node) => ({
    node,
    rawX: node.coordinates.x + node.coordinates.z * 0.58,
    rawY: -node.coordinates.y + node.coordinates.z * 0.34,
    depth: node.coordinates.z,
  }));
  const xs = projected.map(({ rawX }) => rawX);
  const ys = projected.map(({ rawY }) => rawY);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(1, Math.max(...xs) - minX);
  const spanY = Math.max(1, Math.max(...ys) - minY);
  const usableWidth = VIEWBOX.width - VIEWBOX.paddingX * 2;
  const usableHeight = VIEWBOX.height - VIEWBOX.paddingY * 2;

  return projected.map(({ node, rawX, rawY, depth }) => ({
    node,
    x: VIEWBOX.paddingX + ((rawX - minX) / spanX) * usableWidth,
    y: VIEWBOX.paddingY + ((rawY - minY) / spanY) * usableHeight,
    depth,
  }));
}

function buildRouteSegments(positionedNodes: PositionedNode[]): RouteSegment[] {
  const byId = new Map(positionedNodes.map((item) => [item.node.id, item]));
  const seen = new Set<string>();
  const routes: RouteSegment[] = [];
  for (const source of positionedNodes) {
    for (const targetId of source.node.connections) {
      const target = byId.get(targetId);
      if (!target) continue;
      const key = [source.node.id, target.node.id].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      routes.push({ key, source, target });
    }
  }
  return routes;
}

function stageProgress(stage: VimanaDiscoveryStage): number {
  return (discoveryStageRank(stage) / 4) * 100;
}

export function VimanaMap() {
  const vimana = useStore((state) => state.vimana);
  const vitals = useStore((state) => state.vitals);
  const exploreCell = useStore((state) => state.exploreCell);
  const resolveAnomaly = useStore((state) => state.resolveAnomaly);
  const [selectedId, setSelectedId] = useState(
    vimana.activeNodeId ?? vimana.nodes[0]?.id ?? '',
  );

  const positionedNodes = useMemo(() => projectNodes(vimana.nodes), [vimana.nodes]);
  const routeSegments = useMemo(
    () => buildRouteSegments(positionedNodes),
    [positionedNodes],
  );
  const selectedNode = useMemo(
    () => vimana.nodes.find((node) => node.id === selectedId) ?? vimana.nodes[0],
    [selectedId, vimana.nodes],
  );

  if (!selectedNode) {
    return <p className="py-10 text-center text-sm text-zinc-400">No Vimana signals are available yet.</p>;
  }

  const selectedDiscovered = isVimanaNodeDiscovered(selectedNode);
  const selectedVisual = selectedDiscovered
    ? FIELD_VISUALS[selectedNode.fieldType]
    : SIGNAL_VISUAL;
  const discoveredCount = vimana.nodes.filter(isVimanaNodeDiscovered).length;
  const masteredCount = vimana.nodes.filter(
    (node) => node.discoveryStage === 'mastered',
  ).length;
  const activeAnomalyCount = vimana.nodes.filter(
    (node) => node.anomaly?.state === 'active',
  ).length;
  const selectedAnomaly =
    selectedNode.anomaly?.state === 'active'
      ? `${selectedNode.anomaly.severity} ${selectedNode.anomaly.type} anomaly`
      : null;

  const handleScan = () => {
    if (selectedNode.discoveryStage !== 'mastered') exploreCell(selectedNode.id);
  };

  const handleResolve = () => {
    if (selectedNode.anomaly?.state === 'active') resolveAnomaly(selectedNode.id);
  };

  return (
    <div className="space-y-4" data-testid="vimana-field-interface">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            <Compass className="h-4 w-4" /> Living navigation field
          </div>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight text-white">
            <MapPin className="h-6 w-6 text-cyan-300" /> Vimana Field Atlas
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-400">
            Follow luminous routes, scan hidden fields and stabilise anomalies. Every
            point is projected from the current Vimana x/y/z coordinates.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wide text-zinc-500">
          {[
            ['charted', discoveredCount, 'text-cyan-200', 'border-cyan-500/20 bg-cyan-500/5'],
            ['mastered', masteredCount, 'text-fuchsia-200', 'border-fuchsia-500/20 bg-fuchsia-500/5'],
            ['anomalies', activeAnomalyCount, 'text-amber-200', 'border-amber-500/20 bg-amber-500/5'],
          ].map(([label, value, colour, shell]) => (
            <div className={`rounded-xl border px-3 py-2 ${shell}`} key={label}>
              <div className={`text-base font-black ${colour}`}>{value}</div>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(250px,0.85fr)]">
        <section className="relative min-h-[390px] overflow-hidden rounded-[1.75rem] border border-cyan-500/20 bg-[#030711] shadow-[inset_0_1px_0_rgba(103,232,249,0.12),0_30px_90px_rgba(0,0,0,0.34)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-cyan-200/55">
            <span>Route lattice // {routeSegments.length} links</span>
            <span>Projection x·y·z</span>
          </div>
          <svg
            aria-label="Interactive Vimana field atlas"
            className="h-full min-h-[390px] w-full"
            data-testid="vimana-field-atlas"
            preserveAspectRatio="xMidYMid meet"
            role="group"
            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          >
            <defs>
              <radialGradient id="vimana-space" cx="50%" cy="43%" r="72%">
                <stop offset="0%" stopColor="#10233d" stopOpacity="0.72" />
                <stop offset="48%" stopColor="#07111f" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#02040a" />
              </radialGradient>
              <pattern id="vimana-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M44 0H0V44" fill="none" stroke="#22d3ee" strokeOpacity="0.055" />
              </pattern>
              <filter id="vimana-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#vimana-space)" />
            <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#vimana-grid)" />
            <g aria-hidden="true" fill="none" opacity="0.42">
              <ellipse cx="450" cy="286" rx="355" ry="176" stroke="#38bdf8" strokeDasharray="4 15" strokeOpacity="0.28" />
              <ellipse cx="450" cy="286" rx="252" ry="244" stroke="#a78bfa" strokeDasharray="2 18" strokeOpacity="0.2" transform="rotate(-11 450 286)" />
              <path d="M75 286H825M450 52V510" stroke="#67e8f9" strokeDasharray="2 16" strokeOpacity="0.16" />
            </g>

            <g aria-label="Vimana routes">
              {routeSegments.map((route) => {
                const highlighted =
                  route.source.node.id === selectedNode.id ||
                  route.target.node.id === selectedNode.id;
                const charted =
                  isVimanaNodeDiscovered(route.source.node) &&
                  isVimanaNodeDiscovered(route.target.node);
                return (
                  <line
                    data-testid="vimana-route"
                    key={route.key}
                    x1={route.source.x}
                    x2={route.target.x}
                    y1={route.source.y}
                    y2={route.target.y}
                    stroke={highlighted ? '#67e8f9' : charted ? '#38bdf8' : '#64748b'}
                    strokeDasharray={charted ? undefined : '5 10'}
                    strokeLinecap="round"
                    strokeOpacity={highlighted ? 0.9 : charted ? 0.42 : 0.24}
                    strokeWidth={highlighted ? 3.5 : charted ? 2 : 1.4}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>

            <g aria-label="Vimana field nodes">
              {positionedNodes.map(({ node, x, y, depth }) => {
                const discovered = isVimanaNodeDiscovered(node);
                const selected = selectedNode.id === node.id;
                const visual = discovered ? FIELD_VISUALS[node.fieldType] : SIGNAL_VISUAL;
                const radius = selected ? 24 : discovered ? 19 : 15;
                const activateNode = () => setSelectedId(node.id);
                return (
                  <g
                    aria-label={`Select ${nodeDisplayName(node)}, ${STAGE_LABEL[node.discoveryStage]}`}
                    aria-pressed={selected}
                    data-testid={`vimana-node-${node.id}`}
                    key={node.id}
                    onClick={activateNode}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        activateNode();
                      }
                    }}
                    role="button"
                    style={{ cursor: 'pointer', outline: 'none' }}
                    tabIndex={0}
                    transform={`translate(${x} ${y})`}
                  >
                    <title>{`${nodeDisplayName(node)} — ${STAGE_LABEL[node.discoveryStage]}`}</title>
                    {selected && (
                      <>
                        <circle className="motion-safe:animate-[spin_12s_linear_infinite]" fill="none" r="37" stroke={visual.glow} strokeDasharray="4 8" strokeOpacity="0.8" strokeWidth="1.8" />
                        <circle className="motion-safe:animate-ping motion-reduce:hidden" fill="none" r={radius + 7} stroke={visual.glow} strokeOpacity="0.5" strokeWidth="2" />
                      </>
                    )}
                    <circle fill={visual.colour} fillOpacity={discovered ? 0.18 : 0.1} filter="url(#vimana-glow)" r={radius + 7} />
                    <circle fill="#07101d" r={radius} stroke={visual.colour} strokeDasharray={discovered ? undefined : '3 5'} strokeWidth={selected ? 3.4 : 2.2} />
                    <circle fill={visual.colour} fillOpacity={discovered ? 0.95 : 0.58} r={selected ? 8 : 6} />
                    <circle cx={selected ? 13 : 10} cy={selected ? -14 : -11} fill="#020617" r="5.5" stroke={visual.glow} />
                    <text x={selected ? 13 : 10} y={selected ? -12 : -9} fill={visual.glow} fontSize="7" fontWeight="800" textAnchor="middle">{depth > 0 ? '+' : ''}{depth}</text>
                    {node.anomaly?.state === 'active' && (
                      <path d="M0 -8L7 6H-7Z" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" transform={`translate(${selected ? -25 : -21} ${selected ? -25 : -21})`} />
                    )}
                    {node.discoveryStage === 'mastered' && (
                      <path d="M0 -34L4 -24L14 -20L4 -16L0 -6L-4 -16L-14 -20L-4 -24Z" fill="#f0abfc" stroke="#fae8ff" />
                    )}
                    <text fill={selected ? '#f8fafc' : discovered ? '#dbeafe' : '#94a3b8'} fontSize={selected ? 13.5 : 11.5} fontWeight={selected ? 800 : 650} paintOrder="stroke" stroke="#020617" strokeWidth="4" textAnchor="middle" y={selected ? 52 : 44}>{shortNodeName(node)}</text>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-between text-[10px] text-zinc-500">
            <span>Mood <strong className="text-emerald-300">{Math.round(vitals.mood)}%</strong></span>
            <span>Scans <strong className="text-cyan-200">{vimana.scansPerformed}</strong> · Resolved <strong className="text-emerald-200">{vimana.anomaliesResolved}</strong></span>
          </div>
        </section>

        <aside className="overflow-hidden rounded-[1.75rem] border border-slate-700/70 bg-slate-950/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${selectedVisual.colour}, ${selectedVisual.glow})`, boxShadow: `0 0 20px ${selectedVisual.glow}66` }} />
          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Selected field</p>
                  <h3 className="mt-1 text-xl font-black text-white" data-testid="vimana-inspector-title">{nodeDisplayName(selectedNode)}</h3>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${selectedVisual.pillClass}`}>{selectedVisual.label}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{STAGE_HINT[selectedNode.discoveryStage]}</p>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-wide text-zinc-500">
                <span>Discovery state</span><span className="font-bold text-cyan-200">{STAGE_LABEL[selectedNode.discoveryStage]}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stageProgress(selectedNode.discoveryStage)}%`, background: `linear-gradient(90deg, ${selectedVisual.colour}, ${selectedVisual.glow})` }} />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Intensity', selectedDiscovered ? `${Math.round(selectedNode.intensity)}%` : 'Encrypted'],
                ['Scan quality', `${Math.round(selectedNode.scanQuality)}%`],
                ['Samples', selectedNode.samples],
                ['Visits', selectedNode.visits],
                ['Routes', selectedNode.connections.length],
                ['Coordinates', `${selectedNode.coordinates.x},${selectedNode.coordinates.y},${selectedNode.coordinates.z}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-wide text-zinc-600">{label}</dt>
                  <dd className={`mt-0.5 font-bold ${label === 'Intensity' ? selectedVisual.textClass : 'text-zinc-200'}`}>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                {selectedAnomaly ? <AlertTriangle className="h-4 w-4 text-amber-300" /> : selectedNode.discoveryStage === 'mastered' ? <Sparkles className="h-4 w-4 text-fuchsia-300" /> : <Radar className="h-4 w-4 text-cyan-300" />}
                {selectedAnomaly ?? (selectedNode.discoveryStage === 'mastered' ? 'Field fully stabilised' : selectedVisual.reward)}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {selectedNode.discoveryStage !== 'mastered' && (
                <Button onClick={handleScan} className="min-h-[46px] w-full gap-2"><Radar className="h-4 w-4" />{STAGE_ACTION[selectedNode.discoveryStage]}</Button>
              )}
              {selectedNode.anomaly?.state === 'active' && (
                <Button onClick={handleResolve} variant="outline" className="min-h-[46px] w-full gap-2 border-amber-400/60 text-amber-300 hover:bg-amber-500/10"><AlertTriangle className="h-4 w-4" />Resolve Anomaly</Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
        <span className="mr-1 font-semibold uppercase tracking-[0.16em] text-zinc-600">Fields</span>
        {(Object.keys(FIELD_VISUALS) as VimanaFieldType[]).map((field) => {
          const visual = FIELD_VISUALS[field];
          return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${visual.pillClass}`} key={field}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: visual.colour, boxShadow: `0 0 8px ${visual.glow}` }} />{visual.label}</span>;
        })}
      </div>
    </div>
  );
}
