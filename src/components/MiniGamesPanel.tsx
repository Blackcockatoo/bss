"use client";

import {
  BrainCircuit,
  Calculator,
  Gamepad2,
  Music4,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  getGameDifficulty,
  TIER_LABELS,
} from "@/lib/minigames/gameMath";
import { useStore } from "@/lib/store";

import { MemoryShuffle, type MemoryShuffleResult } from "./games/MemoryShuffle";
import { RhythmPulse, type RhythmPulseResult } from "./games/RhythmPulse";
import { SigilSequence, type SigilSequenceResult } from "./games/SigilSequence";
import { VimanaTetris } from "./VimanaTetris";
import { Button } from "./ui/button";

interface MiniGamesPanelProps {
  petName?: string;
}

type ActiveGame = "memory" | "rhythm" | "sigil" | "vimana" | null;

export function MiniGamesPanel({ petName }: MiniGamesPanelProps) {
  const miniGames = useStore((state) => state.miniGames);
  const evolution = useStore((state) => state.evolution);
  const recordMiniGameResult = useStore((state) => state.recordMiniGameResult);
  const genome = useStore((state) => state.genome);

  const [activeGame, setActiveGame] = useState<ActiveGame>(null);

  const genomeSeed = useMemo(() => {
    if (!genome) return undefined;
    const slices = [
      ...genome.red60.slice(0, 12),
      ...genome.blue60.slice(0, 12),
      ...genome.black60.slice(0, 12),
    ];
    return slices.reduce(
      (total, value, index) => total + value * (index + 5),
      0,
    );
  }, [genome]);

  const difficulty = useMemo(
    () => getGameDifficulty(evolution),
    [evolution],
  );

  const closeGame = () => setActiveGame(null);

  const handleMemoryComplete = (result: MemoryShuffleResult) => {
    recordMiniGameResult({
      game: "memory",
      score: result.score,
      roundsCompleted: result.roundsCompleted,
    });
  };

  const handleRhythmComplete = (result: RhythmPulseResult) => {
    recordMiniGameResult({
      game: "rhythm",
      score: result.score,
      accuracy: result.accuracy,
      combo: result.combo,
    });
  };

  const handleSigilComplete = (result: SigilSequenceResult) => {
    recordMiniGameResult({
      game: "sigil",
      score: result.score,
      correctAnswers: result.correctAnswers,
      combo: result.combo,
      accuracy: result.accuracy,
    });
  };

  const handleVimanaGameOver = (
    score: number,
    lines: number,
    level: number,
  ) => {
    recordMiniGameResult({ game: "vimana", score, lines, level });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Gamepad2 className="h-5 w-5 text-emerald-300" />
          Conscious Arcade
        </h2>
        <div className="flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-900/30 px-3 py-1 text-xs text-violet-200">
          <TrendingUp className="h-3.5 w-3.5" />
          {evolution.state} · Lv {evolution.level} —{" "}
          {TIER_LABELS[difficulty.tier]} (Tier {difficulty.tier})
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Every game scales with your pet&apos;s evolution and feeds XP, vitals,
        and essence back into its growth. Evolve to unlock harder patterns and
        richer rewards.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Memory Shuffle */}
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <BrainCircuit className="h-4 w-4 text-emerald-300" />
            Memory Shuffle
          </div>
          <p className="text-xs text-zinc-400">
            Recall growing sigil weaves. {difficulty.memory.padCount} pads,
            starting at {difficulty.memory.startLength} sigils.
          </p>
          <Button onClick={() => setActiveGame("memory")} className="gap-2">
            <BrainCircuit className="h-4 w-4" />
            Start Weaving
          </Button>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div>
              Best Score
              <div className="font-semibold text-emerald-300">
                {miniGames.memoryHighScore}
              </div>
            </div>
            <div>
              Best Round
              <div className="font-semibold text-emerald-300">
                {miniGames.shuffleBestRound}
              </div>
            </div>
          </div>
        </div>

        {/* Rhythm Pulse */}
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Music4 className="h-4 w-4 text-pink-300" />
            Rhythm Pulse
          </div>
          <p className="text-xs text-zinc-400">
            Tap in time with the pulse. {difficulty.rhythm.bpm} BPM,{" "}
            {difficulty.rhythm.beats} beats.
          </p>
          <Button onClick={() => setActiveGame("rhythm")} className="gap-2">
            <Music4 className="h-4 w-4" />
            Feel the Beat
          </Button>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div>
              Best Score
              <div className="font-semibold text-pink-300">
                {miniGames.rhythmHighScore}
              </div>
            </div>
            <div>
              Best Sync
              <div className="font-semibold text-pink-300">
                {miniGames.pulseBestAccuracy}% · {miniGames.pulseBestCombo}x
              </div>
            </div>
          </div>
        </div>

        {/* Sigil Sequence */}
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Calculator className="h-4 w-4 text-violet-300" />
            Sigil Sequence
          </div>
          <p className="text-xs text-zinc-400">
            Name the next number in the flow — Fibonacci, primes, and stranger
            maths await deeper stages.
          </p>
          <Button onClick={() => setActiveGame("sigil")} className="gap-2">
            <Calculator className="h-4 w-4" />
            Read the Numbers
          </Button>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div>
              Best Score
              <div className="font-semibold text-violet-300">
                {miniGames.sigilHighScore}
              </div>
            </div>
            <div>
              Patterns Named
              <div className="font-semibold text-violet-300">
                {miniGames.sigilTotalCorrect}
              </div>
            </div>
          </div>
        </div>

        {/* Vimana Tetris Field */}
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Rocket className="h-4 w-4 text-cyan-300" />
            Vimana Tetris Field
          </div>
          <p className="text-xs text-zinc-400">
            Clear lines to stabilize the craft. Evolution stage sets the
            launch speed — currently level {difficulty.vimana.startLevel}.
          </p>
          <Button onClick={() => setActiveGame("vimana")} className="gap-2">
            <Rocket className="h-4 w-4" />
            Launch Simulation
          </Button>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div>
              High Score
              <div className="font-semibold text-cyan-300">
                {miniGames.vimanaHighScore}
              </div>
            </div>
            <div>
              Max Lines · Level
              <div className="font-semibold text-cyan-300">
                {miniGames.vimanaMaxLines} · {miniGames.vimanaMaxLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-[11px] text-zinc-500">
        <span>
          Focus streak:{" "}
          <span className="font-semibold text-amber-300">
            {miniGames.focusStreak}
          </span>
        </span>
        <span>
          Sessions played:{" "}
          <span className="font-semibold text-zinc-300">
            {miniGames.totalPlays}
          </span>
        </span>
      </div>

      {activeGame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-2 sm:items-center sm:justify-center sm:p-4">
          <div className="flex shrink-0 justify-end py-2 sm:w-full sm:max-w-3xl">
            <Button
              size="sm"
              variant="outline"
              onClick={closeGame}
              className="touch-manipulation"
            >
              Close
            </Button>
          </div>
          <div className="min-h-0 w-full flex-1 sm:max-w-3xl">
            {activeGame === "memory" && (
              <MemoryShuffle
                petName={petName}
                genomeSeed={genomeSeed}
                difficulty={difficulty.memory}
                onComplete={handleMemoryComplete}
                onExit={closeGame}
              />
            )}
            {activeGame === "rhythm" && (
              <RhythmPulse
                petName={petName}
                difficulty={difficulty.rhythm}
                onComplete={handleRhythmComplete}
                onExit={closeGame}
              />
            )}
            {activeGame === "sigil" && (
              <SigilSequence
                petName={petName}
                genomeSeed={genomeSeed}
                difficulty={difficulty.sigil}
                tier={difficulty.tier}
                onComplete={handleSigilComplete}
                onExit={closeGame}
              />
            )}
            {activeGame === "vimana" && (
              <VimanaTetris
                petName={petName}
                genomeSeed={genomeSeed}
                startLevel={difficulty.vimana.startLevel}
                onExit={closeGame}
                onGameOver={handleVimanaGameOver}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
