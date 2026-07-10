"use client";

import { motion } from "framer-motion";
import { Music4 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { triggerHaptic } from "@/lib/haptics";
import {
  computeGameReward,
  type EvolutionSnapshot,
  type RhythmDifficulty,
} from "@/lib/minigames/gameMath";
import { getGrade, RANK_INFO, type GameRank } from "@/lib/minigames/ranks";
import {
  playGood,
  playMetronome,
  playMiss,
  playPerfect,
} from "@/lib/minigames/sfx";

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

export interface RhythmPulseResult {
  /** 2 points per perfect beat, 1 per good beat (rank-multiplied). */
  score: number;
  /** Mean timing quality across all beats, 0-100. */
  accuracy: number;
  /** Longest chain of scored beats. */
  combo: number;
}

interface RhythmPulseProps {
  petName?: string;
  difficulty: RhythmDifficulty;
  rank: GameRank;
  evolution: EvolutionSnapshot;
  bests: { score: number; accuracy: number; combo: number };
  onComplete: (result: RhythmPulseResult) => void;
  onExit?: () => void;
}

type Phase = "intro" | "playing" | "done";
type Judgement = "perfect" | "good" | "miss";

const LEAD_IN_BEATS = 4;

export function RhythmPulse({
  petName = "your companion",
  difficulty,
  rank,
  evolution,
  bests,
  onComplete,
  onExit,
}: RhythmPulseProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [beatNumber, setBeatNumber] = useState(0);
  const [pulseScale, setPulseScale] = useState(0.35);
  const [beatGlow, setBeatGlow] = useState(0);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [finalResult, setFinalResult] = useState<{
    result: RhythmPulseResult;
    newBests: string[];
  } | null>(null);

  const periodMs = 60000 / difficulty.bpm;
  const totalBeats = difficulty.beats;
  const rankInfo = RANK_INFO[rank];

  const startTimeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const judgedBeatsRef = useRef<Map<number, Judgement>>(new Map());
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const rawScoreRef = useRef(0);
  const lastTickedBeatRef = useRef(-1);
  const completedRef = useRef(false);

  const { particles, burst } = useParticles();
  const { floatingItems, pop } = useFloatingText();
  const { shake, ShakeWrap } = useScreenShake();

  const finishRun = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const judged = judgedBeatsRef.current;
    let qualitySum = 0;
    for (let beat = 0; beat < totalBeats; beat++) {
      const judgement = judged.get(beat);
      if (judgement === "perfect") qualitySum += 1;
      else if (judgement === "good") qualitySum += 0.6;
    }
    const result: RhythmPulseResult = {
      score: Math.round(rawScoreRef.current * rankInfo.scoreMult),
      accuracy: Math.round((qualitySum / totalBeats) * 100),
      combo: bestComboRef.current,
    };

    const newBests: string[] = [];
    if (result.score > bests.score && result.score > 0) newBests.push("New best score");
    if (result.accuracy > bests.accuracy && result.accuracy > 0)
      newBests.push("New best sync");
    if (result.combo > bests.combo && result.combo > 0) newBests.push("New best combo");

    setFinalResult({ result, newBests });
    setPhase("done");
    onComplete(result);
  }, [bests, onComplete, rankInfo.scoreMult, totalBeats]);

  // Animation + metronome loop. Beat 0 lands after the lead-in.
  useEffect(() => {
    if (phase !== "playing") return;

    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const beatFloat = elapsed / periodMs - LEAD_IN_BEATS;
      const currentBeat = Math.floor(beatFloat);

      // Ring swells toward the target as each beat approaches.
      const phaseInBeat = ((beatFloat % 1) + 1) % 1;
      setPulseScale(0.35 + 0.65 * phaseInBeat);
      setBeatGlow(phaseInBeat > 0.82 ? (phaseInBeat - 0.82) / 0.18 : 0);
      setBeatNumber(Math.max(0, Math.min(totalBeats, currentBeat + 1)));

      const tickBeat = Math.floor(elapsed / periodMs);
      if (tickBeat !== lastTickedBeatRef.current) {
        lastTickedBeatRef.current = tickBeat;
        playMetronome(tickBeat >= LEAD_IN_BEATS);
      }

      if (currentBeat >= totalBeats) {
        finishRun();
        return;
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [phase, periodMs, totalBeats, finishRun]);

  const startRun = () => {
    judgedBeatsRef.current = new Map();
    comboRef.current = 0;
    bestComboRef.current = 0;
    rawScoreRef.current = 0;
    lastTickedBeatRef.current = -1;
    completedRef.current = false;
    setScore(0);
    setCombo(0);
    setFinalResult(null);
    startTimeRef.current = performance.now();
    setPhase("playing");
  };

  const handleTap = useCallback(() => {
    if (phase !== "playing") return;

    const elapsed = performance.now() - startTimeRef.current;
    const beatFloat = elapsed / periodMs - LEAD_IN_BEATS;
    const nearestBeat = Math.round(beatFloat);
    if (nearestBeat < 0 || nearestBeat >= totalBeats) return;
    if (judgedBeatsRef.current.has(nearestBeat)) return;

    const offset = Math.abs(beatFloat - nearestBeat);
    let judgement: Judgement;
    if (offset <= difficulty.perfectWindow) judgement = "perfect";
    else if (offset <= difficulty.goodWindow) judgement = "good";
    else judgement = "miss";

    judgedBeatsRef.current.set(nearestBeat, judgement);

    if (judgement === "miss") {
      comboRef.current = 0;
      setCombo(0);
      playMiss();
      pop("Off-beat", { color: "#fb7185", y: 46, scale: 0.85 });
      triggerHaptic("warning");
      shake();
    } else {
      comboRef.current += 1;
      bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
      rawScoreRef.current += judgement === "perfect" ? 2 : 1;
      setCombo(comboRef.current);
      setScore(Math.round(rawScoreRef.current * rankInfo.scoreMult));

      if (judgement === "perfect") {
        playPerfect();
        pop("PERFECT", { color: "#34d399", y: 40, scale: 1.25 });
        burst({
          x: 50,
          y: 50,
          colors: ["#f472b6", "#22d3ee", "#ffffff"],
          count: 18,
          radius: 100,
          starChance: 0.4,
        });
        triggerHaptic("success");
      } else {
        playGood();
        pop("Good", { color: "#22d3ee", y: 44 });
        burst({
          x: 50,
          y: 50,
          colors: ["#22d3ee"],
          count: 8,
          radius: 60,
        });
        triggerHaptic("light");
      }
    }
  }, [
    phase,
    periodMs,
    totalBeats,
    difficulty.perfectWindow,
    difficulty.goodWindow,
    rankInfo.scoreMult,
    burst,
    pop,
    shake,
  ]);

  // Space bar taps too.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleTap]);

  if (phase === "done" && finalResult) {
    const reward = computeGameReward(
      {
        game: "rhythm",
        score: finalResult.result.score,
        accuracy: finalResult.result.accuracy,
        combo: finalResult.result.combo,
        rank,
      },
      evolution,
    );
    return (
      <div className="h-full rounded-2xl border border-slate-700 bg-slate-950/95 text-white">
        <GameResultScreen
          gameLabel="Rhythm Pulse"
          accent="#f472b6"
          grade={getGrade({
            game: "rhythm",
            score: finalResult.result.score,
            accuracy: finalResult.result.accuracy,
          })}
          score={finalResult.result.score}
          rank={rank}
          stats={[
            { label: "Timing sync", value: `${finalResult.result.accuracy}%` },
            { label: "Best combo", value: `${finalResult.result.combo}x` },
            { label: "Tempo", value: `${difficulty.bpm} BPM` },
            { label: "Beats", value: `${totalBeats}` },
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
        {/* Beat-synced ambient wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 42%, rgba(244, 114, 182, ${0.04 + beatGlow * 0.14 + Math.min(0.1, combo * 0.01)}), transparent 65%)`,
          }}
        />

        <div className="relative flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Music4 className="h-5 w-5 text-pink-300" />
            Rhythm Pulse
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ borderColor: rankInfo.color, color: rankInfo.color }}
            >
              {rankInfo.label}
            </span>
          </h3>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>
              Beat{" "}
              <span className="font-semibold text-pink-300">
                {beatNumber}/{totalBeats}
              </span>
            </span>
            <span>
              Score <span className="font-semibold text-pink-300">{score}</span>
            </span>
            <ComboFlame combo={combo} />
          </div>
        </div>

        {/* Beat progress track */}
        {phase === "playing" && (
          <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-400 transition-all duration-200"
              style={{ width: `${(beatNumber / totalBeats) * 100}%` }}
            />
          </div>
        )}

        <div className="relative mx-auto my-4 flex aspect-square w-full max-w-xs flex-1 items-center justify-center">
          {/* Target ring — flares as the beat lands */}
          <div
            className="absolute h-full w-full rounded-full border-4 transition-shadow duration-75"
            style={{
              borderColor: `rgba(244, 114, 182, ${0.55 + beatGlow * 0.45})`,
              boxShadow: `0 0 ${8 + beatGlow * 36}px rgba(244, 114, 182, ${0.2 + beatGlow * 0.6})`,
            }}
          />
          {/* Expanding pulse */}
          {phase === "playing" && (
            <div
              className="absolute rounded-full border-4 border-cyan-300"
              style={{
                height: `${pulseScale * 100}%`,
                width: `${pulseScale * 100}%`,
                opacity: 0.4 + pulseScale * 0.6,
                boxShadow: `0 0 ${pulseScale * 22}px rgba(34, 211, 238, ${pulseScale * 0.5})`,
              }}
            />
          )}

          <div className="z-10 text-center">
            {phase === "intro" && (
              <div className="space-y-2">
                <p className="max-w-[14rem] text-sm text-zinc-400">
                  Tap when the cyan pulse meets the pink ring.{" "}
                  {difficulty.bpm} BPM, {totalBeats} beats.
                </p>
                <Button onClick={startRun}>Start the Pulse</Button>
              </div>
            )}
          </div>

          <ParticleLayer particles={particles} />
          <FloatingTextLayer items={floatingItems} />
        </div>

        {phase === "playing" && (
          <motion.button
            type="button"
            onPointerDown={handleTap}
            whileTap={{ scale: 0.93 }}
            className="mx-auto w-full max-w-xs touch-manipulation select-none rounded-2xl border border-pink-500/60 bg-pink-600/30 py-5 text-lg font-bold text-pink-100"
            style={{
              boxShadow: `0 0 ${beatGlow * 26}px rgba(244, 114, 182, ${beatGlow * 0.5})`,
            }}
          >
            TAP
          </motion.button>
        )}

        <p className="relative mt-3 text-center text-xs text-zinc-500">
          {petName} rides the beat with you — perfect timing scores double and
          feeds the combo flame. Space bar works too.
        </p>
      </div>
    </ShakeWrap>
  );
}
