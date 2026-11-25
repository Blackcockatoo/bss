"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { seededUnit } from "@/pet/movement/movementScheduler";
import type { Director } from "./director";
import { beatGaps, continuesBeat, MAX_BEAT_GAP, MIN_BEAT_GAP } from "./gestureMath";

const replies = {
  auralia: { cue: "yes", label: "Auralia bobs" },
  evolved: { cue: "happy", label: "Evolved stamps" },
  geometry: { cue: "resonance", label: "Geometry sends a ring" },
} as const;

export function BeatReply({ director, controlClass, onStageStatus }: {
  director: Director; controlClass: string; onStageStatus?: (status: string) => void;
}) {
  const taps = useRef<number[]>([]);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const replying = useRef(false);
  const round = useRef(0);
  const [markers, setMarkers] = useState<number[]>([]);
  const [status, setStatus] = useState("");
  const reply = replies[director.form];

  const play = useCallback((gaps: number[], fromStage = false) => {
    function report(message: string) {
      setStatus(fromStage ? "" : message);
      if (fromStage) onStageStatus?.(message);
    }
    clearTimeout(timeout.current);
    taps.current = [];
    replying.current = true;
    const extra = director.getMode() !== "calm" && director.personality.playfulness >= 65 &&
      seededUnit(director.seed, round.current++, 33) < .24;
    const count = extra ? 4 : 3;
    const finish = () => {
      replying.current = false;
      setMarkers(Array.from({ length: count }, (_, index) => index + 1));
      report(`Reply: three beats${extra ? " and one extra beat" : ""}.`);
    };
    function beat(index: number, scheduledAt: number) {
      if (director.isBlocked()) {
        replying.current = false;
        setMarkers([]);
        report("The reply paused while your companion settles.");
        return;
      }
      if (director.isPaused() || director.isReduced()) { finish(); return; }
      const delay = gaps[Math.min(index, gaps.length - 1)] ?? 360;
      if (!director.play(reply.cue, { source: "touch", duration: Math.min(delay, 460), intensity: .88, record: false })) {
        replying.current = false;
        report("The reply paused while your companion settles.");
        return;
      }
      setMarkers(Array.from({ length: index + 1 }, (_, marker) => marker + 1));
      if (index + 1 === count) finish();
      else {
        const nextAt = scheduledAt + delay;
        timeout.current = setTimeout(() => beat(index + 1, nextAt), Math.max(MIN_BEAT_GAP, nextAt - performance.now()));
      }
    }
    report("");
    setMarkers([1, 2, 3]);
    if (director.isPaused() || director.isReduced()) finish();
    else {
      const firstAt = performance.now() + 200;
      timeout.current = setTimeout(() => beat(0, firstAt), 200);
    }
  }, [director, onStageStatus, reply.cue]);

  const tap = useCallback((at: number | null, fromStage: boolean) => {
    clearTimeout(timeout.current);
    if (at === null) {
      taps.current = [];
      replying.current = false;
      setMarkers([]);
      setStatus("");
      onStageStatus?.("");
      return false;
    }
    const lastTap = taps.current.at(-1);
    if (replying.current || (lastTap !== undefined && !continuesBeat(lastTap, at))) taps.current = [];
    replying.current = false;
    taps.current.push(at);
    if (taps.current.length === 3) { play(beatGaps(taps.current), fromStage); return true; }
    setStatus("");
    if (fromStage) onStageStatus?.("");
    setMarkers(Array.from({ length: taps.current.length }, (_, index) => index + 1));
    timeout.current = setTimeout(() => {
      taps.current = [];
      setMarkers([]);
      if (!fromStage) setStatus("Start again when you’re ready.");
    }, MAX_BEAT_GAP + 20);
    return false;
  }, [onStageStatus, play]);

  useEffect(() => {
    const unsubscribe = director.subscribeStageTap(at => tap(at, true));
    const onVisibility = () => { if (document.hidden) tap(null, true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      unsubscribe();
      clearTimeout(timeout.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [director, tap]);

  return <div role="group" aria-label="Rhythm call and response" className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={controlClass} onClick={event => tap(event.timeStamp, false)}>Tap a beat</button>
      <button type="button" className={controlClass} onClick={() => play([360, 360])}>Play three beats</button>
      <span className="text-sm text-slate-300">{reply.label}</span>
      <span aria-hidden="true" className="text-sm tabular-nums text-amber-100">{markers.join(" · ")}</span>
    </div>
    <p role="status" className="text-sm text-slate-300">{status}</p>
  </div>;
}
