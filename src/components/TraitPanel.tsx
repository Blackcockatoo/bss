'use client';

import { memo, type ComponentType, useState } from 'react';

import { useStore } from '@/lib/store';
import { Sparkles, Palette, Brain, Zap, Orbit, Link2, Ban, Dna, Info } from 'lucide-react';
import { GenomeJewbleRing } from './GenomeJewbleRing';

type GeneticsPresetId = 'single' | 'multi' | 'polygenic';

interface GeneticsLocus {
  id: string;
  name: string;
  alleles: [string, string];
  dominant: string;
  dominantExplanation: string;
  recessive: string;
  recessiveExplanation: string;
  effect: string;
}

interface PunnettData {
  title: string;
  parentA: string[];
  parentB: string[];
  cells: string[][];
}

interface GeneticsPreset {
  id: GeneticsPresetId;
  label: string;
  description: string;
  loci: GeneticsLocus[];
  punnett: PunnettData;
  phenotypeNotes: string[];
}

const GENETICS_PRESETS: GeneticsPreset[] = [
  {
    id: 'single',
    label: 'Single-Trait',
    description: 'One locus, two alleles, clear dominant/recessive outcomes.',
    loci: [
      {
        id: 'fur-shimmer',
        name: 'Fur Shimmer',
        alleles: ['S', 's'],
        dominant: 'S (Shimmer coat)',
        dominantExplanation: 'Adds reflective sheen to the coat under bright light.',
        recessive: 's (Matte coat)',
        recessiveExplanation: 'No shimmer; coat appears velvety in diffuse light.',
        effect: 'Controls how light interacts with the top coat layer.',
      },
    ],
    punnett: {
      title: 'Shimmer coat (S) vs matte coat (s)',
      parentA: ['S', 's'],
      parentB: ['S', 's'],
      cells: [
        ['SS', 'Ss'],
        ['Ss', 'ss'],
      ],
    },
    phenotypeNotes: [
      '75% chance of shimmer highlight on the mane.',
      '25% chance of matte-only coat with softer gradients.',
    ],
  },
  {
    id: 'multi',
    label: 'Multi-Trait',
    description: 'Two loci with independent assortment for classroom practice.',
    loci: [
      {
        id: 'eye-glow',
        name: 'Eye Glow',
        alleles: ['G', 'g'],
        dominant: 'G (Radiant eyes)',
        dominantExplanation: 'Iridescent glow visible in low light scenes.',
        recessive: 'g (Standard eyes)',
        recessiveExplanation: 'Eyes match body palette without glow.',
        effect: 'Adjusts pupil bloom intensity in creature render.',
      },
      {
        id: 'crest-shape',
        name: 'Crest Shape',
        alleles: ['C', 'c'],
        dominant: 'C (Crown crest)',
        dominantExplanation: 'Tall crest with pointed silhouette.',
        recessive: 'c (Leaf crest)',
        recessiveExplanation: 'Rounded crest with softer edges.',
        effect: 'Changes head outline and ear framing.',
      },
    ],
    punnett: {
      title: 'Radiant eyes (G) sample cross',
      parentA: ['G', 'g'],
      parentB: ['G', 'g'],
      cells: [
        ['GG', 'Gg'],
        ['Gg', 'gg'],
      ],
    },
    phenotypeNotes: [
      'If at least one G, eyes glow during nighttime animations.',
      'C allele makes crest appear taller by ~12%.',
      'Recessive combo keeps a rounded silhouette and calmer eye highlights.',
    ],
  },
  {
    id: 'polygenic',
    label: 'Polygenic',
    description: 'Multiple loci blending together for continuous traits.',
    loci: [
      {
        id: 'scale-density',
        name: 'Scale Density',
        alleles: ['D1', 'd1'],
        dominant: 'D1 (Dense scales)',
        dominantExplanation: 'Adds extra scale layers for a textured look.',
        recessive: 'd1 (Sparse scales)',
        recessiveExplanation: 'Fewer scales, smoother body gradient.',
        effect: 'Modulates surface texture richness.',
      },
      {
        id: 'tail-length',
        name: 'Tail Length',
        alleles: ['T1', 't1'],
        dominant: 'T1 (Long tail)',
        dominantExplanation: 'Longer tail with added sway animation frames.',
        recessive: 't1 (Short tail)',
        recessiveExplanation: 'Compact tail with tighter movements.',
        effect: 'Controls tail segment count.',
      },
      {
        id: 'pattern-contrast',
        name: 'Pattern Contrast',
        alleles: ['P1', 'p1'],
        dominant: 'P1 (High contrast)',
        dominantExplanation: 'Strong contrast between primary and secondary markings.',
        recessive: 'p1 (Soft contrast)',
        recessiveExplanation: 'Subtle transitions between markings.',
        effect: 'Adjusts pattern color range.',
      },
    ],
    punnett: {
      title: 'Pattern contrast (P1) sample cross',
      parentA: ['P1', 'p1'],
      parentB: ['P1', 'p1'],
      cells: [
        ['P1P1', 'P1p1'],
        ['P1p1', 'p1p1'],
      ],
    },
    phenotypeNotes: [
      'Polygenic blend shifts overall silhouette and texture intensity.',
      'Higher dominant allele count nudges contrast and tail length upward.',
      'Recessive-heavy outcomes produce softer gradients and compact motion.',
    ],
  },
];

export const TraitPanel = memo(function TraitPanel() {
  const traits = useStore(s => s.traits);
  const genome = useStore(s => s.genome);
  const [presetId, setPresetId] = useState<GeneticsPresetId>('single');
  const [showPredictions, setShowPredictions] = useState(true);

  if (!traits || !genome) {
    return (
      <div className="text-zinc-500 text-center py-8">
        Loading genome...
      </div>
    );
  }

  const { physical, personality, latent, elementWeb } = traits;
  const activePreset = GENETICS_PRESETS.find(preset => preset.id === presetId) ?? GENETICS_PRESETS[0];

  return (
    <div className="space-y-6">
      {/* Physical Traits */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Palette className="w-5 h-5 text-pink-400" />
          Physical Traits
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <TraitCard label="Body Type" value={physical.bodyType} />
          <TraitCard label="Pattern" value={physical.pattern} />
          <TraitCard label="Texture" value={physical.texture} />
          <TraitCard label="Size" value={`${physical.size.toFixed(2)}x`} />
        </div>
        <div className="flex gap-2 items-center text-sm">
          <span className="text-zinc-400">Colors:</span>
          <div
            className="w-8 h-8 rounded-lg border-2 border-zinc-700"
            style={{ backgroundColor: physical.primaryColor }}
            title={physical.primaryColor}
          />
          <div
            className="w-8 h-8 rounded-lg border-2 border-zinc-700"
            style={{ backgroundColor: physical.secondaryColor }}
            title={physical.secondaryColor}
          />
        </div>
        {physical.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {physical.features.map((feat, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-pink-500/20 text-pink-300 rounded-md border border-pink-500/30"
              >
                {feat}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Personality Traits */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Brain className="w-5 h-5 text-blue-400" />
          Personality
        </h3>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-zinc-400">Temperament:</span>{' '}
            <span className="text-white font-medium">{personality.temperament}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <StatMini label="Energy" value={personality.energy} />
            <StatMini label="Social" value={personality.social} />
            <StatMini label="Curiosity" value={personality.curiosity} />
            <StatMini label="Affection" value={personality.affection} />
            <StatMini label="Playfulness" value={personality.playfulness} />
            <StatMini label="Loyalty" value={personality.loyalty} />
          </div>
        </div>
        {personality.quirks.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-zinc-400">Quirks:</div>
            <div className="flex flex-wrap gap-2">
              {personality.quirks.map((quirk, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-md border border-blue-500/30"
                >
                  {quirk}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Latent Traits */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Hidden Potential
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-zinc-400">Evolution Path:</span>{' '}
            <span className="text-purple-300 font-medium">{latent.evolutionPath}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <StatMini label="Physical" value={latent.potential.physical} color="red" />
            <StatMini label="Mental" value={latent.potential.mental} color="blue" />
            <StatMini label="Social" value={latent.potential.social} color="green" />
          </div>
        </div>
        {latent.rareAbilities.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-zinc-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Rare Abilities:
            </div>
            <div className="flex flex-wrap gap-2">
              {latent.rareAbilities.map((ability, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/30 font-medium"
                >
                  {ability}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Element Web */}
      <section className="space-y-3 bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 -mx-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Orbit className="w-5 h-5 text-amber-300" />
          Element Web
        </h3>
        <div className="grid gap-3 lg:grid-cols-[1fr,0.9fr]">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
            <GenomeJewbleRing
              redDigits={genome.red60}
              blackDigits={genome.black60}
              blueDigits={genome.blue60}
              variant="dial"
            />
          </div>
          <div className="space-y-3 text-sm">
            <MetricRow label="Residue Coverage" value={`${Math.round(elementWeb.coverage * 100)}%`} />
            <div className="grid grid-cols-2 gap-2">
              <MetricPill icon={Orbit} label="Frontier Affinity" value={elementWeb.frontierAffinity} color="amber" />
              <MetricPill icon={Link2} label="Bridge Count" value={elementWeb.bridgeCount} color="cyan" />
              <MetricPill icon={Ban} label="Void Drift" value={elementWeb.voidDrift} color="rose" />
              <MetricPill icon={Sparkles} label="Active Residues" value={elementWeb.usedResidues.length} color="purple" />
            </div>
            <div className="space-y-2 text-xs text-zinc-300">
              <DetailLine label="Frontier Slots" value={formatResidues(elementWeb.frontierSlots)} />
              <DetailLine label="Bridge Slots" value={formatResidues(elementWeb.pairSlots)} />
              <DetailLine label="Void Slots Hit" value={formatResidues(elementWeb.voidSlotsHit)} />
            </div>
          </div>
        </div>
      </section>

      {/* Genetics Classroom */}
      <section className="space-y-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4 -mx-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Dna className="w-5 h-5 text-purple-300" />
            Genetics Classroom
          </h3>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <span>Show predictions</span>
            <button
              type="button"
              role="switch"
              aria-checked={showPredictions}
              onClick={() => setShowPredictions(prev => !prev)}
              className={`relative h-6 w-11 rounded-full transition ${showPredictions ? 'bg-purple-500' : 'bg-zinc-700'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${showPredictions ? 'left-5' : 'left-1'}`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {GENETICS_PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setPresetId(preset.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                presetId === preset.id
                  ? 'border-purple-400 bg-purple-500/20 text-purple-100'
                  : 'border-slate-700 text-zinc-300 hover:border-purple-400/60 hover:text-purple-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-400">{activePreset.description}</p>

        <div className="grid gap-3 md:grid-cols-2">
          {activePreset.loci.map(locus => (
            <div key={locus.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{locus.name}</div>
                  <div className="text-xs text-zinc-400">Alleles: {locus.alleles.join(' / ')}</div>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-purple-300">Locus</span>
              </div>
              <div className="space-y-1 text-xs text-zinc-300">
                <HoverDetail label="Dominant" value={locus.dominant} description={locus.dominantExplanation} />
                <HoverDetail label="Recessive" value={locus.recessive} description={locus.recessiveExplanation} />
                <div className="text-zinc-400">Effect: <span className="text-zinc-200">{locus.effect}</span></div>
              </div>
            </div>
          ))}
        </div>

        {showPredictions && (
          <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
                Punnett-square prediction
              </div>
              <div className="text-sm font-semibold text-white mb-3">{activePreset.punnett.title}</div>
              <div className="overflow-x-auto">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${activePreset.punnett.parentA.length + 1}, minmax(48px, 1fr))` }}>
                  <div className="text-xs text-zinc-400 flex items-center justify-center">×</div>
                  {activePreset.punnett.parentA.map(allele => (
                    <div key={allele} className="text-xs text-purple-200 font-semibold flex items-center justify-center">
                      {allele}
                    </div>
                  ))}
                  {activePreset.punnett.parentB.map((parentAllele, rowIndex) => (
                    <div key={`${parentAllele}-${rowIndex}`} className="contents">
                      <div className="text-xs text-purple-200 font-semibold flex items-center justify-center">
                        {parentAllele}
                      </div>
                      {activePreset.punnett.cells[rowIndex].map((cell, cellIndex) => (
                        <div
                          key={`${parentAllele}-${cellIndex}`}
                          className="rounded-md border border-slate-800 bg-slate-950/60 py-2 text-center text-xs text-white"
                        >
                          {cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-400">Phenotype changes on the creature</div>
                <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                  {activePreset.phenotypeNotes.map(note => (
                    <li key={note} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-zinc-300">
                <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1">Current phenotype snapshot</div>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Body Type</span>
                    <span className="text-white">{physical.bodyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Pattern</span>
                    <span className="text-white">{physical.pattern}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Texture</span>
                    <span className="text-white">{physical.texture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Primary Color</span>
                    <span className="text-white">{physical.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
});

interface TraitCardProps {
  label: string;
  value: string;
}

function TraitCard({ label, value }: TraitCardProps) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-2">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}

interface StatMiniProps {
  label: string;
  value: number;
  color?: 'red' | 'blue' | 'green' | 'zinc';
}

function StatMini({ label, value, color = 'zinc' }: StatMiniProps) {
  const colorMap = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    zinc: 'bg-zinc-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color]} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

interface MetricPillProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color?: 'amber' | 'cyan' | 'rose' | 'purple';
}

function MetricPill({ icon: Icon, label, value, color = 'amber' }: MetricPillProps) {
  const colorMap = {
    amber: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    cyan: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    rose: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    purple: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorMap[color]}`}>
      <Icon className="w-4 h-4" />
      <div>
        <div className="text-[11px] uppercase tracking-wide text-zinc-200/80">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
      <span className="text-zinc-400 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

interface DetailLineProps {
  label: string;
  value: string;
}

function DetailLine({ label, value }: DetailLineProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-400 w-32">{label}:</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function formatResidues(residues: number[]): string {
  if (!residues.length) {
    return 'None';
  }

  return residues.join(', ');
}

interface HoverDetailProps {
  label: string;
  value: string;
  description: string;
}

function HoverDetail({ label, value, description }: HoverDetailProps) {
  return (
    <div className="flex items-center gap-1 text-zinc-300">
      <span className="text-zinc-400">{label}:</span>
      <span className="text-white">{value}</span>
      <span className="relative group inline-flex">
        <Info className="h-3.5 w-3.5 text-zinc-500" />
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-950 p-2 text-[11px] text-zinc-200 opacity-0 shadow-xl transition group-hover:opacity-100">
          {description}
        </span>
      </span>
    </div>
  );
}
