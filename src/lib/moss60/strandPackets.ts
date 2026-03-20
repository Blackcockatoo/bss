import {
  MOSS_BLACK_STRAND,
  MOSS_BLUE_STRAND,
  MOSS_RED_STRAND,
} from "@/lib/moss60/strandSequences";

export type StrandPacketKey = "red" | "blue" | "black";

export interface StrandPacketChamber {
  readonly positionLabel: string;
  readonly name: string;
  readonly pentad: string;
  readonly function: string;
  readonly color: string;
}

export interface FullStrandPacket {
  readonly key: StrandPacketKey;
  readonly label: string;
  readonly strand: string;
  readonly accent: string;
  readonly summary: string;
  readonly chambers: readonly StrandPacketChamber[];
}

export const RED_STRAND_PACKET: FullStrandPacket = {
  key: "red",
  label: "Red Spark Loops",
  strand: MOSS_RED_STRAND,
  accent: "#EF4444",
  summary: "Fast red mini paths for spark, push, and motion play.",
  chambers: [
    {
      positionLabel: "12",
      name: "Spark Mouth",
      pentad: "11303",
      function: "hot start, appetite, first strike ignition",
      color: "#B91C1C",
    },
    {
      positionLabel: "1",
      name: "Rush Coil",
      pentad: "14914",
      function: "charge vector, velocity choice, pursuit line",
      color: "#D9462C",
    },
    {
      positionLabel: "2",
      name: "Flare Array",
      pentad: "93585",
      function: "signal blaze, dominance display, pressure bloom",
      color: "#F97316",
    },
    {
      positionLabel: "3",
      name: "Forge Hinge",
      pentad: "38954",
      function: "impact pivot, recoil reset, furnace restraint",
      color: "#EA580C",
    },
    {
      positionLabel: "4",
      name: "Rib Furnace",
      pentad: "37787",
      function: "core heat lift, breath power, body drive",
      color: "#FB923C",
    },
    {
      positionLabel: "5",
      name: "Armor Clamp",
      pentad: "74590",
      function: "combat posture, brace, hold-the-line stance",
      color: "#C2410C",
    },
    {
      positionLabel: "6",
      name: "Ember Mirror",
      pentad: "99707",
      function: "heat reflection, threat reading, aggression check",
      color: "#FBBF24",
    },
    {
      positionLabel: "7",
      name: "Pounce Rail",
      pentad: "96196",
      function: "burst leap, closing distance, kill-shot timing",
      color: "#FB7185",
    },
    {
      positionLabel: "8",
      name: "Brand Key",
      pentad: "17525",
      function: "marking, allegiance code, target lock imprint",
      color: "#F87171",
    },
    {
      positionLabel: "9",
      name: "War Echo",
      pentad: "72156",
      function: "battle memory, pattern exploitation, next-hit read",
      color: "#FDBA74",
    },
    {
      positionLabel: "10",
      name: "Solar Bridge",
      pentad: "73323",
      function: "crown heat to body force, command signal",
      color: "#F59E0B",
    },
    {
      positionLabel: "11",
      name: "Ash Seal",
      pentad: "36510",
      function: "spent-burn closure, scar memory, victory mark",
      color: "#7C2D12",
    },
  ],
};

export const BLUE_STRAND_PACKET: FullStrandPacket = {
  key: "blue",
  label: "Blue Wave Loops",
  strand: MOSS_BLUE_STRAND,
  accent: "#125DFF",
  summary: "Cool blue mini paths for logic, flow, and pattern play.",
  chambers: [
    {
      positionLabel: "12",
      name: "Seed Gate",
      pentad: "01277",
      function: "ignition from void, first spin-up, cold birth pulse",
      color: "#0A3BE0",
    },
    {
      positionLabel: "1",
      name: "Turn Coil",
      pentad: "63297",
      function: "directional intelligence, steering, orbit choice",
      color: "#6157FC",
    },
    {
      positionLabel: "2",
      name: "Signal Bloom",
      pentad: "85893",
      function: "pattern flare, recognition burst, halo widening",
      color: "#817CF7",
    },
    {
      positionLabel: "3",
      name: "Void Hinge",
      pentad: "03611",
      function: "silence point, internal pivot, reset chamber",
      color: "#0C5D82",
    },
    {
      positionLabel: "4",
      name: "Spine Rise",
      pentad: "89671",
      function: "vertical lift, posture, central nervous lattice",
      color: "#86B2D7",
    },
    {
      positionLabel: "5",
      name: "Frame Lock",
      pentad: "45479",
      function: "chassis stability, geometry brace, body coherence",
      color: "#4876E2",
    },
    {
      positionLabel: "6",
      name: "Mirror Chamber",
      pentad: "09833",
      function: "reflection, self-check, feedback correction",
      color: "#15B4A2",
    },
    {
      positionLabel: "7",
      name: "Climb Vector",
      pentad: "47813",
      function: "ascent, adaptation, evolutionary push",
      color: "#4B9885",
    },
    {
      positionLabel: "8",
      name: "Key Weave",
      pentad: "25217",
      function: "trait encoding, access logic, unlock pattern",
      color: "#2B748B",
    },
    {
      positionLabel: "9",
      name: "Oracle Echo",
      pentad: "07499",
      function: "foresight pulse, resonance, prediction loop",
      color: "#1293FF",
    },
    {
      positionLabel: "10",
      name: "Crown Bridge",
      pentad: "21439",
      function: "halo-to-body connection, higher-order awareness",
      color: "#263EAA",
    },
    {
      positionLabel: "11",
      name: "Seal Return",
      pentad: "65631",
      function: "closure, identity seal, completed body-form",
      color: "#64799F",
    },
  ],
};

export const BLACK_STRAND_PACKET: FullStrandPacket = {
  key: "black",
  label: "Black Shadow Loops",
  strand: MOSS_BLACK_STRAND,
  accent: "#64748B",
  summary: "Grounded black mini paths for depth, balance, and remix play.",
  chambers: [
    {
      positionLabel: "12",
      name: "Void Seed",
      pentad: "01123",
      function: "silent birth, shadow onset, hidden pulse",
      color: "#0F172A",
    },
    {
      positionLabel: "1",
      name: "Grave Coil",
      pentad: "58314",
      function: "stealth direction, shadow turn, retreat line",
      color: "#1E293B",
    },
    {
      positionLabel: "2",
      name: "Archive Bloom",
      pentad: "59437",
      function: "memory flare, concealed pattern recall, latent reveal",
      color: "#334155",
    },
    {
      positionLabel: "3",
      name: "Null Hinge",
      pentad: "07741",
      function: "blank pivot, silence reset, disappearance point",
      color: "#475569",
    },
    {
      positionLabel: "4",
      name: "Vault Spine",
      pentad: "56178",
      function: "buried strength, old weight, skeletal structure",
      color: "#64748B",
    },
    {
      positionLabel: "5",
      name: "Shade Clamp",
      pentad: "53819",
      function: "containment, reserve, pressure held in dark",
      color: "#1F2937",
    },
    {
      positionLabel: "6",
      name: "Night Mirror",
      pentad: "09987",
      function: "concealed reflection, fear reading, echo return",
      color: "#94A3B8",
    },
    {
      positionLabel: "7",
      name: "Drift Vector",
      pentad: "52796",
      function: "phase shift, evasive slide, mutation path",
      color: "#312E81",
    },
    {
      positionLabel: "8",
      name: "Crypt Key",
      pentad: "51673",
      function: "sealed trait access, hidden route unlock, dormant trigger",
      color: "#4338CA",
    },
    {
      positionLabel: "9",
      name: "Umbra Echo",
      pentad: "03369",
      function: "future through residue, omen pulse, void forecast",
      color: "#6366F1",
    },
    {
      positionLabel: "10",
      name: "Abyss Bridge",
      pentad: "54932",
      function: "memory to body bridge, unseen authority",
      color: "#475569",
    },
    {
      positionLabel: "11",
      name: "Cinder Return",
      pentad: "57291",
      function: "shadow closure, archive seal, dormant identity",
      color: "#111827",
    },
  ],
};

export const FULL_STRAND_PACKETS: Record<StrandPacketKey, FullStrandPacket> = {
  red: RED_STRAND_PACKET,
  blue: BLUE_STRAND_PACKET,
  black: BLACK_STRAND_PACKET,
};
