"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { playForgeSequence } from "./audio";
/** Stop on navigation/unmount, and prevent overlapping playback across all Forge views. */
export function useForgeAudio() {
  const [playing, setPlaying] = useState(false);
  const current = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      current.current?.abort();
    };
  }, []);
  const stop = useCallback(() => {
    current.current?.abort();
    if (mounted.current) setPlaying(false);
  }, []);
  const play = useCallback(
    async (
      sequence: readonly number[],
      tempo: number,
      repeats = 1,
      rhythm: readonly number[] = [1],
    ) => {
      current.current?.abort();
      const controller = new AbortController();
      current.current = controller;
      setPlaying(true);
      try {
        await playForgeSequence(
          sequence,
          tempo,
          repeats,
          rhythm,
          controller.signal,
        );
      } finally {
        if (mounted.current && current.current === controller)
          setPlaying(false);
      }
    },
    [],
  );
  return { playing, play, stop };
}
