"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { deriveMoss60PetProfile } from "@/lib/moss60/petProfile";
import { decodeGenome, type DerivedTraits, type Genome } from "@/lib/genome";
import {
  deriveSriYantraProjection,
  SRI_YANTRA_PROJECTION_VERSION_V2,
} from "@/lib/geometry/projection";
import { deriveHeptaProfile, type HeptaProfileV2 } from "@/lib/heptaProfile";
import { usePetRegistryStore, type PetRecordV2 } from "@/lib/registry";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGeometryBehavior } from "@/pet/behavior/useGeometryBehavior";
import { DEFAULT_VITALS } from "@metapet/core/vitals";
import { getCumulativeEvolutionUpgrade } from "@/evolution/stageUpgrades";
import type { EvolutionState } from "@/evolution/types";
import { EvolutionStageAdornments } from "./evolution/EvolutionStageAdornments";
import { resolveStagePalette } from "./evolution/stagePalette";
import { useEvolutionStageTransition } from "./evolution/useEvolutionStageTransition";
import { SriYantraPetDisplay } from "./SriYantraPetDisplay";

interface GeometryAvatarRendererProps {
  animated?: boolean;
  compact?: boolean;
  /** Registered child/parent preview; active registry record is used by default. */
  record?: PetRecordV2 | null;
  /** Development/tests only when a complete record is not available. */
  genomeOverride?: Genome | null;
  /** Offspring-preview data derived from the exact conception packet. */
  traitsOverride?: DerivedTraits | null;
  heptaProfileOverride?: HeptaProfileV2 | null;
  projectionVersionOverride?: string;
  identityKeyOverride?: string;
  showPersonality?: boolean;
  /** Preview-only stage; defaults to the record's, then the live store's. */
  evolutionStateOverride?: EvolutionState | null;
}

/**
 * The geometric pet's avatar presentation. Moss60/Sri Yantra (via
 * SriYantraPetDisplay) stays the internal geometry/markings/aura engine;
 * this wrapper is what call sites reach for and is what derives that
 * engine's red/blue/black packets from the live genome layer, instead of
 * each call site talking to SriYantraPetDisplay directly.
 */
export function GeometryAvatarRenderer({
  animated = true,
  compact = false,
  record = null,
  genomeOverride = null,
  traitsOverride = null,
  heptaProfileOverride = null,
  projectionVersionOverride,
  identityKeyOverride,
  showPersonality = true,
  evolutionStateOverride = null,
}: GeometryAvatarRendererProps) {
  const runtimeGenome = useStore((state) => state.genome);
  const runtimeTraits = useStore((state) => state.traits);
  const petType = useStore((state) => state.petType);
  const vitals = useStore((state) => state.vitals);
  const lastAction = useStore((state) => state.lastAction);
  const lastActionAt = useStore((state) => state.lastActionAt);
  const activeRecord = usePetRegistryStore((state) => state.activeRecord);
  const runtimeEvolutionState = useStore((state) => state.evolution?.state);
  const reduceMotion = useReducedMotion();
  // An explicit genome is a self-contained preview. Never pair a child's
  // geometry with the active parent's traits/profile by accident.
  const selectedRecord = record ?? (genomeOverride ? null : activeRecord);
  const genome = genomeOverride ?? selectedRecord?.genome ?? runtimeGenome;

  const petProfile = useMemo(() => {
    if (!genome) {
      return deriveMoss60PetProfile({ petType, source: "fallback" });
    }
    const projection = deriveSriYantraProjection(
      genome,
      projectionVersionOverride ??
        selectedRecord?.projectionVersion ??
        SRI_YANTRA_PROJECTION_VERSION_V2,
    );
    return {
      strands: projection.strands,
    };
  }, [
    genome,
    petType,
    projectionVersionOverride,
    selectedRecord?.projectionVersion,
  ]);

  const traits = useMemo(
    () =>
      traitsOverride ??
      selectedRecord?.traits ??
      (genomeOverride ? decodeGenome(genomeOverride) : runtimeTraits) ??
      (genome ? decodeGenome(genome) : null),
    [
      genome,
      genomeOverride,
      runtimeTraits,
      selectedRecord?.traits,
      traitsOverride,
    ],
  );
  const heptaProfile = useMemo(
    () =>
      heptaProfileOverride ??
      selectedRecord?.heptaProfile ??
      (genome ? deriveHeptaProfile(genome) : null),
    [genome, heptaProfileOverride, selectedRecord?.heptaProfile],
  );

  // The bootstrap normally supplies these before the geometry form is used.
  // A fallback profile keeps the hook order stable during its first frame.
  const behaviorGenome = useMemo<Genome>(
    () =>
      genome ?? {
        red60: Array(60).fill(1),
        blue60: Array(60).fill(2),
        black60: Array(60).fill(3),
      },
    [genome],
  );
  const behaviorTraits = traits ?? decodeGenome(behaviorGenome);
  const behaviorProfile = heptaProfile ?? deriveHeptaProfile(behaviorGenome);
  const effectiveVitals = vitals ?? selectedRecord?.vitals ?? DEFAULT_VITALS;
  const behavior = useGeometryBehavior({
    identityKey:
      identityKeyOverride ??
      selectedRecord?.petId ??
      selectedRecord?.geometryFingerprint ??
      "geometry-bootstrap",
    profile: behaviorProfile,
    personality: behaviorTraits.personality,
    critical:
      effectiveVitals.isSick ||
      effectiveVitals.hunger >= 90 ||
      effectiveVitals.energy <= 8,
    sleeping: lastAction === "sleep" && effectiveVitals.energy < 45,
    reduceMotion,
    lastAction,
    lastActionAt,
    paused: !animated,
  });

  // Evolution presentation. The Sri Yantra engine is a checksum-locked sprite
  // (see docs/protocol/geometry-sprite-lock.md), so the stage's earned
  // anatomy and sigil are drawn as an overlay in this approved wrapper
  // instead — same grants, same palette, same emergence beat as the other
  // two renderers, without touching the locked asset.
  // A preview is self-contained: a child's geometry must show the CHILD's
  // stage, never the active parent's — the same rule this component already
  // applies to traits and vitals.
  const evolutionState: EvolutionState =
    evolutionStateOverride ??
    selectedRecord?.evolution?.state ??
    runtimeEvolutionState ??
    "GENETICS";
  const stageUpgrade = getCumulativeEvolutionUpgrade(evolutionState);
  const stagePalette = resolveStagePalette(evolutionState, traits);
  const stageEmphasis = useEvolutionStageTransition(evolutionState, {
    reduceMotion,
    paused: !animated,
  });
  // The yantra is radially symmetric and centred, so "head" is its upper
  // pole and "body" its core — the anchor box the shared adornments expect.
  const stageAnchor = {
    headX: 200,
    headY: 132,
    headRx: 46,
    headRy: 34,
    bodyX: 200,
    bodyY: 214,
    bodyRx: 82,
    bodyRy: 70,
  } as const;

  return (
    <div className="relative flex w-full items-center justify-center">
      <SriYantraPetDisplay
        red={petProfile.strands.red}
        blue={petProfile.strands.blue}
        black={petProfile.strands.black}
        animated={animated}
        compact={compact}
        movement={behavior.movement}
      />
      <svg
        viewBox="0 0 400 400"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        data-testid="geometry-evolution-stage"
      >
        <g
          transform={`translate(200 190) scale(${(
            stageUpgrade.bodyScale + stageEmphasis * 0.06
          ).toFixed(4)}) translate(-200 -190)`}
          opacity={0.78 + stageUpgrade.glowBonus + stageEmphasis * 0.2}
        >
          <EvolutionStageAdornments
            {...stageAnchor}
            state={evolutionState}
            layer="behind"
            color={stagePalette.color}
            accentColor={stagePalette.accentColor}
            underlayColor="#050b18"
            emphasis={stageEmphasis}
            strokeWidth={2.8}
          />
          <EvolutionStageAdornments
            {...stageAnchor}
            state={evolutionState}
            layer="front"
            color={stagePalette.color}
            accentColor={stagePalette.accentColor}
            underlayColor="#050b18"
            emphasis={stageEmphasis}
            strokeWidth={2.8}
          />
        </g>
      </svg>
      {showPersonality && genome && (
        <div
          className="pointer-events-none absolute bottom-3 left-1/2 z-10 w-[min(92%,28rem)] -translate-x-1/2 rounded-2xl border border-cyan-300/20 bg-slate-950/80 px-4 py-3 text-center shadow-xl backdrop-blur"
          data-testid="geometry-personality-intent"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/75">
            {behavior.temperament} · {behaviorProfile.dominantAxis} /{" "}
            {behaviorProfile.secondaryAxis}
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {behavior.intent}
          </p>
        </div>
      )}
    </div>
  );
}
