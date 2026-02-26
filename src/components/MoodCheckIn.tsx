'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import type { UserMood } from '@/lib/bond';
import { USER_MOOD_LABELS, USER_MOOD_ICONS } from '@/lib/bond';

interface MoodCheckInProps {
  onCheckIn: (mood: UserMood, note?: string) => void;
  currentMood?: UserMood | null;
  lastCheckIn?: number | null;
  compact?: boolean;
  className?: string;
}

const MOOD_OPTIONS: UserMood[] = ['struggling', 'low', 'neutral', 'good', 'great'];

const MOOD_COLORS: Record<UserMood, string> = {
  struggling: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50',
  low: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/50',
  neutral: 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800/70',
  good: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50',
  great: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
};

const MOOD_SELECTED_COLORS: Record<UserMood, string> = {
  struggling: 'bg-red-200 dark:bg-red-800/50 border-red-500 ring-2 ring-red-400',
  low: 'bg-orange-200 dark:bg-orange-800/50 border-orange-500 ring-2 ring-orange-400',
  neutral: 'bg-gray-200 dark:bg-gray-700 border-gray-500 ring-2 ring-gray-400',
  good: 'bg-green-200 dark:bg-green-800/50 border-green-500 ring-2 ring-green-400',
  great: 'bg-emerald-200 dark:bg-emerald-800/50 border-emerald-500 ring-2 ring-emerald-400',
};

export function MoodCheckIn({
  onCheckIn,
  currentMood,
  lastCheckIn,
  compact = false,
  className,
}: MoodCheckInProps) {
  const [selectedMood, setSelectedMood] = React.useState<UserMood | null>(null);
  const [note, setNote] = React.useState('');
  const [showNoteInput, setShowNoteInput] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Check if checked in recently (within 4 hours)
  const recentlyCheckedIn = lastCheckIn && Date.now() - lastCheckIn < 4 * 60 * 60 * 1000;

  const handleMoodSelect = (mood: UserMood) => {
    setSelectedMood(mood);
    if (compact) {
      // In compact mode, submit immediately
      onCheckIn(mood);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    }
  };

  const handleSubmit = () => {
    if (selectedMood) {
      onCheckIn(selectedMood, note.trim() || undefined);
      setSubmitted(true);
      setSelectedMood(null);
      setNote('');
      setShowNoteInput(false);
      setTimeout(() => setSubmitted(false), 2000);
    }
  };

  // Compact mode: just the mood buttons
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm text-muted-foreground mr-1">How are you?</span>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.span
              key="thanks"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-green-600 dark:text-green-400"
            >
              Noted
            </motion.span>
          ) : (
            <motion.div
              key="buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1"
            >
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  className={cn(
                    'w-8 h-8 rounded-full border transition-all text-lg',
                    currentMood === mood
                      ? MOOD_SELECTED_COLORS[mood]
                      : MOOD_COLORS[mood]
                  )}
                  title={USER_MOOD_LABELS[mood]}
                  aria-label={USER_MOOD_LABELS[mood]}
                >
                  {USER_MOOD_ICONS[mood]}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full mode: card with mood selection and optional note
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">How are you feeling?</CardTitle>
        <CardDescription>
          {recentlyCheckedIn
            ? "You checked in recently, but feel free to update"
            : "Your companion wants to know how you're doing"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-8 text-center"
            >
              <span className="text-4xl mb-2 block">
                {selectedMood ? USER_MOOD_ICONS[selectedMood] : '💚'}
              </span>
              <p className="text-muted-foreground">Thank you for sharing</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Mood buttons */}
              <div className="flex justify-center gap-2 mb-4">
                {MOOD_OPTIONS.map((mood) => (
                  <motion.button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-xl border transition-all min-w-[64px]',
                      selectedMood === mood
                        ? MOOD_SELECTED_COLORS[mood]
                        : MOOD_COLORS[mood]
                    )}
                  >
                    <span className="text-2xl mb-1">{USER_MOOD_ICONS[mood]}</span>
                    <span className="text-xs text-muted-foreground">
                      {USER_MOOD_LABELS[mood]}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Optional note */}
              {selectedMood && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  {!showNoteInput ? (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNoteInput(true)}
                      >
                        Add a note (optional)
                      </Button>
                      <Button onClick={handleSubmit}>Done</Button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What's on your mind? (optional)"
                        className="w-full p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        rows={2}
                        maxLength={200}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowNoteInput(false);
                            setNote('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSubmit}>Save</Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
