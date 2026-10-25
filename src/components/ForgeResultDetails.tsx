import type { ActivityResult } from "@/lib/tools/activities";
/** Exact diagrams and child-authored word review; no generated narrative or grading. */
export function ForgeResultDetails({ result }: { result: ActivityResult }) {
  const path = result.robotPath;
  const points = path ? [...path, { x: 2, y: 2 }] : [];
  const minX = Math.min(0, ...points.map((p) => p.x)),
    maxX = Math.max(2, ...points.map((p) => p.x));
  const minY = Math.min(0, ...points.map((p) => p.y)),
    maxY = Math.max(2, ...points.map((p) => p.y));
  const x = (n: number) => 25 + ((n - minX) / (maxX - minX)) * 270;
  const y = (n: number) => 195 - ((n - minY) / (maxY - minY)) * 170;
  return (
    <>
      {path && (
        <figure className="rounded-lg border border-slate-600 bg-slate-950 p-3">
          <svg
            viewBox="0 0 320 220"
            className="w-full"
            role="img"
            aria-label={`Robot route: ${path.map((p) => `(${p.x}, ${p.y})`).join(", ")}. Goal (2, 2).`}
          >
            <path
              d={`M${x(minX)},${y(0)}H${x(maxX)} M${x(0)},${y(minY)}V${y(maxY)}`}
              stroke="#64748b"
              fill="none"
            />
            <polyline
              points={path.map((p) => `${x(p.x)},${y(p.y)}`).join(" ")}
              stroke="#5eead4"
              strokeWidth="3"
              fill="none"
            />
            <circle cx={x(0)} cy={y(0)} r="6" fill="#67e8f9" />
            <rect
              x={x(2) - 7}
              y={y(2) - 7}
              width="14"
              height="14"
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx={x(path.at(-1)!.x)}
              cy={y(path.at(-1)!.y)}
              r="4"
              fill="#fbbf24"
            />
          </svg>
          <figcaption>
            Blue circle: start (0, 0). Square: goal (2, 2). Gold dot: robot now.
            The line shows your instructions.
          </figcaption>
        </figure>
      )}
      {result.writingReview && (
        <section
          aria-label="Word explorer"
          className="space-y-2 rounded-lg border border-slate-600 p-3"
        >
          <h3 className="font-semibold">Word explorer</h3>
          <p>
            {result.writingReview.distinctWords} different words in your chosen
            story. These are observations, not a writing score.
          </p>
          {result.writingReview.repeatedWords.length > 0 && (
            <p>
              Repeated words: {result.writingReview.repeatedWords.join(", ")}.
            </p>
          )}
          <ul className="list-inside list-disc">
            {result.writingReview.prompts.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
