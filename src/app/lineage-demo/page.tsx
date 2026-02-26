/**
 * Lineage & Coat of Arms Demo
 *
 * Demonstrates the heraldic lineage system
 */

'use client';

import React, { useState } from 'react';
import { CoatOfArmsRenderer } from '@/components/lineage/CoatOfArmsRenderer';
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
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-stone-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-200 mb-2 font-serif">
            Heraldic Lineage System
          </h1>
          <p className="text-amber-100/70">
            Breed Auralia pets and track their ancestry through coat of arms
          </p>
        </div>

        {/* Controls */}
        <div className="bg-stone-900/50 border border-amber-700/30 rounded-lg p-6 mb-8">
          <div className="flex gap-4 justify-center">
            <button
              onClick={createFounder}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
            >
              Create Founder
            </button>
            <button
              onClick={breedSelected}
              disabled={!selectedParent1 || !selectedParent2}
              className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Breed Selected ({selectedParent1 ? '1' : '0'}/2)
            </button>
          </div>

          {/* Selection info */}
          {(selectedParent1 || selectedParent2) && (
            <div className="mt-4 text-center text-sm text-amber-200">
              {selectedParent1 && <span>Parent 1: {selectedParent1.id}</span>}
              {selectedParent1 && selectedParent2 && <span className="mx-2">+</span>}
              {selectedParent2 && <span>Parent 2: {selectedParent2.id}</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Founders */}
          <div>
            <h2 className="text-2xl font-bold text-amber-200 mb-4 font-serif">
              Founders ({founders.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {founders.map((coa) => (
                <CoatCard
                  key={coa.id}
                  coa={coa}
                  selected={selectedParent1?.id === coa.id || selectedParent2?.id === coa.id}
                  onClick={() => {
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
                />
              ))}
            </div>
          </div>

          {/* Offspring */}
          <div>
            <h2 className="text-2xl font-bold text-amber-200 mb-4 font-serif">
              Offspring ({offspring.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {offspring.map((coa) => (
                <CoatCard
                  key={coa.id}
                  coa={coa}
                  selected={selectedParent1?.id === coa.id || selectedParent2?.id === coa.id}
                  onClick={() => {
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
                />
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-amber-900/20 border border-amber-700/50 rounded-lg p-6 text-amber-100">
          <h3 className="text-xl font-bold mb-3 font-serif">How Lineage Works:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Each founder gets a unique coat of arms based on their ID</li>
            <li>Breeding combines elements from both parents' coats</li>
            <li>Division, colors, and charges are inherited or mutated</li>
            <li>Small markers show ancestry from previous generations</li>
            <li>Generation number increases with each breeding</li>
            <li>You can breed offspring with other offspring for complex lineages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface CoatCardProps {
  coa: CoatOfArms;
  selected: boolean;
  onClick: () => void;
}

const CoatCard: React.FC<CoatCardProps> = ({ coa, selected, onClick }) => {
  const [showBlason, setShowBlason] = useState(false);

  return (
    <div
      className={`bg-stone-800/50 border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/50'
          : 'border-stone-700 hover:border-amber-600'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-center mb-2">
        <CoatOfArmsRenderer coatOfArms={coa} size={120} />
      </div>

      <div className="text-center">
        <p className="text-xs text-amber-200 font-semibold mb-1">
          {coa.id.substring(0, 15)}...
        </p>
        <p className="text-xs text-amber-100/60">
          Generation {coa.generation}
        </p>
        <p className="text-xs text-amber-100/60">
          {coa.lineageMarkers.length} ancestor{coa.lineageMarkers.length !== 1 ? 's' : ''}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowBlason(!showBlason);
          }}
          className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline"
        >
          {showBlason ? 'Hide' : 'Show'} Blazon
        </button>

        {showBlason && (
          <div className="mt-2 text-xs text-amber-100/80 bg-stone-900/70 rounded p-2">
            {getBlason(coa)}
          </div>
        )}
      </div>
    </div>
  );
};
