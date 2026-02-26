'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Trophy, Medal, Crown, Award } from 'lucide-react';
import {
  ACHIEVEMENTS_CATALOG,
  updateAchievementProgress,
  calculateTotalPoints,
  getAchievementsByCategory,
  type Achievement,
} from '@/lib/achievements';

const CATEGORY_ICONS = {
  care: '❤️',
  battle: '⚔️',
  exploration: '🗺️',
  evolution: '🧬',
  social: '👥',
};

const TIER_ICONS = {
  bronze: Medal,
  silver: Award,
  gold: Trophy,
  platinum: Crown,
};

const TIER_COLORS = {
  bronze: 'text-orange-400 bg-orange-500/20 border-orange-600',
  silver: 'text-zinc-300 bg-zinc-500/20 border-zinc-600',
  gold: 'text-yellow-400 bg-yellow-500/20 border-yellow-600',
  platinum: 'text-cyan-400 bg-cyan-500/20 border-cyan-600',
};

export function AchievementsPanel() {
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all');
  
  const vitals = useStore(s => s.vitals);
  const evolution = useStore(s => s.evolution);
  const battle = useStore(s => s.battle);
  const vimana = useStore(s => s.vimana);

  // Mock breeding state
  const breeding = { offspringCount: 0 };

  // Update achievement progress
  const achievements = updateAchievementProgress(ACHIEVEMENTS_CATALOG, {
    vitals,
    battle,
    vimana: {
      totalSamples: vimana.scansPerformed || 0,
      anomaliesResolved: vimana.anomaliesResolved ?? vimana.anomaliesFound ?? 0,
      cells: (vimana.cells || []).map(c => ({ explored: Boolean('explored' in c ? c.explored : c.discovered) })),
    },
    evolution,
    breeding,
  });

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === selectedCategory);

  const totalPoints = calculateTotalPoints(achievements);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const categories: Array<Achievement['category'] | 'all'> = [
    'all',
    'care',
    'battle',
    'exploration',
    'evolution',
    'social',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Achievements
          </h2>
          <p className="text-xs text-zinc-500">Track your progress and earn rewards</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-400">{totalPoints}</p>
          <p className="text-xs text-zinc-500">Total Points</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Progress</p>
            <p className="text-lg font-semibold text-white">
              {unlockedCount} / {achievements.length}
            </p>
          </div>
          <div className="flex gap-4">
            {(['bronze', 'silver', 'gold', 'platinum'] as const).map(tier => {
              const count = achievements.filter(a => a.tier === tier && a.unlocked).length;
              const Icon = TIER_ICONS[tier];
              return (
                <div key={tier} className="text-center">
                  <Icon className={`w-5 h-5 mx-auto ${TIER_COLORS[tier].split(' ')[0]}`} />
                  <p className="text-xs text-zinc-400 mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 bg-zinc-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
              ${
                selectedCategory === category
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800'
              }
            `}
          >
            {category !== 'all' && CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}{' '}
            {category}
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div className="space-y-3">
        {filteredAchievements.map(achievement => {
          const Icon = TIER_ICONS[achievement.tier];
          const progress = (achievement.progress / achievement.maxProgress) * 100;

          return (
            <div
              key={achievement.id}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${achievement.unlocked ? 'bg-zinc-800/80 border-zinc-600' : 'bg-zinc-900/40 border-zinc-700'}
              `}
            >
              {/* Tier Badge */}
              <div
                className={`
                  absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
                  border-2 ${TIER_COLORS[achievement.tier]}
                `}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="pr-12">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{achievement.name}</h3>
                    <p className="text-xs text-zinc-400 mb-3">{achievement.description}</p>

                    {/* Progress Bar */}
                    {!achievement.unlocked && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">
                            {achievement.progress} / {achievement.maxProgress}
                          </span>
                          <span className="text-zinc-400 font-medium">{Math.floor(progress)}%</span>
                        </div>
                        <div className="bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Unlocked Badge */}
                    {achievement.unlocked && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-emerald-400">✓ Unlocked</span>
                        {achievement.unlockedAt && (
                          <span className="text-xs text-zinc-500">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reward */}
                <div className="mt-3 pt-3 border-t border-zinc-700/50">
                  <p className="text-xs text-zinc-500">
                    <span className="text-amber-400">Reward:</span> {achievement.reward.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No achievements in this category yet</p>
        </div>
      )}
    </div>
  );
}
