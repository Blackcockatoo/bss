"use client";

import type React from "react";
import {
  SriYantraPetEngine,
  type PetMovementPreset,
} from "./SriYantraPetEngine";

interface SriYantraPetDisplayProps {
  red?: string | number;
  blue?: string | number;
  black?: string | number;
  animated?: boolean;
  compact?: boolean;
  movement?: PetMovementPreset;
}

/**
 * Connects the Sri Yantra Pet Engine to your app's red/blue/black packet system.
 * This component is the integration layer that bridges the pet visualization
 * with your app's data model.
 */
export function SriYantraPetDisplay({
  red = "00000000000000000000",
  blue = "00000000000000000000",
  black = "00000000000000000000",
  animated = true,
  compact = false,
  movement = "idle",
}: SriYantraPetDisplayProps) {
  return (
    <SriYantraPetEngine
      red={red}
      blue={blue}
      black={black}
      animated={animated}
      movement={movement}
      showConstellation={false}
      showScaffold={false}
      compact={compact}
    />
  );
}
