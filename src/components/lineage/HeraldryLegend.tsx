'use client';

import { useState } from 'react';

const TINCTURES = [
  { id: 'or', name: 'Or (Gold)', color: 'bg-yellow-400', description: 'Represents generosity, nobility, or wealth' },
  { id: 'argent', name: 'Argent (Silver)', color: 'bg-gray-100', description: 'Represents peace, innocence, or purity' },
  { id: 'azure', name: 'Azure (Blue)', color: 'bg-blue-600', description: 'Represents loyalty, truth, or protection' },
  { id: 'gules', name: 'Gules (Red)', color: 'bg-red-600', description: 'Represents courage, strength, or military power' },
  { id: 'sable', name: 'Sable (Black)', color: 'bg-black', description: 'Represents constancy, grief, or determination' },
  { id: 'vert', name: 'Vert (Green)', color: 'bg-green-600', description: 'Represents hope, joy, or fertility' },
  { id: 'purpure', name: 'Purpure (Purple)', color: 'bg-purple-600', description: 'Represents royalty, sovereignty, or justice' },
  { id: 'tenne', name: 'Tenne (Orange)', color: 'bg-orange-600', description: 'Represents strength, ambition, or endurance' },
];

const CHARGES = [
  { name: 'Star', description: 'Divine guidance or hope', symbol: '★' },
  { name: 'Moon', description: 'Serenity, dreams, or protection', symbol: '☽' },
  { name: 'Sun', description: 'Enlightenment, glory, or truth', symbol: '☀' },
  { name: 'Cross', description: 'Faith, virtue, or redemption', symbol: '+' },
  { name: 'Chevron', description: 'Protection, achievement, or victory', symbol: '⋀' },
  { name: 'Lion', description: 'Courage, strength, or nobility', symbol: '🦁' },
  { name: 'Eagle', description: 'Power, vision, or dominion', symbol: '🦅' },
  { name: 'Tree', description: 'Growth, life, or wisdom', symbol: '🌲' },
  { name: 'Flower', description: 'Beauty, grace, or fertility', symbol: '❀' },
  { name: 'Crown', description: 'Sovereignty, authority, or honor', symbol: '♔' },
  { name: 'Key', description: 'Trust, opening, or knowledge', symbol: '🗝' },
  { name: 'Sword', description: 'War, justice, or protection', symbol: '⚔' },
  { name: 'Book', description: 'Wisdom, learning, or truth', symbol: '📖' },
  { name: 'Orb', description: 'Power, dominion, or perfection', symbol: '◯' },
];

const DIVISIONS = [
  { name: 'Plain', description: 'Single unified color - foundation of any lineage' },
  { name: 'Per Pale', description: 'Divided vertically - represents balance of two forces' },
  { name: 'Per Fess', description: 'Divided horizontally - represents harmony and equality' },
  { name: 'Per Bend', description: 'Divided diagonally - represents dynamic change and flow' },
  { name: 'Per Saltire', description: 'Divided in X pattern - represents crossing paths and destiny' },
  { name: 'Quarterly', description: 'Four quarters - represents unity of multiple lineages' },
  { name: 'Chevron', description: 'Shaped like an inverted V - represents protection and ascension' },
  { name: 'Canton', description: 'Small section in corner - represents added distinction' },
];

export function HeraldryLegend() {
  const [activeTab, setActiveTab] = useState<'tinctures' | 'charges' | 'divisions'>('tinctures');

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-cyan-500/30 p-6 mb-6">
      <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
        <span>📖</span> Heraldry Reference
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-cyan-500/20">
        {(['tinctures', 'charges', 'divisions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors capitalize ${
              activeTab === tab
                ? 'text-cyan-300 border-b-2 border-cyan-300'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tinctures Tab */}
      {activeTab === 'tinctures' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TINCTURES.map((tincture) => (
            <div key={tincture.id} className="text-sm">
              <div className={`${tincture.color} h-12 rounded border border-gray-600 mb-2 flex items-center justify-center font-bold text-sm`}>
                {tincture.id.substring(0, 2).toUpperCase()}
              </div>
              <p className="font-semibold text-gray-200 text-xs">{tincture.name}</p>
              <p className="text-gray-400 text-xs mt-1">{tincture.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charges Tab */}
      {activeTab === 'charges' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CHARGES.map((charge) => (
            <div key={charge.name} className="text-sm p-3 bg-slate-800 rounded border border-cyan-500/20">
              <div className="text-4xl mb-2 text-center">{charge.symbol}</div>
              <p className="font-semibold text-gray-200 text-xs">{charge.name}</p>
              <p className="text-gray-400 text-xs mt-1">{charge.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Divisions Tab */}
      {activeTab === 'divisions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DIVISIONS.map((division) => (
            <div key={division.name} className="p-3 bg-slate-800 rounded border border-cyan-500/20">
              <p className="font-semibold text-gray-200">{division.name}</p>
              <p className="text-gray-400 text-sm mt-1">{division.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-cyan-500/10 rounded border border-cyan-500/30 text-xs text-gray-300">
        💡 Tip: Each lineage tells a story through its colors and symbols. Tinctures represent virtues, charges represent achievements, and divisions represent heritage.
      </div>
    </div>
  );
}
