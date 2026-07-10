"use client";

import { motion } from "framer-motion";
import { RotateCcw, Sparkles, X, Zap } from "lucide-react";
import { useEffect } from "react";

import type { GameReward } from "@/lib/minigames/gameMath";
import {
  GRADE_COLORS,
  GRADE_LINES,
  RANK_INFO,
  type GameRank,
  type Grade,
} from "@/lib/minigames/ranks";
import { playFanfare } from "@/lib/minigames/sfx";

import { Button } from "../ui/button";
import { AnimatedNumber } from "./juice";

export interface ResultStat {
  label: string;
  value: string;
}

interface GameResultScreenProps {
  gameLabel: string;
  accent: string;
  grade: Grade;
  score: number;
  rank?: GameRank;
  stats: ResultStat[];
  /** e.g. ["New best score!", "New best combo!"] */
  newBests: string[];
  reward: GameReward;
  onReplay: () => void;
  onExit?: () => void;
}

/**
 * Shared cinematic end-of-run screen: springy grade stamp, score count-up,
 * XP/essence reveal, and new-best ribbons. Every arcade game ends here so
 * runs always feel rewarded the same way.
 */
export function GameResultScreen({
  gameLabel,
  accent,
  grade,
  score,
  rank,
  stats,
  newBests,
  reward,
  onReplay,
  onExit,
}: GameResultScreenProps) {
  useEffect(() => {
    playFanfare(grade);
  }, [grade]);

  const gradeColor = GRADE_COLORS[grade];
  const rankInfo = rank ? RANK_INFO[rank] : null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
      <p
        className="text-xs uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        {gameLabel} — run complete
      </p>

      {/* Grade stamp */}
      <motion.div
        initial={{ scale: 3, rotate: -18, opacity: 0 }}
        animate={{ scale: 1, rotate: -6, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 text-6xl font-black"
        style={{
          borderColor: gradeColor,
          color: gradeColor,
          boxShadow: `0 0 40px ${gradeColor}55, inset 0 0 24px ${gradeColor}22`,
          textShadow: `0 0 18px ${gradeColor}aa`,
        }}
      >
        {grade}
      </motion.div>

      <p className="max-w-xs text-sm text-zinc-400">{GRADE_LINES[grade]}</p>

      {/* Score count-up */}
      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={score}
          className="text-5xl font-black tabular-nums"
          style={{ color: accent, textShadow: `0 0 24px ${accent}66` }}
        />
        {rankInfo && rankInfo.scoreMult > 1 && (
          <span
            className="rounded-full border px-2 py-0.5 text-xs font-bold"
            style={{ borderColor: rankInfo.color, color: rankInfo.color }}
          >
            {rankInfo.label} ×{rankInfo.scoreMult}
          </span>
        )}
      </div>

      {/* New bests */}
      {newBests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {newBests.map((label) => (
            <span
              key={label}
              className="animate-pulse rounded-full border border-amber-400/70 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300"
            >
              ★ {label}
            </span>
          ))}
        </motion.div>
      )}

      {/* Reward reveal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-3"
      >
        <span className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-900/30 px-3 py-1.5 text-sm font-semibold text-cyan-200">
          <Zap className="h-4 w-4" />+{reward.xp} XP
        </span>
        {reward.essence > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-900/30 px-3 py-1.5 text-sm font-semibold text-violet-200">
            <Sparkles className="h-4 w-4" />+{reward.essence} Essence
          </span>
        )}
      </motion.div>

      {/* Stat lines */}
      {stats.length > 0 && (
        <div className="grid w-full max-w-sm grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <p className="text-sm font-bold text-zinc-200">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-3">
        <Button onClick={onReplay} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Play Again
        </Button>
        {onExit && (
          <Button variant="outline" onClick={onExit} className="gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
