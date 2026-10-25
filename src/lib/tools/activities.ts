/** Trusted, deterministic SPARK activities. No dynamic code, network, or inference. */
import {
  canUseForgeTool,
  type ForgeContext,
  type ForgeToolId,
} from "./registry";
export type Spark = { spot: string; prediction: string; reflection: string };
export type ActivityInput = {
  sequence: number[];
  tempo: number;
  rhythm?: number[];
  repeats: number;
  height: number;
  gravity: number;
  title: string;
  paragraphs: string[];
  choice: number;
  steps: ("forward" | "left" | "right")[];
  tasks: { text: string; minutes: number }[];
  source: "verified" | "uncertain";
};
export type Project = {
  version: 1;
  id: string;
  toolId: ForgeToolId;
  title: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  spark: Spark;
  input: ActivityInput;
};
export const DEFAULT_INPUT: ActivityInput = {
  sequence: [1, 3, 5, 7],
  tempo: 90,
  rhythm: [1, 0.5, 0.5, 2],
  repeats: 2,
  height: 2,
  gravity: 9.8,
  title: "My discovery",
  paragraphs: [
    "A traveller found a door.",
    "They opened it.",
    "They asked for help.",
  ],
  choice: 1,
  steps: ["forward", "right", "forward"],
  tasks: [{ text: "Gather materials", minutes: 5 }],
  source: "uncertain",
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max;
const number = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export function validInput(v: unknown): v is ActivityInput {
  return (
    object(v) &&
    Array.isArray(v.sequence) &&
    v.sequence.length >= 2 &&
    v.sequence.length <= 16 &&
    v.sequence.every((n) => number(n, 0, 24) && Number.isInteger(n)) &&
    number(v.tempo, 50, 160) &&
    (v.rhythm === undefined ||
      (Array.isArray(v.rhythm) &&
        v.rhythm.length >= 1 &&
        v.rhythm.length <= 16 &&
        v.rhythm.every((n) => [0.25, 0.5, 1, 2].includes(n)))) &&
    number(v.repeats, 1, 4) &&
    Number.isInteger(v.repeats) &&
    number(v.height, 0.1, 10) &&
    number(v.gravity, 1, 20) &&
    text(v.title, 100) &&
    Array.isArray(v.paragraphs) &&
    v.paragraphs.length === 3 &&
    v.paragraphs.every((p) => text(p, 2000)) &&
    number(v.choice, 1, 2) &&
    Number.isInteger(v.choice) &&
    Array.isArray(v.steps) &&
    v.steps.length <= 30 &&
    v.steps.every((s) => ["forward", "left", "right"].includes(s)) &&
    Array.isArray(v.tasks) &&
    v.tasks.length <= 20 &&
    v.tasks.every(
      (t) =>
        object(t) &&
        text(t.text, 100) &&
        number(t.minutes, 1, 120) &&
        Number.isInteger(t.minutes),
    ) &&
    ["verified", "uncertain"].includes(String(v.source))
  );
}
export function validProject(v: unknown): v is Project {
  return (
    object(v) &&
    v.version === 1 &&
    text(v.id, 100) &&
    !!v.id &&
    text(v.title, 100) &&
    number(v.createdAt, 0, Number.MAX_SAFE_INTEGER) &&
    number(v.updatedAt, 0, Number.MAX_SAFE_INTEGER) &&
    number(v.revision, 1, 1000000) &&
    Number.isInteger(v.revision) &&
    object(v.spark) &&
    ["spot", "prediction", "reflection"].every((k) =>
      text((v.spark as Record<string, unknown>)[k], 500),
    ) &&
    validInput(v.input)
  );
}
export type ActivityResult = {
  summary: string;
  explanation: string;
  values: number[];
  signal: number[];
};
export function runActivity(
  id: ForgeToolId,
  input: ActivityInput,
  context: ForgeContext = "family",
): ActivityResult {
  if (!canUseForgeTool(id, context))
    throw new Error("Instrument is not approved for this context.");
  if (!validInput(input)) throw new Error("Activity inputs are out of bounds.");
  switch (id) {
    case "pattern-forge": {
      const diffs = input.sequence
        .slice(1)
        .map((v, i) => v - input.sequence[i]);
      const constant = diffs.every((d) => d === diffs[0]);
      return {
        summary: constant
          ? `Constant difference ${diffs[0]}; next value ${input.sequence.at(-1)! + diffs[0]}.`
          : `Differences: ${diffs.join(", ")}.`,
        explanation:
          "Subtract each number from the next. Many rules can fit a finite sequence; this tests a constant-difference rule only.",
        values: diffs,
        signal: input.sequence,
      };
    }
    case "sound-studio": {
      const beats =
        input.sequence.reduce(
          (sum, _, i) => sum + (input.rhythm?.[i % input.rhythm.length] ?? 1),
          0,
        ) * input.repeats;
      const hz = input.sequence.map((n) => 220 * 2 ** (n / 12));
      return {
        summary: `${beats} beats; ${((beats * 60) / input.tempo).toFixed(2)} seconds.`,
        explanation:
          "Each step is a semitone above 220 Hz. Twelve steps double the frequency. Tempo changes duration, not pitch. Zero is a note, not a rest.",
        values: hz,
        signal: input.sequence,
      };
    }
    case "discovery-lab": {
      const time = Math.sqrt((2 * input.height) / input.gravity);
      return {
        summary: `Model landing time: ${time.toFixed(3)} seconds.`,
        explanation:
          "Simulation: an object released from rest, constant gravity, no air resistance. t = √(2h/g). Compare heights while holding gravity fixed. This model is not a real measurement; try a safe tabletop observation with an adult.",
        values: [time, input.gravity * time],
        signal: [input.height, input.gravity, time],
      };
    }
    case "story-workshop": {
      const words = input.paragraphs
        .join(" ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const sentences = input.paragraphs
        .join(" ")
        .split(/[.!?]+/)
        .filter((s) => s.trim());
      return {
        summary: `${words.length} words; ${sentences.length} sentence segments. Chosen ending: ${input.choice}.`,
        explanation:
          "Read the opening and your chosen ending aloud or silently. Check who acts (subject), what they do (verb), capitals and punctuation. Counts are mechanical, not a judgement of your writing.",
        values: [words.length, sentences.length],
        signal: [words.length, input.choice],
      };
    }
    case "maker-bench": {
      let x = 0,
        y = 0,
        d = 0;
      const path = [0];
      for (const step of input.steps) {
        if (step === "left") d = (d + 3) % 4;
        else if (step === "right") d = (d + 1) % 4;
        else {
          x += [0, 1, 0, -1][d];
          y += [1, 0, -1, 0][d];
        }
        path.push(x + y * 5);
      }
      return {
        summary: `Robot at (${x}, ${y}), facing ${["north", "east", "south", "west"][d]}. Goal (2, 2): ${x === 2 && y === 2 ? "reached" : "try revising"}.`,
        explanation:
          "Start at (0, 0), facing north. Forward moves one square; turns change direction only. Plan, run, compare and revise. These are bounded instructions, never executable scripts.",
        values: path,
        signal: [Math.abs(x), Math.abs(y), input.steps.length],
      };
    }
    case "life-compass": {
      const total = input.tasks.reduce((sum, t) => sum + t.minutes, 0);
      return {
        summary: `${input.tasks.length} planned tasks; ${total} minutes. Information: ${input.source}.`,
        explanation:
          input.source === "uncertain"
            ? "Uncertainty is useful: check who made the claim, its date and an independent source before relying on it. Keep names, addresses and passwords out of your plan."
            : "Explain how you checked the source. A label alone does not prove reliability. Try the plan away from the screen and revise your time estimates.",
        values: [total],
        signal: [input.tasks.length, total],
      };
    }
  }
}
export function adaptation(seed: string, projects: readonly Project[]) {
  const latest = projects.at(-1);
  let inherited = 0;
  for (const c of seed) inherited = (inherited * 31 + c.charCodeAt(0)) >>> 0;
  const signal = latest
    ? runActivity(latest.toolId, latest.input).signal
    : [1, 2, 3];
  return {
    sequence: signal
      .slice(0, 16)
      .map((v) => (Math.round(Math.abs(v)) + (inherited % 7)) % 12),
    tempo:
      latest?.toolId === "sound-studio"
        ? latest.input.tempo
        : 80 + (inherited % 4) * 10,
    source: latest?.title ?? null,
  };
}
