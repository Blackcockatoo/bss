"use client";

import { useEffect, useRef, useState } from "react";
import { seededUnit } from "@/pet/movement/movementScheduler";
import type { Director } from "./director";

const replies = {
  auralia: { cue: "yes", label: "Auralia bobs" },
  evolved: { cue: "happy", label: "Evolved stamps" },
  geometry: { cue: "resonance", label: "Geometry sends a ring" },
} as const;

export function beatGaps(taps: readonly number[]) {
  return taps.slice(1, 3).map((time, index) => Math.min(900, Math.max(150, Math.round(time - taps[index]))));
}

export function BeatReply({ director, controlClass }: { director: Director; controlClass: string }) {
  const taps = useRef<number[]>([]);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const replying = useRef(false);
  const round = useRef(0);
  const [markers, setMarkers] = useState<number[]>([]);
  const [status, setStatus] = useState("");
  const reply = replies[director.form];

  useEffect(() => {
    function reset() {
      clearTimeout(timeout.current);
      replying.current = false;
      taps.current = [];
      setMarkers([]);
      setStatus("");
    }
    function onVisibility() { if (document.hidden) reset(); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timeout.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [director]);

  function play(gaps: number[]) {
    clearTimeout(timeout.current);
    taps.current = [];
    replying.current = true;
    const extra = director.getMode() !== "calm" && director.personality.playfulness >= 65 &&
      seededUnit(director.seed, round.current++, 33) < .24;
    const count = extra ? 4 : 3;
    const finish = () => {
      replying.current = false;
      setMarkers(Array.from({ length: count }, (_, index) => index + 1));
      setStatus(`Reply: three beats${extra ? " and one extra beat" : ""}.`);
    };
    function beat(index: number) {
      if (director.isBlocked()) {
        replying.current = false;
        setMarkers([]);
        setStatus("The reply paused while your companion settles.");
        return;
      }
      if (director.isPaused() || director.isReduced()) { finish(); return; }
      const delay = gaps[Math.min(index, gaps.length - 1)] ?? 360;
      if (!director.play(reply.cue, { source: "touch", duration: Math.min(delay, 460), intensity: .88, record: false })) {
        replying.current = false;
        setStatus("The reply paused while your companion settles.");
        return;
      }
      setMarkers(Array.from({ length: index + 1 }, (_, marker) => marker + 1));
      if (index + 1 === count) finish();
      else timeout.current = setTimeout(() => beat(index + 1), delay);
    }
    setStatus("");
    setMarkers([1, 2, 3]);
    if (director.isPaused() || director.isReduced()) finish();
    else timeout.current = setTimeout(() => beat(0), 200);
  }

  function tap() {
    clearTimeout(timeout.current);
    if (replying.current) taps.current = [];
    replying.current = false;
    taps.current.push(performance.now());
    if (taps.current.length === 3) { play(beatGaps(taps.current)); return; }
    setStatus("");
    setMarkers(Array.from({ length: taps.current.length }, (_, index) => index + 1));
    timeout.current = setTimeout(() => {
      taps.current = [];
      setMarkers([]);
      setStatus("Start again when you’re ready.");
    }, 1800);
  }

  return <div role="group" aria-label="Rhythm call and response" className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={controlClass} onClick={tap}>Tap a beat</button>
      <button type="button" className={controlClass} onClick={() => play([360, 360])}>Play three beats</button>
      <span className="text-sm text-slate-300">{reply.label}</span>
      <span aria-hidden="true" className="text-sm tabular-nums text-amber-100">{markers.join(" · ")}</span>
    </div>
    <p role="status" className="text-sm text-slate-300">{status}</p>
  </div>;
}
