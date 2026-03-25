'use client';

import { CoatOfArms } from '@/lib/lineage';
import { getBlason } from '@/lib/lineage/generator';

const TINCTURE_NAMES: Record<string, string> = {
  or: 'Or (Gold)',
  argent: 'Argent (Silver)',
  azure: 'Azure (Blue)',
  gules: 'Gules (Red)',
  sable: 'Sable (Black)',
  vert: 'Vert (Green)',
  purpure: 'Purpure (Purple)',
  tenne: 'Tenne (Orange)',
};

const CHARGE_NAMES: Record<string, string> = {
  star: 'Star',
  moon: 'Moon',
  sun: 'Sun',
  cross: 'Cross',
  chevron: 'Chevron',
  lion: 'Lion',
  eagle: 'Eagle',
  tree: 'Tree',
  flower: 'Flower',
  crown: 'Crown',
  key: 'Key',
  sword: 'Sword',
  book: 'Book',
  orb: 'Orb',
};

const DIVISION_NAMES: Record<string, string> = {
  plain: 'Plain',
  'per-pale': 'Per Pale',
  'per-fess': 'Per Fess',
  'per-bend': 'Per Bend',
  'per-saltire': 'Per Saltire',
  quarterly: 'Quarterly',
  chevron: 'Chevron',
  canton: 'Canton',
};

interface LineageExplainerProps {
  coat: CoatOfArms;
  generation?: number;
  ancestorCount?: number;
}

export function LineageExplainer({ coat, generation, ancestorCount }: LineageExplainerProps) {
  const blazon = getBlason(coat);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-cyan-500/30 p-4 text-sm">
      <h4 className="font-bold text-cyan-300 mb-3 flex items-center gap-2">
        <span>⚔️</span> Coat Analysis
      </h4>

      {/* Generation & Ancestry Info */}
      {generation !== undefined && (
        <div className="mb-3 p-2 bg-slate-800 rounded border border-cyan-500/20">
          <p className="text-gray-300">
            <span className="text-cyan-400 font-semibold">Generation:</span> {generation}
          </p>
          {ancestorCount !== undefined && (
            <p className="text-gray-300 mt-1">
              <span className="text-cyan-400 font-semibold">Ancestors:</span> {ancestorCount}
            </p>
          )}
        </div>
      )}

      {/* Division Type */}
      <div className="mb-3">
        <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">Structure</p>
        <p className="text-gray-200 bg-slate-800 p-2 rounded text-xs border border-cyan-500/20">
          {DIVISION_NAMES[coat.division] || coat.division}
        </p>
      </div>

      {/* Tinctures */}
      <div className="mb-3">
        <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">Colors (Tinctures)</p>
        <div className="flex flex-wrap gap-1">
          <span
            className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-200 border border-cyan-500/20"
            title={TINCTURE_NAMES[coat.field] || coat.field}
          >
            Primary: {TINCTURE_NAMES[coat.field] || coat.field}
          </span>
          {coat.fieldSecondary && (
            <span
              className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-200 border border-cyan-500/20"
              title={TINCTURE_NAMES[coat.fieldSecondary] || coat.fieldSecondary}
            >
              Secondary: {TINCTURE_NAMES[coat.fieldSecondary] || coat.fieldSecondary}
            </span>
          )}
        </div>
      </div>

      {/* Charges */}
      {coat.charges.length > 0 && (
        <div className="mb-3">
          <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">Symbols (Charges)</p>
          <div className="flex flex-wrap gap-1">
            {coat.charges.map((positioned, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-200 border border-cyan-500/20"
                title={CHARGE_NAMES[positioned.charge] || positioned.charge}
              >
                {CHARGE_NAMES[positioned.charge] || positioned.charge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Blazon (Heraldic Description) */}
      <div className="mb-2">
        <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">Blazon</p>
        <p className="text-gray-300 bg-slate-800 p-2 rounded text-xs border border-cyan-500/20 italic">
          {blazon}
        </p>
      </div>

      <div className="mt-3 p-2 bg-cyan-500/10 rounded border border-cyan-500/30 text-xs text-gray-300">
        💡 The blazon is the formal heraldic description of this coat of arms, following centuries-old conventions.
      </div>
    </div>
  );
}
