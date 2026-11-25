import { useEffect, useRef, type PointerEvent } from "react";
import { isRepeatedFigureEight, type Point } from "./gestureMath";

type Trace = { pointerId: number; startedAt: number; origin: { left: number; top: number; scale: number }; points: Point[] };

export function useFigureEight(onFinish: (matched: boolean) => void, enabled: boolean) {
  const trace = useRef<Trace | null>(null);

  useEffect(() => {
    if (!enabled) trace.current = null;
    const clear = () => { if (document.hidden) trace.current = null; };
    document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, [enabled]);

  function sample(event: PointerEvent, active: Trace) {
    const { left, top, scale } = active.origin;
    return { x: (event.clientX - left) / scale, y: (event.clientY - top) / scale };
  }

  function start(event: PointerEvent, surface: Element) {
    if (!enabled || !event.isPrimary || event.button !== 0 || trace.current) return;
    const { left, top, width, height } = surface.getBoundingClientRect();
    const scale = Math.min(width, height);
    if (!(scale > 0)) return;
    const active: Trace = { pointerId: event.pointerId, startedAt: event.timeStamp, origin: { left, top, scale }, points: [] };
    active.points.push(sample(event, active));
    trace.current = active;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent) {
    const active = trace.current;
    if (active?.pointerId !== event.pointerId) return;
    if (event.timeStamp - active.startedAt > 8000 || active.points.length === 1024) {
      trace.current = null;
      return;
    }
    const point = sample(event, active);
    const previous = active.points.at(-1)!;
    if (Math.hypot(point.x - previous.x, point.y - previous.y) >= .012) active.points.push(point);
  }

  function end(event: PointerEvent) {
    const active = trace.current;
    if (active?.pointerId !== event.pointerId) return;
    trace.current = null;
    active.points.push(sample(event, active));
    onFinish(event.timeStamp - active.startedAt <= 8000 && isRepeatedFigureEight(active.points));
  }

  function cancel(event: PointerEvent) {
    if (trace.current?.pointerId === event.pointerId) trace.current = null;
  }

  return { start, move, end, cancel };
}
