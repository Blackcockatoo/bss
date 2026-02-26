'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type ModeId = 'demo' | 'activity' | 'project';

type ModeConfig = {
  id: ModeId;
  name: string;
  duration: string;
  description: string;
  preQuestions: string[];
  postQuestions: string[];
  rubricCriteria: string[];
};

type ModeResponses = {
  preAnswers: string[];
  postAnswers: string[];
  findings: string;
};

const MODES: ModeConfig[] = [
  {
    id: 'demo',
    name: '10-minute demo',
    duration: '10 minutes',
    description: 'A rapid spark to introduce genome patterns, pet traits, and curiosity hooks.',
    preQuestions: [
      'What do you think a genome controls in a MetaPet?',
      'Which trait do you expect to be most visible at first glance? Why?',
    ],
    postQuestions: [
      'Which trait surprised you, and what evidence led you there?',
      'How would you test one trait if you had more time?',
    ],
    rubricCriteria: ['Observation accuracy', 'Evidence citation', 'Curiosity & questioning'],
  },
  {
    id: 'activity',
    name: '30-minute activity',
    duration: '30 minutes',
    description: 'Hands-on investigation with guided checkpoints and peer discussion.',
    preQuestions: [
      'What patterns might appear if we compare two pets side by side?',
      'How could behavior connect to the genome readout?',
    ],
    postQuestions: [
      'Which pattern did your group verify with evidence?',
      'What did your group disagree on, and how did you resolve it?',
    ],
    rubricCriteria: ['Collaboration', 'Pattern reasoning', 'Use of evidence', 'Communication clarity'],
  },
  {
    id: 'project',
    name: 'Multi-day project',
    duration: '2-5 days',
    description: 'Extended inquiry with student-led hypotheses, data tracking, and presentation.',
    preQuestions: [
      'What hypothesis about pet evolution do you want to test?',
      'What data will you collect to support or refute it?',
    ],
    postQuestions: [
      'What conclusion did your data support?',
      'What would you change if you repeated the investigation?',
    ],
    rubricCriteria: ['Research design', 'Data organization', 'Analysis quality', 'Reflection depth'],
  },
];

function createDefaultResponses() {
  return MODES.reduce<Record<ModeId, ModeResponses>>((acc, mode) => {
    acc[mode.id] = {
      preAnswers: mode.preQuestions.map(() => ''),
      postAnswers: mode.postQuestions.map(() => ''),
      findings: '',
    };
    return acc;
  }, {} as Record<ModeId, ModeResponses>);
}

function escapeCsv(value: string) {
  const sanitized = value.replace(/\r?\n/g, ' ').replace(/"/g, '""');
  return `"${sanitized}"`;
}

export function ClassroomModes() {
  const [responses, setResponses] = useState<Record<ModeId, ModeResponses>>(createDefaultResponses);
  const [lastExport, setLastExport] = useState<Record<ModeId, string>>({
    demo: 'Not exported yet',
    activity: 'Not exported yet',
    project: 'Not exported yet',
  });

  const rubricLevels = useMemo(
    () => ['Emerging', 'Developing', 'Proficient', 'Exemplary'],
    [],
  );

  const handleAnswerChange = (
    modeId: ModeId,
    type: 'pre' | 'post',
    index: number,
    value: string,
  ) => {
    setResponses(prev => {
      const next = { ...prev };
      const answersKey = type === 'pre' ? 'preAnswers' : 'postAnswers';
      const updatedAnswers = [...next[modeId][answersKey]];
      updatedAnswers[index] = value;
      next[modeId] = {
        ...next[modeId],
        [answersKey]: updatedAnswers,
      };
      return next;
    });
  };

  const handleFindingsChange = (modeId: ModeId, value: string) => {
    setResponses(prev => ({
      ...prev,
      [modeId]: {
        ...prev[modeId],
        findings: value,
      },
    }));
  };

  const handleExportCsv = (modeId: ModeId) => {
    const mode = MODES.find(item => item.id === modeId);
    if (!mode) return;
    const data = responses[modeId];
    const rows = [
      ['Mode', mode.name],
      ['Duration', mode.duration],
      ['Exported At', new Date().toLocaleString()],
      [],
      ['Section', 'Question', 'Response'],
      ...mode.preQuestions.map((question, index) => [
        'Pre',
        question,
        data.preAnswers[index] ?? '',
      ]),
      ...mode.postQuestions.map((question, index) => [
        'Post',
        question,
        data.postAnswers[index] ?? '',
      ]),
      [],
      ['Findings', data.findings || ''],
    ];

    const csv = rows
      .map(row => row.map(cell => escapeCsv(cell ?? '')).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metapet-${modeId}-findings.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setLastExport(prev => ({
      ...prev,
      [modeId]: new Date().toLocaleTimeString(),
    }));
  };

  return (
    <div className="space-y-6">
      {MODES.map(mode => (
        <div key={mode.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-white">{mode.name}</h3>
                <p className="text-xs text-zinc-500">{mode.duration}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-700 text-cyan-200 hover:text-cyan-50 touch-manipulation"
                onClick={() => handleExportCsv(mode.id)}
              >
                Export Findings (CSV)
              </Button>
            </div>
            <p className="text-sm text-zinc-300">{mode.description}</p>
            <p className="text-xs text-zinc-500">Last export: {lastExport[mode.id]}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Pre-Questions</p>
              {mode.preQuestions.map((question, index) => (
                <div key={question} className="space-y-1">
                  <p className="text-sm text-zinc-200">{question}</p>
                  <input
                    type="text"
                    value={responses[mode.id].preAnswers[index] ?? ''}
                    onChange={event => handleAnswerChange(mode.id, 'pre', index, event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Student response..."
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Post-Questions</p>
              {mode.postQuestions.map((question, index) => (
                <div key={question} className="space-y-1">
                  <p className="text-sm text-zinc-200">{question}</p>
                  <input
                    type="text"
                    value={responses[mode.id].postAnswers[index] ?? ''}
                    onChange={event => handleAnswerChange(mode.id, 'post', index, event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Student response..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Rubric Template</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-800 text-left text-xs text-zinc-300">
                <thead className="bg-slate-900/60 text-zinc-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Criteria</th>
                    {rubricLevels.map(level => (
                      <th key={level} className="px-3 py-2 font-semibold">
                        {level}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mode.rubricCriteria.map(criteria => (
                    <tr key={criteria} className="border-t border-slate-800">
                      <td className="px-3 py-2 font-medium text-zinc-200">{criteria}</td>
                      {rubricLevels.map(level => (
                        <td key={level} className="px-3 py-2 text-zinc-500">
                          Notes
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Student Findings</p>
            <textarea
              value={responses[mode.id].findings}
              onChange={event => handleFindingsChange(mode.id, event.target.value)}
              className="w-full min-h-[96px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Capture observations, evidence, and next steps..."
            />
          </div>
        </div>
      ))}
    </div>
  );
}
