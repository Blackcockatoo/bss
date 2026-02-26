'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ResonanceState } from '@/lib/bond';

interface PetResonanceProps {
  resonance: ResonanceState;
  petName?: string;
  className?: string;
}

const RESONANCE_MESSAGES: Record<ResonanceState, { message: string; subtext: string; color: string; icon: string }> = {
  attuning: {
    message: 'Learning about you',
    subtext: 'Your companion is getting to know your patterns',
    color: 'text-blue-500',
    icon: '',
  },
  protective: {
    message: 'Here for you',
    subtext: 'Your companion senses you might need support',
    color: 'text-purple-500',
    icon: '',
  },
  playful: {
    message: 'Feeling connected',
    subtext: 'Your bond is strong and joyful',
    color: 'text-green-500',
    icon: '',
  },
  supportive: {
    message: 'Gentle presence',
    subtext: 'A calm, supportive energy surrounds you',
    color: 'text-teal-500',
    icon: '',
  },
  celebratory: {
    message: 'Celebrating with you!',
    subtext: 'Your companion shares in your joy',
    color: 'text-amber-500',
    icon: '',
  },
  missing: {
    message: 'Waiting for you',
    subtext: 'Your companion missed you',
    color: 'text-gray-500',
    icon: '',
  },
  welcoming: {
    message: 'Welcome back!',
    subtext: 'Your companion is happy to see you again',
    color: 'text-pink-500',
    icon: '',
  },
};

export function PetResonance({ resonance, petName, className }: PetResonanceProps) {
  const info = RESONANCE_MESSAGES[resonance];
  const name = petName || 'Your companion';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={resonance}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className={cn('flex items-center gap-3 p-3 rounded-lg bg-muted/30', className)}
      >
        <span className={cn('text-2xl', info.color)}>{info.icon}</span>
        <div>
          <p className={cn('text-sm font-medium', info.color)}>
            {info.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {info.subtext}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for header/status bar
export function PetResonanceCompact({ resonance, className }: { resonance: ResonanceState; className?: string }) {
  const info = RESONANCE_MESSAGES[resonance];

  return (
    <div className={cn('flex items-center gap-1.5', className)} title={info.subtext}>
      <span className={info.color}>{info.icon}</span>
      <span className={cn('text-xs', info.color)}>{info.message}</span>
    </div>
  );
}
