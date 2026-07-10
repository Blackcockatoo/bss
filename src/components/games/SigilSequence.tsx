"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { triggerHaptic } from "@/lib/haptics";
import {
  computeGameReward,
  createSeededRng,
  generateSigilQuestion,
  TIER_LABELS,
  type DifficultyTier,
  type EvolutionSnapshot,
  type SigilDifficulty,
  type SigilQuestion,
} from "@/lib/minigames/gameMath";
import { getGrade, RANK_INFO, type GameRank } from "@/lib/minigames/ranks";
import { playComboTick, playMiss, playRoundWin } from "@/lib/minigames/sfx";

import { Button } from "../ui/button";
import { GameResultScreen } from "./GameResultScreen";
import {
  ComboFlame,
  FloatingTextLayer,
  ParticleLayer,
  useFloatingText,
  useParticles,
  useScreenShake,
} from "./juice";

export interface SigilSequenceResult {
  score: number;
  correctAnswers: number;
  /** Best answer streak within the run. */
  combo: number;
  /** Percent of questions answered correctly. */
  accuracy: number;
}

interface SigilSequenceProps {
  petName?: string;
  genomeSeed?: number;
  difficulty: SigilDifficulty;
  tier: DifficultyTier;
  rank: GameRank;
  evolution: EvolutionSnapshot;
  bests: { score: number; streak: number };
  onComplete: (result: SigilSequenceResult) => void;
  onExit?: () => void;
}

type Phase = "intro" | "question" | "reveal" | "done";

/** Base points per correct answer, plus a streak bonus capped at +8. */
function pointsFor(streak: number): number {
  return 10 + Math.min(8, streak * 2);
}

export function SigilSequence({
  petName = "your companion",
  genomeSeed,
  difficulty,
  tier,
  rank,
  evolution,
  bests,
  onComplete,
  onExit,
}: SigilSequenceProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<SigilQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finalResult, setFinalResult] = useState<{
    result: SigilSequenceResult;
    newBests: string[];
  } | null>(null);
  const rngRef = useRef<() => number>(() => Math.random());

  const { particles, burst } = useParticles();
  const { floatingItems, pop } = useFloatingText();
  const { shake, ShakeWrap } = useScreenShake();

  const rankInfo = RANK_INFO[rank];

  const askQuestion = useCallback(
    (index: number) => {
      setQuestion(generateSigilQuestion(difficulty, rngRef.current));
      setQuestionIndex(index);
      setPicked(null);
      setPhase("question");
    },
    [difficulty],
  );

  const startRun = () => {
    rngRef.current = createSeededRng((genomeSeed ?? 1) + (Date.now() % 0xffff));
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setFinalResult(null);
    askQuestion(0);
  };

  const handleAnswer = (option: number) => {
    if (phase !== "question" || !question) return;
    setPicked(option);
    setPhase("reveal");

    if (option === question.answer) {
      const gained = Math.round(pointsFor(streak) * rankInfo.scoreMult);
      const nextStreak = streak + 1;
      setScore((s) => s + gained);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrectCount((c) => c + 1);
      playComboTick(nextStreak);
      playRoundWin();
      triggerHaptic("success");
      pop(`+${gained}`, { x: 50, y: 30, color: "#fbbf24", scale: 1.2 });
      // Gold rain
      burst({
        x: 50,
        y: 20,
        colors: ["#fbbf24", "#fde68a", "#f59e0b"],
        count: 22,
        radius: 110,
        starChance: 0.5,
      });
    } else {
      setStreak(0);
      playMiss();
      triggerHaptic("error");
      shake();
    }
  };

  const finishRun = useCallback(
    (
      finalScore: number,
      finalCorrect: number,
      finalBestStreak: number,
    ) => {
      const result: SigilSequenceResult = {
        score: finalScore,
        correctAnswers: finalCorrect,
        combo: finalBestStreak,
        accuracy: Math.round((finalCorrect / difficulty.questions) * 100),
      };
      const newBests: string[] = [];
      if (finalScore > bests.score && finalScore > 0) newBests.push("New best score");
      if (finalBestStreak > bests.streak && finalBestStreak > 0)
        newBests.push("New best streak");

      setFinalResult({ result, newBests });
      setPhase("done");
      onComplete(result);
    },
    [bests, difficulty.questions, onComplete],
  );

  const handleNext = () => {
    const next = questionIndex + 1;
    if (next >= difficulty.questions) {
      finishRun(score, correctCount, bestStreak);
    } else {
      askQuestion(next);
    }
  };

  const wasCorrect = question !== null && picked === question.answer;

  if (phase === "done" && finalResult) {
    const reward = computeGameReward(
      {
        game: "sigil",
        score: finalResult.result.score,
        correctAnswers: finalResult.result.correctAnswers,
        combo: finalResult.result.combo,
        accuracy: finalResult.result.accuracy,
        rank,
      },
      evolution,
    );
    return (
      <div className="h-full rounded-2xl border border-slate-700 bg-slate-950/95 text-white">
        <GameResultScreen
          gameLabel="Sigil Sequence"
          accent="#a78bfa"
          grade={getGrade({
            game: "sigil",
            score: finalResult.result.score,
            accuracy: finalResult.result.accuracy,
          })}
          score={finalResult.result.score}
          rank={rank}
          stats={[
            {
              label: "Patterns named",
              value: `${finalResult.result.correctAnswers}/${difficulty.questions}`,
            },
            { label: "Best streak", value: `${finalResult.result.combo}` },
            { label: "Tier", value: TIER_LABELS[tier] },
          ]}
          newBests={finalResult.newBests}
          reward={reward}
          onReplay={startRun}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <ShakeWrap className="h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white">
        {/* Ambient aura warms with the streak */}
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 50% 30%, rgba(167, 139, 250, ${0.05 + Math.min(0.18, streak * 0.03)}), transparent 60%)`,
          }}
        />

        <div className="relative flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Calculator className="h-5 w-5 text-violet-300" />
            Sigil Sequence
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ borderColor: rankInfo.color, color: rankInfo.color }}
            >
              {rankInfo.label}
            </span>
          </h3>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>
              {Math.min(questionIndex + 1, difficulty.questions)}/
              {difficulty.questions}
            </span>
            <span>
              Score{" "}
              <span className="font-semibold text-violet-300">{score}</span>
            </span>
            <ComboFlame combo={streak} threshold={2} />
          </div>
        </div>

        <p className="relative mt-1 text-xs uppercase tracking-widest text-violet-400/80">
          {TIER_LABELS[tier]}
        </p>

        <div className="relative my-4 flex flex-1 flex-col items-center justify-center gap-6">
          {phase === "intro" && (
            <div className="space-y-3 text-center">
              <p className="max-w-sm text-sm text-zinc-400">
                Number patterns flow through {petName}&apos;s field. Name the
                next term in each sequence — streaks multiply your score, and
                deeper evolution stages unlock stranger mathematics.
              </p>
              <Button onClick={startRun} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Open the Sequences
              </Button>
            </div>
          )}

          {(phase === "question" || phase === "reveal") && question && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-2xl sm:text-3xl">
                {question.visible.map((term, i) => (
                  <motion.span
                    key={`${questionIndex}-${i}`}
                    initial={{ opacity: 0, y: 14, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: i * 0.09,
                      type: "spring",
                      stiffness: 320,
                      damping: 20,
                    }}
                    className="rounded-lg border border-violet-500/40 bg-violet-900/30 px-3 py-2"
                  >
                    {term}
                  </motion.span>
                ))}
                <motion.span
                  key={`${questionIndex}-blank`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: 1,
                    scale: phase === "reveal" ? [1, 1.25, 1] : 1,
                  }}
                  transition={{
                    delay: question.visible.length * 0.09,
                    duration: 0.35,
                  }}
                  className={`rounded-lg border-2 border-dashed px-3 py-2 ${
                    phase === "reveal"
                      ? wasCorrect
                        ? "border-emerald-400 text-emerald-300"
                        : "border-rose-400 text-rose-300"
                      : "border-violet-400 text-violet-300"
                  }`}
                  style={
                    phase === "reveal" && wasCorrect
                      ? { boxShadow: "0 0 24px rgba(52,211,153,0.5)" }
                      : undefined
                  }
                >
                  {phase === "reveal" ? question.answer : "?"}
                </motion.span>
              </div>

              <AnimatePresence mode="wait">
                {phase === "question" ? (
                  <motion.div
                    key={`options-${questionIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ delay: 0.25 }}
                    className="grid w-full max-w-sm grid-cols-2 gap-3"
                  >
                    {question.options.map((option) => (
                      <motion.button
                        key={option}
                        type="button"
                        onClick={() => handleAnswer(option)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        className="touch-manipulation rounded-xl border border-slate-600 bg-slate-800/80 py-4 font-mono text-xl transition-colors hover:border-violet-400 hover:bg-violet-900/40"
                      >
                        {option}
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`reveal-${questionIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm space-y-3 text-center"
                  >
                    <p
                      className={`text-lg font-bold ${wasCorrect ? "text-emerald-300" : "text-rose-300"}`}
                    >
                      {wasCorrect
                        ? `+${Math.round(pointsFor(streak - 1) * rankInfo.scoreMult)} resonance`
                        : `The flow was ${question.answer}`}
                    </p>
                    <p className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-zinc-300">
                      {question.lore}
                    </p>
                    <Button onClick={handleNext}>
                      {questionIndex + 1 >= difficulty.questions
                        ? "Finish"
                        : "Next Sequence"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          <ParticleLayer particles={particles} />
          <FloatingTextLayer items={floatingItems} />
        </div>

        <p className="relative text-center text-xs text-zinc-500">
          Mathematics feeds your pet: correct answers grant XP toward
          evolution, and higher stages open new sequence families.
        </p>
      </div>
    </ShakeWrap>
  );
}
