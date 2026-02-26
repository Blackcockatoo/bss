'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useBondStore } from '@/lib/bond/store';
import { getMoments } from '@/lib/memory';

import { MoodCheckIn } from './MoodCheckIn';
import { MemoryTimeline } from './MemoryTimeline';
import { InsightsPanel } from './InsightsPanel';
import { HabitTracker } from './HabitTracker';
import { BreathingExercise } from './BreathingExercise';
import { PetResonance } from './PetResonance';

type TabId = 'bond' | 'memory' | 'wellness' | 'insights';

interface BondDashboardProps {
  petId: string;
  petName?: string;
  className?: string;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'bond', label: 'Bond', icon: '' },
  { id: 'memory', label: 'Memory', icon: '' },
  { id: 'wellness', label: 'Wellness', icon: '' },
  { id: 'insights', label: 'Insights', icon: '' },
];

export function BondDashboard({ petId, petName, className }: BondDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>('bond');

  const {
    bond,
    memory,
    insights,
    resonance,
    initialize,
    checkInMood,
    recordVisit,
    createHabit,
    markHabitComplete,
    deleteHabit,
    addNote,
    pinMoment,
    refreshInsights,
    refreshResonance,
  } = useBondStore();

  // Initialize on mount
  React.useEffect(() => {
    if (petId) {
      initialize(petId);
      // Record a visit
      recordVisit();
    }
  }, [petId, initialize, recordVisit]);

  // Refresh insights periodically
  React.useEffect(() => {
    refreshInsights();
    refreshResonance();

    const interval = setInterval(() => {
      refreshInsights();
      refreshResonance();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [refreshInsights, refreshResonance]);

  const moments = React.useMemo(() => getMoments(memory), [memory]);
  const totalDaysTogether = Math.floor(
    (Date.now() - bond.bondStartedAt) / (24 * 60 * 60 * 1000)
  ) + 1;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Resonance indicator */}
      <PetResonance resonance={resonance} petName={petName} />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'bond' && (
            <div className="space-y-4">
              {/* Mood check-in */}
              <MoodCheckIn
                onCheckIn={checkInMood}
                currentMood={bond.currentMood}
                lastCheckIn={bond.lastMoodCheckIn}
              />

              {/* Habit tracker */}
              <HabitTracker
                habits={bond.habits}
                onCreateHabit={createHabit}
                onCompleteHabit={markHabitComplete}
                onDeleteHabit={deleteHabit}
              />
            </div>
          )}

          {activeTab === 'memory' && (
            <MemoryTimeline
              moments={moments}
              onPinMoment={pinMoment}
              onAddNote={addNote}
              maxItems={50}
            />
          )}

          {activeTab === 'wellness' && (
            <div className="space-y-4">
              {/* Quick mood check */}
              <MoodCheckIn
                onCheckIn={checkInMood}
                currentMood={bond.currentMood}
                lastCheckIn={bond.lastMoodCheckIn}
                compact
              />

              {/* Breathing exercise */}
              <BreathingExercise
                onComplete={() => {
                  // Could add mood boost or memory capture here
                }}
              />
            </div>
          )}

          {activeTab === 'insights' && (
            <InsightsPanel
              insights={insights}
              bondLevel={bond.bondLevel}
              bondPoints={bond.bondPoints}
              currentStreak={bond.patterns.currentStreak}
              totalDaysTogether={totalDaysTogether}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Compact header component for showing bond status elsewhere
export function BondStatusHeader({
  className,
}: {
  className?: string;
}) {
  const { bond, resonance } = useBondStore();

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-1">
        <span></span>
        <span className="text-muted-foreground">{bond.patterns.currentStreak} day streak</span>
      </div>
      <div className="flex items-center gap-1">
        <span></span>
        <span className="capitalize text-muted-foreground">{bond.bondLevel}</span>
      </div>
    </div>
  );
}
