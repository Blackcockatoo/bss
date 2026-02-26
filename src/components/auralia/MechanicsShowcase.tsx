import React, { useEffect, useMemo, useRef } from 'react';

type FieldLike = {
  prng: () => number;
  hash: (msg: string) => bigint;
  pulse: number[];
  ring: number[];
};

type MechanicsShowcaseProps = {
  seedName: string;
  energy: number;
  curiosity: number;
  bond: number;
  field: FieldLike;
};

const CELL_COUNT = 48;
const CANVAS_SIZE = 240;
const PALETTE = ['#0b1021', '#4ecdc4', '#ff6b35', '#ffd166'];

const seedNumber = (value: bigint): number => {
  const masked = value & 0xffffffffn;
  const asNumber = Number(masked);
  return asNumber === 0 ? 1 : asNumber;
};

export const MechanicsShowcase: React.FC<MechanicsShowcaseProps> = ({
  seedName,
  energy,
  curiosity,
  bond,
  field,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fingerprint = useMemo(() => {
    const hash = field.hash(`${seedName}:${energy}:${curiosity}:${bond}:${field.pulse.slice(0, 6).join('')}:${field.ring.slice(0, 6).join('')}`);
    const hex = hash.toString(16).toUpperCase();
    return hex.slice(Math.max(0, hex.length - 24));
  }, [seedName, energy, curiosity, bond, field]);

  const nodeLayout = useMemo(() => {
    let s = seedNumber(field.hash(`${seedName}-layout-${fingerprint}`));
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };

    const nodes = Array.from({ length: 14 }, (_, i) => {
      const wobble = rnd() * 0.25;
      const angle = (i / 14) * Math.PI * 2 + wobble;
      const radius = 60 + rnd() * 50 + (bond / 100) * 20;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, weight: 0.6 + rnd() * 0.6 };
    });

    const links: Array<[number, number]> = [];
    for (let i = 0; i < nodes.length; i++) {
      links.push([i, (i + 1) % nodes.length]);
      if (i % 3 === 0) links.push([i, (i + 4) % nodes.length]);
    }

    return { nodes, links };
  }, [seedName, bond, field, fingerprint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = CANVAS_SIZE * ratio;
    canvas.height = CANVAS_SIZE * ratio;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    let grid = new Uint8Array(CELL_COUNT * CELL_COUNT);
    let stepCount = 0;

    let localSeed = seedNumber(field.hash(`${seedName}-ca-${fingerprint}`));
    const seededRand = () => {
      localSeed = (localSeed * 48271) % 0x7fffffff;
      return localSeed / 0x7fffffff;
    };

    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.floor(seededRand() * 3);
    }

    const draw = () => {
      ctx.fillStyle = '#05060f';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const cellSize = CANVAS_SIZE / CELL_COUNT;

      for (let y = 0; y < CELL_COUNT; y++) {
        for (let x = 0; x < CELL_COUNT; x++) {
          const idx = y * CELL_COUNT + x;
          const state = grid[idx];
          ctx.fillStyle = PALETTE[state];
          ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
        }
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };

    const tick = () => {
      stepCount++;
      const next = new Uint8Array(grid.length);
      const energyBias = Math.floor((energy / 100) * 2);
      const curiosityBias = Math.floor((curiosity / 100) * 2);

      for (let y = 0; y < CELL_COUNT; y++) {
        for (let x = 0; x < CELL_COUNT; x++) {
          const idx = y * CELL_COUNT + x;
          const state = grid[idx];

          let neighborSum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = (x + dx + CELL_COUNT) % CELL_COUNT;
              const ny = (y + dy + CELL_COUNT) % CELL_COUNT;
              neighborSum += grid[ny * CELL_COUNT + nx];
            }
          }

          let nextState = (state + neighborSum + energyBias + (stepCount % 3)) % 3;

          if (seededRand() < bond / 3500) {
            nextState = 3;
          }

          if (nextState === 3 && seededRand() < 0.3) {
            nextState = (curiosityBias + state) % 3;
          }

          next[idx] = nextState;
        }
      }

      grid = next;
      draw();
    };

    let rafId = 0;
    const loop = () => {
      tick();
      rafId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(rafId);
  }, [seedName, energy, curiosity, bond, field, fingerprint]);

  return (
    <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-400/80">Mechanics Lab</p>
          <h3 className="text-xl font-semibold text-yellow-300">DNA Lattice & Key Guardian</h3>
        </div>
        <span className="text-[11px] font-mono bg-gray-950/60 px-2 py-1 rounded border border-yellow-600/30 text-yellow-200">
          {fingerprint}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-cyan-900/30 to-gray-950/60 border border-cyan-500/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-cyan-100 font-medium">Moss60 Cellular Web</p>
            <span className="text-[11px] text-cyan-200 font-mono">adaptive</span>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-cyan-500/20">
            <canvas ref={canvasRef} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/80 to-transparent p-2 text-[10px] text-cyan-100 font-mono">
              energy {energy.toFixed(0)} • curiosity {curiosity.toFixed(0)} • bond {bond.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/30 to-gray-950/60 border border-indigo-500/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-indigo-100 font-medium">Tesseract Bloom</p>
            <span className="text-[11px] text-indigo-200 font-mono">sigil lock</span>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-indigo-500/20">
            <svg viewBox="0 0 260 260" className="w-full h-full" role="img" aria-label="Sigil security bloom">
              <defs>
                <radialGradient id="sigilGlow" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#4ecdc4" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#05060f" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="260" height="260" fill="url(#sigilGlow)" />
              <g transform="translate(130 130)">
                {nodeLayout.links.map(([a, b], i) => {
                  const na = nodeLayout.nodes[a];
                  const nb = nodeLayout.nodes[b];
                  const opacity = 0.25 + ((na.weight + nb.weight) / 2) * 0.4;
                  return (
                    <line
                      key={i}
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth={0.6}
                      opacity={opacity}
                    />
                  );
                })}
                {nodeLayout.nodes.map((n, idx) => (
                  <circle
                    key={idx}
                    cx={n.x}
                    cy={n.y}
                    r={3 + n.weight * 2}
                    fill={idx % 2 === 0 ? '#ffd166' : '#4ecdc4'}
                    opacity={0.7}
                  />
                ))}
                <circle r="18" fill="rgba(255,215,0,0.12)" stroke="#ffd166" strokeWidth="0.8" />
                <circle r="6" fill="#ff6b35" opacity="0.8" />
              </g>
            </svg>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/80 to-transparent p-2 text-[11px] text-indigo-100 font-mono">
              pulse: {field.pulse.slice(0, 6).join(' ')} • ring: {field.ring.slice(0, 6).join(' ')}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-300 mt-4 leading-relaxed">
        These visual mechanics are lifted from the standalone HTML yantra and cellular automata sketches and now live inside the Guardian.
        The weave responds to your Moss DNA values while the sigil bloom encodes a rotating security fingerprint so the pet can be verified
        even when the UI is in high-contrast or offline.
      </p>
    </div>
  );
};

export default MechanicsShowcase;
