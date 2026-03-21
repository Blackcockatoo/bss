import { buildDigitalDNARevealModel } from "@/lib/digitalDnaReveal";

const model = buildDigitalDNARevealModel();

export function DigitalDNAReveal() {
  const visibleNodes = [...model.nodes]
    .sort((a, b) => a.digit - b.digit)
    .slice(0, 10);
  const edges = visibleNodes.map((node, index) => ({
    from: node,
    to: visibleNodes[(index + 1) % visibleNodes.length],
  }));

  return (
    <section className="rounded-[2rem] border border-cyan-500/20 bg-[radial-gradient(circle_at_top,rgba(8,47,73,0.45),rgba(2,6,23,0.98)_58%)] p-5 text-white shadow-[0_24px_80px_rgba(8,47,73,0.35)] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.36em] text-cyan-200/80">
              Genome Constellation Theatre
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              The genome pays off instantly instead of asking for patience
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              This is the hidden engine behind the companion. The star map below
              shows which digits dominate the visible score, which strand owns
              the loudest signals, and which mutation seed is currently shaping
              the decoded lattice.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
            <svg viewBox="0 0 100 100" className="w-full">
              {edges.map(({ from, to }) => (
                <line
                  key={`${from.digit}-${to.digit}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(125,211,252,0.25)"
                  strokeWidth="0.7"
                />
              ))}

              {visibleNodes.map((node) => (
                <g key={node.digit}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size / 5}
                    fill={node.color}
                    opacity="0.9"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size / 3.2}
                    fill="none"
                    stroke={node.color}
                    strokeOpacity="0.4"
                  />
                  <text
                    x={node.x}
                    y={node.y - node.size / 2.4}
                    textAnchor="middle"
                    fontSize="3"
                    fill="rgba(226,232,240,0.88)"
                  >
                    {node.digit}
                  </text>
                </g>
              ))}
            </svg>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {model.nodes.slice(0, 3).map((node) => (
                <div
                  key={`signal-${node.digit}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Signal {node.digit}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {node.strandLabel}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {node.note} · {node.shape}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-amber-400/20 bg-amber-500/10 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-amber-200/75">
              Instant decode
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {model.resonanceClass}
            </h2>
            <p className="mt-3 text-sm leading-6 text-amber-100/85">
              {model.insight}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-cyan-400/15 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">
                Dominant lattice
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {model.dominantLattice}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Three bright anchors define the first visible scaffold.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-fuchsia-400/15 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/75">
                Live mutation seed
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold text-white">
                {model.liveMutationSeed}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use this seed as the visible handoff into the deeper helix and
                sound instruments below.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Why this matters
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {model.progressionNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
