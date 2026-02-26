'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Trophy } from 'lucide-react';
import { useEducationStore, VIBE_EMOJI } from '@/lib/education';
import type { VibeReaction } from '@/lib/education';
import { ProgressRing } from '@/components/ProgressRing';

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-700/30 border-orange-500/50 text-orange-300',
  silver: 'bg-slate-400/20 border-slate-400/50 text-slate-300',
  gold: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300',
  platinum: 'bg-purple-500/20 border-purple-400/50 text-purple-300',
};

interface EduVibeBoardProps {
  className?: string;
}

export function EduVibeBoard({ className = '' }: EduVibeBoardProps) {
  const getClassEnergy = useEducationStore((s) => s.getClassEnergy);
  const vibeReactions = useEducationStore((s) => s.vibeReactions);
  const eduXP = useEducationStore((s) => s.eduXP);
  const eduAchievements = useEducationStore((s) => s.eduAchievements);

  const currentEnergy = getClassEnergy();
  const lastTenVibes = useMemo(() => vibeReactions.slice(-10), [vibeReactions]);
  const unlockedAchievements = useMemo(
    () => eduAchievements.filter(a => a.unlockedAt !== null).slice(-5),
    [eduAchievements]
  );

  // Calculate vibe distribution
  const vibeDistribution = useMemo(() => {
    const counts: Record<VibeReaction, number> = {
      fire: 0,
      brain: 0,
      sleeping: 0,
      'mind-blown': 0,
    };
    for (const vibe of vibeReactions) {
      counts[vibe.reaction]++;
    }
    const total = vibeReactions.length || 1;
    return Object.entries(counts).map(([reaction, count]) => ({
      reaction: reaction as VibeReaction,
      count,
      percent: Math.round((count / total) * 100),
    }));
  }, [vibeReactions]);

  // Determine energy ring color based on level
  const energyColor = currentEnergy > 60 ? 'pink' : currentEnergy > 30 ? 'cyan' : 'purple';

  return (
    <div className={`rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 space-y-4 ${className}`}>
      <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        <Zap className="h-4 w-4 text-cyan-400" />
        Class Vibe Board
      </h3>

      {/* Class Energy Ring */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <ProgressRing
            progress={currentEnergy}
            size={64}
            strokeWidth={5}
            color={energyColor}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-lg font-bold text-zinc-100"
              key={currentEnergy}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {currentEnergy}
            </motion.span>
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Class Energy</p>
          <p className={`text-sm font-semibold ${
            currentEnergy > 60 ? 'text-pink-300' : currentEnergy > 30 ? 'text-cyan-300' : 'text-purple-300'
          }`}>
            {currentEnergy > 80 ? 'On Fire!' : currentEnergy > 50 ? 'Vibing' : currentEnergy > 20 ? 'Building' : 'Warming Up'}
          </p>
        </div>
      </div>

      {/* Live Vibe Feed */}
      <div className="space-y-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Live Vibes</p>
        <div className="flex items-center gap-1 min-h-[28px] overflow-hidden">
          <AnimatePresence mode="popLayout">
            {lastTenVibes.map((vibe, index) => (
              <motion.span
                key={`${vibe.timestamp}-${index}`}
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="text-lg"
              >
                {VIBE_EMOJI[vibe.reaction]}
              </motion.span>
            ))}
          </AnimatePresence>
          {lastTenVibes.length === 0 && (
            <span className="text-xs text-zinc-600">No vibes yet - be the first!</span>
          )}
        </div>

        {/* Distribution Bar */}
        {vibeReactions.length > 0 && (
          <div className="space-y-1">
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
              {vibeDistribution.map(({ reaction, percent }) => (
                percent > 0 && (
                  <motion.div
                    key={reaction}
                    className={`h-full ${
                      reaction === 'fire' ? 'bg-orange-500' :
                      reaction === 'brain' ? 'bg-purple-500' :
                      reaction === 'sleeping' ? 'bg-blue-500' :
                      'bg-pink-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5 }}
                    title={`${VIBE_EMOJI[reaction]} ${percent}%`}
                  />
                )
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              {vibeDistribution.map(({ reaction, count }) => (
                <span key={reaction} className="flex items-center gap-0.5">
                  {VIBE_EMOJI[reaction]} {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Streak Showcase */}
      {(eduXP.streak > 0 || eduXP.bestStreak > 0) && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-orange-500/10 border border-orange-400/20">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame className="h-5 w-5 text-orange-400" />
            </motion.div>
            <div>
              <p className="text-xs text-zinc-500">Current Streak</p>
              <p className="text-lg font-bold text-orange-300">{eduXP.streak}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Best</p>
            <p className="text-sm font-semibold text-orange-200">{eduXP.bestStreak}</p>
          </div>
        </div>
      )}

      {/* Recent Badges */}
      {unlockedAchievements.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Recent Badges
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unlockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] ${TIER_COLORS[achievement.tier]}`}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 15,
                  delay: index * 0.05,
                }}
                title={achievement.description}
              >
                <span>{achievement.emoji}</span>
                <span className="hidden sm:inline">{achievement.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
