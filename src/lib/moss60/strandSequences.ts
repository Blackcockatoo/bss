export type MossStrandKey = "red" | "black" | "blue";

export const MOSS_RED_STRAND =
  "113031491493585389543778774590997079619617525721567332336510";
export const MOSS_BLACK_STRAND =
  "011235831459437077415617853819099875279651673033695493257291";
export const MOSS_BLUE_STRAND =
  "012776329785893036118967145479098334781325217074992143965631";

export const MOSS_STRANDS: Record<MossStrandKey, string> = {
  red: MOSS_RED_STRAND,
  black: MOSS_BLACK_STRAND,
  blue: MOSS_BLUE_STRAND,
};

export const MOSS_SCALE = [
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
] as const;

export const MOSS_DIGIT_COLORS = [
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#8b5cf6",
  "#ffd700",
  "#ff6b6b",
  "#4ecdc4",
  "#95e1d3",
  "#f38181",
] as const;

export const MOSS_LEARNING_COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#38bdf8",
  "#4ade80",
  "#facc15",
  "#fb923c",
  "#e879f9",
] as const;

export const MOSS_DIGIT_SHAPES = [
  "Halo",
  "Beam",
  "Arc",
  "Triangle",
  "Square",
  "Pentagon",
  "Hexagon",
  "Heptagon",
  "Octagon",
  "Nonagon",
] as const;

export const MOSS_STRAND_META = {
  red: {
    label: "Red / Fire",
    owner: "Fire strand",
    shortLabel: "Fire",
    accent: "#ef4444",
    glow: "rgba(239,68,68,0.45)",
    surface: "from-rose-500/20 via-orange-500/10 to-amber-500/10",
    ring: "border-rose-400/30",
    profileColorName: "Solar Red",
    profileDigit: 9,
    profileNote: "E5",
    shape: "Triangle",
    profileShapeIcon: "▲",
    role: "Lead pulse for helix sparks and bright melodic climbs.",
  },
  blue: {
    label: "Blue / Water",
    owner: "Water strand",
    shortLabel: "Water",
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.45)",
    surface: "from-sky-500/20 via-cyan-500/10 to-blue-500/10",
    ring: "border-sky-400/30",
    profileColorName: "Tidal Blue",
    profileDigit: 7,
    profileNote: "C5",
    shape: "Circle",
    profileShapeIcon: "●",
    role: "Flow state for smooth loops, resonance drifts, and softer motion.",
  },
  black: {
    label: "Black / Earth",
    owner: "Earth strand",
    shortLabel: "Earth",
    accent: "#64748b",
    glow: "rgba(100,116,139,0.45)",
    surface: "from-slate-500/20 via-zinc-500/10 to-slate-700/10",
    ring: "border-slate-400/30",
    profileColorName: "Obsidian Slate",
    profileDigit: 5,
    profileNote: "A4",
    shape: "Square",
    profileShapeIcon: "■",
    role: "Grounding layer for structure, repetition, and stable rhythm blocks.",
  },
} as const satisfies Record<
  MossStrandKey,
  {
    label: string;
    owner: string;
    shortLabel: string;
    accent: string;
    glow: string;
    surface: string;
    ring: string;
    profileColorName: string;
    profileDigit: number;
    profileNote: string;
    shape: string;
    profileShapeIcon: string;
    role: string;
  }
>;

export function getMossDigits(key: MossStrandKey): number[] {
  return MOSS_STRANDS[key].split("").map(Number);
}
