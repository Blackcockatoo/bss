/**
 * Consciousness Hook
 * Manages unified consciousness state that blends genetics, behavior, and environment
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DerivedTraits } from '@/genome/types';
import type { GuardianStats, GuardianPosition, GuardianField, GuardianDrive, ComfortState, ExpandedEmotionalState, GuardianAIMode, GBSPState } from '../../shared/auralia/guardianBehavior';
import { calculateDrives, calculateComfort, getExpandedEmotionalState, calculateGBSPState } from '../../shared/auralia/guardianBehavior';
import {
  type ConsciousnessState,
  initializeConsciousness,
  applyGeneticModulation,
  refineEmotionalExpression,
  getEffectivePersonality,
  emotionToParticleParams,
  recordExperience,
  consciousnessToResponseContext,
} from './consciousness';

export interface UseConsciousnessOptions {
  traits: DerivedTraits;
  initialVitals: GuardianStats;
  field: GuardianField;
  position: GuardianPosition;
  fieldResonance: number;
}

export interface ConsciousnessActions {
  recordAction: (action: string, impact: number) => void;
  updateVitals: (vitals: Partial<GuardianStats>) => void;
  updatePosition: (position: Partial<GuardianPosition>) => void;
  updateContext: (context: { fieldResonance?: number; timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night' }) => void;
  getParticleParams: () => ReturnType<typeof emotionToParticleParams>;
  getResponseContext: (vitals: { mood: number; energy: number; hunger: number; hygiene: number }) => ReturnType<typeof consciousnessToResponseContext>;
}

/**
 * Main consciousness hook - unifies genetics, behavior, sentiment
 */
export function useConsciousness({
  traits,
  initialVitals,
  field,
  position,
  fieldResonance,
}: UseConsciousnessOptions): [ConsciousnessState, ConsciousnessActions] {
  // Initialize consciousness state
  const [consciousness, setConsciousness] = useState<ConsciousnessState>(() =>
    initializeConsciousness(traits, initialVitals, position, fieldResonance)
  );

  // Track previous GBSP state for continuity
  const prevGBSPRef = useRef<GBSPState | null>(null);

  // Update consciousness based on current state
  const updateConsciousness = useCallback((
    currentVitals: GuardianStats,
    currentPosition: GuardianPosition,
    currentFieldResonance: number,
    mode: GuardianAIMode,
    awareness: number[],
    sigilPoints: any[]
  ) => {
    setConsciousness(prev => {
      const effectivePersonality = getEffectivePersonality(prev);

      // Calculate base drives from guardian behavior system
      const baseDrives = calculateDrives(
        currentPosition,
        field,
        currentVitals,
        awareness,
        Date.now()
      );

      // Apply genetic modulation - personality influences drives
      const modulatedDrives = applyGeneticModulation(baseDrives, effectivePersonality);

      // Calculate comfort from drives
      const comfort = calculateComfort(modulatedDrives);

      // Calculate full GBSP state
      const gbspState = calculateGBSPState(
        currentPosition,
        field,
        currentVitals,
        awareness,
        mode,
        currentFieldResonance,
        sigilPoints,
        prevGBSPRef.current,
        Date.now()
      );

      // Store for next update
      prevGBSPRef.current = gbspState;

      // Get base emotional state from GBSP
      const baseEmotion = gbspState.emotionalState;

      // Refine emotional expression based on personality
      const refinedEmotion = refineEmotionalExpression(
        baseEmotion,
        effectivePersonality,
        field.prng
      );

      return {
        ...prev,
        expression: {
          emotional: refinedEmotion,
          drives: modulatedDrives,
          comfort,
          vitals: currentVitals,
        },
        context: {
          position: currentPosition,
          fieldResonance: currentFieldResonance,
          timeOfDay: prev.context.timeOfDay, // Will be updated separately
        },
      };
    });
  }, [field]);

  // Actions
  const recordAction = useCallback((action: string, impact: number) => {
    setConsciousness(prev => {
      return recordExperience(prev, action, prev.expression.emotional, impact);
    });
  }, []);

  const updateVitals = useCallback((vitals: Partial<GuardianStats>) => {
    setConsciousness(prev => ({
      ...prev,
      expression: {
        ...prev.expression,
        vitals: {
          ...prev.expression.vitals,
          ...vitals,
        },
      },
    }));
  }, []);

  const updatePosition = useCallback((newPosition: Partial<GuardianPosition>) => {
    setConsciousness(prev => ({
      ...prev,
      context: {
        ...prev.context,
        position: {
          ...prev.context.position,
          ...newPosition,
        },
      },
    }));
  }, []);

  const updateContext = useCallback((context: { fieldResonance?: number; timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night' }) => {
    setConsciousness(prev => ({
      ...prev,
      context: {
        ...prev.context,
        ...context,
      },
    }));
  }, []);

  const getParticleParams = useCallback(() => {
    return emotionToParticleParams(
      consciousness.expression.emotional,
      consciousness.expression.comfort,
      consciousness.expression.drives
    );
  }, [consciousness.expression]);

  const getResponseContext = useCallback((vitals: { mood: number; energy: number; hunger: number; hygiene: number }) => {
    return consciousnessToResponseContext(consciousness, vitals);
  }, [consciousness]);

  const actions: ConsciousnessActions = {
    recordAction,
    updateVitals,
    updatePosition,
    updateContext,
    getParticleParams,
    getResponseContext,
  };

  return [consciousness, actions];
}

/**
 * Helper hook to sync consciousness with guardian AI state
 * Call this in your component's useEffect when AI state changes
 */
export function useSyncConsciousness(
  actions: ConsciousnessActions,
  vitals: GuardianStats,
  position: GuardianPosition,
  fieldResonance: number,
  mode: GuardianAIMode,
  awareness: number[],
  sigilPoints: any[]
) {
  const { updateVitals, updatePosition, updateContext } = actions;

  useEffect(() => {
    updateVitals(vitals);
  }, [vitals, updateVitals]);

  useEffect(() => {
    updatePosition(position);
  }, [position, updatePosition]);

  useEffect(() => {
    updateContext({ fieldResonance });
  }, [fieldResonance, updateContext]);
}
