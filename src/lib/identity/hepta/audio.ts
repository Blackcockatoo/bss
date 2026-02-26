declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const BASE_SCALE = [
  220, // A3
  247, // B3
  262, // C4
  294, // D4
  330, // E4
  349, // F4
  392, // G4
] as const;

const MAX_DIGIT = BASE_SCALE.length - 1;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API unavailable');
    }
    audioContext = new AudioCtx();
  }
  return audioContext;
}

function ensureDigit(digit: number): number {
  if (Number.isNaN(digit) || digit < 0) return 0;
  if (digit > MAX_DIGIT) return MAX_DIGIT;
  return Math.floor(digit);
}

export function heptaDigitsToFrequencies(digits: readonly number[]): number[] {
  const frequencies: number[] = [];
  if (!digits || digits.length === 0) return frequencies;

  for (let i = 0; i < digits.length; i++) {
    const digit = ensureDigit(digits[i]);
    const baseFrequency = BASE_SCALE[digit];
    const octave = Math.floor(i / BASE_SCALE.length);
    const frequency = baseFrequency * Math.pow(2, octave / 2);
    frequencies.push(frequency);
  }

  return frequencies;
}

export interface PlayHeptaOptions {
  tempo?: number;
  volume?: number;
  sustainRatio?: number;
}

export async function playHepta(
  digits: readonly number[],
  options: PlayHeptaOptions = {}
): Promise<void> {
  if (typeof window === 'undefined' || digits.length === 0) return;

  const tempo = options.tempo ?? 160;
  const volume = options.volume ?? 0.2;
  const sustainRatio = options.sustainRatio ?? 0.8;

  const step = 60 / tempo;
  const ctx = getAudioContext();

  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => undefined);
  }

  const startTime = ctx.currentTime + 0.05;
  const frequencies = heptaDigitsToFrequencies(digits);

  frequencies.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    const start = startTime + index * step;
    const stop = start + step * sustainRatio;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(stop);
  });
}

export function stopHepta(): void {
  if (!audioContext) return;
  audioContext.close().catch(() => undefined);
  audioContext = null;
}
