'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWellnessStore, type AnxietyLevel } from '@/lib/wellness';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Anchor, Wind, Hand, Heart, Sparkles, X } from 'lucide-react';

interface AnxietyAnchorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANXIETY_LEVELS: { level: AnxietyLevel; label: string; description: string; color: string; recommended: string }[] = [
  {
    level: 'mild',
    label: 'Mild',
    description: 'Slight unease or tension',
    color: 'text-green-400 border-green-500/30 bg-green-500/10',
    recommended: 'tap',
  },
  {
    level: 'moderate',
    label: 'Moderate',
    description: 'Noticeable worry or restlessness',
    color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    recommended: 'hold',
  },
  {
    level: 'intense',
    label: 'Intense',
    description: 'Overwhelming feelings',
    color: 'text-red-400 border-red-500/30 bg-red-500/10',
    recommended: 'breath',
  },
];

const GROUNDING_EXERCISES: {
  type: 'tap' | 'hold' | 'breath';
  name: string;
  icon: React.ReactNode;
  instructions: string[];
  duration: number;
}[] = [
  {
    type: 'tap',
    name: '5-4-3-2-1 Grounding',
    icon: <Hand className="w-6 h-6" />,
    instructions: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste',
    ],
    duration: 60000,
  },
  {
    type: 'hold',
    name: 'Body Anchor',
    icon: <Anchor className="w-6 h-6" />,
    instructions: [
      'Feel your feet on the ground',
      'Notice the weight of your body',
      'Press your palms together firmly',
      'Hold for 5 seconds',
      'Release and breathe',
    ],
    duration: 30000,
  },
  {
    type: 'breath',
    name: '4-4-4 Box Breathing',
    icon: <Wind className="w-6 h-6" />,
    instructions: [
      'Breathe in for 4 seconds',
      'Hold for 4 seconds',
      'Breathe out for 4 seconds',
      'Repeat 3-4 times',
    ],
    duration: 48000,
  },
];

export function AnxietyAnchor({ isOpen, onClose }: AnxietyAnchorProps) {
  const [selectedLevel, setSelectedLevel] = useState<AnxietyLevel | null>(null);
  const [activeExercise, setActiveExercise] = useState<typeof GROUNDING_EXERCISES[0] | null>(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('rest');
  const [progress, setProgress] = useState(0);

  const logGroundingSession = useWellnessStore(state => state.logGroundingSession);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const completeExerciseRef = useRef<(completed: boolean) => void>(() => {});

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const startExercise = useCallback((exercise: typeof GROUNDING_EXERCISES[0]) => {
    setActiveExercise(exercise);
    setExerciseStep(0);
    setIsActive(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    triggerHaptic('medium');

    if (exercise.type === 'breath') {
      // Box breathing: 4s in, 4s hold, 4s out
      const cycleLength = 12000;
      setBreathPhase('inhale');

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const cyclePosition = elapsed % cycleLength;

        if (cyclePosition < 4000) {
          setBreathPhase('inhale');
        } else if (cyclePosition < 8000) {
          setBreathPhase('hold');
        } else {
          setBreathPhase('exhale');
        }

        const overallProgress = Math.min((elapsed / exercise.duration) * 100, 100);
        setProgress(overallProgress);

        if (elapsed >= exercise.duration) {
          completeExerciseRef.current(true);
        }
      }, 100);
    } else {
      // For tap and hold, use step-based progression
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const stepDuration = exercise.duration / exercise.instructions.length;
        const currentStep = Math.min(
          Math.floor(elapsed / stepDuration),
          exercise.instructions.length - 1
        );

        setExerciseStep(currentStep);
        setProgress(Math.min((elapsed / exercise.duration) * 100, 100));

        if (elapsed >= exercise.duration) {
          completeExerciseRef.current(true);
        }
      }, 100);
    }
  }, []);

  const completeExercise = useCallback((completed: boolean) => {
    clearTimers();
    const duration = Date.now() - startTimeRef.current;

    if (selectedLevel && activeExercise) {
      logGroundingSession(
        selectedLevel,
        activeExercise.type,
        duration,
        completed
      );
    }

    triggerHaptic(completed ? 'medium' : 'light');

    setIsActive(false);
    setActiveExercise(null);
    setExerciseStep(0);
    setBreathPhase('rest');
    setProgress(0);

    if (completed) {
      // Show completion feedback briefly then reset
      setTimeout(() => {
        setSelectedLevel(null);
      }, 2000);
    }
  }, [selectedLevel, activeExercise, logGroundingSession, clearTimers]);


  useEffect(() => {
    completeExerciseRef.current = completeExercise;
  }, [completeExercise]);

  const handleClose = useCallback(() => {
    if (isActive) {
      completeExercise(false);
    }
    setSelectedLevel(null);
    setActiveExercise(null);
    onClose();
  }, [isActive, completeExercise, onClose]);

  if (!enabledFeatures.anxiety) return null;

  // Get recommended exercise for selected level
  const recommendedExercise = selectedLevel
    ? GROUNDING_EXERCISES.find(e => e.type === ANXIETY_LEVELS.find(l => l.level === selectedLevel)?.recommended)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900/95 border-indigo-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-400">
            <Anchor className="w-5 h-5" />
            Grounding Anchor
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Active Exercise View */}
          {isActive && activeExercise ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Exercise header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-3">
                  {activeExercise.icon}
                </div>
                <h3 className="text-lg font-medium text-white">{activeExercise.name}</h3>
              </div>

              {/* Progress ring */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
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
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#anchor-gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 3.52} 352`}
                      className="transition-all duration-100"
                    />
                    <defs>
                      <linearGradient id="anchor-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {activeExercise.type === 'breath' ? (
                      <span className={`text-lg font-medium capitalize transition-all ${
                        breathPhase === 'inhale' ? 'text-blue-400 scale-110' :
                        breathPhase === 'hold' ? 'text-purple-400' :
                        breathPhase === 'exhale' ? 'text-indigo-400 scale-90' :
                        'text-zinc-400'
                      }`}>
                        {breathPhase}
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-indigo-400">
                        {exerciseStep + 1}/{activeExercise.instructions.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current instruction */}
              <div className="text-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-indigo-200 text-lg">
                  {activeExercise.type === 'breath'
                    ? breathPhase === 'inhale' ? 'Breathe in slowly...'
                    : breathPhase === 'hold' ? 'Hold gently...'
                    : breathPhase === 'exhale' ? 'Breathe out slowly...'
                    : 'Get ready...'
                    : activeExercise.instructions[exerciseStep]
                  }
                </p>
              </div>

              {/* Cancel button */}
              <Button
                variant="outline"
                onClick={() => completeExercise(false)}
                className="w-full border-zinc-600"
              >
                <X className="w-4 h-4 mr-2" />
                End Early
              </Button>
            </div>
          ) : (
            <>
              {/* Level selection */}
              {!selectedLevel ? (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-sm text-center">
                    How are you feeling right now?
                  </p>

                  <div className="space-y-2">
                    {ANXIETY_LEVELS.map((item) => (
                      <button
                        key={item.level}
                        onClick={() => {
                          setSelectedLevel(item.level);
                          triggerHaptic('light');
                        }}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${item.color} hover:scale-[1.02] touch-manipulation`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm opacity-70">{item.description}</p>
                          </div>
                          <Sparkles className="w-5 h-5 opacity-50" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Exercise selection */
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedLevel(null)}
                      className="text-sm text-zinc-400 hover:text-white"
                    >
                      ← Back
                    </button>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      ANXIETY_LEVELS.find(l => l.level === selectedLevel)?.color
                    }`}>
                      {ANXIETY_LEVELS.find(l => l.level === selectedLevel)?.label}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-sm text-center">
                    Choose a grounding exercise
                  </p>

                  <div className="space-y-2">
                    {GROUNDING_EXERCISES.map((exercise) => {
                      const isRecommended = exercise === recommendedExercise;
                      return (
                        <button
                          key={exercise.type}
                          onClick={() => startExercise(exercise)}
                          className={`w-full p-4 rounded-xl border transition-all text-left touch-manipulation ${
                            isRecommended
                              ? 'bg-indigo-500/20 border-indigo-500/50 ring-2 ring-indigo-500/30'
                              : 'bg-zinc-800/50 border-zinc-700 hover:border-indigo-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isRecommended ? 'bg-indigo-500/30' : 'bg-zinc-700'}`}>
                              {exercise.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{exercise.name}</p>
                                {isRecommended && (
                                  <span className="text-xs px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400">
                                ~{Math.round(exercise.duration / 1000)}s
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Completion message */}
          {!isActive && !selectedLevel && progress === 0 && (
            <p className="text-xs text-zinc-500 text-center">
              Your companion is here with you. Take all the time you need.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Emergency quick-access button
export function EmergencyGroundingButton({ onClick }: { onClick: () => void }) {
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  if (!enabledFeatures.anxiety) return null;

  return (
    <button
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-full text-indigo-300 text-sm transition-all touch-manipulation"
    >
      <Anchor className="w-4 h-4" />
      <span>Ground Me</span>
    </button>
  );
}
