/** Call only from a user gesture. Audio is optional; no auto-play on return. */
export async function playForgeSequence(
  sequence: readonly number[],
  tempo: number,
  repeats = 1,
  rhythm: readonly number[] = [1],
): Promise<void> {
  if (typeof AudioContext === "undefined")
    throw new Error("Audio unavailable; use the visual sequence.");
  const context = new AudioContext();
  try {
    await context.resume();
    const duration = 60 / tempo;
    const start = context.currentTime + 0.03;
    let elapsed = 0;
    for (let i = 0; i < sequence.length * repeats; i++) {
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      const beatDuration =
        duration * (rhythm[(i % sequence.length) % rhythm.length] ?? 1);
      const at = start + elapsed;
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
    await new Promise<void>((resolve) =>
      setTimeout(resolve, elapsed * 1000 + 100),
    );
  } finally {
    await context.close();
  }
}
