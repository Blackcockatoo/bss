'use client';

import { useState } from 'react';
import PatternSelector from './PatternSelector';
import TimeCompass from './TimeCompass';
import ClockwiseNodePattern from './ClockwiseNodePattern';
import ColoredCirclePattern from './ColoredCirclePattern';

export function TimeCalculatorPanel() {
  const [patternType, setPatternType] = useState<'timeCompass' | 'nodePattern' | 'circlePattern'>('timeCompass');
  const [color, setColor] = useState<'red' | 'blue' | 'black'>('red');

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl md:p-6">
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
  );
}
