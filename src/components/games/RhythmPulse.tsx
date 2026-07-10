"use client";

import { triggerHaptic } from "@/lib/haptics";
import type { RhythmDifficulty } from "@/lib/minigames/gameMath";
import { Music4, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";

export interface RhythmPulseResult {
  /** 2 points per perfect beat, 1 per good beat. */
  score: number;
  /** Mean timing quality across all beats, 0-100. */
  accuracy: number;
  /** Longest chain of scored beats. */
  combo: number;
}

interface RhythmPulseProps {
  petName?: string;
  difficulty: RhythmDifficulty;
  onComplete: (result: RhythmPulseResult) => void;
  onExit?: () => void;
}

type Phase = "intro" | "playing" | "done";
type Judgement = "perfect" | "good" | "miss";

const LEAD_IN_BEATS = 4;

export function RhythmPulse({
  petName = "your companion",
  difficulty,
  onComplete,
  onExit,
}: RhythmPulseProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [beatNumber, setBeatNumber] = useState(0);
  const [pulseScale, setPulseScale] = useState(0.35);
  const [feedback, setFeedback] = useState<{ text: string; tone: string } | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [finalResult, setFinalResult] = useState<RhythmPulseResult | null>(null);

  const periodMs = 60000 / difficulty.bpm;
  const totalBeats = difficulty.beats;

  const startTimeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const judgedBeatsRef = useRef<Map<number, Judgement>>(new Map());
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const scoreRef = useRef(0);
  const lastTickedBeatRef = useRef(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playTick = useCallback((accent: boolean) => {
    if (mutedRef.current) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 880 : 440;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }, []);

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
      score: scoreRef.current,
      accuracy: Math.round((qualitySum / totalBeats) * 100),
      combo: bestComboRef.current,
    };
    setFinalResult(result);
    setPhase("done");
    onComplete(result);
  }, [onComplete, totalBeats]);

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
      setBeatNumber(Math.max(0, Math.min(totalBeats, currentBeat + 1)));

      const tickBeat = Math.floor(elapsed / periodMs);
      if (tickBeat !== lastTickedBeatRef.current) {
        lastTickedBeatRef.current = tickBeat;
        playTick(tickBeat >= LEAD_IN_BEATS);
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
  }, [phase, periodMs, totalBeats, playTick, finishRun]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const handleStart = () => {
    if (typeof window !== "undefined" && "AudioContext" in window) {
      audioCtxRef.current = audioCtxRef.current ?? new AudioContext();
    }
    judgedBeatsRef.current = new Map();
    comboRef.current = 0;
    bestComboRef.current = 0;
    scoreRef.current = 0;
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
      setFeedback({ text: "Off-beat", tone: "text-rose-400" });
      triggerHaptic("warning");
    } else {
      comboRef.current += 1;
      bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
      scoreRef.current += judgement === "perfect" ? 2 : 1;
      setCombo(comboRef.current);
      setScore(scoreRef.current);
      setFeedback(
        judgement === "perfect"
          ? { text: "Perfect!", tone: "text-emerald-300" }
          : { text: "Good", tone: "text-cyan-300" },
      );
      triggerHaptic(judgement === "perfect" ? "success" : "light");
    }
  }, [phase, periodMs, totalBeats, difficulty.perfectWindow, difficulty.goodWindow]);

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

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Music4 className="h-5 w-5 text-pink-300" />
          Rhythm Pulse
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
          <span>
            Combo <span className="font-semibold text-amber-300">{combo}x</span>
          </span>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute metronome" : "Mute metronome"}
            className="text-zinc-400 hover:text-white"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="relative mx-auto my-4 flex aspect-square w-full max-w-xs flex-1 items-center justify-center">
        {/* Target ring */}
        <div className="absolute h-full w-full rounded-full border-4 border-pink-400/70" />
        {/* Expanding pulse */}
        {phase === "playing" && (
          <div
            className="absolute rounded-full border-4 border-cyan-300"
            style={{
              height: `${pulseScale * 100}%`,
              width: `${pulseScale * 100}%`,
              opacity: 0.4 + pulseScale * 0.6,
            }}
          />
        )}

        <div className="z-10 text-center">
          {phase === "intro" && (
            <div className="space-y-2">
              <p className="max-w-[14rem] text-sm text-zinc-400">
                Tap when the cyan pulse meets the pink ring. {difficulty.bpm}{" "}
                BPM, {totalBeats} beats.
              </p>
              <Button onClick={handleStart}>Start the Pulse</Button>
            </div>
          )}
          {phase === "playing" && feedback && (
            <p className={`text-xl font-bold ${feedback.tone}`}>
              {feedback.text}
            </p>
          )}
          {phase === "done" && finalResult && (
            <div className="space-y-2">
              <p className="text-lg font-bold text-pink-300">
                {finalResult.accuracy}% in sync
              </p>
              <p className="text-sm text-zinc-400">
                {petName} felt every beat — best combo {finalResult.combo}x.
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

      {phase === "playing" && (
        <button
          type="button"
          onPointerDown={handleTap}
          className="mx-auto w-full max-w-xs touch-manipulation select-none rounded-2xl border border-pink-500/60 bg-pink-600/30 py-5 text-lg font-bold text-pink-100 active:scale-95 active:bg-pink-500/50"
        >
          TAP
        </button>
      )}

      <p className="mt-3 text-center text-xs text-zinc-500">
        Tap the button (or press Space) on the beat. Perfect timing scores
        double and builds your combo.
      </p>
    </div>
  );
}
