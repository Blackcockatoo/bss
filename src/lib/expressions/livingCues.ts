import { defineExpression } from "./contract";

const figureEight = defineExpression({
  id: "mirror-eight",
  label: "Mirror a figure eight",
  category: "Creature Life",
  tags: "mirroring figure eight",
  duration: 1450,
  staticFrame: .3,
  effect: "halo",
  personality: "curiosity",
  particles: { count: 0 },
  eyes: "curious",
  beats: [
    { t: .12, x: 7, y: -7, gx: .45, gy: -.45, r: 4 },
    { t: .24, x: 14, y: 0, gx: .8, gy: 0, r: 6 },
    { t: .36, x: 7, y: 7, gx: .45, gy: .45, r: 4 },
    { t: .48, x: 0, y: 0, gx: 0, gy: 0, r: 0 },
    { t: .60, x: -7, y: -7, gx: -.45, gy: -.45, r: -4 },
    { t: .72, x: -14, y: 0, gx: -.8, gy: 0, r: -6 },
    { t: .84, x: -7, y: 7, gx: -.45, gy: .45, r: -4 },
  ],
});

const mantleBow = defineExpression({
  id: "mantle-bow",
  label: "Ceremonial bow",
  category: "Creature Life",
  tags: "mantle ceremony bow",
  duration: 1600,
  staticFrame: .52,
  effect: "halo",
  personality: "discipline",
  particles: { count: 0 },
  eyes: "focused",
  beats: [
    { t: .18, y: -4, r: -2, gy: -.2 },
    { t: .46, y: 16, sq: .11, r: 12, lid: .32, gy: .62, a: .3 },
    { t: .62, y: 15, sq: .11, r: 11, lid: .38, gy: .55, a: .24 },
    { t: .86, y: 1, sq: .01, r: 1, lid: .9, gy: .1 },
  ],
});

export const LIVING_CUES = [figureEight, mantleBow] as const;
