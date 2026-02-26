'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';

interface AmbientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Ambient background that shifts colors based on pet mood/vitals
 * Creates a cohesive, living atmosphere for the app
 */
export function AmbientBackground({ children, className = '' }: AmbientBackgroundProps) {
  const vitals = useStore(state => state.vitals);

  // Calculate overall pet "wellness" to determine ambient color
  const moodData = useMemo(() => {
    const avgVitals = (vitals.hunger + vitals.hygiene + vitals.mood + vitals.energy) / 4;

    // Determine dominant mood based on vitals
    let dominantMood: 'happy' | 'neutral' | 'tired' | 'hungry' | 'sad' = 'neutral';

    if (avgVitals >= 70) {
      dominantMood = 'happy';
    } else if (vitals.energy < 30) {
      dominantMood = 'tired';
    } else if (vitals.hunger < 30) {
      dominantMood = 'hungry';
    } else if (avgVitals < 40) {
      dominantMood = 'sad';
    }

    // Color schemes for different moods
    const moodColors = {
      happy: {
        from: 'from-slate-950',
        via: 'via-emerald-950/30',
        to: 'to-cyan-950/20',
        accent: 'rgba(52, 211, 153, 0.1)', // emerald
      },
      neutral: {
        from: 'from-slate-950',
        via: 'via-purple-950/30',
        to: 'to-slate-900',
        accent: 'rgba(139, 92, 246, 0.1)', // purple
      },
      tired: {
        from: 'from-slate-950',
        via: 'via-indigo-950/40',
        to: 'to-slate-950',
        accent: 'rgba(99, 102, 241, 0.08)', // indigo
      },
      hungry: {
        from: 'from-slate-950',
        via: 'via-orange-950/30',
        to: 'to-slate-900',
        accent: 'rgba(251, 146, 60, 0.1)', // orange
      },
      sad: {
        from: 'from-slate-950',
        via: 'via-slate-900',
        to: 'to-slate-950',
        accent: 'rgba(148, 163, 184, 0.05)', // slate
      },
    };

    return {
      mood: dominantMood,
      colors: moodColors[dominantMood],
      wellness: avgVitals,
    };
  }, [vitals]);

  return (
    <div
      className={`relative min-h-screen transition-all duration-1000 ease-in-out ${className}`}
      style={{
        background: `linear-gradient(135deg,
          hsl(222, 47%, 4%) 0%,
          ${moodData.colors.accent} 50%,
          hsl(222, 47%, 6%) 100%)`,
      }}
    >
      {/* Gradient overlay that responds to mood */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${moodData.colors.from} ${moodData.colors.via} ${moodData.colors.to} transition-all duration-1000`}
      />

      {/* Ambient glow based on wellness */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${moodData.colors.accent} 0%, transparent 50%)`,
          opacity: moodData.wellness / 100,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
