'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  Dna,
  Heart,
  RotateCcw,
  Shield,
  Shuffle,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

const RED60 = '130313505035853058505778770877709707970707970752570525233332333';

const primeRotations = [25, 35] as const;

type PrimeRotation = (typeof primeRotations)[number];

type Mode = 'genome' | 'breeding' | 'evolution';

interface Gate {
  readonly id: number;
  readonly palindrome: string;
  readonly position: number;
  readonly color: string;
}

interface Stats {
  readonly vitality: number;
  readonly intelligence: number;
  readonly defense: number;
  readonly agility: number;
}

interface BreedingResult {
  readonly rotation: number;
  readonly compatibility: number;
  readonly primeInfluence: PrimeRotation;
  readonly mutation: boolean;
}

interface EvolutionStage {
  readonly name: string;
  readonly description: string;
  readonly genomeSnapshot: string;
  readonly trigger: string;
  readonly requiresPrime?: boolean;
  readonly displayRotation: number;
  readonly range: readonly [number, number];
}

interface StatBarProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

interface GenomeWheelProps {
  readonly rotation: number;
  readonly size?: number;
  readonly selectedGateId?: number | null;
  readonly onGateSelect?: (gate: Gate) => void;
}

const gates: Gate[] = [
  { id: 0, palindrome: '13031', position: 0, color: '#ff0044' },
  { id: 1, palindrome: '35853', position: 8, color: '#ff3366' },
  { id: 2, palindrome: '77877', position: 20, color: '#ff6699' },
  { id: 3, palindrome: '97079', position: 32, color: '#ff99cc' },
  { id: 4, palindrome: '75257', position: 44, color: '#ff66ff' },
  { id: 5, palindrome: '33233', position: 56, color: '#ff99ff' },
];

const StatBar: React.FC<StatBarProps> = ({ icon, label, value, color }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
        <span className="text-base text-white/80">{icon}</span>
        <span className="uppercase tracking-wide">{label}</span>
        <span className="ml-auto text-white/60">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.4))`,
          }}
        />
      </div>
    </div>
  );
};

const calculateStats = (rot: number): Stats => {
  const redPhase = (rot % 60) / 60;
  const bluePhase = ((rot * 5) % 60) / 60;

  const vitalityHarmonic = Math.abs(
    Math.sin(redPhase * Math.PI * 2) + Math.cos(bluePhase * Math.PI * 2),
  );
  const intelligenceHarmonic = Math.abs(
    Math.sin(redPhase * Math.PI * 3) - Math.sin(bluePhase * Math.PI * 2),
  );
  const defenseHarmonic = Math.abs(
    Math.cos(redPhase * Math.PI * 2) * Math.cos(bluePhase * Math.PI * 3),
  );
  const agilityHarmonic = Math.abs(Math.sin((redPhase + bluePhase) * Math.PI * 4));

  return {
    vitality: Math.round(vitalityHarmonic * 50 + 50),
    intelligence: Math.round(intelligenceHarmonic * 50 + 50),
    defense: Math.round(defenseHarmonic * 50 + 50),
    agility: Math.round(agilityHarmonic * 50 + 50),
  };
};

const toHeptaCode = (value: number): string => {
  if (value === 0) return '0';
  let current = value;
  let result = '';
  while (current > 0) {
    result = `${current % 7}${result}`;
    current = Math.floor(current / 7);
  }
  return result;
};

const clampRotation = (value: number) => ((value % 60) + 60) % 60;

const minimalDistance = (a: number, b: number) => {
  const diff = Math.abs(a - b);
  return Math.min(diff, 60 - diff);
};

const isNearPrime = (rotation: number) =>
  primeRotations.some(prime => minimalDistance(rotation, prime) <= 3);

const breedPets = (rot1: number, rot2: number): BreedingResult => {
  const harmonicDistance = minimalDistance(rot1, rot2);
  const compatibility = Math.max(0, Math.round(100 - (harmonicDistance / 30) * 100));
  const avgRotation = Math.round((rot1 + rot2) / 2);

  const primeInfluence = primeRotations.reduce<PrimeRotation>((closest, current) => {
    return minimalDistance(current, avgRotation) < minimalDistance(closest, avgRotation)
      ? current
      : closest;
  }, primeRotations[0]);

  const influenced = Math.round(avgRotation * 0.7 + primeInfluence * 0.3);
  const rotation = clampRotation(influenced);

  return {
    rotation,
    compatibility,
    primeInfluence,
    mutation: Math.abs(influenced - avgRotation) > 5,
  };
};

const GenomeWheel: React.FC<GenomeWheelProps> = ({
  rotation,
  size = 300,
  selectedGateId,
  onGateSelect,
}) => {
  const center = size / 2;
  const radius = size * 0.35;
  const isPrimeState = isNearPrime(rotation);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width="100%" height="100%" fill="#0a0a0a" rx={12} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#00ff88"
        strokeWidth={1}
        fill="none"
        opacity={0.3}
      />

      {[...Array(60)].map((_, index) => {
        const angle = (index / 60) * Math.PI * 2 - Math.PI / 2;
        const majorTick = index % 15 === 0;
        const inner = radius - (index % 5 === 0 ? 8 : 4);
        const x1 = center + Math.cos(angle) * inner;
        const y1 = center + Math.sin(angle) * inner;
        const x2 = center + Math.cos(angle) * radius;
        const y2 = center + Math.sin(angle) * radius;
        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={majorTick ? '#00ffff' : '#00ff88'}
            strokeWidth={majorTick ? 2 : 0.5}
            opacity={majorTick ? 0.7 : 0.4}
          />
        );
      })}

      {gates.map(gate => {
        const startAngle = (((gate.position + rotation) % 60) / 60) * Math.PI * 2 - Math.PI / 2;
        const endAngle = (((gate.position + rotation + 5) % 60) / 60) * Math.PI * 2 - Math.PI / 2;
        const midAngle = (startAngle + endAngle) / 2;
        const arcRadius = radius - 20;

        const x1 = center + Math.cos(startAngle) * arcRadius;
        const y1 = center + Math.sin(startAngle) * arcRadius;
        const x2 = center + Math.cos(endAngle) * arcRadius;
        const y2 = center + Math.sin(endAngle) * arcRadius;
        const textX = center + Math.cos(midAngle) * (radius - 45);
        const textY = center + Math.sin(midAngle) * (radius - 45);

        const active = selectedGateId === gate.id;

        return (
          <g
            key={gate.id}
            onClick={() => onGateSelect?.(gate)}
            className="cursor-pointer"
            style={{ filter: active ? 'drop-shadow(0 0 8px rgba(255,0,0,0.9))' : 'none' }}
          >
            <path
              d={`M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`}
              stroke={gate.color}
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
              opacity={active ? 1 : 0.8}
            />
            <text
              x={textX}
              y={textY}
              fill={gate.color}
              fontSize={10}
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {gate.palindrome}
            </text>
          </g>
        );
      })}

      {gates.map(gate => {
        const startAngle = (((gate.position + rotation + 5) % 60) / 60) * Math.PI * 2 - Math.PI / 2;
        const endAngle = (((gate.position + rotation + 7) % 60) / 60) * Math.PI * 2 - Math.PI / 2;
        const arcRadius = radius - 20;

        const x1 = center + Math.cos(startAngle) * arcRadius;
        const y1 = center + Math.sin(startAngle) * arcRadius;
        const x2 = center + Math.cos(endAngle) * arcRadius;
        const y2 = center + Math.sin(endAngle) * arcRadius;

        return (
          <path
            key={`blue-${gate.id}`}
            d={`M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`}
            stroke="#3366ff"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            opacity={0.6}
          />
        );
      })}

      {primeRotations.map(prime => {
        const angle = (prime / 60) * Math.PI * 2 - Math.PI / 2;
        const x = center + Math.cos(angle) * (radius + 15);
        const y = center + Math.sin(angle) * (radius + 15);
        const active = minimalDistance(rotation, prime) <= 3;
        return (
          <g key={`prime-${prime}`}>
            <circle
              cx={x}
              cy={y}
              r={6}
              fill={active ? '#ff00ff' : '#663366'}
              stroke="#ff66ff"
              strokeWidth={1}
              opacity={active ? 1 : 0.5}
            />
            {active && (
              <circle cx={x} cy={y} r={10} fill="none" stroke="#ff66ff" strokeWidth={1} opacity={0.6}>
                <animate attributeName="r" from="10" to="16" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      <g>
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - radius + 30}
          stroke={isPrimeState ? '#ff00ff' : '#ffff66'}
          strokeWidth={2}
        />
        <circle
          cx={center}
          cy={center - radius + 30}
          r={4}
          fill={isPrimeState ? '#ff00ff' : '#ffff66'}
        />
      </g>

      <text
        x={center}
        y={center - 10}
        fill="#00ff88"
        fontSize={16}
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight="bold"
      >
        ROT: {rotation}
      </text>
      <text
        x={center}
        y={center + 10}
        fill="#00ffff"
        fontSize={10}
        textAnchor="middle"
        fontFamily="monospace"
      >
        H7: {toHeptaCode(rotation)}
      </text>
      {isPrimeState && (
        <text
          x={center}
          y={center + 26}
          fill="#ff66ff"
          fontSize={9}
          textAnchor="middle"
          fontFamily="monospace"
          fontWeight="bold"
        >
          ★ PRIME ★
        </text>
      )}
    </svg>
  );
};

const evolutionStages: EvolutionStage[] = [
  {
    name: 'Newborn',
    description: 'Initial activation of the palindromic wheel. Stats are fluid and reactive.',
    genomeSnapshot: 'RED focus minimal, BLUE echoes just forming.',
    trigger: 'Rotate beyond 10 ticks to awaken curiosity.',
    displayRotation: 5,
    range: [0, 9],
  },
  {
    name: 'Awakened',
    description: 'Stabilised harmonic rhythm with responsive agility gains.',
    genomeSnapshot: 'RED gates begin resonating; BLUE mirrors align.',
    trigger: 'Reach rotation 20 to unlock study instincts.',
    displayRotation: 15,
    range: [10, 19],
  },
  {
    name: 'Harmonic',
    description: 'Balanced stats with noticeable vitality surges.',
    genomeSnapshot: 'RED/BLUE interference generates stable waveforms.',
    trigger: 'Approach CCW-25 for prime harmonics.',
    requiresPrime: true,
    displayRotation: 25,
    range: [20, 29],
  },
  {
    name: 'Primebound',
    description: 'Prime resonance unlocks rare abilities and mutation potential.',
    genomeSnapshot: 'Palindromic loop locks into CCW-35 gate.',
    trigger: 'Hold rotation near CCW-35 for advanced evolutions.',
    requiresPrime: true,
    displayRotation: 35,
    range: [30, 39],
  },
  {
    name: 'Ascended',
    description: 'Genome exhibits persistent prime echoes; defense harmonics spike.',
    genomeSnapshot: 'RED and BLUE fields reinforce each other.',
    trigger: 'Stabilise rotation past 45 to cement growth.',
    displayRotation: 45,
    range: [40, 49],
  },
  {
    name: 'Legendary',
    description: 'Fully synchronised genome with legendary-tier resonance.',
    genomeSnapshot: 'Prime states cycle seamlessly; mutations become intentional.',
    trigger: 'Maintain high rotations while revisiting prime anchors.',
    displayRotation: 55,
    range: [50, 59],
  },
];

const MetaPetGenomeExplorer: React.FC = () => {
  const [mode, setMode] = useState<Mode>('genome');
  const [rotation, setRotation] = useState(25);
  const [selectedGateId, setSelectedGateId] = useState<number | null>(null);
  const [pet1Rotation, setPet1Rotation] = useState(25);
  const [pet2Rotation, setPet2Rotation] = useState(35);
  const [animating, setAnimating] = useState(false);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  const rotateToPrime = (target: PrimeRotation) => {
    if (animating) return;

    setAnimating(true);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    animationRef.current = setInterval(() => {
      setRotation(prev => {
        if (prev === target) {
          if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
          }
          setAnimating(false);
          return prev;
        }

        let next = prev > target ? prev - 1 : prev + 1;
        if (next < 0) {
          next = 59;
        }
        if (next > 59) {
          next = 0;
        }

        if (next === target) {
          queueMicrotask(() => {
            if (animationRef.current) {
              clearInterval(animationRef.current);
              animationRef.current = null;
            }
            setAnimating(false);
          });
        }

        return next;
      });
    }, 50);
  };

  const stats = useMemo(() => calculateStats(rotation), [rotation]);
  const isPrimeState = useMemo(() => isNearPrime(rotation), [rotation]);

  const breedingResult = useMemo(
    () => breedPets(pet1Rotation, pet2Rotation),
    [pet1Rotation, pet2Rotation],
  );
  const offspringStats = useMemo(
    () => calculateStats(breedingResult.rotation),
    [breedingResult.rotation],
  );

  const selectedGate = useMemo(
    () => gates.find(gate => gate.id === selectedGateId) ?? null,
    [selectedGateId],
  );

  const sequenceDigits = useMemo(() => {
    const entries = Array.from(RED60).map((digit, index) => ({
      digit,
      color: '#444',
      accent: false,
    }));

    gates.forEach(gate => {
      for (let offset = 0; offset < 5; offset += 1) {
        const index = (gate.position + offset) % entries.length;
        entries[index] = {
          digit: entries[index].digit,
          color: gate.color,
          accent: selectedGateId === gate.id,
        };
      }
    });

    return entries;
  }, [selectedGateId]);

  const currentStageIndex = useMemo(() => {
    return evolutionStages.findIndex(stage => {
      const [start, end] = stage.range;
      return rotation >= start && rotation <= end;
    });
  }, [rotation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#12001f] to-black text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="border-b border-emerald-400/30 pb-6 text-center">
          <h1 className="text-4xl font-bold tracking-[0.2em] text-cyan-300">
            META-PET GENOME EXPLORER
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.4em] text-fuchsia-300">
            Palindromic Wheel Mechanics • Harmonic Interactions • Prime Resonance
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => setMode('genome')}
            className={`flex items-center gap-2 rounded-md border px-5 py-2 text-sm font-semibold transition ${
              mode === 'genome'
                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                : 'border-emerald-500/30 bg-black/40 text-emerald-100/70 hover:border-emerald-400/50'
            }`}
          >
            <Dna className="h-4 w-4" /> Genome View
          </button>
          <button
            type="button"
            onClick={() => setMode('breeding')}
            className={`flex items-center gap-2 rounded-md border px-5 py-2 text-sm font-semibold transition ${
              mode === 'breeding'
                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                : 'border-emerald-500/30 bg-black/40 text-emerald-100/70 hover:border-emerald-400/50'
            }`}
          >
            <Heart className="h-4 w-4" /> Breeding Lab
          </button>
          <button
            type="button"
            onClick={() => setMode('evolution')}
            className={`flex items-center gap-2 rounded-md border px-5 py-2 text-sm font-semibold transition ${
              mode === 'evolution'
                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                : 'border-emerald-500/30 bg-black/40 text-emerald-100/70 hover:border-emerald-400/50'
            }`}
          >
            <Sparkles className="h-4 w-4" /> Evolution Path
          </button>
        </div>

        {mode === 'genome' && (
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 rounded-2xl border border-emerald-500/40 bg-black/40 p-6 overflow-visible">
              <h2 className="text-center text-xl font-semibold text-cyan-200">
                Activated Genome Wheel
              </h2>
              <div className="flex justify-center overflow-visible min-h-[420px]">
                <GenomeWheel
                  rotation={rotation}
                  size={400}
                  selectedGateId={selectedGateId}
                  onGateSelect={gate => setSelectedGateId(gate.id)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-cyan-200">Rotation</span>
                  <input
                    type="range"
                    min={0}
                    max={59}
                    value={rotation}
                    onChange={event => setRotation(Number.parseInt(event.target.value, 10))}
                    disabled={animating}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded bg-emerald-500/20 accent-emerald-400"
                  />
                  <span className="text-lg font-bold text-amber-300">{rotation}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => rotateToPrime(25)}
                    disabled={animating}
                    className={`flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition ${
                      animating
                        ? 'cursor-not-allowed border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200/40'
                        : 'border-fuchsia-400/60 bg-fuchsia-500/10 text-fuchsia-200 hover:border-fuchsia-300'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4" /> CCW-25
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateToPrime(35)}
                    disabled={animating}
                    className={`flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition ${
                      animating
                        ? 'cursor-not-allowed border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200/40'
                        : 'border-fuchsia-400/60 bg-fuchsia-500/10 text-fuchsia-200 hover:border-fuchsia-300'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4" /> CCW-35
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(Math.floor(Math.random() * 60))}
                    disabled={animating}
                    className={`flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition ${
                      animating
                        ? 'cursor-not-allowed border-cyan-500/30 bg-cyan-500/10 text-cyan-200/40'
                        : 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200 hover:border-cyan-300'
                    }`}
                  >
                    <Shuffle className="h-4 w-4" /> Random
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 rounded-2xl border border-emerald-500/40 bg-black/40 p-6">
                <h2 className="text-center text-xl font-semibold text-cyan-200">
                  Harmonic Statistics
                </h2>
                <p className="text-center text-xs uppercase tracking-[0.3em] text-emerald-100/60">
                  6-5 RED-BLUE WAVE INTERFERENCE
                </p>
                <div className="space-y-4">
                  <StatBar icon={<Heart className="h-4 w-4 text-red-400" />} label="Vitality" value={stats.vitality} color="#ff0044" />
                  <StatBar icon={<Brain className="h-4 w-4 text-sky-300" />} label="Intelligence" value={stats.intelligence} color="#33bbff" />
                  <StatBar icon={<Shield className="h-4 w-4 text-yellow-300" />} label="Defense" value={stats.defense} color="#ffee66" />
                  <StatBar icon={<Zap className="h-4 w-4 text-fuchsia-300" />} label="Agility" value={stats.agility} color="#ff66ff" />
                </div>
                {isPrimeState && (
                  <div className="rounded-lg border border-fuchsia-400/60 bg-fuchsia-500/10 p-4 text-center">
                    <Star className="mx-auto mb-2 h-6 w-6 text-fuchsia-300" />
                    <p className="text-sm font-semibold text-fuchsia-200">Prime State Active</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/70">
                      Evolution triggers unlocked • Mutation pathways open
                    </p>
                  </div>
                )}
              </div>

              {selectedGate && (
                <div className="space-y-4 rounded-2xl border border-rose-500/40 bg-black/50 p-6">
                  <h3 className="text-lg font-semibold text-rose-300">RED Gate #{selectedGate.id}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Palindrome</p>
                      <p className="text-xl font-bold text-rose-200">{selectedGate.palindrome}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Position</p>
                      <p className="text-lg font-semibold text-emerald-200">{selectedGate.position}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Current Tick</p>
                      <p className="text-lg font-semibold text-emerald-200">
                        {(selectedGate.position + rotation) % 60}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">HeptaCode</p>
                      <p className="font-mono text-base text-cyan-200">
                        {toHeptaCode(Number.parseInt(selectedGate.palindrome, 10))}
                      </p>
                    </div>
                  </div>
                  <p className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-100/80">
                    Gate resonance intensifies when the wheel passes this palindrome while in a prime state,
                    unlocking rare breeding modifiers and defensive harmonics.
                  </p>
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-emerald-500/40 bg-black/50 p-6">
                <h3 className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  RED-60 Sequence
                </h3>
                <div className="rounded-md border border-emerald-500/30 bg-black/60 p-4 font-mono text-sm leading-relaxed">
                  {sequenceDigits.map((entry, index) => (
                    <span
                      key={`${entry.digit}-${index}`}
                      style={{
                        color: entry.color,
                        fontWeight: entry.accent ? 700 : 500,
                        textShadow: entry.accent ? '0 0 10px rgba(255,0,0,0.7)' : 'none',
                      }}
                    >
                      •
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {mode === 'breeding' && (
          <section className="space-y-6 rounded-2xl border border-emerald-500/40 bg-black/40 p-6 overflow-visible">
            <h2 className="text-center text-xl font-semibold text-cyan-200">Harmonic Breeding Laboratory</h2>
            <p className="text-center text-xs uppercase tracking-[0.3em] text-emerald-100/70">
              Compatibility • Prime Attraction • Mutation Detection
            </p>
            <div className="grid gap-6 lg:grid-cols-3 overflow-visible">
              <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-black/40 p-4 overflow-visible">
                <h3 className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  Parent Genome α
                </h3>
                <div className="flex justify-center min-h-[300px] overflow-visible">
                  <GenomeWheel rotation={pet1Rotation} size={280} />
                </div>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={59}
                    value={pet1Rotation}
                    onChange={event => setPet1Rotation(Number.parseInt(event.target.value, 10))}
                    className="h-2 w-full cursor-pointer appearance-none rounded bg-emerald-500/20 accent-emerald-400"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
                    <span>Rotation</span>
                    <span className="text-right text-amber-300">{pet1Rotation}</span>
                    <span>Hepta</span>
                    <span className="text-right font-mono text-cyan-200">{toHeptaCode(pet1Rotation)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-black/40 p-4 overflow-visible">
                <h3 className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  Parent Genome β
                </h3>
                <div className="flex justify-center min-h-[300px] overflow-visible">
                  <GenomeWheel rotation={pet2Rotation} size={280} />
                </div>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={59}
                    value={pet2Rotation}
                    onChange={event => setPet2Rotation(Number.parseInt(event.target.value, 10))}
                    className="h-2 w-full cursor-pointer appearance-none rounded bg-emerald-500/20 accent-emerald-400"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
                    <span>Rotation</span>
                    <span className="text-right text-amber-300">{pet2Rotation}</span>
                    <span>Hepta</span>
                    <span className="text-right font-mono text-cyan-200">{toHeptaCode(pet2Rotation)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-fuchsia-500/40 bg-black/50 p-4 overflow-visible">
                <h3 className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
                  Offspring Genome ω
                </h3>
                <div className="flex justify-center min-h-[300px] overflow-visible">
                  <GenomeWheel rotation={breedingResult.rotation} size={280} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-black/60 p-3 text-xs uppercase tracking-[0.3em] text-emerald-100">
                    <span>Compatibility</span>
                    <span className="text-lg font-bold text-emerald-300">{breedingResult.compatibility}%</span>
                  </div>
                  <div className="rounded-md border border-fuchsia-500/40 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-100/80">
                    Prime attraction pulls toward <span className="font-bold">CCW-{breedingResult.primeInfluence}</span>.
                    {breedingResult.mutation ? (
                      <span className="ml-1 font-semibold uppercase tracking-[0.3em] text-amber-200">
                        Mutation detected!
                      </span>
                    ) : (
                      <span className="ml-1 text-fuchsia-100/70">Genome remains stable.</span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <StatBar icon={<Heart className="h-4 w-4 text-red-400" />} label="Vitality" value={offspringStats.vitality} color="#ff0044" />
                    <StatBar icon={<Brain className="h-4 w-4 text-sky-300" />} label="Intelligence" value={offspringStats.intelligence} color="#33bbff" />
                    <StatBar icon={<Shield className="h-4 w-4 text-yellow-300" />} label="Defense" value={offspringStats.defense} color="#ffee66" />
                    <StatBar icon={<Zap className="h-4 w-4 text-fuchsia-300" />} label="Agility" value={offspringStats.agility} color="#ff66ff" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {mode === 'evolution' && (
          <section className="space-y-8 rounded-2xl border border-emerald-500/40 bg-black/40 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className="text-xl font-semibold text-cyan-200">Evolution Pathway</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/70">
                Prime-triggered Advancement • Six Legendary Stages
              </p>
              <div className="flex items-center gap-4 rounded-md border border-emerald-500/40 bg-black/50 px-5 py-3 text-sm">
                <span className="text-emerald-100/70">Current Rotation</span>
                <span className="text-xl font-bold text-amber-300">{rotation}</span>
                <span className="font-mono text-cyan-200">H7:{toHeptaCode(rotation)}</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {evolutionStages.map((stage, index) => {
                const active = index === currentStageIndex;
                const primeAligned = stage.requiresPrime && isNearPrime(rotation);
                return (
                  <div
                    key={stage.name}
                    className={`relative overflow-hidden rounded-xl border p-5 transition ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/15'
                        : 'border-emerald-500/20 bg-black/50 hover:border-emerald-400/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-200">{stage.name}</h3>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                          Genome Rot {stage.range[0]}–{stage.range[1]}
                        </p>
                      </div>
                      <div className="rounded-md border border-emerald-400/30 bg-black/60 px-3 py-1 text-xs font-semibold text-emerald-200">
                        ROT {stage.displayRotation}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white/70">{stage.description}</p>
                    <p className="mt-3 rounded-md border border-emerald-400/30 bg-black/60 p-3 text-xs text-emerald-100/80">
                      {stage.genomeSnapshot}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.3em] text-emerald-100/70">
                      Trigger: {stage.trigger}
                    </p>
                    {stage.requiresPrime && (
                      <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.3em] ${
                        primeAligned ? 'text-fuchsia-200' : 'text-fuchsia-200/60'
                      }`}>
                        Prime Alignment Required
                      </p>
                    )}
                    {active && (
                      <span className="absolute right-4 top-4 text-xs font-bold uppercase tracking-[0.3em] text-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MetaPetGenomeExplorer;
