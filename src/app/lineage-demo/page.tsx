/**
 * Lineage & Coat of Arms Demo
 *
 * Demonstrates the heraldic lineage system with comprehensive explanations
 */

'use client';

import React, { useState } from 'react';
import { CoatOfArmsRenderer } from '@/components/lineage/CoatOfArmsRenderer';
import { LineageExplainer } from '@/components/lineage/LineageExplainer';
import { HeraldryLegend } from '@/components/lineage/HeraldryLegend';
import { LineageGuide } from '@/components/lineage/LineageGuide';
import {
  generateFounderCoatOfArms,
  breedCoatsOfArms,
  getBlason,
  type CoatOfArms,
} from '@/lib/lineage';

export default function LineageDemoPage() {
  const [founders, setFounders] = useState<CoatOfArms[]>([]);
  const [offspring, setOffspring] = useState<CoatOfArms[]>([]);
  const [selectedParent1, setSelectedParent1] = useState<CoatOfArms | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<CoatOfArms | null>(null);
  const [selectedCoat, setSelectedCoat] = useState<CoatOfArms | null>(null);

  const createFounder = () => {
    const id = `founder-${Date.now()}`;
    const seed = Date.now() + Math.random() * 1000000;
    const coa = generateFounderCoatOfArms(id, seed);
    setFounders([...founders, coa]);
  };

  const breedSelected = () => {
    if (!selectedParent1 || !selectedParent2) {
      alert('Please select two parents');
      return;
    }

    const id = `offspring-${Date.now()}`;
    const seed = Date.now() + Math.random() * 1000000;
    const result = breedCoatsOfArms(selectedParent1, selectedParent2, id, seed);

    setOffspring([...offspring, result.offspring]);
    setSelectedParent1(null);
    setSelectedParent2(null);
  };

  const allCoats = [...founders, ...offspring];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-300 mb-2 font-serif">
            ⚔️ Heraldic Lineage System
          </h1>
          <p className="text-cyan-200/70">
            Breed unique creatures and track their ancestry through heraldic coats of arms
          </p>
        </div>

        {/* Guide Section */}
        <LineageGuide />

        {/* Heraldry Legend */}
        <HeraldryLegend />

        {/* Controls */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={createFounder}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-semibold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 shadow-cyan-500/20"
            >
              + Create Founder
            </button>
            <button
              onClick={breedSelected}
              disabled={!selectedParent1 || !selectedParent2}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              🧬 Breed ({selectedParent1 ? '1' : '0'}/2)
            </button>
          </div>

          {/* Selection info */}
          {(selectedParent1 || selectedParent2) && (
            <div className="mt-4 text-center text-sm text-cyan-200 border-t border-cyan-500/20 pt-4">
              <p>
                {selectedParent1 && (
                  <span className="inline-block px-3 py-1 bg-slate-800 rounded border border-cyan-500/30 mr-2">
                    Parent 1: {selectedParent1.id.substring(0, 12)}...
                  </span>
                )}
                {selectedParent1 && selectedParent2 && <span className="mx-2">+</span>}
                {selectedParent2 && (
                  <span className="inline-block px-3 py-1 bg-slate-800 rounded border border-cyan-500/30 ml-2">
                    Parent 2: {selectedParent2.id.substring(0, 12)}...
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Founders */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-4 font-serif flex items-center gap-2">
              👑 Founders <span className="text-sm text-gray-400">({founders.length})</span>
            </h2>
            {founders.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/20 rounded-lg p-8 text-center">
                <p className="text-4xl mb-3">🌱</p>
                <p className="text-gray-300 font-semibold mb-2">No Founders Yet</p>
                <p className="text-gray-400 text-sm">Click "Create Founder" to start your lineage</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {founders.map((coa) => (
                  <CoatCard
                    key={coa.id}
                    coa={coa}
                    selected={selectedParent1?.id === coa.id || selectedParent2?.id === coa.id}
                    onSelect={() => {
                      if (!selectedParent1) {
                        setSelectedParent1(coa);
                      } else if (!selectedParent2 && selectedParent1.id !== coa.id) {
                        setSelectedParent2(coa);
                      } else if (selectedParent1?.id === coa.id) {
                        setSelectedParent1(null);
                      } else if (selectedParent2?.id === coa.id) {
                        setSelectedParent2(null);
                      }
                    }}
                    onInfo={() => setSelectedCoat(coa)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Offspring */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-4 font-serif flex items-center gap-2">
              👶 Offspring <span className="text-sm text-gray-400">({offspring.length})</span>
            </h2>
            {offspring.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/20 rounded-lg p-8 text-center">
                <p className="text-4xl mb-3">🥚</p>
                <p className="text-gray-300 font-semibold mb-2">No Offspring Yet</p>
                <p className="text-gray-400 text-sm">Select two parents and click "Breed"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {offspring.map((coa) => (
                  <CoatCard
                    key={coa.id}
                    coa={coa}
                    selected={selectedParent1?.id === coa.id || selectedParent2?.id === coa.id}
                    onSelect={() => {
                      if (!selectedParent1) {
                        setSelectedParent1(coa);
                      } else if (!selectedParent2 && selectedParent1.id !== coa.id) {
                        setSelectedParent2(coa);
                      } else if (selectedParent1?.id === coa.id) {
                        setSelectedParent1(null);
                      } else if (selectedParent2?.id === coa.id) {
                        setSelectedParent2(null);
                      }
                    }}
                    onInfo={() => setSelectedCoat(coa)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Information Panel */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-4 font-serif">ℹ️ Details</h2>
            {selectedCoat ? (
              <LineageExplainer
                coat={selectedCoat}
                generation={selectedCoat.generation}
                ancestorCount={selectedCoat.lineageMarkers.length}
              />
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/20 rounded-lg p-6 text-center">
                <p className="text-gray-400">Click on a coat of arms to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-6 text-gray-300">
          <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
            💡 Tips & Tricks
          </h3>
          <ul className="space-y-2 text-sm">
            <li>• <span className="text-cyan-400 font-semibold">Select & Breed:</span> Choose two coats, then click "Breed" to combine their traits</li>
            <li>• <span className="text-cyan-400 font-semibold">Explore Patterns:</span> Try different combinations to discover unique lineages</li>
            <li>• <span className="text-cyan-400 font-semibold">View Details:</span> Click on a coat to see its analysis, blazon, and ancestry</li>
            <li>• <span className="text-cyan-400 font-semibold">Complex Lineages:</span> Breed offspring together for multi-generational lines</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface CoatCardProps {
  coa: CoatOfArms;
  selected: boolean;
  onSelect: () => void;
  onInfo: () => void;
}

const CoatCard: React.FC<CoatCardProps> = ({ coa, selected, onSelect, onInfo }) => {
  const [showBlason, setShowBlason] = useState(false);

  return (
    <div
      className={`bg-gradient-to-br from-slate-800 to-slate-900 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 group ${
        selected
          ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-400/20'
          : 'border-slate-700 hover:border-cyan-500/50 shadow-md shadow-slate-800/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-center mb-3 relative">
        <CoatOfArmsRenderer coatOfArms={coa} size={100} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent rounded opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="text-center">
        <p className="text-xs text-cyan-300 font-semibold mb-1 truncate px-1" title={coa.id}>
          {coa.id.substring(0, 16)}...
        </p>
        <p className="text-xs text-gray-400 mb-0.5">
          Gen {coa.generation} • {coa.lineageMarkers.length}A
        </p>

        <div className="flex gap-1 text-xs mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBlason(!showBlason);
            }}
            className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded transition-colors text-xs"
            title="Toggle blazon description"
          >
            {showBlason ? '▼' : '▶'} Blazon
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfo();
            }}
            className="flex-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded transition-colors text-xs border border-cyan-500/30"
            title="View detailed analysis"
          >
            ℹ️
          </button>
        </div>

        {showBlason && (
          <div className="mt-2 text-xs text-gray-300 bg-slate-900/70 rounded p-2 border border-cyan-500/20 italic">
            {getBlason(coa)}
          </div>
        )}
      </div>
    </div>
  );
};
