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
  const [studentAlias, setStudentAlias] = useState('');

  const completedCount = useMemo(
    () => lessonProgress.filter((p) => p.status === 'completed').length,
    [lessonProgress],
  );

  const activeLessonData = useMemo(
    () => queue.find((l) => l.id === activeLesson),
    [queue, activeLesson],
  );

  const handleStartQuest = () => {
    const firstLesson = queue[0];
    if (firstLesson) {
      activateLesson(firstLesson.id);
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
            </header>

            {/* Queue Summary */}
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
