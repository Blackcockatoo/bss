/**
 * Meta-Pet Teacher Lesson System — safe real-pet update API (Pass 3).
 *
 * The ONLY sanctioned path for a lesson to modify the student's real Meta-Pet.
 * Lesson activities never write arbitrary store fields directly; they call
 * these validated, reversible, atomic-where-practical actions instead.
 *
 * Safety guarantees for every approved update:
 * - Explicit (a confirmation action calls it — never step navigation).
 * - Validated before committing; unsafe/invalid updates are rejected.
 * - Reversible: one recent previous snapshot per update type (survives refresh).
 * - Preserves unrelated pet data.
 * - Records the originating lesson + timestamp.
 * - Refuses preview mode and demonstration pets.
 * - Fails safely (never leaves the pet half-modified; never throws to the UI).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { BodySpec } from "@/components/body-forge/PetBodyRenderer";
import { decodeGenome, type DerivedTraits, type Genome } from "@/lib/genome";
import { useStore } from "@/lib/store";
import {
  clearForgedBody,
  loadForgedBody,
  saveForgedBody,
  sanitizeBodySpec,
} from "@/visual-dna/bodyForgeAdapter";
import type { AppliedChangeMeta } from "./evidence";
import {
  isPreferredDnaView,
  normaliseAlias,
  usePetProfileStore,
  type PreferredDnaView,
} from "./petProfile";
import type { LessonId } from "./types";

export type PetUpdateType =
  | "alias"
  | "body-design"
  | "dna-variation"
  | "preferred-visualisation";

/** Context passed by the calling activity so guards can enforce safety. */
export interface PetUpdateContext {
  isPreview: boolean;
  isDemo: boolean;
  lessonId: LessonId;
}

export interface PetUpdateResult {
  ok: boolean;
  updateType: PetUpdateType;
  appliedAt?: number;
  /** Safe, teacher/student-friendly message. Never a raw error. */
  message: string;
  previousSnapshotAvailable: boolean;
  undoAvailable: boolean;
  /** Short human-readable summary of what changed. */
  summary?: string;
  /** Structured detail for evidence (e.g. DNA position/before/after). */
  detail?: Record<string, unknown>;
}

export interface RealPetSnapshot {
  hasPet: boolean;
  genomePresent: boolean;
  bodyPresent: boolean;
  alias: string;
  preferredDnaView: PreferredDnaView | null;
}

const GENOME_LENGTH = 60;
const GENOME_RADIX = 10;

// ---------------------------------------------------------------------------
// Undo snapshot store (one recent previous state per update type + audit log).
// Persisted so undo and recovery survive a refresh.
// ---------------------------------------------------------------------------

interface BodySnapshot {
  previous: BodySpec | null;
  lessonId: LessonId;
  at: number;
}
interface DnaSnapshot {
  genome: Genome;
  traits: DerivedTraits;
  lessonId: LessonId;
  at: number;
}
interface AliasSnapshot {
  previous: string;
  lessonId: LessonId;
  at: number;
}
interface ViewSnapshot {
  previous: PreferredDnaView | null;
  lessonId: LessonId;
  at: number;
}

export interface PetUpdateAuditEntry {
  updateType: PetUpdateType;
  lessonId: LessonId;
  at: number;
  summary: string;
}

interface PetUpdateSnapshotState {
  body: BodySnapshot | null;
  dna: DnaSnapshot | null;
  alias: AliasSnapshot | null;
  preferredView: ViewSnapshot | null;
  audit: PetUpdateAuditEntry[];
}

interface PetUpdateSnapshotActions {
  setBody: (snap: BodySnapshot | null) => void;
  setDna: (snap: DnaSnapshot | null) => void;
  setAlias: (snap: AliasSnapshot | null) => void;
  setView: (snap: ViewSnapshot | null) => void;
  pushAudit: (entry: PetUpdateAuditEntry) => void;
  reset: () => void;
}

const MAX_AUDIT = 20;
export const PET_UPDATE_STORAGE_KEY = "metapet-teacher-pet-update";

function createDefaultSnapshotState(): PetUpdateSnapshotState {
  return { body: null, dna: null, alias: null, preferredView: null, audit: [] };
}

export const usePetUpdateStore = create<
  PetUpdateSnapshotState & PetUpdateSnapshotActions
>()(
  persist(
    (set) => ({
      ...createDefaultSnapshotState(),
      setBody: (snap) => set(() => ({ body: snap })),
      setDna: (snap) => set(() => ({ dna: snap })),
      setAlias: (snap) => set(() => ({ alias: snap })),
      setView: (snap) => set(() => ({ preferredView: snap })),
      pushAudit: (entry) =>
        set((state) => ({
          audit: [entry, ...state.audit].slice(0, MAX_AUDIT),
        })),
      reset: () => set(() => ({ ...createDefaultSnapshotState() })),
    }),
    { name: PET_UPDATE_STORAGE_KEY, version: 1 },
  ),
);

// ---------------------------------------------------------------------------
// Genome helpers
// ---------------------------------------------------------------------------

function cloneGenome(genome: Genome): Genome {
  return {
    red60: [...genome.red60],
    blue60: [...genome.blue60],
    black60: [...genome.black60],
  };
}

export function isValidGenome(value: unknown): value is Genome {
  if (!value || typeof value !== "object") return false;
  const g = value as Partial<Genome>;
  const strands = [g.red60, g.blue60, g.black60];
  return strands.every(
    (strand) =>
      Array.isArray(strand) &&
      strand.length === GENOME_LENGTH &&
      strand.every(
        (d) => typeof d === "number" && Number.isInteger(d) && d >= 0 && d < GENOME_RADIX,
      ),
  );
}

type GenomeStrandKey = "red60" | "blue60" | "black60";

/** Deterministically change one digit so the mutation is always visible. */
function mutateGenomeDigit(
  genome: Genome,
  strand: GenomeStrandKey,
  index: number,
): { genome: Genome; before: number; after: number } {
  const next = cloneGenome(genome);
  const safeIndex = ((index % GENOME_LENGTH) + GENOME_LENGTH) % GENOME_LENGTH;
  const before = next[strand][safeIndex];
  const after = (before + 1) % GENOME_RADIX;
  next[strand][safeIndex] = after;
  return { genome: next, before, after };
}

// ---------------------------------------------------------------------------
// Guards + result helpers
// ---------------------------------------------------------------------------

function guard(
  ctx: PetUpdateContext,
  requirePet = true,
): string | null {
  if (ctx.isPreview) {
    return "Preview mode can't change your Meta-Pet.";
  }
  if (ctx.isDemo) {
    return "This activity is using a classroom example. Create a Meta-Pet before saving this to your own pet.";
  }
  if (requirePet && useStore.getState().genome === null) {
    return "Create a Meta-Pet before saving this to your own pet.";
  }
  return null;
}

function fail(
  updateType: PetUpdateType,
  message: string,
  extra: Partial<PetUpdateResult> = {},
): PetUpdateResult {
  return {
    ok: false,
    updateType,
    message,
    previousSnapshotAvailable: false,
    undoAvailable: false,
    ...extra,
  };
}

function succeed(
  updateType: PetUpdateType,
  message: string,
  extra: Partial<PetUpdateResult> = {},
): PetUpdateResult {
  return {
    ok: true,
    updateType,
    message,
    appliedAt: Date.now(),
    previousSnapshotAvailable: true,
    undoAvailable: true,
    ...extra,
  };
}

/** Convert a result into compact evidence metadata. */
export function toAppliedChange(result: PetUpdateResult): AppliedChangeMeta {
  return {
    appliedToPet: result.ok,
    appliedAt: result.appliedAt,
    updateType: result.updateType,
    previousSnapshotAvailable: result.previousSnapshotAvailable,
    undoAvailable: result.undoAvailable,
    applicationError: result.ok ? undefined : result.message,
    appliedSummary: result.summary,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export function readRealPetSnapshot(): RealPetSnapshot {
  const store = useStore.getState();
  const profile = usePetProfileStore.getState();
  return {
    hasPet: store.genome !== null,
    genomePresent: store.genome !== null,
    bodyPresent: loadForgedBody() !== null,
    alias: profile.alias,
    preferredDnaView: profile.preferredDnaView,
  };
}

// ---------------------------------------------------------------------------
// Alias
// ---------------------------------------------------------------------------

export function applyAlias(
  rawAlias: string,
  ctx: PetUpdateContext,
): PetUpdateResult {
  const type: PetUpdateType = "alias";
  const blocked = guard(ctx);
  if (blocked) return fail(type, blocked);

  const alias = normaliseAlias(rawAlias);
  if (!alias) {
    return fail(
      type,
      "That alias can't be used. Try a short made-up name (no real name, email or web address).",
    );
  }

  try {
    const previous = usePetProfileStore.getState().alias;
    usePetProfileStore.getState().setAlias(alias);
    usePetUpdateStore.getState().setAlias({
      previous,
      lessonId: ctx.lessonId,
      at: Date.now(),
    });
    const summary = `Alias set to “${alias}”.`;
    usePetUpdateStore
      .getState()
      .pushAudit({ updateType: type, lessonId: ctx.lessonId, at: Date.now(), summary });
    return succeed(type, "Your Meta-Pet's alias was saved.", { summary });
  } catch {
    return fail(type, "We couldn't save that alias. Your Meta-Pet was not changed.");
  }
}

export function undoAlias(): PetUpdateResult {
  const type: PetUpdateType = "alias";
  const snap = usePetUpdateStore.getState().alias;
  if (!snap) return fail(type, "There is no previous alias to restore.");
  try {
    usePetProfileStore.getState().setAlias(snap.previous);
    usePetUpdateStore.getState().setAlias(null);
    return {
      ok: true,
      updateType: type,
      appliedAt: Date.now(),
      message: "Previous alias restored.",
      previousSnapshotAvailable: false,
      undoAvailable: false,
    };
  } catch {
    return fail(type, "We couldn't restore the previous alias.");
  }
}

// ---------------------------------------------------------------------------
// Body design
// ---------------------------------------------------------------------------

export function applyBodyDesign(
  spec: unknown,
  ctx: PetUpdateContext,
): PetUpdateResult {
  const type: PetUpdateType = "body-design";
  const blocked = guard(ctx);
  if (blocked) return fail(type, blocked);

  try {
    // Validate + normalise to a renderable BodySpec.
    const clean = sanitizeBodySpec(spec);
    const previous = loadForgedBody();

    saveForgedBody(clean, useStore.getState().genome);

    // Confirm the resulting state is valid and readable.
    const confirmed = loadForgedBody();
    if (!confirmed) {
      // Roll back to the previous body.
      if (previous) saveForgedBody(previous, useStore.getState().genome);
      else clearForgedBody();
      return fail(type, "We couldn't save that design. Your Meta-Pet was not changed.");
    }

    usePetUpdateStore.getState().setBody({
      previous,
      lessonId: ctx.lessonId,
      at: Date.now(),
    });
    const summary = `Body design applied: ${clean.shape} shape, ${clean.pattern} surface, ${clean.expression} face.`;
    usePetUpdateStore
      .getState()
      .pushAudit({ updateType: type, lessonId: ctx.lessonId, at: Date.now(), summary });
    return succeed(type, "Your Meta-Pet's body design was updated.", {
      summary,
    });
  } catch {
    return fail(type, "We couldn't save that design. Your Meta-Pet was not changed.");
  }
}

export function undoBodyDesign(): PetUpdateResult {
  const type: PetUpdateType = "body-design";
  const snap = usePetUpdateStore.getState().body;
  if (!snap) return fail(type, "There is no previous design to restore.");
  try {
    if (snap.previous) {
      saveForgedBody(snap.previous, useStore.getState().genome);
    } else {
      clearForgedBody();
    }
    usePetUpdateStore.getState().setBody(null);
    return {
      ok: true,
      updateType: type,
      appliedAt: Date.now(),
      message: "Previous body design restored.",
      previousSnapshotAvailable: false,
      undoAvailable: false,
    };
  } catch {
    return fail(type, "We couldn't restore the previous design.");
  }
}

// ---------------------------------------------------------------------------
// DNA variation
// ---------------------------------------------------------------------------

export function applyDnaVariation(
  ctx: PetUpdateContext,
  options: { strand?: GenomeStrandKey; index?: number } = {},
): PetUpdateResult {
  const type: PetUpdateType = "dna-variation";
  const blocked = guard(ctx);
  if (blocked) return fail(type, blocked);

  const store = useStore.getState();
  const genome = store.genome;
  if (!genome || !isValidGenome(genome)) {
    return fail(type, "Your Meta-Pet's DNA couldn't be read. It was not changed.");
  }

  const strand = options.strand ?? "red60";
  const index = options.index ?? 0;

  try {
    const { genome: mutated, before, after } = mutateGenomeDigit(
      genome,
      strand,
      index,
    );
    if (!isValidGenome(mutated)) {
      return fail(type, "That DNA change wasn't valid. Your Meta-Pet was not changed.");
    }

    // decodeGenome throws if the genome cannot be decoded.
    const traits = decodeGenome(mutated);

    // Capture a reversible previous snapshot before committing.
    const previousGenome = cloneGenome(genome);
    const previousTraits = store.traits ?? decodeGenome(genome);

    store.setGenome(mutated, traits);

    // Confirm the resulting state is valid; roll back otherwise.
    const afterState = useStore.getState().genome;
    if (!afterState || !isValidGenome(afterState)) {
      store.setGenome(previousGenome, previousTraits);
      return fail(type, "That DNA change didn't hold. Your Meta-Pet was restored.");
    }

    usePetUpdateStore.getState().setDna({
      genome: previousGenome,
      traits: previousTraits,
      lessonId: ctx.lessonId,
      at: Date.now(),
    });
    const summary = `Kept one DNA change (position ${index + 1}).`;
    usePetUpdateStore
      .getState()
      .pushAudit({ updateType: type, lessonId: ctx.lessonId, at: Date.now(), summary });
    return succeed(type, "Your Meta-Pet kept this DNA variation.", {
      summary,
      detail: { strand, index, before, after },
    });
  } catch {
    // Best-effort rollback if anything failed mid-way.
    try {
      const current = useStore.getState().genome;
      if (current && !isValidGenome(current)) {
        useStore.getState().setGenome(genome, store.traits ?? decodeGenome(genome));
      }
    } catch {
      /* swallow — reported below */
    }
    return fail(type, "We couldn't keep that DNA change. Your Meta-Pet was not changed.");
  }
}

export function restorePreviousDna(): PetUpdateResult {
  const type: PetUpdateType = "dna-variation";
  const snap = usePetUpdateStore.getState().dna;
  if (!snap) return fail(type, "There is no previous DNA to restore.");
  try {
    useStore.getState().setGenome(snap.genome, snap.traits);
    usePetUpdateStore.getState().setDna(null);
    return {
      ok: true,
      updateType: type,
      appliedAt: Date.now(),
      message: "Previous DNA restored.",
      previousSnapshotAvailable: false,
      undoAvailable: false,
    };
  } catch {
    return fail(type, "We couldn't restore the previous DNA.");
  }
}

// ---------------------------------------------------------------------------
// Preferred visualisation (no genome change)
// ---------------------------------------------------------------------------

export function applyPreferredVisualisation(
  view: unknown,
  ctx: PetUpdateContext,
): PetUpdateResult {
  const type: PetUpdateType = "preferred-visualisation";
  const blocked = guard(ctx);
  if (blocked) return fail(type, blocked);

  if (!isPreferredDnaView(view)) {
    return fail(type, "That visualisation can't be used.");
  }

  try {
    const previous = usePetProfileStore.getState().preferredDnaView;
    usePetProfileStore.getState().setPreferredDnaView(view);
    usePetUpdateStore.getState().setView({
      previous,
      lessonId: ctx.lessonId,
      at: Date.now(),
    });
    const summary = `Preferred DNA view set to ${view}.`;
    usePetUpdateStore
      .getState()
      .pushAudit({ updateType: type, lessonId: ctx.lessonId, at: Date.now(), summary });
    return succeed(type, "Your preferred DNA view was saved.", { summary });
  } catch {
    return fail(type, "We couldn't save that preference. Your Meta-Pet was not changed.");
  }
}

export function undoPreferredVisualisation(): PetUpdateResult {
  const type: PetUpdateType = "preferred-visualisation";
  const snap = usePetUpdateStore.getState().preferredView;
  if (!snap) return fail(type, "There is no previous preference to restore.");
  try {
    usePetProfileStore.getState().setPreferredDnaView(snap.previous);
    usePetUpdateStore.getState().setView(null);
    return {
      ok: true,
      updateType: type,
      appliedAt: Date.now(),
      message: "Previous preference restored.",
      previousSnapshotAvailable: false,
      undoAvailable: false,
    };
  } catch {
    return fail(type, "We couldn't restore the previous preference.");
  }
}
