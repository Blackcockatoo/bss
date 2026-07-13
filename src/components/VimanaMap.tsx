'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import type { VimanaNode } from '@/lib/vimana';
import { isVimanaNodeDiscovered } from '@/lib/vimana';
import { Button } from './ui/button';
import { MapPin, AlertTriangle, Radar, Sparkles } from 'lucide-react';

const FIELD_THEME: Record<string, string> = {
  calm: 'from-teal-500/40 to-cyan-500/30 border-teal-500/40',
  neuro: 'from-purple-500/40 to-indigo-500/30 border-purple-500/40',
  quantum: 'from-amber-500/40 to-pink-500/30 border-amber-500/40',
  earth: 'from-emerald-500/40 to-lime-500/30 border-emerald-500/40',
};

const STAGE_LABEL: Record<VimanaNode['discoveryStage'], string> = {
  unknown: 'Unknown',
  detected: 'Signal Detected',
  scanned: 'Scanned',
  explored: 'Explored',
  mastered: 'Mastered',
};

function nodeDisplayName(node: VimanaNode): string {
  if (isVimanaNodeDiscovered(node)) {
    return node.label ?? node.id;
  }
  return node.label ?? 'Unidentified Signal';
}

export function VimanaMap() {
  const vimana = useStore(s => s.vimana);
  const vitals = useStore(s => s.vitals);
  const exploreCell = useStore(s => s.exploreCell);
  const resolveAnomaly = useStore(s => s.resolveAnomaly);

  const [selectedId, setSelectedId] = useState<string>(
    vimana.activeNodeId ?? vimana.nodes[0]?.id ?? ''
  );

  const selectedNode = useMemo(
    () => vimana.nodes.find(node => node.id === selectedId) ?? vimana.nodes[0],
    [selectedId, vimana.nodes]
  );

  const handleScan = () => {
    if (selectedNode) {
      exploreCell(selectedNode.id);
    }
  };

  const handleResolve = () => {
    if (selectedNode) {
      resolveAnomaly(selectedNode.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-300" />
            Vimana Exploration
          </h2>
          <p className="text-xs text-zinc-500">Scan sacred fields to uncover anomalies and mood boosts.</p>
        </div>
        <div className="text-xs text-zinc-400 text-right">
          <p>Scans: <span className="text-cyan-300 font-semibold">{vimana.scansPerformed}</span></p>
          <p>Anomalies Resolved: <span className="text-emerald-300 font-semibold">{vimana.anomaliesResolved}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {vimana.nodes.map(node => {
          const discovered = isVimanaNodeDiscovered(node);
          return (
            <button
              key={node.id}
              onClick={() => setSelectedId(node.id)}
              className={`relative rounded-xl border transition-all p-3 min-h-[108px] text-left bg-gradient-to-br ${
                discovered
                  ? FIELD_THEME[node.fieldType]
                  : 'from-slate-700/30 to-slate-800/30 border-slate-700/60'
              } ${
                selectedNode?.id === node.id
                  ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'hover:ring-1 hover:ring-cyan-200/60'
              }`}
              type="button"
            >
              <div className="flex items-center justify-between text-sm text-white gap-1">
                <span className="font-semibold">{nodeDisplayName(node)}</span>
                {discovered && (
                  <span className="uppercase text-xs text-zinc-300">{node.fieldType}</span>
                )}
              </div>
              {/* Details reveal progressively with the discovery stage. */}
              {discovered ? (
                <div className="mt-2 text-xs text-zinc-300 space-y-1">
                  <p>
                    Intensity: <span className="text-cyan-200 font-semibold">{Math.round(node.intensity)}</span>
                  </p>
                  <p>
                    Routes: <span className="text-zinc-200">{node.connections.length}</span>
                    <span className="ml-2 text-zinc-400">Visits: {node.visits}</span>
                  </p>
                  {node.anomaly?.state === 'active' ? (
                    <span className="flex items-center gap-1 text-amber-300">
                      <AlertTriangle className="w-3 h-3" />
                      {node.anomaly.severity} anomaly
                    </span>
                  ) : node.discoveryStage === 'mastered' ? (
                    <span className="flex items-center gap-1 text-fuchsia-300">
                      <Sparkles className="w-3 h-3" />
                      Mastered
                    </span>
                  ) : (
                    <span className="text-emerald-300">Stable</span>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-xs text-zinc-400 space-y-1">
                  <p>{STAGE_LABEL[node.discoveryStage]}</p>
                  <p className="text-zinc-500">Scan to reveal field data.</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedNode && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radar className="w-5 h-5 text-cyan-300" />
                {nodeDisplayName(selectedNode)}
                <span className="text-xs font-normal uppercase tracking-wide text-cyan-200/80">
                  {STAGE_LABEL[selectedNode.discoveryStage]}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {isVimanaNodeDiscovered(selectedNode)
                  ? 'Field data logged. Repeat scans deepen samples and lead to mastery.'
                  : 'Scan this signal to reveal its field type and hidden anomalies.'}
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Current mood: <span className="text-emerald-300 font-semibold">{Math.round(vitals.mood)}%</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedNode.discoveryStage !== 'mastered' && (
                <Button onClick={handleScan} className="gap-2 min-h-[44px]">
                  <Radar className="w-4 h-4" />
                  {isVimanaNodeDiscovered(selectedNode) ? 'Deep Scan' : 'Scan Field'}
                </Button>
              )}
              {selectedNode.anomaly?.state === 'active' && (
                <Button
                  onClick={handleResolve}
                  variant="outline"
                  className="gap-2 min-h-[44px] text-amber-300 border-amber-400/60"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Resolve Anomaly
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
