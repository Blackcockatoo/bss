'use client';

import { useState, useMemo } from 'react';
import { useWellnessStore, getTodayHydration, getDateKey } from '@/lib/wellness';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Droplets, Plus, Minus, Flame, TrendingUp } from 'lucide-react';

interface HydrationTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HydrationTracker({ isOpen, onClose }: HydrationTrackerProps) {
  const hydration = useWellnessStore(state => state.hydration);
  const logWater = useWellnessStore(state => state.logWater);
  const setHydrationGoal = useWellnessStore(state => state.setHydrationGoal);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  const [quickAdd, setQuickAdd] = useState(1);

  const todayTotal = useMemo(() => getTodayHydration(hydration), [hydration]);
  const progress = Math.min((todayTotal / hydration.dailyGoal) * 100, 100);
  const goalReached = todayTotal >= hydration.dailyGoal;

  // Get last 7 days data for mini chart
  const weekData = useMemo(() => {
    const days: { date: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDateKey(Date.now() - i * 86400000);
      const total = hydration.entries
        .filter(e => getDateKey(e.timestamp) === date)
        .reduce((sum, e) => sum + e.amount, 0);
      days.push({ date, total });
    }
    return days;
  }, [hydration.entries]);

  const handleLogWater = () => {
    logWater(quickAdd);
    triggerHaptic('medium');
  };

  if (!enabledFeatures.hydration) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900/95 border-cyan-500/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-400">
            <Droplets className="w-5 h-5" />
            Hydration Tracker
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Main progress ring */}
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
                  stroke="url(#hydration-gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 3.52} 352`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="hydration-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-cyan-400">
                  {todayTotal}
                </span>
                <span className="text-xs text-zinc-500">
                  / {hydration.dailyGoal} glasses
                </span>
              </div>
            </div>

            {/* Goal reached message */}
            {goalReached && (
              <div className="flex items-center gap-2 mt-3 text-green-400 animate-in fade-in">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">Goal reached!</span>
              </div>
            )}
          </div>

          {/* Quick add controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuickAdd(Math.max(1, quickAdd - 1))}
              className="border-zinc-600 h-10 w-10"
            >
              <Minus className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 rounded-lg min-w-[80px] justify-center">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <span className="text-xl font-bold text-cyan-300">{quickAdd}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuickAdd(Math.min(5, quickAdd + 1))}
              className="border-zinc-600 h-10 w-10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleLogWater}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium"
          >
            <Droplets className="w-4 h-4 mr-2" />
            Log {quickAdd} glass{quickAdd > 1 ? 'es' : ''}
          </Button>

          {/* Week overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">This week</span>
              {hydration.streak > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-400">
                  <Flame className="w-3 h-3" />
                  <span>{hydration.streak} day streak</span>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between gap-1 h-12">
              {weekData.map((day, i) => {
                const height = Math.max(4, (day.total / hydration.dailyGoal) * 100);
                const isToday = i === 6;
                const metGoal = day.total >= hydration.dailyGoal;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t transition-all ${
                        metGoal
                          ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                          : isToday
                          ? 'bg-cyan-500/50'
                          : 'bg-zinc-700'
                      }`}
                      style={{ height: `${Math.min(height, 100)}%` }}
                    />
                    <span className={`text-[10px] ${isToday ? 'text-cyan-400' : 'text-zinc-600'}`}>
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
                onClick={() => setHydrationGoal(Math.max(4, hydration.dailyGoal - 1))}
                className="h-7 w-7 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">{hydration.dailyGoal}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHydrationGoal(Math.min(16, hydration.dailyGoal + 1))}
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

// Floating quick-add button
export function HydrationQuickButton({ onClick }: { onClick: () => void }) {
  const hydration = useWellnessStore(state => state.hydration);
  const logWater = useWellnessStore(state => state.logWater);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  const todayTotal = useMemo(() => getTodayHydration(hydration), [hydration]);
  const progress = Math.min((todayTotal / hydration.dailyGoal) * 100, 100);

  if (!enabledFeatures.hydration) return null;

  const handleQuickLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    logWater(1);
    triggerHaptic('medium');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick log button */}
      <button
        onClick={handleQuickLog}
        className="flex items-center justify-center w-12 h-12 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-full text-cyan-400 transition-all touch-manipulation active:scale-95"
        title="Log 1 glass"
      >
        <Droplets className="w-5 h-5" />
      </button>

      {/* Progress indicator */}
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-full text-sm transition-all touch-manipulation"
      >
        <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-cyan-400 font-medium">{todayTotal}/{hydration.dailyGoal}</span>
      </button>
    </div>
  );
}
