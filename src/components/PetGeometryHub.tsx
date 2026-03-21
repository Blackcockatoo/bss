"use client";

/**
 * Pet Geometry Hub — Interactive Geometry Beast sandbox
 *
 * Keeps all tuning local to this dashboard card while letting the pet respond
 * to hover, taps, and packet bias changes in real time.
 */

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  MOSS_BLACK_STRAND,
  MOSS_BLUE_STRAND,
  MOSS_RED_STRAND,
} from "@/lib/moss60/strandSequences";
import {
  PET_MOVEMENT_PRESETS,
  SriYantraPetEngine,
  type PetInteractiveZone,
  type PetMovementPreset,
  type PetReactionState,
} from "./SriYantraPetEngine";
import { Button } from "./ui/button";
import { Pause, Play, RotateCcw, Shuffle } from "lucide-react";

type PacketChannel = "red" | "blue" | "black";
type PacketSet = Record<PacketChannel, string>;
type ChannelBiases = Record<PacketChannel, number>;

const CHANNELS: PacketChannel[] = ["red", "blue", "black"];
const ZERO_BIASES: ChannelBiases = { red: 0, blue: 0, black: 0 };
const ZONE_CHANNEL_MAP: Partial<Record<PetInteractiveZone, PacketChannel>> = {
  crown: "red",
  eyes: "blue",
  void: "black",
};
const ZONE_LABELS: Record<PetInteractiveZone, string> = {
  crown: "Crown ridge",
  eyes: "Reactor eyes",
  core: "Chest core",
  void: "Oracle void",
  tail: "Tail arc",
};
const REACTION_LABELS: Record<PetInteractiveZone, string> = {
  crown: "Crown spike",
  eyes: "Watch lock",
  core: "Breath pulse",
  void: "Oracle drift",
  tail: "Play flick",
};
const CHANNEL_COPY: Record<PacketChannel, string> = {
  red: "Crown Force — raises the face crest, jaw tension, and chest armor.",
  blue: "Bridge Flow — stabilizes the reactor eyes, breath rhythm, and halo balance.",
  black:
    "Void Channel — deepens the sockets, slits, and night-face oracle pull.",
};
const CHANNEL_NOTE: Record<PacketChannel, string> = {
  red: "Face + Crown",
  blue: "Breath + Flow",
  black: "Void + Oracle",
};
const CHANNEL_PANEL: Record<PacketChannel, string> = {
  red: "border-yellow-500/20 bg-yellow-500/5 text-yellow-300",
  blue: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
  black: "border-purple-500/20 bg-purple-500/5 text-purple-300",
};
const CHANNEL_BAR: Record<PacketChannel, string> = {
  red: "from-yellow-300 via-yellow-500 to-amber-600",
  blue: "from-cyan-200 via-cyan-400 to-sky-600",
  black: "from-fuchsia-300 via-purple-500 to-violet-700",
};
const MOVEMENT_DETAILS: Record<
  PetMovementPreset,
  {
    label: string;
    note: string;
    activeClass: string;
  }
> = {
  idle: {
    label: "Idle",
    note: "Breathing sentinel posture.",
    activeClass: "border-white/30 bg-white/12 text-white",
  },
  wave: {
    label: "Wave",
    note: "High crest hello with a raised arm.",
    activeClass: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
  },
  dab: {
    label: "Dab",
    note: "Diagonal power pose with tucked mask.",
    activeClass: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200",
  },
  shuffle: {
    label: "Shuffle",
    note: "Side-step ritual footwork.",
    activeClass: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  },
  walk: {
    label: "Walk",
    note: "Measured guardian stride.",
    activeClass: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  },
  dance: {
    label: "Dance",
    note: "Full-body festival bounce.",
    activeClass: "border-pink-400/40 bg-pink-500/15 text-pink-200",
  },
  lotus: {
    label: "Lotus",
    note: "Crossed-leg meditation trance.",
    activeClass: "border-violet-400/40 bg-violet-500/15 text-violet-200",
  },
};
const MOVEMENT_PARADE = PET_MOVEMENT_PRESETS.filter(
  (movement) => movement !== "idle",
);

function randomPacket(length: number) {
  const values = new Uint8Array(length);

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i++) {
      values[i] = Math.floor(Math.random() * 10);
    }
  }

  return Array.from(values, (value) => String(value % 10)).join("");
}

function clampBias(value: number) {
  return Math.max(-4, Math.min(4, value));
}

function transformPacket(packet: string, bias: number) {
  return Array.from(packet, (char) => {
    if (!/\d/.test(char)) {
      return char;
    }

    return String((Number(char) + bias + 10) % 10);
  }).join("");
}

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);

    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return prefersReducedMotion;
}

export function PetGeometryHub() {
  const [animated, setAnimated] = useState(true);
  const [movement, setMovement] = useState<PetMovementPreset>("dance");
  const [movementParade, setMovementParade] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<PacketChannel>("red");
  const [basePackets, setBasePackets] = useState<PacketSet>(() => ({
    red: MOSS_RED_STRAND,
    blue: MOSS_BLUE_STRAND,
    black: MOSS_BLACK_STRAND,
  }));
  const [biases, setBiases] = useState<ChannelBiases>(ZERO_BIASES);
  const [activeZone, setActiveZone] = useState<PetInteractiveZone | null>(null);
  const [reaction, setReaction] = useState<PetReactionState | null>(null);
  const [gazeTarget, setGazeTarget] = useState<{ x: number; y: number } | null>(
    null,
  );

  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotionPreference();
  const paradeActive = movementParade && !prefersReducedMotion;

  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!animated || !paradeActive) {
      return;
    }

    const interval = setInterval(() => {
      setMovement((current) => {
        const currentIndex = MOVEMENT_PARADE.findIndex(
          (preset) => preset === current,
        );
        const nextIndex =
          currentIndex === -1
            ? 0
            : (currentIndex + 1) % MOVEMENT_PARADE.length;

        return MOVEMENT_PARADE[nextIndex] ?? "dance";
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [animated, paradeActive]);

  const previewPackets = useMemo<PacketSet>(
    () => ({
      red: transformPacket(basePackets.red, biases.red),
      blue: transformPacket(basePackets.blue, biases.blue),
      black: transformPacket(basePackets.black, biases.black),
    }),
    [basePackets, biases],
  );

  const activeChannelOverride = activeZone
    ? (ZONE_CHANNEL_MAP[activeZone] ?? null)
    : reaction
      ? (ZONE_CHANNEL_MAP[reaction.zone] ?? null)
      : null;
  const displayChannel = activeChannelOverride ?? selectedChannel;
  const currentStrand = previewPackets[displayChannel];
  const focusZone = activeZone ?? reaction?.zone ?? null;
  const reactionLabel = reaction?.label ?? "Approach the beast";
  const activeMovement = MOVEMENT_DETAILS[movement];

  const handleMutate = () => {
    setBasePackets((current) => ({
      red: randomPacket(current.red.length),
      blue: randomPacket(current.blue.length),
      black: randomPacket(current.black.length),
    }));
    setBiases(ZERO_BIASES);
    setReaction(null);
    setActiveZone(null);
    setGazeTarget(null);
  };

  const handleResetTuning = () => {
    setBiases(ZERO_BIASES);
  };

  const handleBiasAdjust = (channel: PacketChannel, delta: number) => {
    setBiases((current) => ({
      ...current,
      [channel]: clampBias(current[channel] + delta),
    }));
  };

  const handleZoneTap = (zone: PetInteractiveZone) => {
    const nextReaction: PetReactionState = {
      zone,
      label: REACTION_LABELS[zone],
      intensity: prefersReducedMotion ? 0.45 : 1,
      startedAt: Date.now(),
    };

    setReaction(nextReaction);

    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
    }

    reactionTimeoutRef.current = setTimeout(() => {
      setReaction((current) =>
        current?.startedAt === nextReaction.startedAt ? null : current,
      );
    }, 1200);
  };

  const handleStagePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || event.pointerType !== "mouse") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    setGazeTarget({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  const handleStagePointerLeave = () => {
    setGazeTarget(null);
    setActiveZone(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 shadow-2xl">
        <div
          className="rounded-[28px] border border-white/8 bg-black/10 p-3"
          onPointerMove={handleStagePointerMove}
          onPointerLeave={handleStagePointerLeave}
        >
          <SriYantraPetEngine
            red={previewPackets.red}
            blue={previewPackets.blue}
            black={previewPackets.black}
            animated={animated}
            movement={movement}
            showConstellation={false}
            showScaffold={false}
            interactive
            activeZone={activeZone}
            reaction={reaction}
            gazeTarget={prefersReducedMotion ? null : gazeTarget}
            onZoneHover={setActiveZone}
            onZoneTap={handleZoneTap}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Focused zone
            </div>
            <div className="mt-2 text-sm font-semibold text-white">
              {focusZone ? ZONE_LABELS[focusZone] : "None"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Reaction
            </div>
            <div className="mt-2 text-sm font-semibold text-white">
              {reactionLabel}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Movement
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-fuchsia-200">
                {activeMovement.label}
              </span>
              {paradeActive && (
                <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-fuchsia-200">
                  Parade
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-white/55">
              {activeMovement.note}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/35">
          Touch crown, eyes, core, void, or tail to wake reactions, then stack a movement ritual on top.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            onClick={() => setAnimated(!animated)}
            className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15"
          >
            {animated ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Play
              </>
            )}
          </Button>
          <Button
            onClick={handleMutate}
            className="rounded-2xl border border-blue-400/20 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Forge Spread
          </Button>
          <Button
            onClick={handleResetTuning}
            variant="outline"
            className="rounded-2xl border-white/15 bg-white/[0.03] text-white/80 hover:bg-white/10"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Tuning
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                Movement Library
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Wave, dab, shuffle, walk, dance, or drop into a lotus sit.
                Parade mode cycles the active beast through the full ritual set.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMovementParade((current) => !current)}
              className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
                paradeActive
                  ? "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              }`}
              disabled={prefersReducedMotion}
            >
              {prefersReducedMotion
                ? "Parade Locked"
                : paradeActive
                  ? "Stop Parade"
                  : "Start Parade"}
            </button>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {PET_MOVEMENT_PRESETS.map((preset) => {
              const details = MOVEMENT_DETAILS[preset];
              const isActive = movement === preset;

              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMovement(preset);
                    setMovementParade(false);
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? details.activeClass
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em]">
                    {details.label}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-white/55">
                    {details.note}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {CHANNELS.map((channel) => {
            const isActive = displayChannel === channel;

            return (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel)}
                className={`rounded-2xl border px-4 py-3 text-center transition-all ${
                  isActive
                    ? channel === "red"
                      ? "border-yellow-400/50 bg-yellow-500/15 text-yellow-300"
                      : channel === "blue"
                        ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300"
                        : "border-purple-400/50 bg-purple-500/15 text-purple-300"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <div className="font-mono text-xs uppercase tracking-[0.15em]">
                  {channel === "red"
                    ? "Red"
                    : channel === "blue"
                      ? "Blue"
                      : "Black"}
                </div>
                <div className="mt-1 text-[10px] text-white/50">
                  {CHANNEL_NOTE[channel]}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                Active Preview Channel
              </div>
              <p className="text-sm leading-6 text-white/80">
                {CHANNEL_COPY[displayChannel]}
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/50">
              {focusZone ? ZONE_LABELS[focusZone] : "Manual focus"}
            </div>
          </div>
          <div className="mt-3 max-h-16 overflow-y-auto break-all rounded-xl bg-white/5 p-2 font-mono text-xs text-white/60">
            {currentStrand}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              Forge Strip
            </div>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Nudge each channel from -4 to +4. This only reshapes the live
              preview.
            </p>
          </div>

          <div className="space-y-3">
            {CHANNELS.map((channel) => {
              const bias = biases[channel];
              const fillStart = bias < 0 ? 50 + (bias / 8) * 100 : 50;
              const fillWidth = (Math.abs(bias) / 8) * 100;
              const indicatorLeft = 50 + (bias / 8) * 100;

              return (
                <div
                  key={channel}
                  className={`rounded-2xl border p-3 ${CHANNEL_PANEL[channel]}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <div className="font-mono text-xs uppercase tracking-[0.18em]">
                        {channel}
                      </div>
                      <div className="mt-1 text-[10px] text-white/50">
                        {CHANNEL_NOTE[channel]}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBiasAdjust(channel, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/15 text-lg text-white/80 transition hover:bg-white/10 disabled:opacity-40"
                      disabled={bias <= -4}
                    >
                      -
                    </button>

                    <div className="relative h-10 flex-1">
                      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
                      <div className="absolute left-1/2 top-1/2 h-5 w-px -translate-y-1/2 bg-white/25" />
                      <div
                        className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r ${CHANNEL_BAR[channel]}`}
                        style={{
                          left: `${fillStart}%`,
                          width: `${fillWidth}%`,
                        }}
                      />
                      <div
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.3)]"
                        style={{ left: `${indicatorLeft}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBiasAdjust(channel, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/15 text-lg text-white/80 transition hover:bg-white/10 disabled:opacity-40"
                      disabled={bias >= 4}
                    >
                      +
                    </button>

                    <div className="w-12 text-right font-mono text-sm text-white">
                      {bias > 0 ? `+${bias}` : bias}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 text-xs text-white/50 sm:grid-cols-3">
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
            <div className="font-mono text-yellow-400">Red Packet</div>
            <p className="mt-1">
              Drives the crown ridge, cheek blades, and front-facing aggression.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div className="font-mono text-cyan-400">Blue Packet</div>
            <p className="mt-1">
              Controls eye glow, breathing cadence, rings, and bridge symmetry.
            </p>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
            <div className="font-mono text-purple-400">Black Packet</div>
            <p className="mt-1">
              Shapes hollows, slits, socket depth, and the oracle-side face.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
