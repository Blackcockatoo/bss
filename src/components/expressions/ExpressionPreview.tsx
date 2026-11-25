import { useEffect, useRef, useState } from "react";
import type { ExpressionFrame } from "@/lib/expressions/studio";
import { artworkCapturePhase, artworkDuration, sampleArtwork, type Artwork } from "./artwork";
import { ExpressionArt } from "./ExpressionArt";

export function ExpressionPreview({
  art, playing, replay, still = false, scrub, feedback = false,
}: {
  art: Artwork; playing: boolean; replay: number; still?: boolean;
  /** When set, playback holds at this phase (0-1) so the user can scrub the timeline. */
  scrub?: number;
  /** Show the live timeline and pose readout used by the Animation Laboratory. */
  feedback?: boolean;
}) {
  const { settings, reducedMotion } = art;
  const playhead = useRef(0);
  const [progress, setProgress] = useState(0);
  const duration = artworkDuration(art);
  const held = still || scrub !== undefined;
  useEffect(() => {
    playhead.current = 0;
    const initial = requestAnimationFrame(() => setProgress(0));
    return () => cancelAnimationFrame(initial);
  }, [replay]);
  useEffect(() => {
    if (!playing || reducedMotion || held) return;
    let id = 0;
    let last = 0;
    const advance = (now: number) => {
      if (!last) last = now;
      if (now - last >= 30) {
        const next = playhead.current + Math.min(now - last, 60) / duration;
        last = now;
        playhead.current = settings.loop ? next % 1 : Math.min(next, 1);
        setProgress(playhead.current);
      }
      if (settings.loop || playhead.current < 1) id = requestAnimationFrame(advance);
    };
    id = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(id);
  }, [playing, reducedMotion, held, duration, settings.loop, replay]);
  const phase = scrub ?? (still ? artworkCapturePhase(art) : progress);
  const sampled = sampleArtwork(art, phase);
  return <>
    <ExpressionArt {...sampled} />
    {feedback && <PerformanceReadout art={art} frame={sampled.frame}
      phase={reducedMotion ? artworkCapturePhase(art) : phase} duration={duration} />}
  </>;
}

/** Real-time feedback: where the playhead is against the keyframes, and what the body is doing. */
function PerformanceReadout({ art, frame, phase, duration }: { art: Artwork; frame: ExpressionFrame; phase: number; duration: number }) {
  // Recorded takes have cues rather than one expression's keyframes.
  const times = art.take ? art.take.cues.map(cue => cue.at / duration) :
    art.settings.timings ?? art.expression.keyframes.map(keyframe => keyframe[0]);
  const fixed = (value: number, digits = 0) => value.toFixed(digits);
  return (
    <div className="space-y-2 border-t border-[#43546d] p-2 text-xs text-slate-300" data-performance-readout="">
      <svg viewBox="0 0 100 8" className="block h-4 w-full" aria-hidden="true" preserveAspectRatio="none">
        <rect x="0" y="3" width="100" height="2" rx="1" fill="#2a3850" />
        {times.map((time, index) => <rect key={index} x={time * 100 - .4} y="1" width=".8" height="6" fill="#d9b45a" />)}
        <rect x={phase * 100 - .6} y="0" width="1.2" height="8" fill="#8be8ef" />
      </svg>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 tabular-nums sm:grid-cols-6">
        <div><dt className="text-slate-400">Time</dt><dd data-readout="time">{fixed(phase * duration)} / {fixed(duration)} ms</dd></div>
        <div><dt className="text-slate-400">Height</dt><dd>{fixed(-frame.y, 1)}</dd></div>
        <div><dt className="text-slate-400">Tilt</dt><dd>{fixed(frame.angle, 1)}°</dd></div>
        <div><dt className="text-slate-400">Squash</dt><dd>{fixed(frame.squash * 100)}%</dd></div>
        <div><dt className="text-slate-400">Follow-through</dt><dd>{fixed(Math.hypot(frame.lag.x, frame.lag.y), 1)}</dd></div>
        <div><dt className="text-slate-400">Props</dt><dd data-readout="props">{frame.props.map(item => item.kind).join(", ") || "none"}</dd></div>
      </dl>
    </div>
  );
}
