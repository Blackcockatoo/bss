import { useEffect, useRef, useState } from "react";
import { artworkCapturePhase, artworkDuration, sampleArtwork, type Artwork } from "./artwork";
import { ExpressionArt } from "./ExpressionArt";

export function ExpressionPreview({
  art, playing, replay, still = false,
}: { art: Artwork; playing: boolean; replay: number; still?: boolean }) {
  const { settings, reducedMotion } = art;
  const playhead = useRef(0);
  const [progress, setProgress] = useState(0);
  const duration = artworkDuration(art);
  useEffect(() => {
    playhead.current = 0;
    const initial = requestAnimationFrame(() => setProgress(0));
    return () => cancelAnimationFrame(initial);
  }, [replay]);
  useEffect(() => {
    if (!playing || reducedMotion || still) return;
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
  }, [playing, reducedMotion, still, duration, settings.loop, replay]);
  return <ExpressionArt {...sampleArtwork(art, still ? artworkCapturePhase(art) : progress)} />;
}
