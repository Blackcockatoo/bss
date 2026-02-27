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
  { value: 'compass', label: 'Compass' },
  { value: 'network', label: 'Network' },
  { value: 'geometry', label: 'Geometry' },
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
      {/* Mode */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Mode</span>
        <div className="flex gap-1">
          {MODE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === opt.value
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
              onClick={() => onModeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Color</span>
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

      {/* Data source */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Source</span>
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
  );
}
