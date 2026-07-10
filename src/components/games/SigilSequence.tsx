"use client";

import { triggerHaptic } from "@/lib/haptics";
import {
  createSeededRng,
  generateSigilQuestion,
  TIER_LABELS,
  type DifficultyTier,
  type SigilDifficulty,
  type SigilQuestion,
} from "@/lib/minigames/gameMath";
import { Calculator, Flame, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "../ui/button";

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
  const rngRef = useRef<() => number>(() => Math.random());
  const completedRef = useRef(false);

  const askQuestion = useCallback(
    (index: number) => {
      setQuestion(generateSigilQuestion(difficulty, rngRef.current));
      setQuestionIndex(index);
      setPicked(null);
      setPhase("question");
    },
    [difficulty],
  );

  const handleStart = () => {
    rngRef.current = createSeededRng(
      (genomeSeed ?? 1) + Date.now() % 0xffff,
    );
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    completedRef.current = false;
    askQuestion(0);
  };

  const handleAnswer = (option: number) => {
    if (phase !== "question" || !question) return;
    setPicked(option);
    setPhase("reveal");

    if (option === question.answer) {
      const gained = pointsFor(streak);
      const nextStreak = streak + 1;
      setScore((s) => s + gained);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrectCount((c) => c + 1);
      triggerHaptic("success");
    } else {
      setStreak(0);
      triggerHaptic("error");
    }
  };

  const handleNext = () => {
    const next = questionIndex + 1;
    if (next >= difficulty.questions) {
      finishRun();
    } else {
      askQuestion(next);
    }
  };

  const finishRun = () => {
    setPhase("done");
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      score,
      correctAnswers: correctCount,
      combo: bestStreak,
      accuracy: Math.round((correctCount / difficulty.questions) * 100),
    });
  };

  const wasCorrect = question !== null && picked === question.answer;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Calculator className="h-5 w-5 text-violet-300" />
          Sigil Sequence
        </h3>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            {Math.min(questionIndex + 1, difficulty.questions)}/
            {difficulty.questions}
          </span>
          <span>
            Score <span className="font-semibold text-violet-300">{score}</span>
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1 text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              {streak}
            </span>
          )}
        </div>
      </div>

      <p className="mt-1 text-xs uppercase tracking-widest text-violet-400/80">
        {TIER_LABELS[tier]}
      </p>

      <div className="my-4 flex flex-1 flex-col items-center justify-center gap-6">
        {phase === "intro" && (
          <div className="space-y-3 text-center">
            <p className="max-w-sm text-sm text-zinc-400">
              Number patterns flow through {petName}&apos;s field. Name the
              next term in each sequence — streaks multiply your score, and
              deeper evolution stages unlock stranger mathematics.
            </p>
            <Button onClick={handleStart} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Open the Sequences
            </Button>
          </div>
        )}

        {(phase === "question" || phase === "reveal") && question && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-2xl sm:text-3xl">
              {question.visible.map((term, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-violet-500/40 bg-violet-900/30 px-3 py-2"
                >
                  {term}
                </span>
              ))}
              <span
                className={`rounded-lg border-2 border-dashed px-3 py-2 ${
                  phase === "reveal"
                    ? wasCorrect
                      ? "border-emerald-400 text-emerald-300"
                      : "border-rose-400 text-rose-300"
                    : "border-violet-400 text-violet-300"
                }`}
              >
                {phase === "reveal" ? question.answer : "?"}
              </span>
            </div>

            {phase === "question" ? (
              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswer(option)}
                    className="touch-manipulation rounded-xl border border-slate-600 bg-slate-800/80 py-4 font-mono text-xl transition-all hover:border-violet-400 hover:bg-violet-900/40 active:scale-95"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full max-w-sm space-y-3 text-center">
                <p
                  className={`text-lg font-bold ${wasCorrect ? "text-emerald-300" : "text-rose-300"}`}
                >
                  {wasCorrect
                    ? `+${pointsFor(streak - 1)} resonance`
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
              </div>
            )}
          </>
        )}

        {phase === "done" && (
          <div className="space-y-2 text-center">
            <p className="text-2xl font-bold text-violet-300">{score} points</p>
            <p className="text-sm text-zinc-400">
              {correctCount}/{difficulty.questions} patterns named — best
              streak {bestStreak}. {petName} grows sharper with every sequence.
            </p>
            {onExit && (
              <Button size="sm" variant="outline" onClick={onExit}>
                Close
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-zinc-500">
        Mathematics feeds your pet: correct answers grant XP toward evolution,
        and higher stages open new sequence families.
      </p>
    </div>
  );
}
