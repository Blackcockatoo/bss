'use client';

import { CoatOfArms } from '@/lib/lineage';
import { useState } from 'react';

interface LineageStatsProps {
  coats: CoatOfArms[];
}

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  description?: string;
}

export function LineageStatsDashboard({ coats }: LineageStatsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'genetics' | 'breeding' | 'timeline'>('overview');

  // Calculate statistics
  const stats = {
    totalLineages: coats.length,
    totalGenerations: Math.max(0, ...coats.map(c => c.generation)),
    averageGeneration: coats.length > 0 ? (coats.reduce((sum, c) => sum + c.generation, 0) / coats.length).toFixed(1) : 0,
    maxAncestors: Math.max(0, ...coats.map(c => c.lineageMarkers.length)),

    // Genetics
    uniqueTinctures: new Set([...coats.map(c => c.field), ...coats.flatMap(c => c.fieldSecondary ? [c.fieldSecondary] : [])]).size,
    uniqueCharges: new Set(coats.flatMap(c => c.charges.map(pc => pc.charge))).size,
    uniqueDivisions: new Set(coats.map(c => c.division)).size,

    // Get most common traits
    mostCommonDivision: getMostCommon(coats.map(c => c.division)),
    mostCommonTincture: getMostCommon([...coats.map(c => c.field), ...coats.flatMap(c => c.fieldSecondary ? [c.fieldSecondary] : [])]),
    mostCommonCharge: getMostCommon(coats.flatMap(c => c.charges.map(pc => pc.charge))),

    // Breeding
    averageChargeCount: coats.length > 0 ? (coats.reduce((sum, c) => sum + c.charges.length, 0) / coats.length).toFixed(2) : 0,
    geneticDiversity: calculateGeneticDiversity(coats),
  };

  const overviewStats: StatCard[] = [
    { label: 'Total Lineages', value: stats.totalLineages, icon: '⚔️' },
    { label: 'Max Generation', value: stats.totalGenerations, icon: '📈' },
    { label: 'Avg Generation', value: stats.averageGeneration, icon: '📊', description: 'Average generation level' },
    { label: 'Max Ancestors', value: stats.maxAncestors, icon: '👥' },
  ];

  const geneticsStats: StatCard[] = [
    { label: 'Unique Tinctures', value: stats.uniqueTinctures, icon: '🎨', description: 'Unique colors used' },
    { label: 'Unique Charges', value: stats.uniqueCharges, icon: '⭐', description: 'Unique symbols used' },
    { label: 'Unique Divisions', value: stats.uniqueDivisions, icon: '✂️', description: 'Unique patterns used' },
    { label: 'Genetic Diversity', value: `${(stats.geneticDiversity * 100).toFixed(0)}%`, icon: '🧬', description: 'Population diversity score' },
  ];

  const breedingStats: StatCard[] = [
    { label: 'Avg Symbols/Coat', value: stats.averageChargeCount, icon: '⚡', description: 'Average charges per lineage' },
    { label: 'Most Common Division', value: stats.mostCommonDivision || 'N/A', icon: '📐' },
    { label: 'Most Common Color', value: stats.mostCommonTincture || 'N/A', icon: '🎨' },
    { label: 'Most Common Symbol', value: stats.mostCommonCharge || 'N/A', icon: '✨' },
  ];

  const renderStatsGrid = (statsList: StatCard[]) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statsList.map((stat, idx) => (
        <div key={idx} className="bg-slate-800 rounded-lg border border-cyan-500/20 p-4 text-center hover:border-cyan-500/50 transition-colors">
          <p className="text-2xl mb-2">{stat.icon}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
          <p className="text-lg font-bold text-cyan-300">{stat.value}</p>
          {stat.description && (
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderTimeline = () => {
    const generations = Math.max(0, ...coats.map(c => c.generation)) + 1;
    const coatsByGen: Record<number, CoatOfArms[]> = {};

    for (let i = 0; i < generations; i++) {
      coatsByGen[i] = coats.filter(c => c.generation === i);
    }

    return (
      <div className="space-y-4">
        {Array.from({ length: generations }).map((_, gen) => (
          <div key={gen} className="bg-slate-800 rounded-lg border border-cyan-500/20 p-4">
            <p className="font-bold text-cyan-300 mb-2">Generation {gen}</p>
            <div className="flex flex-wrap gap-2">
              {coatsByGen[gen]?.length > 0 ? (
                coatsByGen[gen].map((coa) => (
                  <span
                    key={coa.id}
                    className="px-3 py-1 bg-slate-700 text-gray-200 text-xs rounded border border-cyan-500/30 truncate max-w-[150px]"
                    title={coa.id}
                  >
                    {coa.id.substring(0, 12)}...
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm italic">No lineages</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">{coatsByGen[gen]?.length || 0} lineage{coatsByGen[gen]?.length !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>
    );
  };

  if (coats.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-cyan-500/30 p-8 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-gray-300 font-semibold mb-2">No Data Yet</p>
        <p className="text-gray-400 text-sm">Create some lineages to see statistics here</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-cyan-500/30 p-6">
      <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
        <span>📊</span> Lineage Statistics
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-cyan-500/20 overflow-x-auto">
        {(['overview', 'genetics', 'breeding', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'text-cyan-300 border-b-2 border-cyan-300'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'overview' && '📈'}
            {tab === 'genetics' && '🧬'}
            {tab === 'breeding' && '🧪'}
            {tab === 'timeline' && '⏱️'}
            {' '}{tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderStatsGrid(overviewStats)}
        {activeTab === 'genetics' && renderStatsGrid(geneticsStats)}
        {activeTab === 'breeding' && renderStatsGrid(breedingStats)}
        {activeTab === 'timeline' && renderTimeline()}
      </div>

      <div className="mt-6 p-3 bg-cyan-500/10 rounded border border-cyan-500/30 text-xs text-gray-300">
        💡 These statistics help you understand your lineage population and discover genetic patterns.
      </div>
    </div>
  );
}

function getMostCommon<T>(items: T[]): T | null {
  if (items.length === 0) return null;

  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  let max = 0;
  let mostCommon: T | null = null;
  for (const [item, count] of counts) {
    if (count > max) {
      max = count;
      mostCommon = item;
    }
  }

  return mostCommon;
}

function calculateGeneticDiversity(coats: CoatOfArms[]): number {
  if (coats.length === 0) return 0;

  const divisions = new Set(coats.map(c => c.division)).size;
  const tinctures = new Set([...coats.map(c => c.field), ...coats.flatMap(c => c.fieldSecondary ? [c.fieldSecondary] : [])]).size;
  const charges = new Set(coats.flatMap(c => c.charges.map(pc => pc.charge))).size;

  // Max possible: 8 divisions, 8 tinctures, 14 charges
  const divisionRatio = Math.min(divisions / 8, 1);
  const tinctureRatio = Math.min(tinctures / 8, 1);
  const chargeRatio = Math.min(charges / 14, 1);

  // Average the ratios
  return (divisionRatio + tinctureRatio + chargeRatio) / 3;
}
