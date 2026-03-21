'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { triggerHaptic } from '@/lib/haptics';
import AuraliaSprite from './AuraliaSprite';
import { SriYantraPetDisplay } from './SriYantraPetDisplay';

interface PetHeroProps {
  className?: string;
  staticMode?: boolean;
}

/**
 * Pet Hero Section - The main focal point of the app
 * Supports gesture controls and shows the pet prominently
 */
export function PetHero({ className = '', staticMode = false }: PetHeroProps) {
  const petType = useStore(state => state.petType);
  const feed = useStore(state => state.feed);
  const play = useStore(state => state.play);
  const clean = useStore(state => state.clean);
  const sleep = useStore(state => state.sleep);
  const systemState = useStore(state => state.systemState);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [gestureIndicator, setGestureIndicator] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show gesture feedback
  const showGesture = useCallback((gesture: string) => {
    setGestureIndicator(gesture);
    setTimeout(() => setGestureIndicator(null), 800);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  // Handle touch end - detect gestures
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (systemState === 'sealed') return;
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    const minSwipeDistance = 50;
    const maxTapDuration = 300;

    // Check for swipe
    if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe - Play
        triggerHaptic('medium');
        play();
        showGesture('Play!');
      } else if (dy < -minSwipeDistance) {
        // Swipe up - Clean
        triggerHaptic('medium');
        clean();
        showGesture('Clean!');
      } else if (dy > minSwipeDistance) {
        // Swipe down - Feed
        triggerHaptic('medium');
        feed();
        showGesture('Feed!');
      }
    } else if (duration < maxTapDuration) {
      // It's a tap - track for double tap
      setTapCount(prev => {
        const newCount = prev + 1;

        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }

        if (newCount === 2) {
          // Double tap - Sleep/Rest
          triggerHaptic('heavy');
          sleep();
          showGesture('Rest...');
          return 0;
        }

        // Wait for potential second tap
        tapTimeoutRef.current = setTimeout(() => {
          if (newCount === 1) {
            // Single tap - Pet/Love
            triggerHaptic('light');
            showGesture('Love!');
          }
          setTapCount(0);
        }, 300);

        return newCount;
      });
    }

    touchStartRef.current = null;
  }, [clean, feed, play, showGesture, sleep, systemState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col items-center justify-center ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-64 h-64 flex items-center justify-center">
        {petType === 'geometric' ? (
          <SriYantraPetDisplay animated={!staticMode} />
        ) : (
          <AuraliaSprite size="large" interactive staticMode={staticMode} />
        )}

        {/* Gesture Indicator Overlay */}
        {gestureIndicator && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="px-4 py-2 bg-black/70 backdrop-blur-sm rounded-xl border border-white/20 animate-bounce">
              <span className="text-white font-semibold text-lg">{gestureIndicator}</span>
            </div>
          </div>
        )}
      </div>

      {/* Gesture Hint */}
      <div className="mt-4 text-center">
        <p className="text-zinc-500 text-xs">
          {systemState === 'sealed'
            ? 'Stillness holds • gestures are quiet'
            : 'Swipe to interact • Double-tap to rest'}
        </p>
      </div>
    </div>
  );
}
