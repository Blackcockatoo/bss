/** Optional, gesture-triggered, bounded audio. The latest playback owns one context. */
let active: AbortController | null = null;
export function stopForgeAudio(): void {
  active?.abort();
}
export async function playForgeSequence(
  sequence: readonly number[],
  tempo: number,
  repeats = 1,
  rhythm: readonly number[] = [1],
  signal?: AbortSignal,
): Promise<void> {
  if (
    sequence.length < 1 ||
    sequence.length > 16 ||
    !sequence.every((n) => Number.isInteger(n) && n >= 0 && n <= 24) ||
    !Number.isFinite(tempo) ||
    tempo < 50 ||
    tempo > 160 ||
    !Number.isInteger(repeats) ||
    repeats < 1 ||
    repeats > 4 ||
    rhythm.length < 1 ||
    rhythm.length > 16 ||
    !rhythm.every((n) => [0.25, 0.5, 1, 2].includes(n))
  )
    throw new Error("Sound inputs are out of bounds.");
  if (signal?.aborted) return;
  if (typeof AudioContext === "undefined")
    throw new Error("Audio unavailable; use the visual sequence.");
  const context = new AudioContext();
  const controller = new AbortController();
  active?.abort();
  active = controller;
  const externalAbort = () => controller.abort();
  signal?.addEventListener("abort", externalAbort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let interrupt!: () => void;
  const interrupted = new Promise<void>((resolve) => {
    interrupt = resolve;
  });
  controller.signal.addEventListener("abort", interrupt, { once: true });
  try {
    await Promise.race([context.resume(), interrupted]);
    if (controller.signal.aborted) return;
    const duration = 60 / tempo,
      start = context.currentTime + 0.03;
    let elapsed = 0;
    for (let i = 0; i < sequence.length * repeats; i++) {
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      const beatDuration =
          duration * rhythm[(i % sequence.length) % rhythm.length],
        at = start + elapsed;
      elapsed += beatDuration;
      oscillator.frequency.value =
        220 * 2 ** (sequence[i % sequence.length] / 12);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.08, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, at + beatDuration * 0.8);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + beatDuration * 0.85);
    }
    await Promise.race([
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, elapsed * 1000 + 100);
      }),
      interrupted,
    ]);
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener("abort", interrupt);
    signal?.removeEventListener("abort", externalAbort);
    if (active === controller) active = null;
    if (context.state !== "closed") await context.close();
  }
}
