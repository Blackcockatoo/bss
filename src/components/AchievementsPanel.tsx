'use client';

import { useMemo, useState } from 'react';
import {
  Baby,
  CheckCircle2,
  Gamepad2,
  Lock,
  Map,
  Swords,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

import { useStore } from '@/lib/store';
import {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_TARGETS,
  type Achievement,
  type BattleStats,
  type MiniGameProgress,
  type VimanaState,
} from '@/lib/progression/types';

type AchievementId = keyof typeof ACHIEVEMENT_TARGETS;
type AchievementCategory = 'exploration' | 'battle' | 'minigame' | 'breeding';

interface AchievementView extends Achievement {
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
}

interface AchievementProgressSource {
  achievements: Achievement[];
  battle: BattleStats;
  miniGames: MiniGameProgress;
  vimana: VimanaState;
}

const CATEGORY_ICONS: Record<AchievementCategory, LucideIcon> = {
  exploration: Map,
  battle: Swords,
  minigame: Gamepad2,
  breeding: Baby,
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  exploration: 'Exploration',
  battle: 'Battle',
  minigame: 'Mini-Games',
  breeding: 'Breeding',
};

function getAchievementProgress(
  id: AchievementId,
  source: AchievementProgressSource,
  unlocked: boolean,
): number {
  switch (id) {
    case 'explorer-first-step':
      return source.vimana.cells.filter((cell) => cell.discovered).length > 1 ? 1 : 0;
    case 'explorer-anomaly-hunter':
      return source.vimana.anomaliesResolved ?? 0;
    case 'battle-first-win':
      return source.battle.wins > 0 ? 1 : 0;
    case 'battle-streak':
      return source.battle.streak;
    case 'minigame-memory':
    case 'minigame-memory-ace':
      return source.miniGames.memoryHighScore;
    case 'minigame-rhythm':
    case 'minigame-rhythm-ace':
      return source.miniGames.rhythmHighScore;
    case 'minigame-vimana-score':
      return source.miniGames.vimanaHighScore;
    case 'minigame-vimana-lines':
      return source.miniGames.vimanaMaxLines;
    case 'minigame-vimana-level':
      return source.miniGames.vimanaMaxLevel;
    case 'minigame-focus-streak':
      return source.miniGames.focusStreak;
    case 'breeding-first':
      return unlocked ? 1 : 0;
    default:
      return 0;
  }
}

function buildAchievementView(
  definition: Achievement,
  source: AchievementProgressSource,
): AchievementView {
  const unlockedEntry = source.achievements.find((entry) => entry.id === definition.id);
  const unlocked = Boolean(unlockedEntry);
  const id = definition.id as AchievementId;
  const maxProgress = ACHIEVEMENT_TARGETS[id];
  const rawProgress = getAchievementProgress(id, source, unlocked);

  return {
    ...definition,
    unlocked,
    unlockedAt: unlockedEntry?.earnedAt,
    progress: Math.min(maxProgress, unlocked ? Math.max(rawProgress, maxProgress) : rawProgress),
    maxProgress,
  };
}

export function AchievementsPanel() {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  const achievements = useStore((state) => state.achievements);
  const battle = useStore((state) => state.battle);
  const miniGames = useStore((state) => state.miniGames);
  const vimana = useStore((state) => state.vimana);

  const achievementViews = useMemo(
    () =>
      ACHIEVEMENT_CATALOG.map((achievement) =>
        buildAchievementView(achievement, {
          achievements,
          battle,
          miniGames,
          vimana,
        }),
      ),
    [achievements, battle, miniGames, vimana],
  );

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievementViews
      : achievementViews.filter((achievement) => achievement.category === selectedCategory);

  const unlockedCount = achievementViews.filter((achievement) => achievement.unlocked).length;
  const completion = achievementViews.length === 0 ? 0 : Math.round((unlockedCount / achievementViews.length) * 100);
  const categories: Array<AchievementCategory | 'all'> = [
    'all',
    'exploration',
    'battle',
    'minigame',
    'breeding',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Achievements
          </h2>
          <p className="text-xs text-zinc-500">Progress is calculated from the live pet state.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-400">{unlockedCount}</p>
          <p className="text-xs text-zinc-500">Unlocked</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Completion</p>
            <p className="text-lg font-semibold text-white">
              {unlockedCount} / {achievementViews.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-emerald-400">{completion}%</p>
            <p className="text-xs text-zinc-500">Catalog cleared</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon =
            category === 'all'
              ? Trophy
              : CATEGORY_ICONS[category];
          const label = category === 'all' ? 'All' : CATEGORY_LABELS[category];

          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredAchievements.map((achievement) => {
          const CategoryIcon =
            achievement.category && CATEGORY_ICONS[achievement.category]
              ? CATEGORY_ICONS[achievement.category]
              : Trophy;
          const progressPercent =
            achievement.maxProgress === 0
              ? 100
              : Math.min(100, (achievement.progress / achievement.maxProgress) * 100);

          return (
            <div
              key={achievement.id}
              className={`rounded-lg border-2 p-4 transition-all ${
                achievement.unlocked
                  ? 'border-emerald-500/40 bg-zinc-800/80'
                  : 'border-zinc-700 bg-zinc-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4 shrink-0 text-cyan-300" />
                    <h3 className="font-semibold text-white">{achievement.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{achievement.description}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300">
                  {achievement.unlocked ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Unlocked
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-zinc-500" />
                      Locked
                    </>
                  )}
                </div>
              </div>

              {achievement.unlocked ? (
                <p className="mt-3 text-xs text-emerald-300">
                  Earned{' '}
                  {achievement.unlockedAt
                    ? new Date(achievement.unlockedAt).toLocaleString()
                    : 'in this session'}
                </p>
              ) : (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                    <span className="font-medium text-zinc-400">{Math.floor(progressPercent)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="py-12 text-center text-zinc-500">
          <Trophy className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>No achievements in this category.</p>
        </div>
      )}
    </div>
  );
}
