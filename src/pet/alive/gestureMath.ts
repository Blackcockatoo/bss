export type Point = { x: number; y: number };

export const MAX_BEAT_GAP = 900;
export const MIN_BEAT_GAP = 150;

export function beatGaps(taps: readonly number[]) {
  return taps.slice(1, 3).map((time, index) => {
    const gap = time - taps[index];
    return Number.isFinite(gap) ? Math.max(MIN_BEAT_GAP, Math.min(MAX_BEAT_GAP, Math.round(gap))) : 360;
  });
}

export function continuesBeat(last: number, next: number) {
  const gap = next - last;
  return Number.isFinite(gap) && gap > 0 && gap <= MAX_BEAT_GAP;
}

export function isRepeatedFigureEight(path: readonly Point[]) {
  if (path.length < 16) return false;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of path) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (width < .28 || height < .18) return false;

  const centerX = (maxX + minX) / 2;
  const centerY = (maxY + minY) / 2;
  const normalized = path.map(({ x, y }) => ({ x: (x - centerX) * 2 / width, y: (y - centerY) * 2 / height }));
  const nearCenter = (point: Point) => Math.abs(point.x) < .22 && Math.abs(point.y) < .38;
  let start = -1;
  let side = 0;
  let previousSide = 0;
  let previousWinding = 0;
  let lobes = 0;

  for (let index = 0; index < normalized.length; index++) {
    const point = normalized[index];
    if (start < 0 || (!side && nearCenter(point))) {
      if (nearCenter(point)) start = index;
      continue;
    }
    if (!side && Math.abs(point.x) >= .48) side = Math.sign(point.x);
    if (!side || !nearCenter(point)) continue;

    let area = 0;
    for (let j = start; j <= index; j++) {
      const from = normalized[j];
      const to = normalized[j < index ? j + 1 : start];
      area += from.x * to.y - to.x * from.y;
    }
    if (Math.abs(area) >= .32) {
      const winding = Math.sign(area);
      lobes = side !== previousSide && winding !== previousWinding ? lobes + 1 : 1;
      previousSide = side;
      previousWinding = winding;
      if (lobes === 4) return true;
    } else {
      lobes = 0;
    }
    start = index;
    side = 0;
  }
  return false;
}
