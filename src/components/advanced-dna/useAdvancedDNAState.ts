"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AdvancedDnaControlsState,
  AdvancedDnaMode,
  PerformanceMode,
} from "./types";

const DEFAULT_CONTROLS: Omit<AdvancedDnaControlsState, "playing"> = {
  mode: "sigil",
  speed: 0.78,
  intensity: 0.82,
  mutationLevel: 0.24,
  particleDensity: 0.76,
  symmetry: 12,
  cameraDepth: 1,
  dimension: 4,
  performanceMode: "auto",
  animationNonce: 0,
};

export function useAdvancedDNAState(
  reducedMotion: boolean,
  initialMode?: AdvancedDnaMode,
) {
  const [storedControls, setControls] = useState<AdvancedDnaControlsState>(
    () => ({
      ...DEFAULT_CONTROLS,
      mode: initialMode ?? DEFAULT_CONTROLS.mode,
      playing: !reducedMotion,
    }),
  );
  const [allowReducedMotionAnimation, setAllowReducedMotionAnimation] =
    useState(false);
  const [resetViewToken, setResetViewToken] = useState(0);
  const controls = useMemo(
    () => ({
      ...storedControls,
      playing:
        storedControls.playing &&
        (!reducedMotion || allowReducedMotionAnimation),
    }),
    [allowReducedMotionAnimation, reducedMotion, storedControls],
  );

  const setMode = useCallback((mode: AdvancedDnaMode) => {
    setControls((current) => ({ ...current, mode }));
  }, []);

  const setNumber = useCallback(
    (
      key:
        | "speed"
        | "intensity"
        | "mutationLevel"
        | "particleDensity"
        | "cameraDepth"
        | "dimension",
      value: number,
    ) => {
      setControls((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const setSymmetry = useCallback((symmetry: 6 | 8 | 12 | 60) => {
    setControls((current) => ({ ...current, symmetry }));
  }, []);

  const setPerformanceMode = useCallback((performanceMode: PerformanceMode) => {
    setControls((current) => ({ ...current, performanceMode }));
  }, []);

  const togglePlaying = useCallback(() => {
    if (controls.playing) {
      setControls((current) => ({ ...current, playing: false }));
      return;
    }
    if (reducedMotion) setAllowReducedMotionAnimation(true);
    setControls((current) => ({ ...current, playing: true }));
  }, [controls.playing, reducedMotion]);

  const randomiseAnimation = useCallback(() => {
    setControls((current) => ({
      ...current,
      animationNonce: current.animationNonce + 1,
    }));
  }, []);

  const resetView = useCallback(() => {
    setResetViewToken((token) => token + 1);
  }, []);

  return {
    controls,
    resetViewToken,
    setMode,
    setNumber,
    setSymmetry,
    setPerformanceMode,
    togglePlaying,
    randomiseAnimation,
    resetView,
  };
}
