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
import { NAVIGATION_TARGETS, getNavigationTargetByPosition } from './types';

const FEATURED_ADVENTURE_ROUTES = [
  '/',
  '/pet',
  '/monkey-invaders',
  '/digital-dna',
  '/body-forge',
  '/scaffold',
] as const;

const ADVENTURE_DETAILS: Record<string, { emoji: string; copy: string; tone: string }> = {
  '/': { emoji: '\u{1F3E0}', copy: 'Head back to your home base.', tone: 'from-sky-400/25 to-cyan-500/10' },
  '/pet': { emoji: '\u{1F43E}', copy: 'Visit, care for, and check on your pet.', tone: 'from-emerald-400/25 to-lime-500/10' },
  '/monkey-invaders': { emoji: '\u{1F680}', copy: 'Jump into a quick space game.', tone: 'from-orange-400/25 to-rose-500/10' },
  '/digital-dna': { emoji: '\u{1F9EC}', copy: 'Turn DNA into colour, shapes, and sound.', tone: 'from-violet-400/25 to-fuchsia-500/10' },
  '/body-forge': { emoji: '\u{1F3A8}', copy: 'Create a one-of-a-kind pet body.', tone: 'from-pink-400/25 to-amber-500/10' },
  '/scaffold': { emoji: '\u{1F5FA}\u{FE0F}', copy: 'See what is waiting in the wider world.', tone: 'from-blue-400/25 to-indigo-500/10' },
};

const MORE_ADVENTURE_EMOJI: Record<string, string> = {
  '/visualizer': '\u{2728}',
  '/share': '\u{1F3C6}',
  '/shop': '\u{1F6CD}\u{FE0F}',
  '/identity': '\u{1F50E}',
  '/lineage-demo': '\u{1F333}',
  '/genome-resonance': '\u{1F30C}',
  '/qr-messaging': '\u{1F4AC}',
};

// MossPrimeSeed canonical strings (from the original calculator)
const SEED_STRINGS = {
  red: SEED_RED.join(''),
  blue: SEED_BLUE.join(''),
  black: SEED_BLACK.join(''),
};

export function SteeringWheel() {
  const router = useRouter();
  const genome = useStore(state => state.genome);

  const [mode, setMode] = useState<SteeringMode>('cards');
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
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Navigator</p>
        <h1 className="mt-2 text-3xl font-black text-white">Where shall we go?</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Pick a card to jump straight into an adventure.
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

      {mode === 'cards' && (
        <div className="w-full space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NAVIGATION_TARGETS.filter(target =>
              FEATURED_ADVENTURE_ROUTES.includes(target.route as typeof FEATURED_ADVENTURE_ROUTES[number]),
            ).map(target => {
              const detail = ADVENTURE_DETAILS[target.route];
              return (
                <button
                  key={target.route}
                  type="button"
                  onClick={() => handleFeatureActivate(target.position)}
                  className={`group min-h-[150px] rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${detail.tone} p-5 text-left shadow-lg transition-all hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-cyan-950/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/40`}
                >
                  <span className="text-4xl" aria-hidden>{detail.emoji}</span>
                  <span className="mt-4 block text-xl font-black text-white">{target.label}</span>
                  <span className="mt-2 block text-sm leading-5 text-slate-300">{detail.copy}</span>
                  <span className="mt-4 inline-flex text-sm font-bold text-cyan-200 group-hover:text-white">Let&apos;s go &rarr;</span>
                </button>
              );
            })}
          </div>

          <details className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/55 p-4">
            <summary className="cursor-pointer text-center text-sm font-bold text-slate-200">Show more places</summary>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NAVIGATION_TARGETS.filter(target =>
                !FEATURED_ADVENTURE_ROUTES.includes(target.route as typeof FEATURED_ADVENTURE_ROUTES[number]),
              ).map(target => (
                <button
                  key={target.route}
                  type="button"
                  onClick={() => handleFeatureActivate(target.position)}
                  className="min-h-16 rounded-2xl border border-slate-700 bg-slate-900/85 px-3 py-3 text-left text-sm font-bold text-slate-200 transition-colors hover:border-violet-400/60 hover:bg-slate-800"
                >
                  <span className="mr-2 text-lg" aria-hidden>{MORE_ADVENTURE_EMOJI[target.route] ?? '?'}</span>
                  {target.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      )}

      {mode === 'compass' && <CompassNav {...viewProps} />}
      {mode === 'network' && <NetworkView {...viewProps} />}
      {mode === 'geometry' && <GeometryView {...viewProps} />}

      {mode !== 'cards' && selectedTarget && (
        <div className="w-full max-w-lg flex items-center justify-between rounded-lg border border-zinc-600 bg-zinc-900/80 px-4 py-2">
          <span className="text-sm font-medium text-zinc-200">{selectedTarget.label}</span>
          <span className="text-xs text-zinc-300 font-mono">{selectedTarget.route}</span>
        </div>
      )}

      {/* Sequence info footer */}
      {mode !== 'cards' && <div className="p-3 bg-zinc-900 rounded-lg max-w-lg text-center border border-zinc-700/70">
        <p className="text-xs text-zinc-200 font-mono truncate">
          {numberStrings[color].substring(0, 40)}...
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {dataSource === 'seed' ? 'MossPrimeSeed' : 'Pet Genome'} &middot; {color} &middot; 60-digit base-{dataSource === 'seed' ? '10' : '7'}
        </p>
      </div>}
    </div>
  );
}
