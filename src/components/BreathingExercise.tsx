'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';

interface BreathingExerciseProps {
  onComplete?: () => void;
  className?: string;
}

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

const PHASE_DURATIONS = {
  inhale: 4000,
  hold: 4000,
  exhale: 4000,
};

const TOTAL_CYCLES = 3;

const PHASE_INSTRUCTIONS: Record<BreathPhase, string> = {
  idle: 'Ready to begin',
  inhale: 'Breathe in...',
  hold: 'Hold...',
  exhale: 'Breathe out...',
  complete: 'Well done',
};

const PHASE_COLORS: Record<BreathPhase, string> = {
  idle: 'bg-gray-200 dark:bg-gray-700',
  inhale: 'bg-blue-400',
  hold: 'bg-purple-400',
  exhale: 'bg-teal-400',
  complete: 'bg-green-400',
};

export function BreathingExercise({ onComplete, className }: BreathingExerciseProps) {
  const [phase, setPhase] = React.useState<BreathPhase>('idle');
  const [cycle, setCycle] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);

  const startExercise = () => {
    setIsRunning(true);
    setCycle(1);
    setPhase('inhale');
  };

  const stopExercise = () => {
    setIsRunning(false);
    setPhase('idle');
    setCycle(0);
  };

  // Phase progression
  React.useEffect(() => {
    if (!isRunning) return;

    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'inhale') {
      timer = setTimeout(() => setPhase('hold'), PHASE_DURATIONS.inhale);
    } else if (phase === 'hold') {
      timer = setTimeout(() => setPhase('exhale'), PHASE_DURATIONS.hold);
    } else if (phase === 'exhale') {
      timer = setTimeout(() => {
        if (cycle < TOTAL_CYCLES) {
          setCycle(c => c + 1);
          setPhase('inhale');
        } else {
          setPhase('complete');
          setIsRunning(false);
          onComplete?.();
        }
      }, PHASE_DURATIONS.exhale);
    }

    return () => clearTimeout(timer);
  }, [phase, cycle, isRunning, onComplete]);

  const circleScale = {
    idle: 0.6,
    inhale: 1,
    hold: 1,
    exhale: 0.6,
    complete: 0.8,
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span></span>
          Breathe Together
        </CardTitle>
        <CardDescription>
          A moment of calm with your companion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-6">
          {/* Breathing circle */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            {/* Background ring */}
            <div className="absolute inset-0 rounded-full border-4 border-muted opacity-30" />

            {/* Animated circle */}
            <motion.div
              className={cn(
                'rounded-full flex items-center justify-center',
                PHASE_COLORS[phase]
              )}
              initial={{ width: 100, height: 100 }}
              animate={{
                width: 150 * circleScale[phase],
                height: 150 * circleScale[phase],
              }}
              transition={{
                duration: phase === 'idle' || phase === 'complete'
                  ? 0.5
                  : PHASE_DURATIONS[phase as keyof typeof PHASE_DURATIONS] / 1000,
                ease: phase === 'exhale' ? 'easeOut' : 'easeInOut',
              }}
            >
              {/* Inner content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white text-center"
                >
                  {phase === 'complete' ? (
                    <span className="text-3xl"></span>
                  ) : phase !== 'idle' ? (
                    <span className="text-4xl font-light">{cycle}/{TOTAL_CYCLES}</span>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Instructions */}
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg font-medium text-center mb-6"
            >
              {PHASE_INSTRUCTIONS[phase]}
            </motion.p>
          </AnimatePresence>

          {/* Controls */}
          {phase === 'idle' && (
            <Button onClick={startExercise} size="lg">
              Begin
            </Button>
          )}

          {isRunning && (
            <Button variant="ghost" onClick={stopExercise}>
              Stop
            </Button>
          )}

          {phase === 'complete' && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                You completed {TOTAL_CYCLES} breathing cycles
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setPhase('idle')}>
                  Done
                </Button>
                <Button onClick={startExercise}>
                  Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Subtle guide */}
        {phase === 'idle' && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            4 seconds in · 4 seconds hold · 4 seconds out
          </p>
        )}
      </CardContent>
    </Card>
  );
}
