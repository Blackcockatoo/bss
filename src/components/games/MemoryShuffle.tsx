"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Heart, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { triggerHaptic } from "@/lib/haptics";
import {
  computeGameReward,
  createSeededRng,
  type EvolutionSnapshot,
  type MemoryDifficulty,
} from "@/lib/minigames/gameMath";
import { getGrade, RANK_INFO, type GameRank } from "@/lib/minigames/ranks";
import { playMiss, playPadTone, playRoundWin } from "@/lib/minigames/sfx";

import { Button } from "../ui/button";
import { GameResultScreen } from "./GameResultScreen";
import {
  FloatingTextLayer,
  ParticleLayer,
  useFloatingText,
  useParticles,
  useScreenShake,
} from "./juice";

export interface MemoryShuffleResult {
  /** Total sequence steps recalled across completed rounds (rank-multiplied). */
  score: number;
  roundsCompleted: number;
}

interface MemoryShuffleProps {
  petName?: string;
  genomeSeed?: number;
  difficulty: MemoryDifficulty;
  rank: GameRank;
  evolution: EvolutionSnapshot;
  bests: { score: number; round: number };
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
  rank,
  evolution,
  bests,
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
  const [finalResult, setFinalResult] = useState<{
    result: MemoryShuffleResult;
    newBests: string[];
  } | null>(null);
  const runNonce = useRef(0);

  const { particles, burst } = useParticles();
  const { floatingItems, pop } = useFloatingText();
  const { shake, ShakeWrap } = useScreenShake();

  const padCount = difficulty.padCount;
  const rankInfo = RANK_INFO[rank];

  const padPosition = useCallback(
    (index: number) => {
      const angle = (index / padCount) * Math.PI * 2 - Math.PI / 2;
      return {
        xPct: 50 + 38 * Math.cos(angle),
        yPct: 50 + 38 * Math.sin(angle),
      };
    },
    [padCount],
  );

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

  const startRun = useCallback(() => {
    runNonce.current = Math.floor(Math.random() * 0xffff);
    setRound(1);
    setScore(0);
    setRoundsCompleted(0);
    setShards(difficulty.focusShards);
    setFinalResult(null);
    startRound(1);
  }, [difficulty.focusShards, startRound]);

  // Play the sequence back one pad at a time, with tone per pad.
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
      const nextPad = sequence[showIndex + 1];
      if (nextPad !== undefined) {
        playPadTone(nextPad, difficulty.showMs / 1000);
      }
      if (showIndex >= 0) triggerHaptic("selection");
    }, stepMs);
    return () => {
      clearTimeout(gapTimer);
      clearTimeout(timer);
    };
  }, [phase, showIndex, sequence, difficulty.showMs]);

  const finishRun = useCallback(
    (finalScore: number, finalRounds: number) => {
      // Capture bests before onComplete updates the store.
      const newBests: string[] = [];
      if (finalScore > bests.score && finalScore > 0) newBests.push("New best score");
      if (finalRounds > bests.round && finalRounds > 0) newBests.push("New best round");

      const result: MemoryShuffleResult = {
        score: finalScore,
        roundsCompleted: finalRounds,
      };
      setFinalResult({ result, newBests });
      setPhase("gameover");
      onComplete(result);
    },
    [bests.round, bests.score, onComplete],
  );

  const handlePadPress = (pad: number) => {
    if (phase !== "input") return;

    setFlashPad(pad);
    setTimeout(() => setFlashPad(null), 220);

    const pos = padPosition(pad);

    if (pad === sequence[inputIndex]) {
      playPadTone(pad);
      triggerHaptic("light");
      burst({
        x: pos.xPct,
        y: pos.yPct,
        colors: [PAD_COLORS[pad], "#ffffff"],
        count: 8,
        radius: 44,
      });

      const nextIndex = inputIndex + 1;
      if (nextIndex >= sequence.length) {
        const roundScore = Math.round(sequence.length * rankInfo.scoreMult);
        const newScore = score + roundScore;
        const newRounds = roundsCompleted + 1;
        setScore(newScore);
        setRoundsCompleted(newRounds);
        setPhase("roundWon");
        playRoundWin();
        triggerHaptic("success");
        pop(`+${roundScore}`, { x: 50, y: 38, color: "#34d399", scale: 1.3 });
        burst({
          x: 50,
          y: 50,
          colors: PAD_COLORS,
          count: 26,
          radius: 120,
          starChance: 0.45,
        });
      } else {
        setInputIndex(nextIndex);
      }
      return;
    }

    // Wrong pad: burn a focus shard and replay the same weave, or end the run.
    playMiss();
    triggerHaptic("error");
    shake();
    burst({ x: pos.xPct, y: pos.yPct, colors: ["#f87171"], count: 10, radius: 50 });
    if (shards > 0) {
      setShards(shards - 1);
      pop("Focus shard spent", { x: 50, y: 55, color: "#fb7185", scale: 0.85 });
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

  const activePad =
    phase === "showing" &&
    !showGap &&
    showIndex >= 0 &&
    showIndex < sequence.length
      ? sequence[showIndex]
      : null;

  const progress = sequence.length > 0 ? inputIndex / sequence.length : 0;

  if (phase === "gameover" && finalResult) {
    const reward = computeGameReward(
      {
        game: "memory",
        score: finalResult.result.score,
        roundsCompleted: finalResult.result.roundsCompleted,
        rank,
      },
      evolution,
    );
    return (
      <div className="h-full rounded-2xl border border-slate-700 bg-slate-950/95 text-white">
        <GameResultScreen
          gameLabel="Memory Shuffle"
          accent="#34d399"
          grade={getGrade({
            game: "memory",
            score: finalResult.result.score,
            roundsCompleted: finalResult.result.roundsCompleted,
          })}
          score={finalResult.result.score}
          rank={rank}
          stats={[
            { label: "Rounds woven", value: `${finalResult.result.roundsCompleted}` },
            { label: "Longest weave", value: `${difficulty.startLength + Math.max(0, finalResult.result.roundsCompleted - 1)} sigils` },
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
        {/* Ambient aura that deepens as rounds build */}
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at 50% 45%, rgba(52, 211, 153, ${Math.min(0.22, 0.05 + roundsCompleted * 0.02)}), transparent 60%)`,
          }}
        />

        <div className="relative flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <BrainCircuit className="h-5 w-5 text-emerald-300" />
            Memory Shuffle
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ borderColor: rankInfo.color, color: rankInfo.color }}
            >
              {rankInfo.label}
            </span>
          </h3>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>
              Round{" "}
              <span className="font-semibold text-emerald-300">{round}</span>
            </span>
            <span>
              Score{" "}
              <span className="font-semibold text-emerald-300">{score}</span>
            </span>
            <span className="flex items-center gap-1">
              {Array.from({ length: difficulty.focusShards }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-3.5 w-3.5 transition-colors ${i < shards ? "text-rose-400" : "text-zinc-700"}`}
                  fill={i < shards ? "currentColor" : "none"}
                />
              ))}
            </span>
          </div>
        </div>

        <div className="relative mx-auto my-4 aspect-square w-full max-w-sm flex-1">
          {/* Progress ring */}
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(51,65,85,0.6)"
              strokeWidth="5"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 276.5} 276.5`}
              className="transition-all duration-200"
              style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.8))" }}
            />
          </svg>

          {Array.from({ length: padCount }).map((_, i) => {
            const pos = padPosition(i);
            const isLit = activePad === i || flashPad === i;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => handlePadPress(i)}
                disabled={phase !== "input"}
                aria-label={`Sigil pad ${i + 1}`}
                animate={{ scale: isLit ? 1.18 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                whileTap={phase === "input" ? { scale: 0.9 } : undefined}
                className="absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-2xl transition-colors duration-150 touch-manipulation sm:h-20 sm:w-20"
                style={{
                  left: `${pos.xPct}%`,
                  top: `${pos.yPct}%`,
                  borderColor: PAD_COLORS[i],
                  color: PAD_COLORS[i],
                  backgroundColor: isLit ? PAD_COLORS[i] : "rgba(15,23,42,0.9)",
                  boxShadow: isLit
                    ? `0 0 28px ${PAD_COLORS[i]}, 0 0 60px ${PAD_COLORS[i]}66`
                    : `0 0 0px transparent`,
                }}
              >
                <span className={isLit ? "text-slate-950" : ""}>
                  {PAD_GLYPHS[i]}
                </span>
              </motion.button>
            );
          })}

          <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 text-center text-sm text-zinc-400">
            {phase === "intro" && (
              <Button onClick={startRun} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Begin Weave
              </Button>
            )}
            {phase === "showing" && (
              <p className="animate-pulse">Watch the weave…</p>
            )}
            {phase === "input" && (
              <p className="font-mono text-emerald-300/90">
                {inputIndex}/{sequence.length}
              </p>
            )}
            {phase === "roundWon" && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className="space-y-2"
              >
                <p className="font-bold text-emerald-300">Round woven!</p>
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
              </motion.div>
            )}
          </div>

          <ParticleLayer particles={particles} />
          <FloatingTextLayer items={floatingItems} />
        </div>

        <p className="relative text-center text-xs text-zinc-500">
          {petName} hums each sigil&apos;s tone — listen as much as you look. A
          miss costs a focus shard; the weave grows every round.
        </p>
      </div>
    </ShakeWrap>
  );
}
