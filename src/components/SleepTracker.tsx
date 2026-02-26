'use client';

import { useState, useMemo } from 'react';
import { useWellnessStore, getTodaySleepHours, getDateKey } from '@/lib/wellness';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Moon, Sun, Flame, Clock, Star, Minus, Plus, Bed } from 'lucide-react';

interface SleepTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SleepTracker({ isOpen, onClose }: SleepTrackerProps) {
  const sleep = useWellnessStore(state => state.sleep);
  const startSleep = useWellnessStore(state => state.startSleep);
  const endSleep = useWellnessStore(state => state.endSleep);
  const logSleepManual = useWellnessStore(state => state.logSleepManual);
  const setSleepGoal = useWellnessStore(state => state.setSleepGoal);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualSleepHour, setManualSleepHour] = useState(22);
  const [manualWakeHour, setManualWakeHour] = useState(7);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);

  const todayHours = useMemo(() => getTodaySleepHours(sleep), [sleep]);
  const progress = Math.min((todayHours / sleep.dailyGoal) * 100, 100);
  const goalReached = todayHours >= sleep.dailyGoal;
  const isSleeping = sleep.currentSleep !== null;

  // Get last 7 days data
  const weekData = useMemo(() => {
    const days: { date: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDateKey(Date.now() - i * 86400000);
      const dayEntries = sleep.entries.filter(e => {
        const wakeDate = e.wakeTime ? getDateKey(e.wakeTime) : null;
        return wakeDate === date;
      });
      const hours = dayEntries.reduce((sum, e) => {
        if (!e.wakeTime) return sum;
        return sum + (e.wakeTime - e.sleepTime) / (1000 * 60 * 60);
      }, 0);
      days.push({ date, hours });
    }
    return days;
  }, [sleep.entries]);

  // Calculate average sleep
  const avgSleep = useMemo(() => {
    const validDays = weekData.filter(d => d.hours > 0);
    if (validDays.length === 0) return 0;
    return validDays.reduce((sum, d) => sum + d.hours, 0) / validDays.length;
  }, [weekData]);

  const handleStartSleep = () => {
    startSleep();
    triggerHaptic('medium');
  };

  const handleEndSleep = () => {
    endSleep(quality);
    triggerHaptic('medium');
    setQuality(3);
  };

  const handleManualEntry = () => {
    // Create timestamps for yesterday night to this morning
    const now = new Date();
    const sleepDate = new Date(now);
    sleepDate.setDate(sleepDate.getDate() - 1);
    sleepDate.setHours(manualSleepHour, 0, 0, 0);

    const wakeDate = new Date(now);
    wakeDate.setHours(manualWakeHour, 0, 0, 0);

    // If wake time would be before sleep time, it's the same day
    if (wakeDate.getTime() < sleepDate.getTime()) {
      sleepDate.setDate(sleepDate.getDate() + 1);
    }

    logSleepManual(sleepDate.getTime(), wakeDate.getTime(), quality);
    triggerHaptic('medium');
    setShowManualEntry(false);
    setQuality(3);
  };

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (!enabledFeatures.sleep) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900/95 border-violet-500/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-violet-400">
            <Moon className="w-5 h-5" />
            Sleep Sanctuary
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Main progress display */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              {/* Background ring */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-zinc-800"
                />
                {/* Progress ring */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#sleep-gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 3.52} 352`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="sleep-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isSleeping ? (
                  <>
                    <Moon className="w-6 h-6 text-violet-400 animate-pulse" />
                    <span className="text-xs text-violet-300 mt-1">Sleeping...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-violet-400">
                      {formatHours(todayHours)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      / {sleep.dailyGoal}h goal
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Goal reached */}
            {goalReached && !isSleeping && (
              <div className="flex items-center gap-2 mt-3 text-green-400 animate-in fade-in">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">Well rested!</span>
              </div>
            )}
          </div>

          {/* Sleep/Wake buttons */}
          <div className="space-y-3">
            {isSleeping ? (
              <div className="space-y-3">
                {/* Quality rating before waking */}
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 text-center block">
                    How did you sleep?
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setQuality(rating as 1 | 2 | 3 | 4 | 5)}
                        className={`p-2 rounded-lg transition-all ${
                          quality >= rating
                            ? 'text-yellow-400'
                            : 'text-zinc-600'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${quality >= rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleEndSleep}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Wake Up
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleStartSleep}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Going to Sleep
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="w-full border-zinc-600"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Log Past Sleep
                </Button>
              </>
            )}
          </div>

          {/* Manual entry form */}
          {showManualEntry && !isSleeping && (
            <div className="space-y-4 p-4 bg-zinc-800/50 rounded-xl animate-in fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500">Slept at</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setManualSleepHour((h) => (h - 1 + 24) % 24)}
                      className="h-8 w-8"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-lg font-mono w-12 text-center">
                      {manualSleepHour.toString().padStart(2, '0')}:00
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setManualSleepHour((h) => (h + 1) % 24)}
                      className="h-8 w-8"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-500">Woke at</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setManualWakeHour((h) => (h - 1 + 24) % 24)}
                      className="h-8 w-8"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-lg font-mono w-12 text-center">
                      {manualWakeHour.toString().padStart(2, '0')}:00
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setManualWakeHour((h) => (h + 1) % 24)}
                      className="h-8 w-8"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quality rating */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Sleep quality</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setQuality(rating as 1 | 2 | 3 | 4 | 5)}
                      className={`p-2 rounded-lg transition-all ${
                        quality >= rating
                          ? 'text-yellow-400'
                          : 'text-zinc-600'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${quality >= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleManualEntry}
                className="w-full bg-violet-600 hover:bg-violet-500"
              >
                Log Sleep
              </Button>
            </div>
          )}

          {/* Week overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">This week</span>
              <div className="flex items-center gap-3 text-xs">
                {sleep.streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-3 h-3" />
                    <span>{sleep.streak}d streak</span>
                  </div>
                )}
                <span className="text-zinc-400">
                  Avg: {formatHours(avgSleep)}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-1 h-12">
              {weekData.map((day, i) => {
                const height = Math.max(4, (day.hours / 10) * 100);
                const isToday = i === 6;
                const metGoal = day.hours >= sleep.dailyGoal;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t transition-all ${
                        metGoal
                          ? 'bg-gradient-to-t from-violet-600 to-violet-400'
                          : day.hours > 0
                          ? 'bg-violet-500/50'
                          : isToday
                          ? 'bg-zinc-700'
                          : 'bg-zinc-800'
                      }`}
                      style={{ height: `${Math.min(height, 100)}%` }}
                    />
                    <span className={`text-[10px] ${isToday ? 'text-violet-400' : 'text-zinc-600'}`}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(day.date).getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal adjuster */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <span className="text-sm text-zinc-400">Daily goal</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSleepGoal(Math.max(5, sleep.dailyGoal - 1))}
                className="h-7 w-7 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-medium w-10 text-center">{sleep.dailyGoal}h</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSleepGoal(Math.min(12, sleep.dailyGoal + 1))}
                className="h-7 w-7 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact sleep status button
export function SleepStatusButton({ onClick }: { onClick: () => void }) {
  const sleep = useWellnessStore(state => state.sleep);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  const todayHours = useMemo(() => getTodaySleepHours(sleep), [sleep]);
  const isSleeping = sleep.currentSleep !== null;

  if (!enabledFeatures.sleep) return null;

  const formatHours = (hours: number): string => {
    if (hours === 0) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  return (
    <button
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all touch-manipulation ${
        isSleeping
          ? 'bg-violet-500/30 border border-violet-500/50 text-violet-300 animate-pulse'
          : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400'
      }`}
    >
      {isSleeping ? (
        <>
          <Moon className="w-4 h-4" />
          <span>Sleeping</span>
        </>
      ) : (
        <>
          <Bed className="w-4 h-4" />
          <span>{formatHours(todayHours)}</span>
        </>
      )}
    </button>
  );
}
