'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import type { VimanaEncounterKind, VimanaNode } from '@/lib/vimana';
import {
  computeVimanaGenomeSeed,
  findVimanaRoute,
  getVimanaEncounterKind,
  hashString,
  isVimanaLivingRuin,
  isVimanaNodeDiscovered,
  vimanaInfoLevel,
} from '@/lib/vimana';
import {
  EXPEDITION_CHARGE_REGEN_MS,
  createExpeditionCharge,
  flightBonusEssence,
  regenExpeditionCharge,
  spendExpeditionCharge,
  type ExpeditionCharge,
} from '@/lib/minigames/vimanaFlight';
import type { ScanRingResult } from '@/lib/minigames/vimanaScanRing';
import { VimanaFlightSequence } from './VimanaFlightSequence';
import { VimanaScanRing } from './VimanaScanRing';
import { EchoLoopEncounter } from './EchoLoopEncounter';
import { GravityFoldEncounter } from './GravityFoldEncounter';
import { PrismStormEncounter } from './PrismStormEncounter';
import { BattleArena } from './BattleArena';
import { VimanaTetris } from './VimanaTetris';
import { AlertTriangle, MapPin, Radar, Sparkles, Wrench, X, Zap } from 'lucide-react';

/** World-space layout: px per coordinate unit, with a slight z parallax. */
const SPACING = 96;
const Z_SHEAR_X = 26;
const Z_SHEAR_Y = 18;
const WORLD_PADDING = 90;
/** Pointer movement beyond this is a pan, not a node tap. */
const PAN_THRESHOLD = 8;

const FIELD_COLORS: Record<VimanaNode['fieldType'], string> = {
  calm: '#2dd4bf',
  neuro: '#a78bfa',
  quantum: '#fbbf24',
  earth: '#4ade80',
};

const STAGE_LABEL: Record<VimanaNode['discoveryStage'], string> = {
  unknown: 'Unknown',
  detected: 'Signal Detected',
  scanned: 'Scanned',
  explored: 'Explored',
  mastered: 'Mastered',
};

interface MapLayout {
  positions: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
}

function layoutNodes(nodes: VimanaNode[]): MapLayout {
  if (nodes.length === 0) {
    return { positions: new Map(), width: 320, height: 320 };
  }
  const raw = nodes.map((node) => ({
    id: node.id,
    x: node.coordinates.x * SPACING + node.coordinates.z * Z_SHEAR_X,
    y: node.coordinates.y * SPACING + node.coordinates.z * Z_SHEAR_Y,
  }));
  const minX = Math.min(...raw.map((p) => p.x));
  const minY = Math.min(...raw.map((p) => p.y));
  const maxX = Math.max(...raw.map((p) => p.x));
  const maxY = Math.max(...raw.map((p) => p.y));
  const positions = new Map(
    raw.map((p) => [
      p.id,
      { x: p.x - minX + WORLD_PADDING, y: p.y - minY + WORLD_PADDING },
    ]),
  );
  return {
    positions,
    width: maxX - minX + WORLD_PADDING * 2,
    height: maxY - minY + WORLD_PADDING * 2,
  };
}

function nodeDisplayName(node: VimanaNode): string {
  if (isVimanaNodeDiscovered(node)) return node.label ?? node.id;
  return 'Unidentified Signal';
}

type TravelState =
  | { phase: 'flight'; targetId: string; seed: number }
  | { phase: 'scan'; targetId: string; gatesHit: number };

interface VimanaMapProps {
  petName?: string;
}

export function VimanaMap({ petName = 'Meta-Pet' }: VimanaMapProps) {
  const vimana = useStore((s) => s.vimana);
  const genome = useStore((s) => s.genome);
  const exploreCell = useStore((s) => s.exploreCell);
  const resolveAnomaly = useStore((s) => s.resolveAnomaly);
  const recordVimanaRun = useStore((s) => s.recordVimanaRun);

  const accentHue = computeVimanaGenomeSeed(genome) % 360;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const [travel, setTravel] = useState<TravelState | null>(null);
  const [charge, setCharge] = useState<ExpeditionCharge>(() => createExpeditionCharge());
  const [encounter, setEncounter] = useState<
    { nodeId: string; kind: VimanaEncounterKind } | null
  >(null);
  const [repairNodeId, setRepairNodeId] = useState<string | null>(null);

  // Any full-screen overlay (travel, an anomaly encounter, or a repair run)
  // suspends panning and hides the bottom sheet the same way.
  const overlayActive = travel !== null || encounter !== null || repairNodeId !== null;

  // Session-only regen tick for the expedition charge — never persisted, and
  // never blocks travel itself, only whether the flight flourish plays.
  useEffect(() => {
    const id = window.setInterval(() => {
      setCharge((current) => regenExpeditionCharge(current, performance.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    panned: boolean;
  } | null>(null);
  const pannedRef = useRef(false);

  const layout = useMemo(() => layoutNodes(vimana.nodes), [vimana.nodes]);
  const nodesById = useMemo(
    () => new Map(vimana.nodes.map((node) => [node.id, node])),
    [vimana.nodes],
  );

  const activeNode = vimana.activeNodeId ? nodesById.get(vimana.activeNodeId) : undefined;
  const selectedNode = selectedId ? nodesById.get(selectedId) : undefined;

  /** Planned route from the craft to the selected destination. */
  const route = useMemo(() => {
    if (!selectedNode || !vimana.activeNodeId) return null;
    return findVimanaRoute(vimana.nodes, vimana.activeNodeId, selectedNode.id);
  }, [selectedNode, vimana.activeNodeId, vimana.nodes]);

  const routeEdges = useMemo(() => {
    if (!route || route.length < 2) return new Set<string>();
    const edges = new Set<string>();
    for (let i = 0; i < route.length - 1; i += 1) {
      edges.add([route[i], route[i + 1]].sort().join('|'));
    }
    return edges;
  }, [route]);

  const clampOffset = useCallback(
    (x: number, y: number) => {
      const viewport = viewportRef.current;
      const vw = viewport?.clientWidth ?? 320;
      const vh = viewport?.clientHeight ?? 380;
      const minX = Math.min(0, vw - layout.width);
      const minY = Math.min(0, vh - layout.height);
      return {
        x: Math.max(minX, Math.min(0, x)),
        y: Math.max(minY, Math.min(0, y)),
      };
    },
    [layout.height, layout.width],
  );

  // Centre the craft on first render (measured, so it runs post-layout).
  useEffect(() => {
    if (offset !== null) return;
    const frame = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      const homeId = vimana.activeNodeId;
      const position = homeId ? layout.positions.get(homeId) : undefined;
      if (!viewport || !position) {
        setOffset({ x: 0, y: 0 });
        return;
      }
      setOffset(
        clampOffset(
          viewport.clientWidth / 2 - position.x,
          viewport.clientHeight / 2 - position.y,
        ),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [offset, clampOffset, layout.positions, vimana.activeNodeId]);

  // ===== Pan gesture =====

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (panRef.current || offset === null || overlayActive) return;
      viewportRef.current?.setPointerCapture(event.pointerId);
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: offset.x,
        originY: offset.y,
        panned: false,
      };
      pannedRef.current = false;
    },
    [offset, overlayActive],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId || overlayActive) return;
      const dx = event.clientX - pan.startX;
      const dy = event.clientY - pan.startY;
      if (!pan.panned && Math.hypot(dx, dy) < PAN_THRESHOLD) return;
      pan.panned = true;
      pannedRef.current = true;
      setOffset(clampOffset(pan.originX + dx, pan.originY + dy));
    },
    [clampOffset, overlayActive],
  );

  const handlePointerEnd = useCallback((event: React.PointerEvent) => {
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null;
    }
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    // Ignore the click that ends a pan drag.
    if (pannedRef.current) return;
    setSelectedId((current) => (current === nodeId ? null : nodeId));
  }, []);

  const handleTravelScan = useCallback(() => {
    if (!selectedNode) return;
    const isTravel = selectedNode.id !== vimana.activeNodeId;
    if (isTravel) {
      const now = performance.now();
      const settled = regenExpeditionCharge(charge, now);
      if (settled.count > 0) {
        setCharge(spendExpeditionCharge(settled, now));
        setTravel({ phase: 'flight', targetId: selectedNode.id, seed: Date.now() });
        return;
      }
      if (settled !== charge) setCharge(settled);
      // Out of charge: skip the flight flourish, but travel is never
      // blocked — go straight to the scan that always follows arrival.
    }
    setTravel({ phase: 'scan', targetId: selectedNode.id, gatesHit: 0 });
  }, [selectedNode, vimana.activeNodeId, charge]);

  const handleFlightComplete = useCallback((gatesHit: number) => {
    setTravel((current) =>
      current?.phase === 'flight' ? { phase: 'scan', targetId: current.targetId, gatesHit } : current,
    );
  }, []);

  const handleScanComplete = useCallback(
    (result: ScanRingResult) => {
      // Side effect first, state reset second — a setState updater must stay
      // a pure computation of the next value, never a place to dispatch
      // other store actions.
      if (travel) {
        exploreCell(travel.targetId, {
          scanQuality: result.scanQuality,
          flightBonus: flightBonusEssence(travel.phase === 'scan' ? travel.gatesHit : 0),
        });
      }
      setTravel(null);
    },
    [exploreCell, travel],
  );

  const handleResolve = useCallback(() => {
    if (!selectedNode || selectedNode.anomaly?.state !== 'active') return;
    // Four polished, reusable encounters resolve every anomaly — which one
    // is deterministic per node, so replaying always shows the same puzzle.
    setEncounter({ nodeId: selectedNode.id, kind: getVimanaEncounterKind(selectedNode.id) });
  }, [selectedNode]);

  const handleEncounterComplete = useCallback(() => {
    if (encounter) resolveAnomaly(encounter.nodeId);
    setEncounter(null);
  }, [encounter, resolveAnomaly]);

  const handleEncounterExit = useCallback(() => setEncounter(null), []);

  const handleRepairRun = useCallback(() => {
    if (!selectedNode) return;
    setRepairNodeId(selectedNode.id);
  }, [selectedNode]);

  const handleRepairComplete = useCallback(
    (score: number, lines: number, level: number) => {
      recordVimanaRun(score, lines, level);
      setRepairNodeId(null);
    },
    [recordVimanaRun],
  );

  // ===== Render =====

  const visibleNodes = vimana.nodes.filter((node) => node.discoveryStage !== 'unknown');

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ key: string; from: VimanaNode; to: VimanaNode; known: boolean }> = [];
    for (const node of vimana.nodes) {
      if (node.discoveryStage === 'unknown') continue;
      for (const otherId of node.connections) {
        const other = nodesById.get(otherId);
        if (!other || other.discoveryStage === 'unknown') continue;
        const key = [node.id, otherId].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({
          key,
          from: node,
          to: other,
          known: isVimanaNodeDiscovered(node) && isVimanaNodeDiscovered(other),
        });
      }
    }
    return list;
  }, [vimana.nodes, nodesById]);

  const hops = route ? route.length - 1 : null;

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes vimana-signal-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.35); opacity: 0.35; }
        }
        @keyframes vimana-craft-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes vimana-sheet-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes vimana-flight-particle {
          from { transform: translateY(0); opacity: 0.9; }
          to { transform: translateY(340%); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vimana-map-fx { animation: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <MapPin className="h-5 w-5 text-cyan-300" />
            Vimana Exploration
          </h2>
          <p className="text-xs text-zinc-500">
            Pan the field map. Tap a signal to plot a route and scan.
          </p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <p>
            Scans: <span className="font-semibold text-cyan-300">{vimana.scansPerformed}</span>
          </p>
          <p>
            Anomalies Resolved:{' '}
            <span className="font-semibold text-emerald-300">{vimana.anomaliesResolved}</span>
          </p>
          <p
            className="mt-1 flex items-center justify-end gap-1"
            aria-label={`Expedition charge ${charge.count} of ${charge.max}`}
            title={`Flight charge — regenerates every ${EXPEDITION_CHARGE_REGEN_MS / 1000}s`}
          >
            <Zap className="h-3 w-3 text-amber-300" />
            {Array.from({ length: charge.max }, (_, index) => (
              <span
                key={index}
                className="h-1.5 w-3 rounded-full"
                style={{ background: index < charge.count ? '#fbbf24' : '#334155' }}
              />
            ))}
          </p>
        </div>
      </div>

      {/* Map viewport: portrait-first, pannable, fog beyond revealed nodes. */}
      <div
        ref={viewportRef}
        data-testid="vimana-map-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative h-[56dvh] min-h-[340px] touch-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.06), transparent 45%), radial-gradient(circle at 75% 70%, rgba(167,139,250,0.05), transparent 40%), radial-gradient(#1e293b 1px, transparent 1.4px)',
          backgroundSize: 'auto, auto, 26px 26px',
        }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${offset?.x ?? 0}px, ${offset?.y ?? 0}px)`,
            visibility: offset === null ? 'hidden' : 'visible',
          }}
        >
          {/* Routes */}
          <svg
            width={layout.width}
            height={layout.height}
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            {edges.map((edge) => {
              const from = layout.positions.get(edge.from.id);
              const to = layout.positions.get(edge.to.id);
              if (!from || !to) return null;
              const onRoute = routeEdges.has(edge.key);
              return (
                <line
                  key={edge.key}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={onRoute ? '#fbbf24' : edge.known ? '#38bdf8' : '#475569'}
                  strokeOpacity={onRoute ? 0.95 : edge.known ? 0.5 : 0.3}
                  strokeWidth={onRoute ? 3 : 1.5}
                  strokeDasharray={edge.known ? undefined : '4 6'}
                />
              );
            })}
          </svg>

          {/* Nodes as real buttons for big touch targets + a11y. */}
          {visibleNodes.map((node) => {
            const position = layout.positions.get(node.id);
            if (!position) return null;
            const discovered = isVimanaNodeDiscovered(node);
            const isActive = node.id === vimana.activeNodeId;
            const isSelected = node.id === selectedId;
            const color = discovered ? FIELD_COLORS[node.fieldType] : '#94a3b8';
            return (
              <button
                key={node.id}
                type="button"
                aria-label={`${nodeDisplayName(node)} — ${STAGE_LABEL[node.discoveryStage]}`}
                onClick={() => handleNodeClick(node.id)}
                className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                style={{ left: position.x, top: position.y }}
              >
                {/* Pulsing halo for undiscovered signals */}
                {!discovered && (
                  <span
                    className="vimana-map-fx absolute h-8 w-8 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(148,163,184,0.5), transparent 70%)',
                      animation: 'vimana-signal-pulse 1.8s ease-in-out infinite',
                    }}
                  />
                )}
                <span
                  className={`relative flex items-center justify-center rounded-full border-2 transition-all ${
                    discovered ? 'h-9 w-9' : 'h-5 w-5'
                  } ${isSelected ? 'ring-4 ring-amber-300/60' : ''}`}
                  style={{
                    borderColor: color,
                    background: discovered
                      ? `radial-gradient(circle at 35% 30%, ${color}cc, ${color}33)`
                      : `${color}55`,
                    boxShadow:
                      node.anomaly?.state === 'active'
                        ? '0 0 14px rgba(251,191,36,0.8)'
                        : discovered
                          ? `0 0 10px ${color}66`
                          : undefined,
                  }}
                >
                  {node.anomaly?.state === 'active' && (
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                  )}
                  {node.discoveryStage === 'mastered' && !node.anomaly?.state?.includes('active') && (
                    <Sparkles className="h-4 w-4 text-fuchsia-200" />
                  )}
                </span>
                {/* Craft at the active node */}
                {isActive && (
                  <span
                    className="vimana-map-fx pointer-events-none absolute -top-4 text-xl"
                    style={{ animation: 'vimana-craft-bob 2.2s ease-in-out infinite' }}
                    aria-label="Vimana craft"
                    role="img"
                  >
                    🛸
                  </span>
                )}
                {discovered && (
                  <span className="pointer-events-none absolute top-[46px] whitespace-nowrap text-[10px] text-slate-300">
                    {node.label ?? node.id}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Fog vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(2,6,23,0.75) 100%)',
          }}
        />

        {/* Flight sequence: brief travel animation between nodes. */}
        {travel?.phase === 'flight' && (
          <VimanaFlightSequence
            seed={travel.seed}
            petName={petName}
            accentHue={accentHue}
            fromLabel={activeNode ? nodeDisplayName(activeNode) : 'Origin'}
            toLabel={
              nodesById.get(travel.targetId)
                ? nodeDisplayName(nodesById.get(travel.targetId)!)
                : 'Destination'
            }
            onComplete={handleFlightComplete}
          />
        )}

        {/* Resonance-ring scan: tap timing on arrival (or scanning in place). */}
        {travel?.phase === 'scan' && (
          <VimanaScanRing accentHue={accentHue} onComplete={handleScanComplete} />
        )}

        {/* Anomaly encounters — one of four polished, reusable puzzles. */}
        {encounter?.kind === 'echo-loop' && (
          <EchoLoopEncounter
            seed={hashString(encounter.nodeId)}
            accentHue={accentHue}
            onComplete={handleEncounterComplete}
          />
        )}
        {encounter?.kind === 'gravity-fold' && (
          <GravityFoldEncounter
            seed={hashString(encounter.nodeId)}
            accentHue={accentHue}
            onComplete={handleEncounterComplete}
          />
        )}
        {encounter?.kind === 'prism-storm' && (
          <PrismStormEncounter
            seed={hashString(encounter.nodeId)}
            accentHue={accentHue}
            onComplete={handleEncounterComplete}
          />
        )}
        {encounter?.kind === 'guardian-signal' && (
          <div className="vimana-map-fx absolute inset-0 z-30 overflow-y-auto rounded-2xl bg-slate-950 p-4">
            <BattleArena onWin={handleEncounterComplete} onExit={handleEncounterExit} />
          </div>
        )}

        {/* Living Ruin: an optional short Vimana Stack repair run. */}
        {repairNodeId && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-slate-950">
            <VimanaTetris
              petName={petName}
              genomeSeed={computeVimanaGenomeSeed(genome)}
              startLevel={1}
              onExit={() => setRepairNodeId(null)}
              onGameOver={handleRepairComplete}
            />
          </div>
        )}
      </div>

      {/* Bottom sheet: destination panel with progressive reveal. */}
      {selectedNode && !overlayActive && (
        <div
          data-testid="vimana-bottom-sheet"
          className="vimana-map-fx fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl rounded-t-3xl border border-b-0 border-slate-700 bg-slate-950/95 px-4 pt-2 shadow-[0_-8px_40px_rgba(0,0,0,0.6)] backdrop-blur"
          style={{
            animation: 'vimana-sheet-up 200ms ease-out',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-700" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                {nodeDisplayName(selectedNode)}
                <span className="text-[10px] font-normal uppercase tracking-wide text-cyan-200/80">
                  {STAGE_LABEL[selectedNode.discoveryStage]}
                </span>
              </h3>
              {/* Details reveal progressively: first by discovery stage (is
                  this field known at all?), then by how precise the
                  resonance-ring scan that found it was. */}
              {isVimanaNodeDiscovered(selectedNode) ? (
                <div className="mt-1 space-y-0.5 text-xs text-zinc-400">
                  <p>
                    Field:{' '}
                    <span
                      className="font-semibold uppercase"
                      style={{ color: FIELD_COLORS[selectedNode.fieldType] }}
                    >
                      {selectedNode.fieldType}
                    </span>
                    {vimanaInfoLevel(selectedNode.scanQuality) !== 'rough' && (
                      <span className="ml-3">
                        Intensity:{' '}
                        <span className="font-semibold text-cyan-200">
                          {Math.round(selectedNode.intensity)}
                        </span>
                      </span>
                    )}
                  </p>
                  {vimanaInfoLevel(selectedNode.scanQuality) === 'rough' ? (
                    <p className="text-zinc-500">A sharper scan would read this field more clearly.</p>
                  ) : (
                    <p>
                      Visits: {selectedNode.visits} · Samples: {selectedNode.samples} · Routes:{' '}
                      {selectedNode.connections.length}
                    </p>
                  )}
                  {selectedNode.anomaly?.state === 'active' && (
                    <p className="flex items-center gap-1 text-amber-300">
                      <AlertTriangle className="h-3 w-3" />
                      {vimanaInfoLevel(selectedNode.scanQuality) === 'rough'
                        ? 'Instability detected'
                        : `${selectedNode.anomaly.severity} ${selectedNode.anomaly.type} anomaly active`}
                    </p>
                  )}
                  {selectedNode.discoveryStage === 'mastered' && (
                    <p className="flex items-center gap-1 text-fuchsia-300">
                      <Sparkles className="h-3 w-3" />
                      Field mastered
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">
                  Signal strength unknown. Travel there and scan to reveal what this field holds.
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                {selectedNode.id === vimana.activeNodeId
                  ? 'The craft is holding position here.'
                  : hops !== null
                    ? `Route plotted: ${hops} jump${hops === 1 ? '' : 's'}.`
                    : 'Out of range — scan nearer fields to open a route.'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close destination panel"
              onClick={() => setSelectedId(null)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 active:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedNode.discoveryStage !== 'mastered' && (
              <button
                type="button"
                onClick={handleTravelScan}
                disabled={hops === null}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-slate-950 active:bg-cyan-500 disabled:opacity-40"
              >
                <Radar className="h-4 w-4" />
                {selectedNode.id === vimana.activeNodeId
                  ? isVimanaNodeDiscovered(selectedNode)
                    ? 'Deep Scan'
                    : 'Scan Field'
                  : 'Travel & Scan'}
              </button>
            )}
            {selectedNode.anomaly?.state === 'active' && (
              <button
                type="button"
                onClick={handleResolve}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/60 px-4 text-sm font-semibold text-amber-300 active:bg-amber-950/40"
              >
                <AlertTriangle className="h-4 w-4" />
                Resolve Anomaly
              </button>
            )}
            {isVimanaNodeDiscovered(selectedNode) && isVimanaLivingRuin(selectedNode.id) && (
              <button
                type="button"
                onClick={handleRepairRun}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/60 px-4 text-sm font-semibold text-emerald-300 active:bg-emerald-950/40"
              >
                <Wrench className="h-4 w-4" />
                Repair Run
              </button>
            )}
          </div>
        </div>
      )}

      {!selectedNode && activeNode && (
        <p className="text-center text-xs text-zinc-500">
          Craft holding at{' '}
          <span className="text-cyan-300">{activeNode.label ?? activeNode.id}</span> — tap a signal
          to plot a route.
        </p>
      )}
    </div>
  );
}
