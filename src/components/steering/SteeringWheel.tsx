'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  R as SEED_RED,
  K as SEED_BLACK,
  B as SEED_BLUE,
} from '@/lib/qr-messaging/crypto';
import { CompassNav } from './CompassNav';
import { NetworkView } from './NetworkView';
import { GeometryView } from './GeometryView';
import { WheelModeSelector } from './WheelModeSelector';
import type { SteeringMode, SteeringColor, DataSource, SteeringViewProps } from './types';
import { getNavigationTargetByPosition } from './types';

// MossPrimeSeed canonical strings (from the original calculator)
const SEED_STRINGS = {
  red: SEED_RED.join(''),
  blue: SEED_BLUE.join(''),
  black: SEED_BLACK.join(''),
};

export function SteeringWheel() {
  const router = useRouter();
  const genome = useStore(state => state.genome);

  const [mode, setMode] = useState<SteeringMode>('compass');
  const [color, setColor] = useState<SteeringColor>('red');
  const [dataSource, setDataSource] = useState<DataSource>('seed');
  const [selectedFeature, setSelectedFeature] = useState(0);

  const hasGenome = genome !== null;

  // Build number strings from either seed or live genome
  const numberStrings = useMemo(() => {
    if (dataSource === 'pet' && genome) {
      return {
        red: genome.red60.join(''),
        blue: genome.blue60.join(''),
        black: genome.black60.join(''),
      };
    }
    return SEED_STRINGS;
  }, [dataSource, genome]);

  const handleFeatureSelect = useCallback((position: number) => {
    setSelectedFeature(position);
  }, []);

  const handleFeatureActivate = useCallback((position: number) => {
    setSelectedFeature(position);
    const target = getNavigationTargetByPosition(position);
    if (target) {
      if (target.route.startsWith('http')) {
        window.location.href = target.route;
        return;
      }
      router.push(target.route);
    }
  }, [router]);

  // Shared props for all views
  const viewProps: SteeringViewProps = {
    color,
    numberStrings,
    selectedFeature,
    onFeatureSelect: handleFeatureSelect,
    onFeatureActivate: handleFeatureActivate,
  };

  const selectedTarget = getNavigationTargetByPosition(selectedFeature);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Navigator</h1>
        <p className="text-sm text-zinc-300 mt-1">
          Explore the MOSS60 universe
        </p>
      </div>

      <WheelModeSelector
        mode={mode}
        onModeChange={setMode}
        color={color}
        onColorChange={setColor}
        dataSource={dataSource}
        onDataSourceChange={setDataSource}
        hasGenome={hasGenome}
      />

      {mode === 'compass' && <CompassNav {...viewProps} />}
      {mode === 'network' && <NetworkView {...viewProps} />}
      {mode === 'geometry' && <GeometryView {...viewProps} />}

      {selectedTarget && (
        <div className="w-full max-w-lg flex items-center justify-between rounded-lg border border-zinc-600 bg-zinc-900/80 px-4 py-2">
          <span className="text-sm font-medium text-zinc-200">{selectedTarget.label}</span>
          <span className="text-xs text-zinc-300 font-mono">{selectedTarget.route}</span>
        </div>
      )}

      {/* Sequence info footer */}
      <div className="p-3 bg-zinc-900 rounded-lg max-w-lg text-center border border-zinc-700/70">
        <p className="text-xs text-zinc-200 font-mono truncate">
          {numberStrings[color].substring(0, 40)}...
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {dataSource === 'seed' ? 'MossPrimeSeed' : 'Pet Genome'} &middot; {color} &middot; 60-digit base-{dataSource === 'seed' ? '10' : '7'}
        </p>
      </div>
    </div>
  );
}
