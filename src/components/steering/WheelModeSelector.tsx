'use client';

import type { SteeringMode, SteeringColor, DataSource } from './types';

interface WheelModeSelectorProps {
  mode: SteeringMode;
  onModeChange: (mode: SteeringMode) => void;
  color: SteeringColor;
  onColorChange: (color: SteeringColor) => void;
  dataSource: DataSource;
  onDataSourceChange: (source: DataSource) => void;
  hasGenome: boolean;
}

const MODE_OPTIONS: { value: SteeringMode; label: string }[] = [
  { value: 'cards', label: 'Adventure cards' },
  { value: 'compass', label: 'Spin wheel' },
  { value: 'network', label: 'Star map' },
  { value: 'geometry', label: 'Shapes' },
];

const COLOR_OPTIONS: { value: SteeringColor; label: string; activeClass: string }[] = [
  { value: 'red', label: 'Red', activeClass: 'bg-red-600' },
  { value: 'blue', label: 'Blue', activeClass: 'bg-blue-600' },
  { value: 'black', label: 'Black', activeClass: 'bg-gray-950 border border-gray-600' },
];

export function WheelModeSelector({
  mode,
  onModeChange,
  color,
  onColorChange,
  dataSource,
  onDataSourceChange,
  hasGenome,
}: WheelModeSelectorProps) {
  return (
    <div className="w-full space-y-3">
      <div>
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Choose a view</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`min-h-11 rounded-2xl px-3 py-2 text-sm font-bold transition-all ${
                mode === opt.value
                  ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/60 hover:bg-slate-800'
              }`}
              onClick={() => onModeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mode !== 'cards' && (
        <details className="rounded-2xl border border-slate-800 bg-slate-950/55 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-300">Change colours or DNA source</summary>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400 uppercase tracking-wider">Colour</span>
        <div className="flex gap-1">
          {COLOR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                color === opt.value
                  ? opt.activeClass + ' text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
              onClick={() => onColorChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400 uppercase tracking-wider">DNA</span>
        <div className="flex gap-1">
          <button
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              dataSource === 'seed'
                ? 'bg-zinc-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            onClick={() => onDataSourceChange('seed')}
          >
            Seed
          </button>
          <button
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              dataSource === 'pet'
                ? 'bg-zinc-600 text-white'
                : hasGenome
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
            onClick={() => hasGenome && onDataSourceChange('pet')}
            title={hasGenome ? 'Use live pet genome data' : 'No pet genome loaded'}
          >
            Pet DNA
          </button>
        </div>
      </div>
          </div>
        </details>
      )}
    </div>
  );
}
