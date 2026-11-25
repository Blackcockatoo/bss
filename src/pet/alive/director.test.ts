import { describe, expect, it, vi } from "vitest";
import type { PersonalityTraits } from "@/genome/types";
import { parseTake, readTake, sampleTake, saveTake, takeDuration, takeFramePlan, weightedFrame } from "@/lib/expressions/take";
import { createDirector, gestureExpression, idleDelayMs, idleExpression } from "./director";
import { genomeMotif, playBeatPose } from "./music";
import { trackPulse } from "./useLocalTrack";

const personality: PersonalityTraits = {
  affection: 82, curiosity: 74, discipline: 35, energy: 72,
  independence: 30, loyalty: 65, playfulness: 80, social: 68,
  temperament: "playful", quirks: [],
};

function rig() {
  let time = 0;
  let fn: FrameRequestCallback | undefined;
  let blocked = false;
  let reduced = false;
  const director = createDirector({
    form: "evolved", seed: 81, personality,
    blocked: () => blocked, reduced: () => reduced,
    clock: {
      now: () => time, request: callback => { fn = callback; return 1; }, cancel: () => { fn = undefined; },
    },
  });
  return {
    director,
    at(next: number) { time = next; const frame = fn; fn = undefined; frame?.(next); },
    block(value: boolean) { blocked = value; },
    reduce() { reduced = true; },
  };
}

describe("live performance director", () => {
  it("crossfades interruptions using the same deterministic take evaluator", () => {
    const { director, at } = rig();
    director.startTake();
    expect(director.play("happy", { source: "directed" })).toBe(true);
    at(430);
    const previous = director.getFrame();
    expect(previous?.weight).toBe(1);
    expect(director.play("lol", { source: "directed" })).toBe(true);
    at(465);
    const blend = director.getFrame()!;
    expect(blend.cue.expressionId).toBe("happy");
    expect(weightedFrame(blend).y).toBeCloseTo(weightedFrame(sampleTake(director.finishTake()!, 465, personality, 81)!).y);
    at(620);
    expect(director.getFrame()?.cue.expressionId).toBe("lol");
  });

  it("gives care and critical state precedence and wakes subscribers only for active cues", () => {
    const { director, at, block } = rig();
    const listener = vi.fn();
    director.subscribe(listener);
    at(333);
    expect(listener).not.toHaveBeenCalled();
    director.play("hello", { source: "directed" });
    at(380);
    expect(director.getFrame()).not.toBeNull();
    expect(director.play("dance", { source: "ambient" })).toBe(false);
    block(true);
    at(430);
    expect(director.getFrame()).toBeNull();
    expect(director.play("hello", { source: "directed" })).toBe(false);
    block(false);
    director.setPaused(true);
    expect(director.replay()).toBe(false);
  });

  it("switches reduced motion to a stable, brief pose", () => {
    const { director, at, reduce } = rig();
    reduce();
    director.play("lol", { source: "directed" });
    at(40);
    const first = director.getFrame();
    at(123);
    expect(director.getFrame()).toEqual(first);
    at(700);
    expect(director.getFrame()).toBeNull();
  });

  it("varies spontaneous gestures with mode, fatigue and real genetic traits", () => {
    const tap = { kind: "double-tap" as const, intensity: .5, direction: 1 as const };
    expect(gestureExpression(tap, "playful", personality)).toBe("lol");
    expect(gestureExpression(tap, "playful", { ...personality, playfulness: 20 })).toBe("happy");
    expect(idleExpression(81, 3, "calm", true, 50)).toMatch(/sleepy|yawn|moonbeam|goodnight/);
    expect(idleExpression(81, 2, "playful", false, 50)).toBe(idleExpression(81, 2, "playful", false, 50));
    expect(new Set(Array.from({ length: 24 }, (_, i) => idleExpression(81, i, "playful", false, 50))).size).toBeGreaterThan(1);
  });

  it("uses a quicker playful cadence and exercises more existing poses", () => {
    const picks = Array.from({ length: 32 }, (_, i) => idleExpression(81, i, "playful", false, 72));
    expect(new Set(picks).size).toBeGreaterThanOrEqual(6);
    expect(idleDelayMs(81, 0, "playful")).toBeLessThan(4200);
    expect(idleDelayMs(81, 0, "calm")).toBeGreaterThanOrEqual(4500);
    const { director, at } = rig();
    const tap = { kind: "tap", intensity: .5, direction: 1 } as const;
    director.gesture(tap);
    at(230);
    expect(director.getFrame()?.cue.expressionId).toBe("hello");
    director.gesture(tap);
    at(500);
    expect(director.getFrame()?.cue.expressionId).toMatch(/^(wink|high-five|cheer)$/);
  });

  it("lets the pet notice a pointer without interrupting a deliberate gesture", () => {
    const { director, at, reduce } = rig();
    const hover = { kind: "hover", intensity: .5, direction: -1 } as const;
    expect(director.gesture(hover)).toBe(true);
    at(140);
    expect(director.getFrame()?.cue).toMatchObject({ expressionId: "curious", direction: -1 });
    expect(director.gesture(hover)).toBe(false);
    at(3500);
    director.play("win", { source: "directed" });
    expect(director.gesture(hover)).toBe(false);
    at(9000);
    reduce();
    expect(director.gesture(hover)).toBe(false);
  });

  it("drives the shared sampler from downbeat, note interval and tempo", () => {
    const { director, at } = rig();
    expect(genomeMotif(81, 72)).not.toEqual(genomeMotif(82, 72));
    playBeatPose(director, { note: 7, interval: 7, index: 0, durationMs: 500, downbeat: true });
    at(180);
    expect(director.getFrame()).toMatchObject({ cue: { source: "music", expressionId: "dance", duration: 530 } });
    const initial = { average: 30, lastMs: 500, intervalMs: 450, count: 1 };
    expect(trackPulse(initial, 82, 940).onset).toBe(true);
    expect(trackPulse(initial, 82, 530).onset).toBe(false);
  });

  it("keeps brief cues in a long exported take within the frame budget", () => {
    const { director, at } = rig();
    director.startTake();
    director.play("dance", { source: "music", duration: 240 });
    at(3205);
    director.play("resonance", { source: "music", duration: 150 });
    at(11_900);
    director.play("win", { source: "directed", duration: 500 });
    const take = director.finishTake()!;
    const framePlan = takeFramePlan(take);
    const duration = takeDuration(take);
    const seen = framePlan.map(({ progress }) => sampleTake(take, Math.round(progress * duration), personality, 81)?.cue.expressionId);
    expect(seen).toEqual(expect.arrayContaining(["dance", "resonance", "win"]));
    expect(framePlan.length).toBeLessThanOrEqual(96);
    expect(framePlan.every(frame => frame.delay >= 10)).toBe(true);
  });

  it("keeps recording packets local, per-pet and free of pointer traces", () => {
    const { director, at } = rig();
    director.startTake();
    expect(director.play("hello", { source: "ambient" })).toBe(false);
    director.gesture({ kind: "stroke", intensity: .4, direction: -1 });
    at(800);
    director.play("win", { source: "directed" });
    const take = director.finishTake()!;
    expect(take.cues.map(cue => cue.at)).toEqual([0, 800]);
    expect(takeDuration(take)).toBeGreaterThan(800);
    saveTake("alive-a", take);
    expect(readTake("alive-a")).toEqual(take);
    expect(readTake("alive-b")).toBeNull();
    const augmented = { ...take, cues: take.cues.map(cue => ({ ...cue, rawPoints: [[1, 2]] })) };
    expect(parseTake(JSON.stringify(augmented))).toEqual(take);
    expect(() => parseTake(JSON.stringify({ ...take, cues: [...take.cues].reverse() }))).toThrow();
  });
});
