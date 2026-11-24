import { describe, expect, it } from "vitest";
import {
  EFFECTS, EXPRESSION_CONTRACT_VERSION, EYE_MOODS, INTERPRETATIONS, MOUTH_SHAPES, OSCILLATOR_KINDS,
  PACKS, PARTICLE_BEHAVIOURS, PROP_KINDS, beatsToKeyframes, defineExpression,
} from "./contract";
import { DEFAULT_SETTINGS, EXPRESSIONS, FORMS, getExpression, sampleExpression, seedFor } from "./studio";
import { performanceProfile } from "./personality";
import type { PersonalityTraits } from "@/genome/types";

const base: PersonalityTraits = {
  energy: 55, social: 55, curiosity: 55, discipline: 55, affection: 55, independence: 55,
  playfulness: 55, loyalty: 55, temperament: "Calm", quirks: [],
};

/** The 24 ids shipped in the first PR #201 revision; saved recipes, favourites and comics reference them. */
const ORIGINAL_IDS = [
  "hello", "bye", "yes", "thanks", "happy", "love", "sad", "confused", "lol", "bruh", "side-eye", "think",
  "eureka", "focus", "solved", "win", "champion", "level", "party", "sleepy", "dance", "lotus", "orbit", "chaos",
];

describe("expression catalogue integrity", () => {
  it("keeps every original id and fills all twelve packs", () => {
    const ids = EXPRESSIONS.map(e => e.id);
    for (const id of ORIGINAL_IDS) expect(ids).toContain(id);
    expect(PACKS).toHaveLength(12);
    for (const pack of PACKS) expect(EXPRESSIONS.filter(e => e.category === pack).length, pack).toBeGreaterThanOrEqual(3);
    expect(new Set(EXPRESSIONS.map(e => e.label.toLowerCase())).size).toBe(EXPRESSIONS.length);
  });

  it("only uses declared vocabulary in every performance", () => {
    for (const e of EXPRESSIONS) {
      expect(e.version).toBe(EXPRESSION_CONTRACT_VERSION);
      expect(e.id).toMatch(/^[a-z0-9-]+$/);
      expect(PACKS).toContain(e.category);
      expect(EFFECTS).toContain(e.effect);
      expect(EYE_MOODS).toContain(e.face.eyes);
      expect(MOUTH_SHAPES).toContain(e.face.mouth);
      expect(INTERPRETATIONS).toContain(e.interpretation);
      expect(PARTICLE_BEHAVIOURS).toContain(e.particles.behaviour);
      expect(e.particles.count).toBeGreaterThanOrEqual(0);
      expect(e.particles.count).toBeLessThanOrEqual(16);
      expect(e.duration).toBeGreaterThanOrEqual(600);
      expect(e.duration).toBeLessThanOrEqual(4000);
      expect(e.reducedMotionFrame).toBeGreaterThan(0);
      expect(e.reducedMotionFrame).toBeLessThan(1);
      expect(e.caption.length).toBeGreaterThan(0);
      expect(e.caption.length).toBeLessThanOrEqual(24);
      for (const cue of e.props) {
        expect(PROP_KINDS).toContain(cue.kind);
        expect(cue.from).toBeGreaterThanOrEqual(0);
        expect(cue.to).toBeLessThanOrEqual(1);
        expect(cue.to).toBeGreaterThan(cue.from);
      }
      for (const osc of e.movement) {
        expect(OSCILLATOR_KINDS).toContain(osc.kind);
        expect(osc.to).toBeGreaterThan(osc.from);
      }
      for (const pose of e.keyframes) expect(pose).toHaveLength(10);
      expect(Object.keys(e.capabilities)).toEqual([...FORMS]);
    }
  });

  it("rests at neutral at both ends so loops are seamless", () => {
    for (const e of EXPRESSIONS) {
      expect(e.keyframes[0].slice(1)).toEqual(e.keyframes.at(-1)!.slice(1));
      const start = sampleExpression(e, 0, DEFAULT_SETTINGS, base, 1);
      const end = sampleExpression(e, 1, DEFAULT_SETTINGS, base, 1);
      expect(end.x).toBeCloseTo(start.x, 5);
      expect(end.y).toBeCloseTo(start.y, 5);
    }
  });

  it("is genuinely animated: each performance moves the body, face and accessories over time", () => {
    for (const e of EXPRESSIONS) {
      const frames = Array.from({ length: 24 }, (_, i) => sampleExpression(e, i / 24, DEFAULT_SETTINGS, base, 7));
      const distinct = new Set(frames.map(f => [f.x, f.y, f.angle, f.squash, f.scale].map(n => n.toFixed(2)).join()));
      expect(distinct.size, e.id).toBeGreaterThanOrEqual(8);
      if (e.props.length) expect(frames.some(f => f.props.length > 0), e.id).toBe(true);
    }
  });

  it("produces bounded, finite frames for every expression across the whole loop", () => {
    for (const e of EXPRESSIONS) for (let i = 0; i <= 40; i += 1) {
      const f = sampleExpression(e, i / 40, DEFAULT_SETTINGS, { ...base, energy: 100, playfulness: 100 }, 3);
      for (const n of [f.x, f.y, f.angle, f.scale, f.squash, f.lid, f.mouth, f.mouthOpen, f.aura]) expect(Number.isFinite(n), e.id).toBe(true);
      expect(Math.abs(f.x)).toBeLessThanOrEqual(40);
      expect(f.y).toBeGreaterThanOrEqual(-45);
      expect(f.y).toBeLessThanOrEqual(34);
      expect(f.particles.length).toBeLessThanOrEqual(16);
      for (const p of f.particles) {
        expect(p.x).toBeGreaterThanOrEqual(34); expect(p.x).toBeLessThanOrEqual(478);
        expect(p.y).toBeGreaterThanOrEqual(34); expect(p.y).toBeLessThanOrEqual(478);
      }
    }
  });
});

describe("animation principles", () => {
  it("is deterministic for a seed and varies particles between seeds", () => {
    for (const e of EXPRESSIONS) {
      expect(sampleExpression(e, .43, DEFAULT_SETTINGS, base, seedFor("a"))).toEqual(sampleExpression(e, .43, DEFAULT_SETTINGS, base, seedFor("a")));
    }
    const confetti = getExpression("fireworks")!;
    expect(sampleExpression(confetti, .5, DEFAULT_SETTINGS, base, 1).particles)
      .not.toEqual(sampleExpression(confetti, .5, DEFAULT_SETTINGS, base, 2).particles);
  });

  it("reduced motion holds one readable frame with no follow-through or oscillation", () => {
    for (const e of EXPRESSIONS) {
      const a = sampleExpression(e, .1, DEFAULT_SETTINGS, base, 1, true);
      const b = sampleExpression(e, .9, DEFAULT_SETTINGS, base, 1, true);
      expect(a).toEqual(b);
      expect(a.lag).toEqual({ x: 0, y: 0, angle: 0 });
    }
  });

  it("anticipates and overshoots with spring easing but not linear", () => {
    const e = getExpression("win")!;
    const jump = (easing: "spring" | "linear") =>
      Array.from({ length: 60 }, (_, i) => sampleExpression(e, i / 60, { ...DEFAULT_SETTINGS, easing }, base, 1).y);
    const spring = jump("spring");
    const linear = jump("linear");
    expect(Math.min(...spring)).toBeLessThan(Math.min(...linear));
    // Anticipation: spring dips down (positive y) before the leap.
    expect(Math.max(...spring.slice(0, 20))).toBeGreaterThan(Math.max(...linear.slice(0, 20)) + .1);
  });

  it("squashes on landing and stretches in the air", () => {
    // Positive squash widens and flattens the body; negative stretches it tall.
    const squash = Array.from({ length: 60 }, (_, i) => sampleExpression(getExpression("win")!, i / 60, DEFAULT_SETTINGS, base, 1).squash);
    expect(Math.min(...squash)).toBeLessThan(-.03);
    expect(Math.max(...squash)).toBeGreaterThan(.03);
  });

  it("drags loose parts behind fast movement (follow-through)", () => {
    const e = getExpression("bye")!;
    const lags = Array.from({ length: 40 }, (_, i) => sampleExpression(e, i / 40, DEFAULT_SETTINGS, base, 1).lag);
    expect(lags.some(l => Math.abs(l.x) > .5 || Math.abs(l.angle) > .5)).toBe(true);
  });
});

describe("personality interpretation", () => {
  const travel = (p: PersonalityTraits, id: string) => {
    const e = getExpression(id)!;
    return Math.max(...Array.from({ length: 48 }, (_, i) => {
      const f = sampleExpression(e, i / 48, DEFAULT_SETTINGS, p, 1);
      return Math.hypot(f.x, f.y);
    }));
  };

  it("derives the profile only from genome traits, temperament and quirks", () => {
    expect(performanceProfile(base)).toEqual(performanceProfile(structuredClone(base)));
    const bold = performanceProfile({ ...base, social: 95, independence: 95, temperament: "Adventurous" });
    const shy = performanceProfile({ ...base, social: 10, independence: 15, temperament: "Gentle" });
    expect(bold.boldness).toBeGreaterThan(shy.boldness);
    expect(shy.reserve).toBeGreaterThan(bold.reserve);
    expect(performanceProfile({ ...base, quirks: ["Loves to spin"] }).spins).toBe(true);
    expect(performanceProfile({ ...base, quirks: ["Dances when happy"] }).dances).toBe(true);
    // Junk input falls back to neutral rather than throwing.
    const junk = performanceProfile({ ...base, energy: Number.NaN, temperament: "Unknown" as never, quirks: null as never });
    expect(junk.energy).toBe(.5);
    expect(junk.spins).toBe(false);
  });

  it("bold creatures celebrate bigger than reserved ones", () => {
    const bold = { ...base, social: 95, independence: 95, energy: 90, temperament: "Adventurous" } as PersonalityTraits;
    const shy = { ...base, social: 10, independence: 10, energy: 20, temperament: "Gentle" } as PersonalityTraits;
    for (const id of ["win", "fireworks", "party"]) expect(travel(bold, id), id).toBeGreaterThan(travel(shy, id));
  });

  it("playful creatures exaggerate squash and stretch more than disciplined calm ones", () => {
    const range = (p: PersonalityTraits) => {
      const s = Array.from({ length: 60 }, (_, i) => sampleExpression(getExpression("lol")!, i / 60, DEFAULT_SETTINGS, p, 1).squash);
      return Math.max(...s) - Math.min(...s);
    };
    expect(range({ ...base, playfulness: 95, discipline: 10, temperament: "Mischievous" }))
      .toBeGreaterThan(range({ ...base, playfulness: 10, discipline: 95, temperament: "Calm" }));
  });

  it("curious creatures look around more when inspecting", () => {
    const gaze = (p: PersonalityTraits) => Math.max(...Array.from({ length: 48 }, (_, i) =>
      Math.abs(sampleExpression(getExpression("curious")!, i / 48, DEFAULT_SETTINGS, p, 1).gazeX)));
    expect(gaze({ ...base, curiosity: 95 })).toBeGreaterThan(gaze({ ...base, curiosity: 10 }));
  });
});

describe("contract helpers", () => {
  const spec = {
    id: "probe", label: "Probe", category: "Everyday", tags: "probe", duration: 1000, effect: "halo",
    personality: "energy", staticFrame: .5, beats: [{ t: .3, x: 4 }, { t: .6, y: -10 }],
  } as const;

  it("carries values forward between beats and adds neutral rests", () => {
    const keys = beatsToKeyframes(spec.beats);
    expect(keys[1][1]).toBe(4);
    const e = defineExpression(spec);
    expect(e.keyframes.map(k => k[0])).toEqual([0, .3, .6, 1]);
    expect(e.keyframes[0].slice(1)).toEqual(e.keyframes.at(-1)!.slice(1));
  });

  it("rejects malformed definitions", () => {
    expect(() => defineExpression({ ...spec, id: "Bad Id" })).toThrow();
    expect(() => defineExpression({ ...spec, beats: [{ t: 1.4 }] })).toThrow();
    expect(() => defineExpression({ ...spec, beats: [{ t: .6 }, { t: .3 }] })).toThrow();
    expect(() => defineExpression({ ...spec, staticFrame: 1 })).toThrow();
    expect(() => defineExpression({ ...spec, props: [{ kind: "zzz", from: .8, to: .2 }] })).toThrow();
    expect(() => defineExpression({ ...spec, particles: { count: 40 } })).toThrow();
  });
});
