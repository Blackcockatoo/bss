"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  Calculator,
  Gamepad2,
  Lock,
  Music4,
  Rocket,
  TrendingUp,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getGameDifficulty,
  TIER_LABELS,
  type MiniGameSessionResult,
} from "@/lib/minigames/gameMath";
import {
  applyRankToDifficulty,
  getRankUnlockHint,
  getUnlockedRanks,
  highestUnlockedRank,
  isRankUnlocked,
  RANK_INFO,
  RANK_ORDER,
  type GameRank,
  type RankedGame,
} from "@/lib/minigames/ranks";
import { isSfxEnabled, playUnlock, setSfxEnabled } from "@/lib/minigames/sfx";
import {
  getMasteryStars,
  getTotalMasteryStars,
  MASTERY_TRACKS,
  type MasteryGame,
} from "@/lib/progression/types";
import { useStore } from "@/lib/store";

import { MemoryShuffle, type MemoryShuffleResult } from "./games/MemoryShuffle";
import { MasteryStars } from "./games/juice";
import { RhythmPulse, type RhythmPulseResult } from "./games/RhythmPulse";
import { SigilSequence, type SigilSequenceResult } from "./games/SigilSequence";
import { VimanaTetris } from "./VimanaTetris";
import { Button } from "./ui/button";

interface MiniGamesPanelProps {
  petName?: string;
}

type ActiveGame = RankedGame | null;

interface UnlockToast {
  id: number;
  kind: "achievement" | "rank";
  title: string;
  subtitle: string;
}

let toastId = 0;

const GAME_META: Record<
  RankedGame,
  { label: string; accent: string; gradient: string; icon: ReactNode }
> = {
  memory: {
    label: "Memory Shuffle",
    accent: "#34d399",
    gradient: "from-emerald-500/60 via-emerald-500/10 to-transparent",
    icon: <BrainCircuit className="h-5 w-5" />,
  },
  rhythm: {
    label: "Rhythm Pulse",
    accent: "#f472b6",
    gradient: "from-pink-500/60 via-pink-500/10 to-transparent",
    icon: <Music4 className="h-5 w-5" />,
  },
  sigil: {
    label: "Sigil Sequence",
    accent: "#a78bfa",
    gradient: "from-violet-500/60 via-violet-500/10 to-transparent",
    icon: <Calculator className="h-5 w-5" />,
  },
  vimana: {
    label: "Vimana Tetris Field",
    accent: "#22d3ee",
    gradient: "from-cyan-500/60 via-cyan-500/10 to-transparent",
    icon: <Rocket className="h-5 w-5" />,
  },
};

export function MiniGamesPanel({ petName }: MiniGamesPanelProps) {
  const miniGames = useStore((state) => state.miniGames);
  const evolution = useStore((state) => state.evolution);
  const recordMiniGameResult = useStore((state) => state.recordMiniGameResult);
  const genome = useStore((state) => state.genome);

  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [toasts, setToasts] = useState<UnlockToast[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [selectedRanks, setSelectedRanks] = useState<Record<RankedGame, GameRank>>(
    () => ({
      memory: highestUnlockedRank("memory", miniGames),
      rhythm: highestUnlockedRank("rhythm", miniGames),
      sigil: highestUnlockedRank("sigil", miniGames),
      vimana: highestUnlockedRank("vimana", miniGames),
    }),
  );

  useEffect(() => {
    setSoundOn(isSfxEnabled());
  }, []);

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

  const baseDifficulty = useMemo(() => getGameDifficulty(evolution), [evolution]);

  const rankedDifficulty = useCallback(
    (game: RankedGame) => applyRankToDifficulty(baseDifficulty, selectedRanks[game]),
    [baseDifficulty, selectedRanks],
  );

  const evolutionSnapshot = useMemo(
    () => ({ state: evolution.state, level: evolution.level }),
    [evolution.state, evolution.level],
  );

  const totalMastery = getTotalMasteryStars(miniGames);

  const pushToast = useCallback((toast: Omit<UnlockToast, "id">) => {
    const entry = { ...toast, id: toastId++ };
    setToasts((prev) => [...prev.slice(-2), entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((existing) => existing.id !== entry.id));
    }, 4200);
  }, []);

  /** Record a run, then surface any achievement or rank unlocks as toasts. */
  const recordWithUnlocks = useCallback(
    (game: RankedGame, result: Omit<MiniGameSessionResult, "game" | "rank">) => {
      const before = useStore.getState();
      const achievementsBefore = new Set(before.achievements.map((a) => a.id));
      const ranksBefore = new Set(getUnlockedRanks(game, before.miniGames));

      recordMiniGameResult({ ...result, game, rank: selectedRanks[game] });

      const after = useStore.getState();
      let unlockedSomething = false;

      for (const achievement of after.achievements) {
        if (!achievementsBefore.has(achievement.id)) {
          unlockedSomething = true;
          pushToast({
            kind: "achievement",
            title: achievement.title,
            subtitle: "Achievement unlocked",
          });
        }
      }
      for (const rank of getUnlockedRanks(game, after.miniGames)) {
        if (!ranksBefore.has(rank)) {
          unlockedSomething = true;
          pushToast({
            kind: "rank",
            title: `${RANK_INFO[rank].label} rank unlocked`,
            subtitle: `${GAME_META[game].label} — ${RANK_INFO[rank].tagline}`,
          });
        }
      }
      if (unlockedSomething) playUnlock();
    },
    [pushToast, recordMiniGameResult, selectedRanks],
  );

  const handleMemoryComplete = (result: MemoryShuffleResult) => {
    recordWithUnlocks("memory", {
      score: result.score,
      roundsCompleted: result.roundsCompleted,
    });
  };

  const handleRhythmComplete = (result: RhythmPulseResult) => {
    recordWithUnlocks("rhythm", {
      score: result.score,
      accuracy: result.accuracy,
      combo: result.combo,
    });
  };

  const handleSigilComplete = (result: SigilSequenceResult) => {
    recordWithUnlocks("sigil", {
      score: result.score,
      correctAnswers: result.correctAnswers,
      combo: result.combo,
      accuracy: result.accuracy,
    });
  };

  const handleVimanaGameOver = (score: number, lines: number, level: number) => {
    recordWithUnlocks("vimana", { score, lines, level });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSfxEnabled(next);
  };

  const closeGame = () => setActiveGame(null);

  const cardStats: Record<RankedGame, Array<{ label: string; value: string }>> = {
    memory: [
      { label: "Best Score", value: `${miniGames.memoryHighScore}` },
      { label: "Best Round", value: `${miniGames.shuffleBestRound}` },
    ],
    rhythm: [
      { label: "Best Score", value: `${miniGames.rhythmHighScore}` },
      {
        label: "Best Sync",
        value: `${miniGames.pulseBestAccuracy}% · ${miniGames.pulseBestCombo}x`,
      },
    ],
    sigil: [
      { label: "Best Score", value: `${miniGames.sigilHighScore}` },
      { label: "Patterns Named", value: `${miniGames.sigilTotalCorrect}` },
    ],
    vimana: [
      { label: "High Score", value: `${miniGames.vimanaHighScore}` },
      {
        label: "Lines · Level",
        value: `${miniGames.vimanaMaxLines} · ${miniGames.vimanaMaxLevel}`,
      },
    ],
  };

  const cardBlurbs: Record<RankedGame, string> = {
    memory: `Recall growing sigil weaves — each pad sings its own tone. ${rankedDifficulty("memory").memory.padCount} pads, starting at ${rankedDifficulty("memory").memory.startLength} sigils.`,
    rhythm: `Tap when the pulse meets the ring. ${rankedDifficulty("rhythm").rhythm.bpm} BPM, ${rankedDifficulty("rhythm").rhythm.beats} beats.`,
    sigil:
      "Name the next number in the flow — Fibonacci, primes, and stranger maths await deeper stages.",
    vimana: `Clear lines to stabilize the craft. Launching at level ${rankedDifficulty("vimana").vimana.startLevel}.`,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Gamepad2 className="h-5 w-5 text-emerald-300" />
          Conscious Arcade
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-900/30 px-3 py-1 text-xs text-violet-200">
            <TrendingUp className="h-3.5 w-3.5" />
            {evolution.state} · Lv {evolution.level} —{" "}
            {TIER_LABELS[baseDifficulty.tier]}
          </div>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? "Mute arcade sound" : "Unmute arcade sound"}
            className="rounded-full border border-slate-700 bg-slate-900/70 p-2 text-zinc-400 transition-colors hover:text-white"
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mastery constellation */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Trophy className="h-4 w-4 text-amber-300" />
          <span>
            Arcade mastery{" "}
            <span className="font-bold text-amber-300">{totalMastery}</span>
            <span className="text-zinc-600">/20 ★</span>
          </span>
        </div>
        <div className="h-1.5 max-w-[50%] flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-700"
            style={{
              width: `${(totalMastery / 20) * 100}%`,
              boxShadow: "0 0 10px rgba(251,191,36,0.6)",
            }}
          />
        </div>
        <span className="hidden text-[11px] text-zinc-500 sm:block">
          Focus streak{" "}
          <span className="font-semibold text-amber-300">
            {miniGames.focusStreak}
          </span>{" "}
          · Sessions{" "}
          <span className="font-semibold text-zinc-300">
            {miniGames.totalPlays}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(GAME_META) as RankedGame[]).map((game) => {
          const meta = GAME_META[game];
          const stars = getMasteryStars(miniGames, game as MasteryGame);
          const selected = selectedRanks[game];
          return (
            <motion.div
              key={game}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 bg-gradient-to-br p-4 ${meta.gradient}`}
              style={{ boxShadow: `inset 0 1px 0 ${meta.accent}22` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <span
                    className="rounded-lg p-1.5"
                    style={{
                      color: meta.accent,
                      backgroundColor: `${meta.accent}1a`,
                      boxShadow: `0 0 14px ${meta.accent}44`,
                    }}
                  >
                    {meta.icon}
                  </span>
                  {meta.label}
                </div>
                <MasteryStars earned={stars} size="text-xs" />
              </div>

              <p className="mt-2 min-h-[2.5rem] text-xs text-zinc-400">
                {cardBlurbs[game]}
              </p>

              {/* Rank picker */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {RANK_ORDER.map((rank) => {
                  const unlocked = isRankUnlocked(game, rank, miniGames);
                  const info = RANK_INFO[rank];
                  const isSelected = selected === rank;
                  return (
                    <button
                      key={rank}
                      type="button"
                      disabled={!unlocked}
                      title={
                        unlocked
                          ? `${info.tagline} Score ×${info.scoreMult}.`
                          : `Locked — ${getRankUnlockHint(game, rank)}`
                      }
                      onClick={() =>
                        setSelectedRanks((prev) => ({ ...prev, [game]: rank }))
                      }
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                        unlocked ? "" : "cursor-not-allowed opacity-40"
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: info.color,
                              color: "#0f172a",
                              backgroundColor: info.color,
                              boxShadow: `0 0 12px ${info.color}88`,
                            }
                          : {
                              borderColor: `${info.color}66`,
                              color: info.color,
                              backgroundColor: "rgba(15,23,42,0.6)",
                            }
                      }
                    >
                      {!unlocked && <Lock className="h-2.5 w-2.5" />}
                      {info.label}
                      {info.scoreMult > 1 && unlocked && ` ×${info.scoreMult}`}
                    </button>
                  );
                })}
              </div>
              {!isRankUnlocked(game, "mythic", miniGames) && (
                <p className="mt-1.5 text-[10px] text-zinc-500">
                  Next unlock:{" "}
                  {getRankUnlockHint(
                    game,
                    RANK_ORDER.find((rank) => !isRankUnlocked(game, rank, miniGames)) ??
                      "mythic",
                  )}
                </p>
              )}

              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="grid flex-1 grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  {cardStats[game].map((stat) => (
                    <div key={stat.label}>
                      {stat.label}
                      <div className="font-semibold" style={{ color: meta.accent }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setActiveGame(game)}
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  Play
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Every game scales with your pet&apos;s evolution and skill rank, and
        feeds XP, vitals, and essence back into its growth. Higher ranks
        multiply scores — earn them by proving mastery.
      </p>

      {activeGame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
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
                difficulty={rankedDifficulty("memory").memory}
                rank={selectedRanks.memory}
                evolution={evolutionSnapshot}
                bests={{
                  score: miniGames.memoryHighScore,
                  round: miniGames.shuffleBestRound,
                }}
                onComplete={handleMemoryComplete}
                onExit={closeGame}
              />
            )}
            {activeGame === "rhythm" && (
              <RhythmPulse
                petName={petName}
                difficulty={rankedDifficulty("rhythm").rhythm}
                rank={selectedRanks.rhythm}
                evolution={evolutionSnapshot}
                bests={{
                  score: miniGames.rhythmHighScore,
                  accuracy: miniGames.pulseBestAccuracy,
                  combo: miniGames.pulseBestCombo,
                }}
                onComplete={handleRhythmComplete}
                onExit={closeGame}
              />
            )}
            {activeGame === "sigil" && (
              <SigilSequence
                petName={petName}
                genomeSeed={genomeSeed}
                difficulty={rankedDifficulty("sigil").sigil}
                tier={baseDifficulty.tier}
                rank={selectedRanks.sigil}
                evolution={evolutionSnapshot}
                bests={{
                  score: miniGames.sigilHighScore,
                  streak: miniGames.sigilBestStreak,
                }}
                onComplete={handleSigilComplete}
                onExit={closeGame}
              />
            )}
            {activeGame === "vimana" && (
              <VimanaTetris
                petName={petName}
                genomeSeed={genomeSeed}
                startLevel={rankedDifficulty("vimana").vimana.startLevel}
                onExit={closeGame}
                onGameOver={handleVimanaGameOver}
              />
            )}
          </div>
        </div>
      )}

      {/* Unlock toasts */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="flex items-center gap-3 rounded-xl border border-amber-400/60 bg-slate-950/95 px-4 py-2.5 shadow-[0_0_30px_rgba(251,191,36,0.35)]"
            >
              <Trophy className="h-5 w-5 shrink-0 text-amber-300" />
              <div className="text-left">
                <p className="text-sm font-bold text-amber-200">{toast.title}</p>
                <p className="max-w-[16rem] truncate text-[11px] text-zinc-400">
                  {toast.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
