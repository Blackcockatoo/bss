"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ForgeBeat } from "@/lib/tools/audio";

type Pulse = { average: number; lastMs: number; intervalMs: number; count: number };

export function trackPulse(pulse: Pulse, bass: number, now: number) {
  const average = pulse.average * .92 + bass * .08;
  const gap = now - pulse.lastMs;
  const onset = bass > 32 && bass > average * 1.27 && gap > Math.max(220, pulse.intervalMs * .54);
  const intervalMs = onset && gap < 1500 ? pulse.intervalMs * .65 + gap * .35 : pulse.intervalMs;
  return {
    pulse: { average, intervalMs, lastMs: onset ? now : pulse.lastMs, count: pulse.count + (onset ? 1 : 0) },
    onset,
  };
}

/** A selected file stays in the browser. Audio hardware opens only on Play. */
export function useLocalTrack() {
  const [playing, setPlaying] = useState(false);
  const current = useRef<(() => void) | null>(null);
  const stop = useCallback(() => {
    current.current?.();
    current.current = null;
    setPlaying(false);
  }, []);
  useEffect(() => () => current.current?.(), []);

  const play = useCallback(async (file: File, beat: (event: ForgeBeat) => void) => {
    if (!file.size || file.size > 25 * 1024 * 1024 || (file.type && !file.type.startsWith("audio/"))) {
      throw new Error("Choose an audio file under 25 MB.");
    }
    stop();
    const context = new AudioContext();
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    const spectrum = context.createAnalyser();
    spectrum.fftSize = 1024;
    spectrum.smoothingTimeConstant = .38;
    const source = context.createMediaElementSource(audio);
    source.connect(spectrum).connect(context.destination);
    let active = true;
    let raf = 0;
    let last = 0;
    let pulse = { average: 45, lastMs: -Infinity, intervalMs: 540, count: 0 };
    const bins = new Uint8Array(spectrum.frequencyBinCount);
    const dispose = () => {
      active = false;
      cancelAnimationFrame(raf);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
      void context.close().catch(() => {});
    };
    current.current = dispose;
    audio.addEventListener("ended", stop, { once: true });
    try {
      await Promise.all([context.resume(), audio.play()]);
      if (!active) return;
      setPlaying(true);
      function step(now: number) {
        if (!active) return;
        if (now - last >= 40) {
          last = now;
          spectrum.getByteFrequencyData(bins);
          let sum = 0;
          const end = Math.max(3, Math.floor(250 / (context.sampleRate / spectrum.fftSize)));
          for (let i = 1; i <= end; i++) sum += bins[i];
          const result = trackPulse(pulse, sum / end, now);
          pulse = result.pulse;
          if (result.onset) beat({ index: pulse.count - 1, note: 0, interval: 0,
            durationMs: pulse.intervalMs, downbeat: pulse.count % 4 === 1 });
        }
        raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    } catch (error) {
      if (active) { stop(); throw error; }
    }
  }, [stop]);

  return { play, stop, playing };
}
