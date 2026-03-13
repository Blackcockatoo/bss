'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Brain, ClipboardList, Play, Sparkles, Users, Target, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useEducationStore, FOCUS_AREA_LABELS } from '@/lib/education';
import type { DnaMode, QuickFireChallenge } from '@/lib/education';
import { EducationQueuePanel } from '@/components/EducationQueuePanel';
import { EduVibeBoard } from '@/components/EduVibeBoard';
import DigitalDNAHub from '@/components/DigitalDNAHub';
import type { LessonContext } from '@/components/DigitalDNAHub';
import { TEACHER_HUB_MENU_ACTIONS } from './menuActions';

const PAIRING_STORAGE_KEY = 'teacher-hub-pairing-state';

type PairingState = {
  pairedPetAlias: string | null;
  crestConfirmedAt: number | null;
  questLaunchedAt: number | null;
};

const PILLAR_DNA_MODES: Record<string, DnaMode[]> = {
  'Pattern Detective': ['spiral', 'mandala'],
  'Team Story Builder': ['particles'],
  'Reflection Checkpoint': ['journey'],
};

const PILLARS = [
  {
    title: 'Pattern Detective',
    description:
      'Students identify visual and audio patterns, then explain their reasoning. This supports math fluency and scientific observation.',
    icon: Brain,
  },
  {
    title: 'Team Story Builder',
    description:
      'Small groups solve prompts together and earn shared progress, encouraging communication and collaboration over competition.',
    icon: Users,
  },
  {
    title: 'Reflection Checkpoint',
    description:
      'Every short round ends with a quick SEL reflection so learners connect strategy, mood, and focus habits.',
    icon: ClipboardList,
  },
];


function loadPersistedPairingState(): PairingState {
  if (typeof window === 'undefined') {
    return {
      pairedPetAlias: null,
      crestConfirmedAt: null,
      questLaunchedAt: null,
    };
  }

  const saved = window.localStorage.getItem(PAIRING_STORAGE_KEY);
  if (!saved) {
    return {
      pairedPetAlias: null,
      crestConfirmedAt: null,
      questLaunchedAt: null,
    };
  }

  try {
    return JSON.parse(saved) as PairingState;
  } catch {
    window.localStorage.removeItem(PAIRING_STORAGE_KEY);
    return {
      pairedPetAlias: null,
      crestConfirmedAt: null,
      questLaunchedAt: null,
    };
  }
}

const DIRECTION_ICONS = [ArrowUp, ArrowRight, ArrowDown, ArrowLeft];
const DIRECTION_LABELS = ['Up', 'Right', 'Down', 'Left'];

// Quick-Fire Challenge Component
function QuickFireRound({ difficulty = 1 }: { difficulty?: number }) {
  const generateQuickFire = useEducationStore((s) => s.generateQuickFire);
  const scoreQuickFire = useEducationStore((s) => s.scoreQuickFire);

  const [challenge, setChallenge] = useState<QuickFireChallenge | null>(null);
  const [phase, setPhase] = useState<'idle' | 'memorize' | 'input' | 'result'>('idle');
  const [userInput, setUserInput] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [result, setResult] = useState<{ success: boolean; xp: number } | null>(null);

  const startChallenge = useCallback(() => {
    const newChallenge = generateQuickFire(difficulty);
    setChallenge(newChallenge);
    setUserInput([]);
    setResult(null);
    setPhase('memorize');

    // Show pattern for 2 seconds, then switch to input
    setTimeout(() => {
      setPhase('input');
      setStartTime(Date.now());
      setTimeLeft(newChallenge.timeLimitMs);
    }, 2000);
  }, [generateQuickFire, difficulty]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'input' || !challenge) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, challenge.timeLimitMs - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Time's up - fail
        setResult({ success: false, xp: 0 });
        setPhase('result');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, challenge, startTime]);

  const handleInput = useCallback((direction: number) => {
    if (phase !== 'input' || !challenge) return;

    const newInput = [...userInput, direction];
    setUserInput(newInput);

    // Check if input is complete
    if (newInput.length === challenge.pattern.length) {
      const elapsed = Date.now() - startTime;
      const scored = scoreQuickFire(challenge.id, newInput, elapsed, challenge.pattern);
      setResult({ success: scored.success, xp: scored.xpAwarded });
      setPhase('result');
    }
  }, [phase, challenge, userInput, startTime, scoreQuickFire]);

  if (phase === 'idle') {
    return (
      <button
        type="button"
        onClick={startChallenge}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 transition text-sm text-purple-200"
      >
        <Target className="h-4 w-4" />
        Quick-Fire Challenge
      </button>
    );
  }

  if (phase === 'memorize' && challenge) {
    return (
      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/30 text-center space-y-2">
        <p className="text-xs text-purple-300 uppercase tracking-wide">Memorize!</p>
        <div className="flex justify-center gap-2">
          {challenge.pattern.map((dir, i) => {
            const Icon = DIRECTION_ICONS[dir];
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center"
              >
                <Icon className="h-5 w-5 text-purple-200" />
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'input' && challenge) {
    const isUrgent = timeLeft < 3000;
    return (
      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {userInput.length} / {challenge.pattern.length}
          </p>
          <motion.p
            className={`text-sm font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-cyan-300'}`}
            animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            {(timeLeft / 1000).toFixed(1)}s
          </motion.p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DIRECTION_ICONS.map((Icon, dir) => (
            <motion.button
              key={dir}
              type="button"
              onClick={() => handleInput(dir)}
              className="h-12 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              title={DIRECTION_LABELS[dir]}
            >
              <Icon className="h-5 w-5 text-zinc-200" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'result' && result !== null) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`p-3 rounded-lg text-center space-y-2 ${
          result.success
            ? 'bg-emerald-500/20 border border-emerald-400/30'
            : 'bg-red-500/20 border border-red-400/30'
        }`}
      >
        <motion.p
          className={`text-2xl ${result.success ? 'text-emerald-300' : 'text-red-300'}`}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.3 }}
        >
          {result.success ? '⚡' : '💨'}
        </motion.p>
        <p className={`text-sm font-semibold ${result.success ? 'text-emerald-200' : 'text-red-200'}`}>
          {result.success ? `+${result.xp} XP!` : 'Try again!'}
        </p>
        <button
          type="button"
          onClick={() => setPhase('idle')}
          className="text-xs text-zinc-400 hover:text-zinc-200 underline"
        >
          Close
        </button>
      </motion.div>
    );
  }

  return null;
}

export default function SchoolGamePage() {
  const queue = useEducationStore((s) => s.queue);
  const activeLesson = useEducationStore((s) => s.activeLesson);
  const activateLesson = useEducationStore((s) => s.activateLesson);
  const lessonProgress = useEducationStore((s) => s.lessonProgress);

  const [activeDnaView, setActiveDnaView] = useState<LessonContext | null>(null);
  const [pairingState, setPairingState] = useState<PairingState>(() => loadPersistedPairingState());
  const [studentAlias, setStudentAlias] = useState(() => loadPersistedPairingState().pairedPetAlias ?? '');
  const [selectedActionId, setSelectedActionId] = useState<'pair-qr' | 'confirm-crest' | 'launch-quest'>('pair-qr');
  const [qrInput, setQrInput] = useState('');
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowSuccess, setFlowSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PAIRING_STORAGE_KEY, JSON.stringify(pairingState));
    window.sessionStorage.setItem(PAIRING_STORAGE_KEY, JSON.stringify(pairingState));
  }, [pairingState]);

  const completedCount = useMemo(
    () => lessonProgress.filter((p) => p.status === 'completed').length,
    [lessonProgress],
  );

  const activeLessonData = useMemo(
    () => queue.find((l) => l.id === activeLesson),
    [queue, activeLesson],
  );

  const handleStartQuest = () => {
    if (!pairingState.pairedPetAlias) {
      setFlowError('Pair with a pet via QR before launching Classroom Quest.');
      setFlowSuccess(null);
      return;
    }
    if (!pairingState.crestConfirmedAt) {
      setFlowError('Confirm the bonded crest before launching Classroom Quest.');
      setFlowSuccess(null);
      return;
    }
    const firstLesson = queue[0];
    if (firstLesson) {
      activateLesson(firstLesson.id);
      const launchTime = Date.now();
      setPairingState((prev) => ({ ...prev, questLaunchedAt: launchTime }));
      setFlowError(null);
      setFlowSuccess('Classroom Quest launched successfully.');
      if (studentAlias.trim() && firstLesson.dnaMode) {
        setActiveDnaView({
          lessonId: firstLesson.id,
          studentAlias: studentAlias.trim(),
          prePrompt: firstLesson.prePrompt,
          postPrompt: firstLesson.postPrompt,
        });
      }
    }
  };

  const handlePairViaQr = useCallback(() => {
    const match = qrInput.trim().match(/^PET:([A-Za-z0-9\s-]{2,40})$/i);
    if (!match) {
      setFlowError('QR payload invalid. Use format PET:Student Alias (example: PET:Bluebird 4).');
      setFlowSuccess(null);
      return;
    }
    const pairedPetAlias = match[1].trim();
    setStudentAlias(pairedPetAlias);
    setPairingState({
      pairedPetAlias,
      crestConfirmedAt: null,
      questLaunchedAt: null,
    });
    setFlowError(null);
    setFlowSuccess(`Paired with ${pairedPetAlias}. Crest confirmation is now available.`);
  }, [qrInput]);

  const handleConfirmCrest = useCallback(() => {
    if (!pairingState.pairedPetAlias) {
      setFlowError('No paired pet found. Pair with a pet via QR first.');
      setFlowSuccess(null);
      return;
    }
    const crestConfirmedAt = Date.now();
    setPairingState((prev) => ({ ...prev, crestConfirmedAt }));
    setFlowError(null);
    setFlowSuccess(`Bonded crest confirmed for ${pairingState.pairedPetAlias}.`);
  }, [pairingState.pairedPetAlias]);

  const handlePillarStart = (pillarTitle: string) => {
    const modes = PILLAR_DNA_MODES[pillarTitle] ?? [];
    // Find a queued lesson matching this pillar's DNA mode
    const matchingLesson = queue.find(
      (l) => l.dnaMode && modes.includes(l.dnaMode),
    );
    if (matchingLesson && studentAlias.trim()) {
      activateLesson(matchingLesson.id);
      setActiveDnaView({
        lessonId: matchingLesson.id,
        studentAlias: studentAlias.trim(),
        prePrompt: matchingLesson.prePrompt,
        postPrompt: matchingLesson.postPrompt,
      });
    }
  };

  // If DNA Hub is active, show it
  if (activeDnaView) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            type="button"
            onClick={() => setActiveDnaView(null)}
            className="px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-zinc-200 hover:bg-slate-700 transition"
          >
            Back to Quest
          </button>
        </div>
        <DigitalDNAHub lessonContext={activeDnaView} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
          {/* Main Content */}
          <div className="space-y-8">
            <header className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Classroom-ready
              </p>
              <h1 className="text-3xl font-bold sm:text-4xl">Classroom Quest</h1>
              <p className="text-slate-300">
                A calm, school-appropriate experience focused on teamwork, pattern literacy, and short reflection loops.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                Every activity here maps to real curriculum standards (NGSS, ISTE). Pattern Detective builds observation skills. Team Story Builder teaches collaboration without competition. Reflection Checkpoints weave social-emotional learning into every session. No scores are shared publicly — progress belongs to the learner.
              </p>
            </header>

            {/* Queue Summary */}
            <section className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-emerald-200">Teacher Hub Menu</h2>
                <span className="text-xs text-emerald-300">Pair → Crest → Quest</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {TEACHER_HUB_MENU_ACTIONS.map((action) => {
                  const isLive = action.status === 'live';
                  const isSelected = selectedActionId === action.id;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => isLive && setSelectedActionId(action.id as 'pair-qr' | 'confirm-crest' | 'launch-quest')}
                      disabled={!isLive}
                      className={`rounded-lg border px-3 py-2 text-left transition ${
                        isSelected
                          ? 'border-emerald-400/70 bg-emerald-400/10'
                          : 'border-slate-700 bg-slate-900/50'
                      } ${!isLive ? 'opacity-60 cursor-not-allowed' : 'hover:border-emerald-400/50 hover:bg-emerald-500/5'}`}
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        {action.label}
                        {!isLive && <span className="ml-2 text-xs text-amber-300">Coming soon</span>}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {isLive ? action.description : `${action.description} Coming soon.`}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedActionId === 'pair-qr' && (
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 space-y-2">
                  <p className="text-xs text-zinc-400">Pair with pet via QR payload</p>
                  <div className="flex gap-2">
                    <input
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="PET:Bluebird 4"
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handlePairViaQr}
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold"
                    >
                      Pair
                    </button>
                  </div>
                </div>
              )}

              {selectedActionId === 'confirm-crest' && (
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 space-y-2">
                  <p className="text-xs text-zinc-400">
                    Confirm bonded crest for {pairingState.pairedPetAlias ?? '— no pet paired yet —'}
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmCrest}
                    className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold"
                  >
                    Confirm Crest
                  </button>
                </div>
              )}

              {selectedActionId === 'launch-quest' && (
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 space-y-2 text-xs text-zinc-300">
                  <p>Ready checks before launch:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Pet paired: {pairingState.pairedPetAlias ? 'Yes' : 'No'}</li>
                    <li>Crest confirmed: {pairingState.crestConfirmedAt ? 'Yes' : 'No'}</li>
                    <li>Quest launched this session: {pairingState.questLaunchedAt ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}

              {flowError && <p className="text-xs text-red-300">{flowError}</p>}
              {flowSuccess && <p className="text-xs text-emerald-300">{flowSuccess}</p>}
            </section>

            {queue.length > 0 && (
              <section className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-cyan-200">Lesson Queue</h2>
                  <p className="text-xs text-cyan-300">
                    {completedCount} of {queue.length} done
                  </p>
                </div>
                {activeLessonData && (
                  <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
                    <p className="text-xs text-cyan-300 uppercase tracking-wide">Active now</p>
                    <p className="text-sm font-semibold text-white mt-1">{activeLessonData.title}</p>
                    <p className="text-xs text-zinc-400">
                      {FOCUS_AREA_LABELS[activeLessonData.focusArea]} · {activeLessonData.targetMinutes} min
                    </p>
                  </div>
                )}

                {/* Student alias input */}
                <div className="flex gap-2">
                  <input
                    value={studentAlias}
                    onChange={(e) => setStudentAlias(e.target.value)}
                    placeholder="Your alias (e.g., Bluebird 4)"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleStartQuest}
                    disabled={!studentAlias.trim() || queue.length === 0}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Play className="h-4 w-4 inline mr-1" />
                    Start Quest
                  </button>
                </div>

                <EducationQueuePanel
                  mode="student"
                  studentAlias={studentAlias}
                  onLessonActivate={(lessonId) => {
                    const lesson = queue.find((l) => l.id === lessonId);
                    if (lesson && studentAlias.trim() && lesson.dnaMode) {
                      activateLesson(lessonId);
                      setActiveDnaView({
                        lessonId,
                        studentAlias: studentAlias.trim(),
                        prePrompt: lesson.prePrompt,
                        postPrompt: lesson.postPrompt,
                      });
                    } else {
                      activateLesson(lessonId);
                    }
                  }}
                />
              </section>
            )}

            {/* Learning Pillars */}
            <section className="grid gap-4 sm:grid-cols-3">
              {PILLARS.map(({ title, description, icon: Icon }, index) => {
                const modes = PILLAR_DNA_MODES[title] ?? [];
                const hasMatchingLesson = queue.some(
                  (l) => l.dnaMode && modes.includes(l.dnaMode),
                );
                return (
                  <motion.article
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 space-y-3"
                  >
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-slate-300">{description}</p>
                    {hasMatchingLesson && studentAlias.trim() && (
                      <button
                        type="button"
                        onClick={() => handlePillarStart(title)}
                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-cyan-200 transition"
                      >
                        <Play className="h-3 w-3 inline mr-1" />
                        Start {title}
                      </button>
                    )}
                    {/* Quick-Fire Round inside Pattern Detective pillar */}
                    {title === 'Pattern Detective' && studentAlias.trim() && (
                      <div className="pt-2">
                        <QuickFireRound difficulty={1} />
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </section>

            {/* Round flow */}
            <section className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-indigo-200">
                <BookOpen className="h-5 w-5" />
                Round flow (10 minutes)
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-200">
                <li>Warm-up clue (1 min): identify a sequence pattern.</li>
                <li>Team challenge (6 min): solve three mixed logic prompts.</li>
                <li>Reflection (2 min): students pick which strategy helped most.</li>
                <li>Teacher snapshot (1 min): local-only summary of class progress.</li>
              </ol>
            </section>

            {/* No queue fallback */}
            {queue.length === 0 && (
              <section className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
                <p className="text-sm text-amber-200">
                  No lessons queued yet. Ask your teacher to set up activities in the{' '}
                  <Link href="/" className="underline text-amber-300 hover:text-amber-100">
                    Classroom Manager
                  </Link>
                  , or explore the DNA Hub directly.
                </p>
              </section>
            )}

            <footer className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/pet"
                className="rounded-lg border border-slate-600 px-3 py-2 text-slate-200 hover:bg-slate-800"
              >
                Back to Pet
              </Link>
              <Link
                href="/digital-dna"
                className="rounded-lg border border-cyan-400/50 px-3 py-2 text-cyan-200 hover:bg-cyan-500/10"
              >
                Open Digital DNA Hub
              </Link>
            </footer>
          </div>

          {/* Sidebar with EduVibeBoard */}
          <aside className="space-y-4">
            <EduVibeBoard />

            {/* Quick stats */}
            {studentAlias.trim() && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4"
              >
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Playing as</p>
                <p className="text-sm font-semibold text-zinc-200">{studentAlias}</p>
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
