import type { Genome } from "@/genome/types";
import { MOSS_STRANDS } from "../strandSequences";
import { expressionGates } from "./atlas";
import { createLabRandom, RNG_VERSION, sha256 } from "./random";

export const LAB_VERSION = "moss60-observatory/experimental-v1" as const;
export const LANES = ["red60", "blue60", "black60"] as const;
export const PERSONALITY_AXES = ["energy", "social", "curiosity", "discipline", "affection", "independence", "playfulness", "loyalty"] as const;
export const MAX_TICKS = 36_000;
export const MAX_EVENTS = 1_000;
export const MAX_IMPORT_BYTES = 256_000;
export type Radix = 7 | 10;
export type LabGenome = Readonly<Record<typeof LANES[number], readonly number[]>>;
export const ENVIRONMENTS = {
  balanced: { label: "Balanced", exposure: [0.4, 0.4, 0.4] },
  spark: { label: "Spark-rich", exposure: [0.9, 0.2, 0.1] },
  quiet: { label: "Shadow-rich", exposure: [0.1, 0.2, 0.9] },
} as const;
export type Environment = keyof typeof ENVIRONMENTS;
export interface LabEvent { steps: number; environment: Environment }

export interface Experiment {
  readonly genome: LabGenome;
  readonly radix: Radix;
  readonly seed: string;
  readonly dnaHash: string;
  readonly gates: readonly boolean[];
  readonly amplitude: Float64Array;
  readonly phase: Float64Array;
  readonly frequency: Float64Array;
  readonly expression: Float64Array;
  readonly delta: Float64Array;
  readonly events: LabEvent[];
  tick: number;
  remainder: number;
}

export function copyGenome(value: unknown, radix: Radix): Genome {
  if (radix !== 7 && radix !== 10) throw new TypeError("Genome radix must be 7 or 10");
  if (!value || typeof value !== "object") throw new TypeError("Missing genome");
  const record = value as Record<string, unknown>;
  const result = {} as Genome;
  for (const lane of LANES) {
    const digits = record[lane];
    if (!Array.isArray(digits) || digits.length !== 60 ||
        !Array.from(digits).every(d => Number.isInteger(d) && d >= 0 && d < radix)) {
      throw new TypeError(`Expected exactly 60 base-${radix} digits in ${lane}`);
    }
    result[lane] = [...digits];
  }
  return result;
}

export function canonicalGenome(): Genome {
  return { red60: Array.from(MOSS_STRANDS.red, Number), blue60: Array.from(MOSS_STRANDS.blue, Number), black60: Array.from(MOSS_STRANDS.black, Number) };
}

export function normalizedTraits(genome: LabGenome, radix: Radix) {
  const copy = copyGenome(genome, radix);
  const fraction = (digits: readonly number[]) => digits.reduce((sum, digit) => sum + digit, 0) / (digits.length * (radix - 1));
  return {
    size: 0.5 + 1.5 * fraction(copy.red60.slice(25, 30)),
    personality: Object.fromEntries(PERSONALITY_AXES.map((axis, i) => [axis, Math.round(100 * fraction(copy.blue60.slice(5 + i * 5, 10 + i * 5)))])) as Record<typeof PERSONALITY_AXES[number], number>,
    potential: Object.fromEntries(["physical", "mental", "social"].map((axis, i) => [axis, Math.round(60 + 40 * fraction(copy.black60.slice(30 + i * 10, 40 + i * 10)))])),
  };
}

/** Decimal readings of digit windows, regardless of the genome's digit alphabet. */
export function windowResidues(genome: LabGenome, radix: Radix): number[] {
  const copy = copyGenome(genome, radix);
  const bins = Array<number>(60).fill(0);
  for (const lane of LANES) for (let i = 0; i < 60; i++) {
    let value = 0;
    for (let j = 0; j < 7; j++) value = (10 * value + copy[lane][(i + j) % 60]) % 60;
    bins[value]++;
  }
  return bins;
}

export async function createExperiment(genome: unknown, radix: Radix, seed = "MOSS60") : Promise<Experiment> {
  const copy = copyGenome(genome, radix);
  if (typeof seed !== "string" || seed.length > 128) throw new TypeError("Experiment seed must contain at most 128 characters");
  const dnaHash = await sha256(`${radix}|${LANES.map(lane => copy[lane].join("")).join("|")}`);
  const rng = await createLabRandom(`${seed}|${dnaHash}`);
  const digits = LANES.flatMap(lane => copy[lane]);
  for (const lane of LANES) Object.freeze(copy[lane]);
  return {
    genome: Object.freeze(copy), radix, seed, dnaHash,
    gates: Object.freeze(LANES.flatMap(lane => expressionGates(copy[lane].join("")))),
    amplitude: Float64Array.from(digits, () => 0.2 + rng.next() * 0.3),
    phase: Float64Array.from(digits, () => rng.next() * 2 * Math.PI),
    frequency: Float64Array.from(digits, digit => 0.8 + digit / (radix - 1) * 2.2),
    expression: new Float64Array(180).fill(0.5), delta: new Float64Array(180),
    events: [], tick: 0, remainder: 0,
  };
}

// Three degree-four rings, coupled at corresponding loci. Visual shape does
// not change topology. All edge flows read the old state before any writes.
const EDGES: readonly (readonly [number, number])[] = LANES.flatMap((_, strand) =>
  Array.from({ length: 60 }, (__, locus) => [
    [strand * 60 + locus, strand * 60 + (locus + 1) % 60] as const,
    [strand * 60 + locus, ((strand + 1) % 3) * 60 + locus] as const,
  ]).flat());

function tick(state: Experiment, environment: Environment) {
  const exposure = ENVIRONMENTS[environment].exposure;
  state.delta.fill(0);
  for (const [a, b] of EDGES) {
    const flow = 0.4 * (state.amplitude[b] - state.amplitude[a]);
    state.delta[a] += flow;
    state.delta[b] -= flow;
  }
  for (let i = 0; i < 180; i++) {
    const strand = Math.floor(i / 60);
    const locus = i % 60;
    const gate = state.gates[strand * 60 + (locus + state.tick) % 60] ? 1 : 0.25;
    const input = exposure[strand] * gate;
    const amplitude = state.amplitude[i];
    state.amplitude[i] = Math.max(0, Math.min(1, amplitude + (state.delta[i] + input * (1 - amplitude) - 0.18 * amplitude) / 60));
    state.phase[i] = (state.phase[i] + state.frequency[i] / 60) % (Math.PI * 2);
    const target = state.genome[LANES[strand]][locus] / (state.radix - 1) * 0.5 + input * 0.5;
    state.expression[i] += (target - state.expression[i]) * 0.02;
  }
  state.tick++;
}

function validateRun(state: Experiment, steps: number, environment: Environment) {
  if (!Number.isInteger(steps) || steps < 0 || state.tick + steps > MAX_TICKS) throw new RangeError(`Experiments are limited to ${MAX_TICKS} ticks`);
  if (!Object.hasOwn(ENVIRONMENTS, environment)) throw new TypeError("Unknown environment");
  if (steps > 0 && state.events.at(-1)?.environment !== environment && state.events.length >= MAX_EVENTS) throw new RangeError("Too many environment changes");
}

export function runExperiment(state: Experiment, steps: number, environment: Environment): Experiment {
  validateRun(state, steps, environment);
  if (steps === 0) return state;
  const last = state.events.at(-1);
  if (last?.environment === environment) last.steps += steps;
  else state.events.push({ steps, environment });
  for (let i = 0; i < steps; i++) tick(state, environment);
  return state;
}

/** Failed advances are atomic; elapsed time is never silently dropped. */
export function advanceExperiment(state: Experiment, elapsedSeconds: number, environment: Environment): Experiment {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) throw new RangeError("Invalid elapsed time");
  const elapsed = state.remainder + elapsedSeconds;
  const steps = Math.floor((elapsed + 1e-10) * 60);
  validateRun(state, steps, environment);
  runExperiment(state, steps, environment);
  state.remainder = Math.max(0, elapsed - steps / 60);
  return state;
}

export function exportExperiment(state: Experiment): string {
  return JSON.stringify({ format: LAB_VERSION, rng: RNG_VERSION, genome: state.genome, radix: state.radix,
    seed: state.seed, dnaHash: state.dnaHash, events: state.events, remainder: state.remainder }, null, 2);
}

/** Event replay derives all mutable state afresh; this is not a pet packet. */
export async function importExperiment(json: string): Promise<Experiment> {
  if (typeof json !== "string" || new TextEncoder().encode(json).length > MAX_IMPORT_BYTES) throw new RangeError("Experiment file is too large");
  const parsed = JSON.parse(json);
  if (!parsed || parsed.format !== LAB_VERSION || parsed.rng !== RNG_VERSION ||
      !Array.isArray(parsed.events) || parsed.events.length > MAX_EVENTS ||
      !Number.isFinite(parsed.remainder) || parsed.remainder < 0 || parsed.remainder >= 1 / 60 ||
      typeof parsed.seed !== "string" || typeof parsed.dnaHash !== "string") throw new TypeError("Unsupported experiment file");
  let total = 0;
  for (const event of parsed.events) {
    if (!event || !Object.hasOwn(ENVIRONMENTS, event.environment) || !Number.isInteger(event.steps) || event.steps < 1) throw new TypeError("Invalid experiment event");
    total += event.steps;
    if (total > MAX_TICKS) throw new RangeError("Experiment replay exceeds the tick limit");
  }
  const state = await createExperiment(parsed.genome, parsed.radix, parsed.seed);
  if (state.dnaHash !== parsed.dnaHash) throw new TypeError("DNA does not match the experiment fingerprint");
  for (const event of parsed.events) runExperiment(state, event.steps, event.environment);
  state.remainder = parsed.remainder;
  return state;
}
