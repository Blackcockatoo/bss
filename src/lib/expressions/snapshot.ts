import { loadGuardianState } from "@metapet/core/auralia/persistence";
import { useAddonStore } from "@/lib/addons/store";
import { getEquippedWardrobeItems, useWardrobeProgressionStore } from "@/lib/wardrobe/store";
import type { PetRecordV2 } from "@/lib/registry";
import { deriveSriYantraProjection } from "@/lib/geometry/projection";
import { getCumulativeEvolutionUpgrade } from "@/evolution/stageUpgrades";
import { resolveStagePalette } from "@/components/evolution/stagePalette";
import { resolveAuraliaForm, resolveAuraliaMarkings } from "@/components/auralia/AuraliaCreature";
import { resolveVisualDNA } from "@/visual-dna";
import { getGenomeVisualFingerprint, loadForgedBodyPacket, resolveBodySpec } from "@/visual-dna/bodyForgeAdapter";
import { seedFor } from "./studio";
import { isStudioWardrobeAsset } from "./wardrobeAssets";

export function makeCreatureSnapshot(
  record: PetRecordV2,
  appearance = readLocalAppearance(),
) {
  // Copy only inherited rendering inputs. No registry proofs, names or memories.
  const { traits, evolution, vitals, genome, projectionVersion } = structuredClone({
    traits: record.traits, evolution: record.evolution, vitals: record.vitals,
    genome: record.genome, projectionVersion: record.projectionVersion,
  });
  const phenotype = resolveVisualDNA({
    traits, vitals, evolution, lastAction: null, lastActionAt: 0, now: 0, reducedMotion: true,
  });
  const forged = appearance.forged;
  const fingerprint = getGenomeVisualFingerprint(genome);
  const matchesForge = forged && (!forged.genomeFingerprint ||
    forged.genomeFingerprint.startsWith("SEED-") || forged.genomeFingerprint === fingerprint);
  const stage = getCumulativeEvolutionUpgrade(evolution.state);
  const palette = resolveStagePalette(evolution.state, traits);
  const { guardian, addons, positions, cosmetics } = structuredClone(appearance);
  return {
    seed: seedFor(fingerprint),
    traits,
    evolution: evolution.state,
    personality: traits.personality,
    body: resolveBodySpec(phenotype, genome, matchesForge ? forged.body : null),
    mark: {
      shape: stage.mark, count: stage.markCount, intensity: stage.markIntensity,
      color: palette.color, accentColor: palette.accentColor,
    },
    strands: deriveSriYantraProjection(genome, projectionVersion).strands,
    auralia: {
      form: resolveAuraliaForm(guardian),
      markings: resolveAuraliaMarkings(guardian),
      ...guardian,
    },
    addons: addons.map(addon => {
      const previewAsset = addon.visual?.previewAsset;
      return previewAsset && !isStudioWardrobeAsset(previewAsset) ?
        { ...addon, visual: { ...addon.visual, previewAsset: undefined } } : addon;
    }),
    positions,
    cosmetics,
  } as const;
}

export type CreatureSnapshot = ReturnType<typeof makeCreatureSnapshot>;

function readLocalAppearance() {
  const guardian = loadGuardianState();
  const wardrobe = useAddonStore.getState();
  const stat = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
  return {
    guardian: {
      energy: stat(guardian?.energy, 50), health: stat(guardian?.health, 80),
      curiosity: stat(guardian?.curiosity, 50), bond: stat(guardian?.bond, 50),
      dreamCount: stat(guardian?.dreamCount, 0),
      activatedCount: Array.isArray(guardian?.activatedPoints) ? guardian.activatedPoints.length : 0,
      reduceMotion: guardian?.accessibility?.reduceMotion === true,
    },
    forged: loadForgedBodyPacket({ migrate: false }),
    addons: wardrobe.getEquippedAddons(),
    positions: wardrobe.positionOverrides,
    cosmetics: getEquippedWardrobeItems(useWardrobeProgressionStore.getState().inventory),
  };
}
