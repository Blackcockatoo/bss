'use client';

import { useMemo, useState } from 'react';
import PatternSelector from './PatternSelector';
import TimeCompass from './TimeCompass';
import ClockwiseNodePattern from './ClockwiseNodePattern';
import ColoredCirclePattern from './ColoredCirclePattern';
import { MetaPetCompassBridge } from './MetaPetCompassBridge';

type PatternType = 'timeCompass' | 'nodePattern' | 'circlePattern';
type PaletteColor = 'red' | 'blue' | 'black';

const PATTERN_DESCRIPTIONS: Record<PatternType, string> = {
  timeCompass: 'Live clock + sacred sequence ring for active temporal orientation.',
  nodePattern: 'Radial node map generated from sequence-pair trigonometry.',
  circlePattern: 'Layered geometric circles and sequence overlays for meditative viewing.'
};

export function TimeCalculatorPanel() {
  const [patternType, setPatternType] = useState<PatternType>('timeCompass');
  const [color, setColor] = useState<PaletteColor>('red');

  const activeSummary = useMemo(
    () => ({
      label: patternType === 'timeCompass' ? 'Time Compass' : patternType === 'nodePattern' ? 'Node Pattern' : 'Circle Pattern',
      description: PATTERN_DESCRIPTIONS[patternType]
    }),
    [patternType]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
      <MetaPetCompassBridge
        onApplyPreset={({ color: nextColor, pattern }) => {
          setColor(nextColor);
          setPatternType(pattern);
        }}
      />

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl md:p-6">
        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3">
          <p className="text-xs uppercase tracking-wider text-zinc-400">Current Mode</p>
          <p className="text-sm font-semibold text-white">
            {activeSummary.label} · <span className="capitalize text-cyan-300">{color}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-300">{activeSummary.description}</p>
        </div>

        <PatternSelector
          currentPattern={patternType}
          onPatternChange={setPatternType}
          currentColor={color}
          onColorChange={setColor}
        />

        <div className="mt-8 flex justify-center">
          {patternType === 'timeCompass' && <TimeCompass color={color} />}
          {patternType === 'nodePattern' && <ClockwiseNodePattern color={color} />}
          {patternType === 'circlePattern' && <ColoredCirclePattern color={color} />}
        </div>
      </div>
    </div>
  );
}
