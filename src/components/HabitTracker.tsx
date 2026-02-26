'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import type { Habit } from '@/lib/bond';

interface HabitTrackerProps {
  habits: Habit[];
  onCreateHabit?: (name: string, frequency: 'daily' | 'weekly', description?: string, targetTime?: string) => void;
  onCompleteHabit?: (habitId: string) => void;
  onDeleteHabit?: (habitId: string) => void;
  className?: string;
}

const MAX_HABITS = 3;

const PRESET_HABITS = [
  { name: 'Morning check-in', description: 'Start the day with your companion', frequency: 'daily' as const },
  { name: 'Evening wind-down', description: 'A peaceful moment before bed', frequency: 'daily' as const },
  { name: 'Weekly reflection', description: 'Review your journey together', frequency: 'weekly' as const },
];

function getCompletionStatus(habit: Habit): { completed: boolean; streak: number } {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const period = habit.frequency === 'daily' ? dayMs : weekMs;
  const periodStart = Math.floor(now / period) * period;

  const completedThisPeriod = habit.completions.some(c => c.timestamp >= periodStart);

  // Calculate streak
  let streak = 0;
  let checkTime = periodStart;
  while (checkTime >= 0) {
    const hasCompletion = habit.completions.some(
      c => c.timestamp >= checkTime - period && c.timestamp < checkTime
    );
    if (hasCompletion) {
      streak++;
      checkTime -= period;
    } else {
      break;
    }
  }
  if (completedThisPeriod) streak++;

  return { completed: completedThisPeriod, streak };
}

export function HabitTracker({
  habits,
  onCreateHabit,
  onCompleteHabit,
  onDeleteHabit,
  className,
}: HabitTrackerProps) {
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newHabitName, setNewHabitName] = React.useState('');
  const [newHabitFrequency, setNewHabitFrequency] = React.useState<'daily' | 'weekly'>('daily');
  const [showPresets, setShowPresets] = React.useState(false);
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  const canAddMore = habits.length < MAX_HABITS;

  const handleCreate = () => {
    if (newHabitName.trim() && onCreateHabit) {
      onCreateHabit(newHabitName.trim(), newHabitFrequency);
      setNewHabitName('');
      setShowCreateForm(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_HABITS[0]) => {
    if (onCreateHabit) {
      onCreateHabit(preset.name, preset.frequency, preset.description);
    }
    setShowPresets(false);
  };

  const handleComplete = (habitId: string) => {
    setCompletingId(habitId);
    onCompleteHabit?.(habitId);
    setTimeout(() => setCompletingId(null), 1500);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span></span>
          Rituals
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {habits.length}/{MAX_HABITS}
          </span>
        </CardTitle>
        <CardDescription>
          Simple habits to nurture your bond
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Habit list */}
        {habits.length > 0 ? (
          <div className="space-y-3">
            {habits.map((habit) => {
              const { completed, streak } = getCompletionStatus(habit);
              const isCompleting = completingId === habit.id;

              return (
                <motion.div
                  key={habit.id}
                  layout
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    completed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  {/* Complete button */}
                  <button
                    onClick={() => !completed && handleComplete(habit.id)}
                    disabled={completed}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                      completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/10'
                    )}
                  >
                    <AnimatePresence>
                      {(completed || isCompleting) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >

                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Habit info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-sm',
                      completed && 'text-green-700 dark:text-green-300'
                    )}>
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{habit.frequency}</span>
                      {streak > 1 && (
                        <span className="text-orange-500"> {streak} streak</span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  {onDeleteHabit && (
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Remove habit"
                    >

                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <span className="text-3xl block mb-2"></span>
            <p className="text-sm">No rituals yet</p>
            <p className="text-xs">Create up to {MAX_HABITS} habits to track</p>
          </div>
        )}

        {/* Add habit section */}
        {canAddMore && (
          <AnimatePresence mode="wait">
            {showCreateForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2 border-t"
              >
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Habit name..."
                  className="w-full p-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={50}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewHabitFrequency('daily')}
                    className={cn(
                      'flex-1 py-2 text-sm rounded-lg border transition-colors',
                      newHabitFrequency === 'daily'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setNewHabitFrequency('weekly')}
                    className={cn(
                      'flex-1 py-2 text-sm rounded-lg border transition-colors',
                      newHabitFrequency === 'weekly'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    Weekly
                  </button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewHabitName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={!newHabitName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </motion.div>
            ) : showPresets ? (
              <motion.div
                key="presets"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 pt-2 border-t"
              >
                <p className="text-xs text-muted-foreground">Quick add:</p>
                {PRESET_HABITS.filter(
                  preset => !habits.some(h => h.name === preset.name)
                ).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPresets(false)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPresets(false);
                      setShowCreateForm(true);
                    }}
                  >
                    Custom
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="buttons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 pt-2 border-t"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowPresets(true)}
                >
                  + Quick Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowCreateForm(true)}
                >
                  + Custom
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
