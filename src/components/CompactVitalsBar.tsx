'use client';

import { useStore } from '@/lib/store';
import { UtensilsCrossed, Droplets, Sparkles, Zap } from 'lucide-react';

/**
 * Compact horizontal vitals bar for display below the pet hero
 * Shows all 4 stats in a single row with mini progress bars
 */
export function CompactVitalsBar() {
  const vitals = useStore(state => state.vitals);
  const essence = useStore(state => state.essence);
  const ritualProgress = useStore(state => state.ritualProgress);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-sm border-y border-slate-800/50">
      <div className="max-w-lg mx-auto px-4 py-3">
        {/* Vitals Row */}
        <div className="grid grid-cols-4 gap-3 mb-2">
          <MiniStat
            icon={<UtensilsCrossed className="w-3.5 h-3.5" />}
            value={vitals.hunger}
            color="from-orange-500 to-red-500"
            label="Hunger"
          />
          <MiniStat
            icon={<Droplets className="w-3.5 h-3.5" />}
            value={vitals.hygiene}
            color="from-blue-500 to-cyan-500"
            label="Hygiene"
          />
          <MiniStat
            icon={<Sparkles className="w-3.5 h-3.5" />}
            value={vitals.mood}
            color="from-pink-500 to-purple-500"
            label="Mood"
          />
          <MiniStat
            icon={<Zap className="w-3.5 h-3.5" />}
            value={vitals.energy}
            color="from-yellow-500 to-amber-500"
            label="Energy"
          />
        </div>

        {/* Secondary Stats Row */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-400">Essence</span>
            <span className="text-emerald-300 font-mono font-medium">{essence}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-zinc-400">Resonance</span>
            <span className="text-cyan-300 font-mono font-medium">{ritualProgress.resonance}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-zinc-400">Nectar</span>
            <span className="text-amber-300 font-mono font-medium">{ritualProgress.nectar}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MiniStatProps {
  icon: React.ReactNode;
  value: number;
  color: string;
  label: string;
}

function MiniStat({ icon, value, color, label }: MiniStatProps) {
  const isLow = value < 30;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex items-center gap-1 ${isLow ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`}>
        {icon}
        <span className="text-xs font-medium text-white tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}
