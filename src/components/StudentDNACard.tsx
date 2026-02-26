'use client';

import { motion } from 'framer-motion';
import type { StudentDNAProfile } from '@/lib/education';
import { useEducationStore } from '@/lib/education';

interface StudentDNACardProps {
  profile: StudentDNAProfile;
  compact?: boolean;
  showXP?: boolean;
  showBadges?: boolean;
}

const MODE_COLORS: Record<string, string> = {
  spiral: '#8b5cf6',   // purple
  mandala: '#10b981',  // emerald
  particles: '#06b6d4', // cyan
  sound: '#f59e0b',    // amber
  journey: '#ec4899',  // pink
};

const SYMBOL_EMOJI: Record<string, string> = {
  star: '\u2605',
  moon: '\u263E',
  sun: '\u2600',
  flower: '\u2740',
  tree: '\u2663',
  heart: '\u2665',
  crown: '\u265B',
  crystal: '\u25C6',
  flame: '\u2739',
  wave: '\u2248',
  mountain: '\u25B2',
  feather: '\u2767',
};

const ELEMENT_LABEL: Record<string, string> = {
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
};

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-700/30 border-orange-500/50 text-orange-300',
  silver: 'bg-slate-400/20 border-slate-400/50 text-slate-300',
  gold: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300',
  platinum: 'bg-purple-500/20 border-purple-400/50 text-purple-300',
};

export function StudentDNACard({ profile, compact = false, showXP = false, showBadges = false }: StudentDNACardProps) {
  const symbolChar = SYMBOL_EMOJI[profile.learningSymbol] ?? '\u2605';
  const eduXP = useEducationStore((s) => s.eduXP);
  const eduAchievements = useEducationStore((s) => s.eduAchievements);

  const unlockedAchievements = eduAchievements.filter(a => a.unlockedAt !== null);
  const xpProgress = eduXP.xp % 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <AffinityBar affinities={profile.modeAffinities} width={48} height={6} />
        <span className="text-sm" title={`Your Pattern: ${profile.learningSymbol}`}>
          {symbolChar}
        </span>
        <span className="text-[10px] text-zinc-500">
          {profile.discoveryCount} discoveries
        </span>
        {showXP && (
          <span className="text-[10px] text-amber-400 font-semibold">
            Lv.{eduXP.level}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" title={profile.learningSymbol}>{symbolChar}</span>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{profile.alias}</p>
            <p className="text-[11px] text-zinc-500">Your Pattern</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-zinc-100">{profile.discoveryCount}</p>
          <p className="text-[11px] text-zinc-500">Discoveries</p>
        </div>
      </div>

      {/* Mode affinity bar */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Exploration Style</p>
        <AffinityBar affinities={profile.modeAffinities} width={280} height={10} />
        <div className="flex flex-wrap gap-2 mt-1">
          {Object.entries(profile.modeAffinities)
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([mode, value]) => (
              <span
                key={mode}
                className="flex items-center gap-1 text-[10px] text-zinc-400"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: MODE_COLORS[mode] }}
                />
                {mode} {Math.round(value * 100)}%
              </span>
            ))}
        </div>
      </div>

      {/* Element preference */}
      {profile.soundPreference && (
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-zinc-500">Element:</p>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-zinc-300">
            {ELEMENT_LABEL[profile.soundPreference]}
          </span>
        </div>
      )}

      {/* Reflection depth */}
      <div className="space-y-1">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Reflection Depth</p>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
            style={{ width: `${Math.round(profile.reflectionDepth * 100)}%` }}
          />
        </div>
      </div>

      {/* XP/Level Display */}
      {showXP && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Experience</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-300">Level {eduXP.level}</span>
              {eduXP.streak > 0 && (
                <motion.span
                  className="flex items-center gap-0.5 text-xs text-orange-400"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  🔥 {eduXP.streak}
                </motion.span>
              )}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 text-right">
            {eduXP.xp} XP · {100 - xpProgress} to next level
          </p>
        </div>
      )}

      {/* Achievement Badges */}
      {showBadges && unlockedAchievements.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {unlockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${TIER_COLORS[achievement.tier]}`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                  delay: index * 0.1,
                }}
                title={achievement.description}
              >
                <span>{achievement.emoji}</span>
                <span className="font-medium">{achievement.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Affinity Bar (color band visualization) ----------

function AffinityBar({
  affinities,
  width,
  height,
}: {
  affinities: Record<string, number>;
  width: number;
  height: number;
}) {
  const entries = Object.entries(affinities).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    return (
      <div
        className="rounded-full bg-slate-800"
        style={{ width, height }}
      />
    );
  }

  return (
    <div
      className="flex rounded-full overflow-hidden"
      style={{ width: '100%', maxWidth: width, height }}
    >
      {entries.map(([mode, value]) => (
        <div
          key={mode}
          style={{
            width: `${value * 100}%`,
            backgroundColor: MODE_COLORS[mode] ?? '#64748b',
          }}
          title={`${mode}: ${Math.round(value * 100)}%`}
        />
      ))}
    </div>
  );
}
