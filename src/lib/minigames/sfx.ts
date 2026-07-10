/**
 * Arcade SFX kit — one tiny WebAudio engine for every game.
 *
 * No samples, no network: every cue is synthesized, so it works offline and
 * weighs nothing. A single shared AudioContext is created lazily on first
 * user-triggered sound (autoplay-policy safe). Mute preference persists.
 */

const STORAGE_KEY = 'bss-arcade-sound';

let ctx: AudioContext | null = null;
let enabled: boolean | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function isSfxEnabled(): boolean {
  if (enabled === null) {
    if (typeof window === 'undefined') return true;
    enabled = window.localStorage.getItem(STORAGE_KEY) !== 'off';
  }
  return enabled;
}

export function setSfxEnabled(next: boolean): void {
  enabled = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
  }
}

type OscType = OscillatorType;

interface ToneOptions {
  freq: number;
  duration?: number;
  type?: OscType;
  gain?: number;
  delay?: number;
  /** Slide to this frequency over the duration. */
  glideTo?: number;
}

function tone({
  freq,
  duration = 0.16,
  type = 'sine',
  gain = 0.12,
  delay = 0,
  glideTo,
}: ToneOptions): void {
  if (!isSfxEnabled()) return;
  const audio = getContext();
  if (!audio) return;

  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, glideTo), start + duration);
  }

  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(amp).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// Pentatonic scale rooted at A3 — pad tones always sound good together.
const PENTATONIC = [220, 247.5, 277.2, 330, 371.25, 440, 495];

/** Musical tone for a sigil pad — each pad has its own note, like a real Simon. */
export function playPadTone(index: number, duration = 0.22): void {
  const freq = PENTATONIC[index % PENTATONIC.length] * (index >= PENTATONIC.length ? 2 : 1);
  tone({ freq, duration, type: 'triangle', gain: 0.14 });
}

export function playPerfect(): void {
  tone({ freq: 880, duration: 0.1, type: 'sine', gain: 0.12 });
  tone({ freq: 1320, duration: 0.14, type: 'sine', gain: 0.1, delay: 0.05 });
}

export function playGood(): void {
  tone({ freq: 660, duration: 0.1, type: 'sine', gain: 0.1 });
}

export function playMiss(): void {
  tone({ freq: 180, duration: 0.22, type: 'sawtooth', gain: 0.07, glideTo: 90 });
}

export function playMetronome(accent: boolean): void {
  tone({
    freq: accent ? 880 : 440,
    duration: 0.07,
    type: 'square',
    gain: accent ? 0.06 : 0.045,
  });
}

/** Rising arpeggio for round wins. */
export function playRoundWin(): void {
  [523.25, 659.25, 783.99].forEach((freq, i) =>
    tone({ freq, duration: 0.16, type: 'triangle', gain: 0.12, delay: i * 0.09 }),
  );
}

/** Full fanfare for the result screen. */
export function playFanfare(grade: 'S' | 'A' | 'B' | 'C' | 'D'): void {
  if (grade === 'D') {
    tone({ freq: 330, duration: 0.3, type: 'sine', gain: 0.08, glideTo: 220 });
    return;
  }
  const base = grade === 'S' ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
  base.forEach((freq, i) =>
    tone({ freq, duration: 0.22, type: 'triangle', gain: 0.13, delay: i * 0.11 }),
  );
  if (grade === 'S') {
    tone({ freq: 1568, duration: 0.4, type: 'sine', gain: 0.08, delay: 0.44 });
  }
}

/** Shimmering cue for achievement / rank unlocks. */
export function playUnlock(): void {
  [783.99, 987.77, 1174.66, 1567.98].forEach((freq, i) =>
    tone({ freq, duration: 0.28, type: 'sine', gain: 0.09, delay: i * 0.07 }),
  );
}

/** Soft tick for streak/combo build-up, pitch rising with the streak. */
export function playComboTick(streak: number): void {
  tone({
    freq: 440 * Math.min(3, 1 + streak * 0.12),
    duration: 0.08,
    type: 'sine',
    gain: 0.07,
  });
}
