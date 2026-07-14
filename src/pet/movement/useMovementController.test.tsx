import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  useMovementController,
  type MovementControllerInputs,
} from "./useMovementController";

function mount(inputs: MovementControllerInputs = {}) {
  return renderHook(() =>
    useMovementController({ paused: true, identityKey: "test-pet", ...inputs }),
  );
}

describe("useMovementController", () => {
  it("starts on idle breathing", () => {
    const { result } = mount();
    expect(result.current.active.clip.id).toBe("idle_breathe");
  });

  it("lets higher priority interrupt and blocks lower priority", () => {
    const { result } = mount({ mood: 80, energy: 80 });
    act(() => {
      expect(result.current.play("head_tilt")).toBe(true);
    });
    expect(result.current.active.clip.id).toBe("head_tilt");
    // Touch (4) interrupts attention (3)…
    act(() => {
      expect(result.current.play("tap_surprise")).toBe(true);
    });
    expect(result.current.active.clip.id).toBe("tap_surprise");
    // …but attention (3) cannot interrupt touch (4).
    act(() => {
      expect(result.current.play("head_tilt")).toBe(false);
    });
    expect(result.current.active.clip.id).toBe("tap_surprise");
  });

  it("gates clips by mood and evolution state", () => {
    const { result } = mount({ mood: 10, energy: 80, evolutionState: "GENETICS" });
    act(() => {
      // happy_bounce requires a happy mood bucket.
      expect(result.current.play("happy_bounce")).toBe(false);
      // quantum_split requires QUANTUM/SPECIATION.
      expect(result.current.play("quantum_split")).toBe(false);
    });
  });

  it("suppresses celebratory moves during critical distress", () => {
    const { result } = mount({ mood: 90, energy: 80, hunger: 95 });
    act(() => {
      expect(result.current.play("happy_bounce")).toBe(false);
      expect(result.current.play("sacred_toy_bounce")).toBe(false);
      // Calm care motion is still allowed.
      expect(result.current.play("head_tilt")).toBe(true);
    });
  });

  it("blocks clips that are unsafe under reduced motion", () => {
    const { result } = mount({ mood: 80, reduceMotion: true });
    act(() => {
      expect(result.current.play("swipe_spin")).toBe(false);
      expect(result.current.play("blink")).toBe(true);
    });
  });

  it("starts an action sequence with its first playable step", () => {
    const { result } = mount({ mood: 80, energy: 80 });
    act(() => {
      result.current.playAction("feed");
    });
    // feed = head_tilt → hold_charge → happy_bounce.
    expect(result.current.active.clip.id).toBe("head_tilt");
  });

  it("skips gated steps so crisis feeds stay subdued", () => {
    const { result } = mount({ mood: 20, energy: 80 });
    act(() => {
      result.current.playAction("sleep");
    });
    // sleepy_droop requires the tired bucket (energy < 30). With energy 80
    // the droop is skipped and the fold-in step (unhappy-allowed) plays.
    expect(result.current.active.clip.id).toBe("folded_wing_hide");
  });

  it("maps love to a lean-blink-bloom sequence", () => {
    const { result } = mount({ mood: 80, energy: 80 });
    act(() => {
      result.current.onAffection();
    });
    expect(result.current.active.clip.id).toBe("head_tilt");
  });

  it("plays an anomaly reaction appropriate to the evolution state", () => {
    const early = mount({ evolutionState: "GENETICS" });
    act(() => {
      early.result.current.onAnomaly();
    });
    expect(["omen_twitch"]).toContain(early.result.current.active.clip.id);

    const evolved = mount({ evolutionState: "QUANTUM" });
    act(() => {
      evolved.result.current.onAnomaly();
    });
    expect(["omen_twitch", "oracle_blink", "quantum_split", "quantum_stutter"]).toContain(
      evolved.result.current.active.clip.id,
    );
  });

  it("keeps the ceremony available and identity-stable per pet", () => {
    const a = mount({ identityKey: "pet-one" });
    const b = mount({ identityKey: "pet-one" });
    const c = mount({ identityKey: "pet-two" });
    expect(a.result.current.seed).toBe(b.result.current.seed);
    expect(a.result.current.seed).not.toBe(c.result.current.seed);
    act(() => {
      a.result.current.playCeremony();
    });
    expect(a.result.current.active.clip.id).toBe("evolution_ceremony");
  });

  it("resolves play deterministically per pet identity", () => {
    const run = () => {
      const { result } = mount({ identityKey: "determinism", mood: 80 });
      const ids: string[] = [];
      for (let index = 0; index < 4; index += 1) {
        act(() => {
          result.current.playAction("play");
        });
        ids.push(result.current.active.clip.id);
      }
      return ids;
    };
    expect(run()).toEqual(run());
  });
});
