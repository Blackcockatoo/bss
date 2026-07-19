import type { DerivedTraits, Genome } from "@/lib/genome";
import type { Vitals } from "@/lib/store";

export const ADVANCED_DNA_MODES = [
  "sigil",
  "cascade",
  "fourD",
  "vortex",
] as const;

export type AdvancedDnaMode = (typeof ADVANCED_DNA_MODES)[number];
export type DnaBase = "A" | "T" | "C" | "G";
export type GenomeStrand = "red" | "blue" | "black";
export type GeneExpressionState =
  | "inherited"
  | "expressed"
  | "dormant"
  | "mutated";
export type PerformanceMode = "auto" | "quality" | "performance";

export type MutationRecord = {
  strand: GenomeStrand;
  index: number;
  before: number;
  after: number;
  reason?: string;
};

export type DnaVisualSource = {
  genome: Genome;
  traits: DerivedTraits | null;
  vitals: Vitals;
  mutationLog: readonly MutationRecord[];
  petId: string;
  petName: string;
  isFallback: boolean;
};

export type GeneLocus = {
  index: number;
  strandIndex: number;
  strand: GenomeStrand;
  digit: number;
  base: DnaBase;
  color: string;
  group: number;
  weight: number;
  stability: number;
  rarity: number;
  mutationPotential: number;
  explicitMutation: boolean;
  expression: GeneExpressionState;
  phase: number;
  radialBias: number;
  angleBias: number;
};

export type GeneGroup = {
  index: number;
  label: string;
  shortLabel: string;
  weight: number;
  stability: number;
  rarity: number;
  dominantBase: DnaBase;
  locusIndices: number[];
};

export type TraitWeights = {
  physical: number;
  personality: number;
  latent: number;
  health: number;
  mood: number;
  energy: number;
};

export type DnaVisualModel = {
  fingerprint: string;
  numericSeed: number;
  petId: string;
  petName: string;
  isFallback: boolean;
  loci: GeneLocus[];
  groups: GeneGroup[];
  traitWeights: TraitWeights;
  baseCounts: Record<DnaBase, number>;
  mutationCount: number;
};

export type AdvancedDnaControlsState = {
  mode: AdvancedDnaMode;
  speed: number;
  intensity: number;
  mutationLevel: number;
  particleDensity: number;
  symmetry: 6 | 8 | 12 | 60;
  cameraDepth: number;
  dimension: number;
  playing: boolean;
  performanceMode: PerformanceMode;
  animationNonce: number;
};

export type PerformanceProfile = {
  dprCap: number;
  densityScale: number;
  blurScale: number;
  trailAlpha: number;
  recursion: number;
  targetFps: number;
};

export type VisualInteraction = {
  yaw: number;
  pitch: number;
  zoom: number;
  distortion: number;
  focusGroup: number | null;
  pulseStartedAt: number;
  pointerX: number;
  pointerY: number;
};

export type RenderFrame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  controls: AdvancedDnaControlsState;
  interaction: VisualInteraction;
  performance: PerformanceProfile;
  reducedMotion: boolean;
};

export interface DnaModeRenderer {
  render(frame: RenderFrame): void;
  updateModel(model: DnaVisualModel): void;
  reset(): void;
  dispose(): void;
}
