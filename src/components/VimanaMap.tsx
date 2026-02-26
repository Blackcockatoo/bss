'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { VIMANA_ESSENCE_REWARDS } from '@/lib/vimana';
import { Button } from './ui/button';
import { MapPin, AlertTriangle, Radar } from 'lucide-react';

const FIELD_THEME: Record<string, string> = {
  calm: 'from-teal-500/40 to-cyan-500/30 border-teal-500/40',
  neuro: 'from-purple-500/40 to-indigo-500/30 border-purple-500/40',
  quantum: 'from-amber-500/40 to-pink-500/30 border-amber-500/40',
  earth: 'from-emerald-500/40 to-lime-500/30 border-emerald-500/40',
};

export function VimanaMap() {
  const vimana = useStore(s => s.vimana);
  const vitals = useStore(s => s.vitals);
  const exploreCell = useStore(s => s.exploreCell);
  const resolveAnomaly = useStore(s => s.resolveAnomaly);
  const addEssence = useStore(s => s.addEssence);

  const [selectedId, setSelectedId] = useState<string>(vimana.activeCellId ?? vimana.cells[0]?.id ?? '');

  const selectedCell = useMemo(
    () => vimana.cells.find(cell => cell.id === selectedId) ?? vimana.cells[0],
    [selectedId, vimana.cells]
  );

  const handleSelect = (cellId: string) => {
    setSelectedId(cellId);
  };

  const handleExplore = () => {
    const shouldRewardDiscovery = !selectedCell?.discovered;
    exploreCell(selectedCell.id);
    if (shouldRewardDiscovery) {
      addEssence({ amount: VIMANA_ESSENCE_REWARDS.discovery, source: 'exploration' });
    }
  };

  const handleResolve = () => {
    const shouldRewardResolution = selectedCell?.anomaly && selectedCell?.discovered;
    resolveAnomaly(selectedCell.id);
    if (shouldRewardResolution) {
      addEssence({ amount: VIMANA_ESSENCE_REWARDS.anomalyResolved, source: 'exploration' });
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
          <p>Anomalies Resolved: <span className="text-emerald-300 font-semibold">{vimana.anomaliesFound}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {vimana.cells.map(cell => (
          <button
            key={cell.id}
            onClick={() => handleSelect(cell.id)}
            className={`relative rounded-xl border transition-all p-3 text-left bg-gradient-to-br ${cell.field ? FIELD_THEME[cell.field] : ''} ${!cell.field ? 'from-slate-700/30 to-slate-800/30 border-slate-700/60' : ''} ${
              selectedCell?.id === cell.id ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20' : 'hover:ring-1 hover:ring-cyan-200/60'
            }`}
            type="button"
          >
            <div className="flex items-center justify-between text-sm text-white">
              <span className="font-semibold">{cell.label}</span>
              <span className="uppercase text-xs text-zinc-300">{cell.field}</span>
            </div>
            <div className="mt-2 text-xs text-zinc-300 space-y-1">
              <p>Energy Flux: <span className="text-cyan-200 font-semibold">{cell.energy}</span></p>
              <p>
                Reward:
                <span className="ml-1 capitalize text-emerald-200">{cell.reward}</span>
              </p>
            </div>
            <div className="mt-2 text-xs">
              {cell.anomaly ? (
                <span className="flex items-center gap-1 text-amber-300">
                  <AlertTriangle className="w-3 h-3" />
                  Anomaly Active
                </span>
              ) : (
                <span className="text-emerald-300">Stable</span>
              )}
            </div>
            {!cell.discovered && (
              <span className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center text-xs text-zinc-400 rounded-xl">
                Fogged
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedCell && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radar className="w-5 h-5 text-cyan-300" />
                {selectedCell.label}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {selectedCell.discovered
                  ? 'Field data logged. Additional scans refine energy resonance.'
                  : 'Scan this field to reveal its resonance reward and hidden anomalies.'}
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Current mood: <span className="text-emerald-300 font-semibold">{Math.round(vitals.mood)}%</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExplore} className="gap-2">
                <Radar className="w-4 h-4" />
                Scan Field
              </Button>
              {selectedCell.anomaly && selectedCell.discovered && (
                <Button onClick={handleResolve} variant="outline" className="gap-2 text-amber-300 border-amber-400/60">
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
