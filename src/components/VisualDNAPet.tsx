'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { useStore } from '@/lib/store';
import { PetBodyRenderer, type BodySpec } from '@/components/body-forge/PetBodyRenderer';
import { clearForgedBody, loadForgedBody, phenotypeToBodySpec } from '@/visual-dna/bodyForgeAdapter';
import { resolveVisualDNA, type ParticleMode, type VisualPhenotype } from '@/visual-dna';

const ACTION_WINDOW_MS = 1_600;

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

function bodyShape(phenotype: VisualPhenotype, fill: string, stroke: string, patternId: string) {
  const size = 45;
  const base = {
    fill,
    stroke,
    strokeWidth: phenotype.aura.thickness,
  };

  switch (phenotype.identity.bodyType) {
    case 'Cubic':
      return <rect x={110 - size} y={105 - size} width={size * 2} height={size * 2} rx="12" {...base} />;
    case 'Pyramidal':
      return <polygon points={`110,${105 - size} ${110 - size},${105 + size} ${110 + size},${105 + size}`} {...base} />;
    case 'Cylindrical':
      return <ellipse cx="110" cy="105" rx={size * 0.66} ry={size * 1.08} {...base} />;
    case 'Toroidal':
      return (
        <g>
          <circle cx="110" cy="105" r={size} {...base} />
          <circle cx="110" cy="105" r={size * 0.44} fill="#07111f" stroke={stroke} strokeWidth={phenotype.aura.thickness} />
        </g>
      );
    case 'Crystalline':
      return (
        <polygon
          points={`110,${105 - size} ${110 + size * 0.72},${105 - size * 0.28} ${110 + size * 0.5},${105 + size * 0.56} ${110 - size * 0.5},${105 + size * 0.56} ${110 - size * 0.72},${105 - size * 0.28}`}
          {...base}
        />
      );
    case 'Spherical':
    default:
      return <circle cx="110" cy="105" r={size} {...base} />;
  }
}

function mouthPath(expression: VisualPhenotype['face']['expression']): string {
  switch (expression) {
    case 'smile':
      return 'M 96 122 Q 110 137 124 122';
    case 'frown':
    case 'strained':
      return 'M 96 130 Q 110 116 124 130';
    case 'sleepy':
      return 'M 102 126 Q 110 130 118 126';
    case 'focused':
      return 'M 101 125 Q 110 132 119 125';
    default:
      return 'M 99 126 L 121 126';
  }
}

function particleAnimation(mode: ParticleMode, x: number, y: number, index: number) {
  const delay = index * 0.08;
  switch (mode) {
    case 'inward':
      return {
        animate: { cx: [x, 110], cy: [y, 105], opacity: [0, 0.8, 0] },
        transition: { duration: 1.6, delay, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' as const },
      };
    case 'rise':
      return {
        animate: { cy: [y + 8, y - 30], opacity: [0, 0.72, 0], scale: [0.6, 1, 0.7] },
        transition: { duration: 2.4, delay, repeat: Number.POSITIVE_INFINITY, ease: 'easeOut' as const },
      };
    case 'fall':
    case 'dust':
      return {
        animate: { cy: [y - 10, y + 25], opacity: [0, 0.55, 0], x: [0, index % 2 === 0 ? 8 : -8] },
        transition: { duration: 2.8, delay, repeat: Number.POSITIVE_INFINITY, ease: 'linear' as const },
      };
    case 'static':
      return {
        animate: { x: [0, 3, -4, 1, 0], y: [0, -2, 3, -1, 0], opacity: [0.2, 0.8, 0.35] },
        transition: { duration: 0.7 + (index % 3) * 0.15, delay, repeat: Number.POSITIVE_INFINITY },
      };
    case 'spark':
      return {
        animate: { scale: [0.3, 1.4, 0.3], opacity: [0.15, 0.9, 0.15] },
        transition: { duration: 1.2 + (index % 4) * 0.25, delay, repeat: Number.POSITIVE_INFINITY },
      };
    case 'orbit':
      return {
        animate: { opacity: [0.25, 0.8, 0.25], scale: [0.8, 1.2, 0.8] },
        transition: { duration: 2 + (index % 5) * 0.3, delay, repeat: Number.POSITIVE_INFINITY },
      };
    default:
      return { animate: {}, transition: { duration: 0 } };
  }
}

export function VisualDNAPet({
  className = '',
  showReadout = true,
}: {
  className?: string;
  showReadout?: boolean;
}) {
  const traits = useStore((state) => state.traits);
  const vitals = useStore((state) => state.vitals);
  const evolution = useStore((state) => state.evolution);
  const lastAction = useStore((state) => state.lastAction);
  const lastActionAt = useStore((state) => state.lastActionAt);
  const reducedMotion = useReducedMotion();
  // Tracks which action timestamp has aged past the reaction window. Keeps
  // render pure (no Date.now during render): while an action is fresh the
  // memo is fed now=lastActionAt (full reaction), after the timer fires it is
  // fed a time past the window (pose settled).
  const [settledActionAt, setSettledActionAt] = useState<number | null>(null);
  const [forgedBody, setForgedBody] = useState<BodySpec | null>(null);
  const rawId = useId();
  const id = sanitizeId(rawId);

  useEffect(() => {
    const sync = () => setForgedBody(loadForgedBody());
    // Deferred so the initial load happens outside the effect body.
    const initialLoad = window.setTimeout(sync, 0);
    window.addEventListener('bss:body-forge:updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener('bss:body-forge:updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!lastAction || !lastActionAt) return;
    const remaining = ACTION_WINDOW_MS - (Date.now() - lastActionAt);
    const timeout = window.setTimeout(
      () => setSettledActionAt(lastActionAt),
      Math.max(0, remaining + 20),
    );
    return () => window.clearTimeout(timeout);
  }, [lastAction, lastActionAt]);

  const actionSettled = !lastActionAt || settledActionAt === lastActionAt;

  const phenotype = useMemo(() => {
    if (!traits) return null;
    return resolveVisualDNA({
      traits,
      vitals,
      evolution,
      lastAction,
      lastActionAt,
      now: actionSettled ? lastActionAt + ACTION_WINDOW_MS : lastActionAt,
      reducedMotion: Boolean(reducedMotion),
    });
  }, [actionSettled, evolution, lastAction, lastActionAt, reducedMotion, traits, vitals]);

  const resolvedBody = useMemo(() => phenotype ? (forgedBody ?? phenotypeToBodySpec(phenotype)) : null, [forgedBody, phenotype]);

  const particles = useMemo(() => {
    if (!phenotype) return [];
    const count = phenotype.particles.count;
    return Array.from({ length: count }, (_, index) => {
      const fraction = index / Math.max(1, count);
      const angle = ((phenotype.identity.seed % 360) + fraction * 360 + phenotype.aura.phaseOffset) * (Math.PI / 180);
      const jitter = ((phenotype.identity.seed * (index + 3) * 2_654_435_761) >>> 0) % 1_000 / 1_000;
      const radius = phenotype.aura.radius * (0.72 + jitter * 0.34);
      return {
        x: 110 + Math.cos(angle) * radius,
        y: 105 + Math.sin(angle) * radius * (0.72 + phenotype.aura.asymmetry * 0.15),
      };
    });
  }, [phenotype]);

  if (!phenotype) {
    return (
      <div className={`flex min-h-72 items-center justify-center rounded-3xl border border-cyan-900/50 bg-slate-950/70 ${className}`}>
        <motion.div
          className="text-6xl"
          animate={reducedMotion ? undefined : { scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
        >
          🧬
        </motion.div>
      </div>
    );
  }

  const patternId = `visual-dna-pattern-${id}`;
  const glowId = `visual-dna-glow-${id}`;
  const auraGradientId = `visual-dna-aura-${id}`;
  const bodyFill = phenotype.identity.pattern === 'Solid' ? phenotype.identity.baseColor : `url(#${patternId})`;
  const auraPulse = phenotype.aura.pulseSeconds > 0
    ? { scale: [0.97, 1.03, 0.97], opacity: [phenotype.aura.opacity * 0.72, phenotype.aura.opacity, phenotype.aura.opacity * 0.72] }
    : { scale: 1, opacity: phenotype.aura.opacity };
  const auraTransition = phenotype.aura.pulseSeconds > 0
    ? { duration: phenotype.aura.pulseSeconds, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' as const }
    : { duration: 0 };

  return (
    <section className={`relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-[radial-gradient(circle_at_center,_rgba(8,47,73,0.42),_rgba(2,6,23,0.96)_72%)] p-4 ${className}`}>
      <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative min-h-[360px]">
          <motion.svg
            viewBox="0 0 220 220"
            className="absolute inset-0 h-full w-full overflow-visible"
            role="img"
            aria-label={`${phenotype.evolution.state} visual DNA pet, ${phenotype.behavior.label}`}
          >
            <defs>
              <radialGradient id={auraGradientId} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={phenotype.aura.colors[3]} stopOpacity="0.76" />
                <stop offset="45%" stopColor={phenotype.aura.colors[2]} stopOpacity="0.42" />
                <stop offset="100%" stopColor={phenotype.aura.colors[0]} stopOpacity="0" />
              </radialGradient>
              {phenotype.identity.pattern === 'Striped' && (
                <pattern id={patternId} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform={`rotate(${phenotype.identity.waveAngle})`}>
                  <rect width="14" height="14" fill={phenotype.identity.baseColor} />
                  <rect width="5" height="14" fill={phenotype.identity.accentColor} opacity="0.72" />
                </pattern>
              )}
              {phenotype.identity.pattern === 'Spotted' && (
                <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill={phenotype.identity.baseColor} />
                  <circle cx="6" cy="7" r="3.3" fill={phenotype.identity.accentColor} opacity="0.74" />
                  <circle cx="16" cy="15" r="2.4" fill={phenotype.identity.highlightColor} opacity="0.55" />
                </pattern>
              )}
              {phenotype.identity.pattern === 'Gradient' && (
                <linearGradient id={patternId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={phenotype.identity.baseColor} />
                  <stop offset="55%" stopColor={phenotype.identity.stageColor} />
                  <stop offset="100%" stopColor={phenotype.identity.accentColor} />
                </linearGradient>
              )}
              {!['Striped', 'Spotted', 'Gradient', 'Solid'].includes(phenotype.identity.pattern) && (
                <linearGradient id={patternId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={phenotype.identity.baseColor} />
                  <stop offset="100%" stopColor={phenotype.identity.accentColor} />
                </linearGradient>
              )}
              <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation={phenotype.aura.blur / 4} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <motion.circle
              cx="110"
              cy="105"
              r={phenotype.aura.radius + 28}
              fill={`url(#${auraGradientId})`}
              animate={auraPulse}
              transition={auraTransition}
            />

            <motion.g
              style={{ transformOrigin: '110px 105px' }}
              animate={phenotype.aura.rotationSeconds > 0 ? { rotate: [0, 360] } : undefined}
              transition={phenotype.aura.rotationSeconds > 0 ? { duration: phenotype.aura.rotationSeconds, repeat: Number.POSITIVE_INFINITY, ease: 'linear' } : undefined}
              filter={`url(#${glowId})`}
            >
              {Array.from({ length: phenotype.aura.rings }, (_, index) => {
                const radius = Math.max(30, phenotype.aura.radius - index * 10);
                const stroke = phenotype.aura.colors[index % phenotype.aura.colors.length];
                const dash = phenotype.aura.topology === 'halo' ? undefined : `${5 + index * 2} ${7 + index * 3}`;
                if (phenotype.aura.topology === 'neural-lattice' || phenotype.aura.topology === 'phase-torus') {
                  return (
                    <motion.ellipse
                      key={index}
                      cx="110"
                      cy="105"
                      rx={radius}
                      ry={radius * (phenotype.aura.topology === 'phase-torus' ? 0.38 + index * 0.08 : 0.68)}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={phenotype.aura.thickness}
                      strokeDasharray={dash}
                      opacity={phenotype.aura.opacity}
                      transform={`rotate(${phenotype.aura.phaseOffset + index * (phenotype.aura.topology === 'phase-torus' ? 48 : 72)} 110 105)`}
                      animate={phenotype.aura.turbulence > 0.05 ? { pathLength: [0.72, 1, 0.72], opacity: [phenotype.aura.opacity * 0.55, phenotype.aura.opacity, phenotype.aura.opacity * 0.55] } : undefined}
                      transition={{ duration: 2 + index * 0.35, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                    />
                  );
                }
                return (
                  <motion.circle
                    key={index}
                    cx="110"
                    cy="105"
                    r={radius}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={phenotype.aura.thickness}
                    strokeDasharray={phenotype.aura.topology === 'speciation-crown' ? `${3 + index} ${8 - Math.min(index, 4)}` : dash}
                    opacity={phenotype.aura.opacity}
                  />
                );
              })}

              {Array.from({ length: phenotype.aura.nodes }, (_, index) => {
                const angle = ((index / phenotype.aura.nodes) * 360 + phenotype.aura.phaseOffset) * (Math.PI / 180);
                const radius = phenotype.aura.radius - (index % Math.max(1, phenotype.aura.rings)) * 7;
                return (
                  <motion.circle
                    key={`node-${index}`}
                    cx={110 + Math.cos(angle) * radius}
                    cy={105 + Math.sin(angle) * radius * (0.72 + phenotype.aura.asymmetry * 0.12)}
                    r={1.4 + phenotype.evolution.complexity * 1.2}
                    fill={phenotype.aura.colors[(index + 1) % phenotype.aura.colors.length]}
                    opacity={phenotype.aura.opacity + 0.12}
                    animate={reducedMotion ? undefined : { scale: [0.7, 1.35, 0.7], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 1.4 + (index % 5) * 0.22, delay: index * 0.035, repeat: Number.POSITIVE_INFINITY }}
                  />
                );
              })}
            </motion.g>

            {particles.map((particle, index) => {
              const animation = particleAnimation(phenotype.particles.mode, particle.x, particle.y, index);
              return (
                <motion.circle
                  key={`particle-${index}`}
                  cx={particle.x}
                  cy={particle.y}
                  r={phenotype.particles.size * (0.7 + (index % 4) * 0.12)}
                  fill={phenotype.aura.colors[index % phenotype.aura.colors.length]}
                  opacity={phenotype.particles.opacity}
                  animate={animation.animate}
                  transition={animation.transition}
                />
              );
            })}

            {resolvedBody && (
              <g transform="translate(40 42) scale(.5)">
                <PetBodyRenderer spec={resolvedBody} animate={!reducedMotion} className="overflow-visible" />
              </g>
            )}

            <motion.g
              className="opacity-0" aria-hidden="true"
              style={{ transformOrigin: '110px 105px' }}
              animate={reducedMotion ? undefined : {
                y: [0, -phenotype.body.bobPixels, 0],
                rotate: [phenotype.body.tiltDegrees - phenotype.body.shiver, phenotype.body.tiltDegrees + phenotype.body.shiver, phenotype.body.tiltDegrees - phenotype.body.shiver],
                scaleX: phenotype.body.squashX,
                scaleY: phenotype.body.squashY,
              }}
              transition={{ duration: Math.max(0.65, phenotype.body.bobSeconds), repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              opacity={phenotype.body.opacity}
              filter={`saturate(${phenotype.body.saturation}) brightness(${phenotype.body.brightness})`}
            >
              {phenotype.identity.features.includes('Wings') && (
                <g opacity="0.72">
                  <ellipse cx="60" cy="108" rx={26 * phenotype.identity.limbRatio} ry="14" fill={phenotype.identity.baseColor} stroke={phenotype.identity.stageColor} />
                  <ellipse cx="160" cy="108" rx={26 * phenotype.identity.limbRatio} ry="14" fill={phenotype.identity.baseColor} stroke={phenotype.identity.stageColor} />
                </g>
              )}

              {bodyShape(phenotype, bodyFill, phenotype.identity.accentColor, patternId)}

              {phenotype.identity.texture === 'Glowing' && (
                <circle cx="110" cy="105" r="48" fill="none" stroke={phenotype.identity.highlightColor} strokeWidth="4" opacity="0.45" filter={`url(#${glowId})`} />
              )}

              {phenotype.identity.features.includes('Horns') && (
                <g fill="none" stroke={phenotype.identity.accentColor} strokeWidth="4" strokeLinecap="round">
                  <path d="M 80 78 Q 66 52 74 39" />
                  <path d="M 140 78 Q 154 52 146 39" />
                </g>
              )}

              {phenotype.identity.features.includes('Crown') && (
                <path d="M 82 70 L 89 49 L 98 67 L 110 43 L 122 67 L 131 49 L 138 70" fill="none" stroke={phenotype.identity.highlightColor} strokeWidth="3" />
              )}

              {phenotype.identity.features.includes('Tail Flame') && (
                <motion.g animate={reducedMotion ? undefined : { scale: [0.85, 1.15, 0.85], opacity: [0.65, 1, 0.65] }} transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY }}>
                  <path d="M 110 151 C 96 170 102 184 110 192 C 118 184 124 170 110 151" fill={phenotype.identity.stageColor} />
                  <path d="M 110 165 C 104 176 106 182 110 186 C 114 182 116 176 110 165" fill={phenotype.identity.highlightColor} />
                </motion.g>
              )}

              <g>
                <ellipse cx="93" cy="99" rx="9" ry={9 * phenotype.face.eyeOpen} fill="white" />
                <ellipse cx="127" cy="99" rx="9" ry={9 * phenotype.face.eyeOpen} fill="white" />
                <circle cx={93 + phenotype.face.gazeX * 6} cy={99 + phenotype.face.gazeY * 6} r={4.7 * phenotype.face.pupilScale} fill="#020617" />
                <circle cx={127 + phenotype.face.gazeX * 6} cy={99 + phenotype.face.gazeY * 6} r={4.7 * phenotype.face.pupilScale} fill="#020617" />
              </g>

              {phenotype.identity.features.includes('Third Eye') && (
                <g>
                  <ellipse cx="110" cy="77" rx="8" ry="5" fill={phenotype.identity.stageColor} stroke={phenotype.identity.highlightColor} />
                  <circle cx="110" cy="77" r="2.5" fill="white" />
                </g>
              )}

              <motion.path
                d={mouthPath(phenotype.face.expression)}
                fill="none"
                stroke={phenotype.identity.accentColor}
                strokeWidth="3"
                strokeLinecap="round"
                animate={{ d: mouthPath(phenotype.face.expression) }}
                transition={{ duration: 0.35 }}
              />
            </motion.g>
          </motion.svg>
        </div>

        {showReadout && (
          <aside className="rounded-2xl border border-slate-800 bg-slate-950/72 p-4 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-2"><p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Visual DNA live readout</p>{forgedBody && <button type="button" onClick={() => { clearForgedBody(); setForgedBody(null); }} className="rounded-full border border-amber-500/40 px-2 py-1 text-[9px] uppercase tracking-wider text-amber-200">Use DNA body</button>}</div>
            <h2 className="mt-2 text-lg font-semibold text-white">{phenotype.behavior.state.replace('-', ' ')}</h2>
            <p className="mt-2 text-xs leading-5 text-zinc-400">{phenotype.behavior.label}</p>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3"><dt>Body source</dt><dd className={forgedBody ? 'text-amber-200' : 'text-cyan-200'}>{forgedBody ? 'Body Forge' : 'Visual DNA'}</dd></div>
              <div className="flex justify-between gap-3"><dt>Evolution</dt><dd className="text-cyan-200">{phenotype.evolution.state}</dd></div>
              <div className="flex justify-between gap-3"><dt>Aura</dt><dd className="text-cyan-200">{phenotype.aura.topology}</dd></div>
              <div className="flex justify-between gap-3"><dt>Rings / nodes</dt><dd>{phenotype.aura.rings} / {phenotype.aura.nodes}</dd></div>
              <div className="flex justify-between gap-3"><dt>Urgency</dt><dd>{Math.round(phenotype.behavior.urgency * 100)}%</dd></div>
              <div className="flex justify-between gap-3"><dt>Field pull</dt><dd>{Math.round(phenotype.aura.inwardPull * 100)}%</dd></div>
              <div className="flex justify-between gap-3"><dt>Turbulence</dt><dd>{Math.round(phenotype.aura.turbulence * 100)}%</dd></div>
            </dl>
          </aside>
        )}
      </div>
    </section>
  );
}
