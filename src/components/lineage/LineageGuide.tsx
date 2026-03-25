'use client';

import { useState } from 'react';

const GUIDE_STEPS = [
  {
    title: 'Creating Founders',
    description: 'Every lineage begins with a founder. Click "Create Founder" to generate a unique coat of arms.',
    details: [
      '• Each founder receives a unique ID and generational marker',
      '• The coat of arms is randomly generated with colors and symbols',
      '• Founders are the root of your breeding lineages',
      '• You can create multiple founders to explore different lineages',
    ],
  },
  {
    title: 'Breeding Mechanics',
    description: 'Breed two founders to create offspring with inherited traits.',
    details: [
      '• Select two founders or breeding pairs',
      '• The offspring inherits tinctures (colors) from both parents',
      '• Symbols (charges) are selected based on genetic compatibility',
      '• Generation counter increases with each breeding cycle',
      '• Different breeding combinations produce different results',
    ],
  },
  {
    title: 'Reading Coats of Arms',
    description: 'Each coat tells a story through its visual elements.',
    details: [
      '• Division: The structural pattern (plain, per pale, quarterly, etc.)',
      '• Tinctures: The colors representing virtues and attributes',
      '• Charges: The symbols representing achievements and characteristics',
      '• Generation: Shows how many breeding cycles have occurred',
      '• Ancestors: Tracks the lineage depth and complexity',
    ],
  },
];

export function LineageGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const step = GUIDE_STEPS[activeStep];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-cyan-500/30 p-6 mb-6">
      <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
        <span>📚</span> Lineage Guide
      </h3>

      {/* Step Indicator */}
      <div className="flex gap-2 mb-4">
        {GUIDE_STEPS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-all ${
              activeStep === idx
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400'
                : 'bg-slate-700 text-gray-400 hover:text-gray-300 border border-slate-600'
            }`}
          >
            Step {idx + 1}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-800 rounded border border-cyan-500/20 p-4 mb-4">
        <h4 className="text-lg font-bold text-cyan-300 mb-2">{step.title}</h4>
        <p className="text-gray-300 mb-3">{step.description}</p>
        <ul className="space-y-2 text-sm text-gray-300">
          {step.details.map((detail, idx) => (
            <li key={idx} className="text-gray-300">
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="px-3 py-2 bg-slate-700 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 text-sm font-semibold"
        >
          ← Previous
        </button>
        <p className="text-sm text-gray-400">
          Step {activeStep + 1} of {GUIDE_STEPS.length}
        </p>
        <button
          onClick={() => setActiveStep(Math.min(GUIDE_STEPS.length - 1, activeStep + 1))}
          disabled={activeStep === GUIDE_STEPS.length - 1}
          className="px-3 py-2 bg-cyan-500/30 text-cyan-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-500/40 text-sm font-semibold border border-cyan-500/50"
        >
          Next →
        </button>
      </div>

      <div className="mt-4 p-3 bg-cyan-500/10 rounded border border-cyan-500/30 text-xs text-gray-300">
        💡 Pro Tip: The lineage system combines genetics with heraldry. Each breeding creates unique combinations based on parental traits!
      </div>
    </div>
  );
}
