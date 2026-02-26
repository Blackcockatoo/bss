'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useRealtimeResponse } from '@/lib/realtime/useRealtimeResponse';
import { ResponseBubble } from '@/components/ResponseBubble';
import { playHepta } from '@/lib/identity/hepta';
import type { ResponseContext } from '@/lib/realtime/responseSystem';

interface PetResponseOverlayProps {
  enableAudio?: boolean;
  enableAnticipation?: boolean;
}

/**
 * PetResponseOverlay - Integrates the real-time response system with the Zustand store
 * Automatically displays responses for pet interactions and game events
 */
export function PetResponseOverlay({ enableAudio = true, enableAnticipation = true }: PetResponseOverlayProps) {
  const vitals = useStore(state => state.vitals);
  const evolution = useStore(state => state.evolution);
  const achievements = useStore(state => state.achievements);

  // Build context from Zustand store
  const context: ResponseContext = {
    mood: vitals.mood,
    energy: vitals.energy,
    hunger: vitals.hunger,
    hygiene: vitals.hygiene,
    recentActions: [], // Could be tracked separately if needed
    evolutionStage: evolution.state,
  };

  // Audio callback for playing HeptaCode tones
  const handleAudioTrigger = useCallback(async (digits: number[]) => {
    try {
      await playHepta(digits as readonly number[], {
        tempo: 200,
        volume: 0.15,
        sustainRatio: 0.7,
      });
    } catch (error) {
      console.warn('Failed to play audio feedback:', error);
    }
  }, []);

  // Initialize response system with Zustand context
  const {
    currentResponse,
    isVisible,
    triggerResponse,
    responseHistory,
  } = useRealtimeResponse(context, {
    enableAudio,
    enableAnticipation,
    onAudioTrigger: handleAudioTrigger,
    autoIdleInterval: 12000, // Show idle responses every 12 seconds
  });

  // Listen for store actions and trigger appropriate responses
  useEffect(() => {
    // Subscribe to store actions via state changes
    const unsubscribe = useStore.subscribe((state, prevState) => {
      // Detect feeding
      if (state.vitals.hunger < prevState.vitals.hunger && prevState.vitals.hunger - state.vitals.hunger >= 10) {
        triggerResponse('feed');
      }

      // Detect playing
      if (state.vitals.mood > prevState.vitals.mood && prevState.vitals.mood - state.vitals.mood <= -10) {
        triggerResponse('play');
      }

      // Detect cleaning
      if (state.vitals.hygiene > prevState.vitals.hygiene && state.vitals.hygiene - prevState.vitals.hygiene >= 10) {
        triggerResponse('clean');
      }

      // Detect energy recovery (sleeping/resting)
      if (state.vitals.energy > prevState.vitals.energy && state.vitals.energy - prevState.vitals.energy >= 15) {
        triggerResponse('sleep');
      }

      // Detect evolution
      if (state.evolution.state !== prevState.evolution.state) {
        triggerResponse('evolution');
      }

      // Detect achievements
      if (state.achievements.length > prevState.achievements.length) {
        triggerResponse('achievement');
      }

      // Detect battle wins
      if (state.battle && prevState.battle) {
        if (state.battle.wins > prevState.battle.wins) {
          triggerResponse('battle_victory');
        }
        if (state.battle.losses > prevState.battle.losses) {
          triggerResponse('battle_defeat');
        }
      }

      // Detect mini-game score improvements
      if (state.miniGames && prevState.miniGames) {
        if (state.miniGames.memoryHighScore > prevState.miniGames.memoryHighScore) {
          triggerResponse('minigame_victory');
        }
        if (state.miniGames.rhythmHighScore > prevState.miniGames.rhythmHighScore) {
          triggerResponse('minigame_victory');
        }

        // Detect Space Jewbles run completion
        if (state.miniGames.spaceJewblesRunsPlayed > prevState.miniGames.spaceJewblesRunsPlayed) {
          if (state.miniGames.spaceJewblesHighScore > prevState.miniGames.spaceJewblesHighScore) {
            triggerResponse('jewbles_high_score');
          } else if (state.miniGames.spaceJewblesBossesDefeated > prevState.miniGames.spaceJewblesBossesDefeated) {
            triggerResponse('jewbles_boss');
          } else {
            triggerResponse('jewbles_run');
          }
        }
      }

      // Detect Vimana exploration
      if (state.vimana && prevState.vimana) {
        const discoveredCount = state.vimana.cells.filter(c => c.discovered).length;
        const prevDiscoveredCount = prevState.vimana.cells.filter(c => c.discovered).length;

        if (discoveredCount > prevDiscoveredCount) {
          triggerResponse('exploration_discovery');
        }

        const resolvedCount = state.vimana.anomaliesResolved ?? 0;
        const prevResolvedCount = prevState.vimana.anomaliesResolved ?? 0;

        if (resolvedCount > prevResolvedCount) {
          triggerResponse('exploration_anomaly');
        }
      }
    });

    return () => unsubscribe();
  }, [triggerResponse]);

  return (
    <>
      <ResponseBubble response={currentResponse} isVisible={isVisible} />

      {/* Optional: Response History Display */}
      {responseHistory.length > 0 && (
        <div className="fixed bottom-6 right-6 w-72 max-h-56 overflow-y-auto pointer-events-none z-40 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="space-y-2">
            {responseHistory.slice(0, 5).map((response, index) => (
              <div
                key={response.id}
                className="text-sm bg-slate-900/90 backdrop-blur-md rounded-xl px-4 py-3 text-white/70 border border-slate-700/60 shadow-lg transition-all duration-300"
                style={{
                  opacity: Math.max(0.4, 1 - index * 0.15),
                  transform: `translateY(${index * 2}px)`
                }}
              >
                <span className="mr-3 text-lg">{response.emoji}</span>
                <span className="font-light">{response.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
