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
}: GeometryAvatarRendererProps) {
  const runtimeGenome = useStore((state) => state.genome);
  const runtimeTraits = useStore((state) => state.traits);
  const petType = useStore((state) => state.petType);
  const vitals = useStore((state) => state.vitals);
  const lastAction = useStore((state) => state.lastAction);
  const lastActionAt = useStore((state) => state.lastActionAt);
  const activeRecord = usePetRegistryStore((state) => state.activeRecord);
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
