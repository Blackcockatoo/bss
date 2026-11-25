import type { ForgeBeat } from "@/lib/tools/audio";
import { seededUnit } from "@/pet/movement/movementScheduler";
import type { Director } from "./director";

export function genomeMotif(seed: number, energy: number) {
  const scale = [0, 2, 4, 7, 9, 12];
  const sequence = Array.from({ length: 8 }, (_, index) =>
    scale[Math.floor(seededUnit(seed, index, 25) * scale.length)]);
  const rhythm = seededUnit(seed, 0, 26) > .5 ? [1, .5, .5, 2] : [1, 1, .5, .5];
  return { sequence, rhythm, tempo: Math.round(76 + Math.min(100, Math.max(0, energy)) * .4) };
}

export function playBeatPose(director: Director, beat: ForgeBeat, source: "music" | "learned" = "music") {
  const harmony = Math.abs(beat.interval) % 12;
  const consonant = harmony === 0 || harmony === 4 || harmony === 7;
  return director.play(beat.downbeat ? "dance" : consonant ? "resonance" : beat.note % 2 ? "cheeky" : "dance", {
    source,
    direction: beat.index % 2 ? -1 : 1,
    intensity: beat.downbeat ? 1.16 : consonant ? .82 : .69,
    duration: Math.max(220, beat.durationMs * 1.06),
  });
}
