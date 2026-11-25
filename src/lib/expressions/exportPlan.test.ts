import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ExportTimeoutError, MAX_ANIMATION_FRAMES, MIN_ANIMATION_FRAMES, MIN_FRAME_DELAY_MS, planAnimation, startWorker, workerRequest,
} from "./exportPlan";

class FakeWorker extends EventTarget {
  posted: unknown[] = [];
  reply?: (message: unknown) => unknown;
  postMessage(message: unknown) {
    this.posted.push(message);
    const reply = this.reply?.(message);
    if (reply !== undefined) queueMicrotask(() => this.dispatchEvent(new MessageEvent("message", { data: reply })));
  }
}

afterEach(() => vi.useRealTimers());

describe("animation export plan", () => {
  it("bounds frame counts and delays for any duration", () => {
    for (const duration of [0, -5, Number.NaN, 1, 300, 1700, 4000, 60_000, Infinity]) {
      for (const loop of [true, false]) {
        const plan = planAnimation(duration, loop);
        expect(plan.frames).toBeGreaterThanOrEqual(MIN_ANIMATION_FRAMES);
        expect(plan.frames).toBeLessThanOrEqual(MAX_ANIMATION_FRAMES);
        expect(plan.delay).toBeGreaterThanOrEqual(MIN_FRAME_DELAY_MS);
        expect(plan.delay % 10).toBe(0);
        expect(plan.phases).toHaveLength(plan.frames);
        expect(plan.phases.every((phase, i) => phase >= 0 && phase <= 1 && (i === 0 || phase > plan.phases[i - 1]))).toBe(true);
      }
    }
  });

  it("does not repeat the first frame of a loop and ends a one-shot on the final pose", () => {
    expect(planAnimation(1700, true).phases.at(-1)).toBeLessThan(1);
    expect(planAnimation(1700, false).phases.at(-1)).toBe(1);
    expect(planAnimation(1700, true, true)).toEqual({ frames: 1, delay: 1700, phases: [0] });
  });
});

describe("worker requests", () => {
  it("resolves with the worker reply", async () => {
    const worker = new FakeWorker();
    worker.reply = () => ({ frame: true });
    await expect(workerRequest(worker as never, { type: "frame" }, [], new AbortController().signal, "failed")).resolves.toEqual({ frame: true });
  });

  it("turns encoder errors and crashed workers into readable errors", async () => {
    const worker = new FakeWorker();
    worker.reply = () => ({ error: "Could not encode the animation." });
    await expect(workerRequest(worker as never, {}, [], new AbortController().signal, "failed")).rejects.toThrow("Could not encode the animation.");
    const crashing = new FakeWorker();
    const pending = workerRequest(crashing as never, {}, [], new AbortController().signal, "The encoder stopped.");
    crashing.dispatchEvent(new Event("error"));
    await expect(pending).rejects.toThrow("The encoder stopped.");
  });

  it("cancels promptly and leaves no listeners behind", async () => {
    const worker = new FakeWorker();
    const remove = vi.spyOn(worker, "removeEventListener");
    const controller = new AbortController();
    const pending = workerRequest(worker as never, {}, [], controller.signal, "failed");
    controller.abort(new DOMException("Cancelled", "AbortError"));
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(remove).toHaveBeenCalledTimes(3);
    const already = new AbortController();
    already.abort();
    await expect(workerRequest(worker as never, {}, [], already.signal, "failed")).rejects.toBeDefined();
    expect(worker.posted).toHaveLength(1);
  });

  it("times out a stuck worker", async () => {
    vi.useFakeTimers();
    const pending = workerRequest(new FakeWorker() as never, {}, [], new AbortController().signal, "The encoder stopped responding.", 1000);
    vi.advanceTimersByTime(1001);
    await expect(pending).rejects.toBeInstanceOf(ExportTimeoutError);
  });

  it("reports workers that cannot start", () => {
    expect(() => startWorker(() => { throw new Error("blocked"); }, "Animation export is unavailable here.")).toThrow("Animation export is unavailable here.");
  });
});
