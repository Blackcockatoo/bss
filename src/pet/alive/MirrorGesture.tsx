"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Director } from "./director";

type Point = { x: number; y: number };

export function isRepeatedFigureEight(path: readonly Point[]) {
  let lobes = 0;
  let previousSide = 0;
  let side = 0;
  let start = 0;
  for (let index = 0; index < path.length; index++) {
    const point = path[index];
    if (!side && Math.abs(point.x) >= .22) {
      side = Math.sign(point.x);
      start = Math.max(0, index - 1);
    }
    if (!side || Math.abs(point.x) >= .12 || Math.abs(point.y) >= .30) continue;
    const segment = path.slice(start, index + 1);
    let area = 0;
    for (let j = 1; j < segment.length; j++) {
      area += segment[j - 1].x * segment[j].y - segment[j].x * segment[j - 1].y;
    }
    if (Math.abs(area) >= .11) {
      lobes = side === previousSide ? 1 : lobes + 1;
      previousSide = side;
      if (lobes === 4) return true;
    }
    side = 0;
  }
  return false;
}

export function MirrorGesture({ director, controlClass }: { director: Director; controlClass: string }) {
  const path = useRef<{ id: number; expires: number; points: Point[] } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const clear = () => { if (document.hidden) path.current = null; };
    document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, []);

  function mirror() {
    const played = director.play("mirror-eight", { source: "touch", intensity: .68 });
    setStatus(played ? "Your companion echoed the figure eight." : "Figure eight selected. Your companion is resting.");
  }

  function sample(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - box.left) * 2 / box.width - 1, y: (event.clientY - box.top) * 2 / box.height - 1 };
  }

  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <button type="button" className={controlClass} onClick={mirror}>Mirror figure eight</button>
      <button type="button" className={controlClass} aria-expanded={drawing} onClick={() => {
        path.current = null;
        setDrawing(!drawing);
        setStatus("");
      }}>{drawing ? "Close drawing pad" : "Draw a figure eight"}</button>
    </div>
    {drawing && <div className="touch-none select-none rounded-lg border border-slate-700 bg-slate-900 p-4 text-center text-slate-200"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        path.current = { id: event.pointerId, expires: performance.now() + 5000, points: [sample(event)] };
        setStatus("");
      }}
      onPointerMove={event => {
        const active = path.current;
        if (!active || active.id !== event.pointerId) return;
        if (performance.now() > active.expires || active.points.length === 192) { path.current = null; return; }
        const point = sample(event);
        const previous = active.points.at(-1)!;
        if (Math.hypot(point.x - previous.x, point.y - previous.y) >= .038) active.points.push(point);
      }}
      onPointerUp={event => {
        const active = path.current;
        path.current = null;
        if (active?.id !== event.pointerId) return;
        if (performance.now() <= active.expires && isRepeatedFigureEight(active.points)) mirror();
        else setStatus("Start in the centre and draw two sideways eights.");
      }}
      onPointerCancel={() => { path.current = null; }}
      onPointerLeave={() => { path.current = null; }}
      onLostPointerCapture={() => { path.current = null; }}
    >Start in the centre and draw two sideways eights without lifting.</div>}
    <p role="status" className="text-sm text-slate-300">{status}</p>
  </div>;
}
