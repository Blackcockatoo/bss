'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { isVimanaNodeDiscovered } from '@/lib/vimana';
import { useRealtimeResponse } from '@/lib/realtime/useRealtimeResponse';
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

      }

      // Detect Vimana exploration
      if (state.vimana && prevState.vimana) {
        const discoveredCount = state.vimana.nodes.filter(isVimanaNodeDiscovered).length;
        const prevDiscoveredCount = prevState.vimana.nodes.filter(isVimanaNodeDiscovered).length;

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

  if (!currentResponse && responseHistory.length === 0) return null;

  return (
    <section aria-label="Companion responses" className="mt-4 min-w-0 space-y-2 text-sm">
      {currentResponse && isVisible && (
        <p role="status" className="rounded-xl border border-cyan-800/60 bg-slate-950/80 px-4 py-3 leading-relaxed text-cyan-100 break-words">
          <span aria-hidden="true" className="mr-2">{currentResponse.emoji}</span>
          {currentResponse.text}
        </p>
      )}
      {responseHistory.length > 0 && (
        <details className="rounded-xl border border-slate-700/60 bg-slate-950/60 px-3">
          <summary className="min-h-11 cursor-pointer content-center py-3 text-slate-300">Recent companion responses</summary>
          <ol className="space-y-2 pb-3 text-slate-300">
            {responseHistory.slice(0, 5).map((response, index) => (
              <li key={`${response.id}-${index}`} className="rounded-lg bg-slate-900 px-3 py-2 leading-relaxed break-words">
                <span aria-hidden="true" className="mr-2">{response.emoji}</span>
                {response.text}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
