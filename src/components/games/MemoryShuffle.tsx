"use client";

import { triggerHaptic } from "@/lib/haptics";
import {
  createSeededRng,
  type MemoryDifficulty,
} from "@/lib/minigames/gameMath";
import { BrainCircuit, Heart, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";

export interface MemoryShuffleResult {
  /** Total sequence steps recalled across completed rounds. */
  score: number;
  roundsCompleted: number;
}

interface MemoryShuffleProps {
  petName?: string;
  genomeSeed?: number;
  difficulty: MemoryDifficulty;
  onComplete: (result: MemoryShuffleResult) => void;
  onExit?: () => void;
}

const PAD_GLYPHS = ["◆", "▲", "●", "✦", "⬟", "✧", "❖"];
const PAD_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#fb7185",
];

type Phase = "intro" | "showing" | "input" | "roundWon" | "gameover";

export function MemoryShuffle({
  petName = "your companion",
  genomeSeed,
  difficulty,
  onComplete,
  onExit,
}: MemoryShuffleProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showIndex, setShowIndex] = useState(-1);
  const [inputIndex, setInputIndex] = useState(0);
  const [shards, setShards] = useState(difficulty.focusShards);
  const [score, setScore] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [flashPad, setFlashPad] = useState<number | null>(null);
  const [showGap, setShowGap] = useState(false);
  const completedRef = useRef(false);
  const runNonce = useRef(0);

  const padCount = difficulty.padCount;

  const buildSequence = useCallback(
    (forRound: number) => {
      const rng = createSeededRng(
        (genomeSeed ?? 1) + forRound * 101 + runNonce.current,
      );
      const length = difficulty.startLength + (forRound - 1);
      const next: number[] = [];
      for (let i = 0; i < length; i++) {
        let pad = Math.floor(rng() * padCount);
        // Avoid triple repeats so sequences stay readable.
        if (
          next.length >= 2 &&
          pad === next[next.length - 1] &&
          pad === next[next.length - 2]
        ) {
          pad = (pad + 1 + Math.floor(rng() * (padCount - 1))) % padCount;
        }
        next.push(pad);
      }
      return next;
    },
    [difficulty.startLength, genomeSeed, padCount],
  );

  const startRound = useCallback(
    (forRound: number, reuseSequence?: number[]) => {
      setSequence(reuseSequence ?? buildSequence(forRound));
      setShowIndex(-1);
      setInputIndex(0);
      setPhase("showing");
    },
    [buildSequence],
  );

  // Play the sequence back one pad at a time.
  useEffect(() => {
    if (phase !== "showing") return;
    if (showIndex >= sequence.length) {
      const settle = setTimeout(() => {
        setPhase("input");
        setInputIndex(0);
      }, 400);
      return () => clearTimeout(settle);
    }
    const stepMs = showIndex === -1 ? 600 : difficulty.showMs;
    // Brief dark gap before advancing so repeated pads read as separate flashes.
    const gapTimer = setTimeout(
      () => setShowGap(true),
      Math.max(100, stepMs - 130),
    );
    const timer = setTimeout(() => {
      setShowGap(false);
      setShowIndex((prev) => prev + 1);
      if (showIndex >= 0) triggerHaptic("selection");
    }, stepMs);
    return () => {
      clearTimeout(gapTimer);
      clearTimeout(timer);
    };
  }, [phase, showIndex, sequence.length, difficulty.showMs]);

  const finishRun = useCallback(
    (finalScore: number, finalRounds: number) => {
      setPhase("gameover");
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete({ score: finalScore, roundsCompleted: finalRounds });
      }
    },
    [onComplete],
  );

  const handlePadPress = (pad: number) => {
    if (phase !== "input") return;

    setFlashPad(pad);
    setTimeout(() => setFlashPad(null), 220);

    if (pad === sequence[inputIndex]) {
      triggerHaptic("light");
      const nextIndex = inputIndex + 1;
      if (nextIndex >= sequence.length) {
        const newScore = score + sequence.length;
        const newRounds = roundsCompleted + 1;
        setScore(newScore);
        setRoundsCompleted(newRounds);
        setPhase("roundWon");
        triggerHaptic("success");
      } else {
        setInputIndex(nextIndex);
      }
      return;
    }

    // Wrong pad: burn a focus shard and replay the same weave, or end the run.
    triggerHaptic("error");
    if (shards > 0) {
      setShards(shards - 1);
      startRound(round, sequence);
    } else {
      finishRun(score, roundsCompleted);
    }
  };

  const handleNextRound = () => {
    const nextRound = round + 1;
    setRound(nextRound);
    startRound(nextRound);
  };

  const padPositions = Array.from({ length: padCount }, (_, i) => {
    const angle = (i / padCount) * Math.PI * 2 - Math.PI / 2;
    return {
      left: `${50 + 38 * Math.cos(angle)}%`,
      top: `${50 + 38 * Math.sin(angle)}%`,
    };
  });

  const activePad =
    phase === "showing" &&
    !showGap &&
    showIndex >= 0 &&
    showIndex < sequence.length
      ? sequence[showIndex]
      : null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <BrainCircuit className="h-5 w-5 text-emerald-300" />
          Memory Shuffle
        </h3>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            Round <span className="font-semibold text-emerald-300">{round}</span>
          </span>
          <span>
            Score <span className="font-semibold text-emerald-300">{score}</span>
          </span>
          <span className="flex items-center gap-1">
            {Array.from({ length: difficulty.focusShards }).map((_, i) => (
              <Heart
                key={i}
                className={`h-3.5 w-3.5 ${i < shards ? "text-rose-400" : "text-zinc-700"}`}
                fill={i < shards ? "currentColor" : "none"}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="relative mx-auto my-4 aspect-square w-full max-w-sm flex-1">
        {padPositions.map((pos, i) => {
          const isLit = activePad === i || flashPad === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePadPress(i)}
              disabled={phase !== "input"}
              aria-label={`Sigil pad ${i + 1}`}
              className="absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-2xl transition-all duration-150 touch-manipulation sm:h-20 sm:w-20"
              style={{
                left: pos.left,
                top: pos.top,
                borderColor: PAD_COLORS[i],
                color: PAD_COLORS[i],
                backgroundColor: isLit ? PAD_COLORS[i] : "rgba(15,23,42,0.9)",
                boxShadow: isLit ? `0 0 24px ${PAD_COLORS[i]}` : "none",
                transform: `translate(-50%, -50%) scale(${isLit ? 1.15 : 1})`,
              }}
            >
              <span className={isLit ? "text-slate-950" : ""}>
                {PAD_GLYPHS[i]}
              </span>
            </button>
          );
        })}

        <div className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 text-center text-sm text-zinc-400">
          {phase === "intro" && (
            <Button
              onClick={() => {
                // Fresh nonce per run so replays get new weaves.
                runNonce.current = Math.floor(Math.random() * 0xffff);
                startRound(1);
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Begin Weave
            </Button>
          )}
          {phase === "showing" && <p>Watch the weave…</p>}
          {phase === "input" && (
            <p>
              Your turn — {inputIndex}/{sequence.length}
            </p>
          )}
          {phase === "roundWon" && (
            <div className="space-y-2">
              <p className="font-semibold text-emerald-300">Round woven!</p>
              <Button size="sm" onClick={handleNextRound}>
                Next Round
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => finishRun(score, roundsCompleted)}
              >
                Bank &amp; Finish
              </Button>
            </div>
          )}
          {phase === "gameover" && (
            <div className="space-y-2">
              <p className="font-semibold text-cyan-300">
                {roundsCompleted > 0
                  ? `${petName} memorized ${score} steps with you.`
                  : "The weave slipped away this time."}
              </p>
              {onExit && (
                <Button size="sm" variant="outline" onClick={onExit}>
                  Close
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500">
        Repeat the flashing sigils in order. A miss costs a focus shard; the
        weave grows one sigil longer each round.
      </p>
    </div>
  );
}
