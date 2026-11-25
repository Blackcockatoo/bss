import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { playForgeSequence, stopForgeAudio } from "./audio";
const contexts: { state: string; close: ReturnType<typeof vi.fn> }[] = [];
class AudioMock {
  state = "running";
  currentTime = 0;
  destination = {};
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {
    this.state = "closed";
  });
  constructor() {
    contexts.push(this);
  }
  createOscillator() {
    return {
      frequency: { value: 0 },
      connect: vi.fn(
        (target: { connect: (destination: unknown) => unknown }) => target,
      ),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(() => ({})),
    };
  }
}
beforeEach(() => {
  contexts.length = 0;
  vi.stubGlobal("AudioContext", AudioMock);
  vi.useFakeTimers();
});
afterEach(() => {
  stopForgeAudio();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Bounded optional sound", () => {
  it("rejects unbounded arguments before opening audio resources", async () => {
    const cases: Parameters<typeof playForgeSequence>[] = [
      [[], 90],
      [Array(17).fill(1), 90],
      [[1, 2], 0],
      [[1, 2], 90, Infinity],
      [[1, 2], 90, 1, [100]],
    ];
    for (const args of cases)
      await expect(playForgeSequence(...args)).rejects.toThrow("bounds");
    expect(contexts).toHaveLength(0);
  });
  it("closes the context and timer when the learner stops", async () => {
    const playing = playForgeSequence([1, 2], 90);
    await Promise.resolve();
    stopForgeAudio();
    await playing;
    expect(contexts[0].close).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels earlier playback when another instrument begins", async () => {
    const first = playForgeSequence([1, 2], 90);
    const second = playForgeSequence([2, 3], 90);
    await first;
    expect(contexts[0].close).toHaveBeenCalledOnce();
    stopForgeAudio();
    await second;
    expect(contexts[1].close).toHaveBeenCalledOnce();
  });
  it("emits scheduled notes with tempo, subdivisions and downbeats", async () => {
    const beat = vi.fn();
    const playing = playForgeSequence([2, 9], 120, 1, [.5, 2], undefined, beat);
    await vi.advanceTimersByTimeAsync(40);
    expect(beat.mock.calls[0]?.[0]).toEqual({ index: 0, note: 2, interval: -7, durationMs: 250, downbeat: true });
    await vi.advanceTimersByTimeAsync(260);
    expect(beat.mock.calls[1]?.[0]).toEqual({ index: 1, note: 9, interval: 7, durationMs: 1000, downbeat: false });
    stopForgeAudio();
    await playing;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("stops promptly when the owning view leaves", async () => {
    const abort = new AbortController();
    const playing = playForgeSequence([1, 2], 90, 1, [1], abort.signal);
    abort.abort();
    await playing;
    expect(contexts[0].state).toBe("closed");
  });
});
