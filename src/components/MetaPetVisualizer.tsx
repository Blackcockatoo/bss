'use client';

import { useMemo, useState } from 'react';

type FormName = 'explorer' | 'sleep' | 'study' | 'battle';

type EyeShape = 'round' | 'slit' | 'star';

interface FormConfig {
  readonly name: string;
  readonly baseColor: string;
  readonly accentColor: string;
  readonly secondaryAccent: string;
  readonly eyeColor: string;
  readonly glowColor: string;
  readonly description: string;
}

interface StatSliderProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly color: string;
  readonly icon: string;
}

interface GenomeBarProps {
  readonly label: string;
  readonly value: number;
  readonly color: string;
  readonly hideValue?: boolean;
}

interface FormConditionProps {
  readonly active: boolean;
  readonly label: string;
  readonly condition: string;
  readonly progress: number;
  readonly accentColor: string;
}

interface EyeProps {
  readonly cx: number;
  readonly cy: number;
  readonly shape: EyeShape;
  readonly color: string;
  readonly size?: number;
}

interface TailProps {
  readonly form: FormName;
  readonly splits: number;
  readonly color: string;
  readonly secondaryColor: string;
  readonly curiosity: number;
  readonly energy: number;
}

interface MetaPetSvgProps {
  readonly form: FormName;
  readonly colors: FormConfig;
  readonly red60: number;
  readonly blue60: number;
  readonly black60: number;
  readonly eyeShape: EyeShape;
  readonly tailSplits: number;
  readonly energy: number;
  readonly curiosity: number;
}

interface FormEnvironmentProps {
  readonly form: FormName;
  readonly colors: FormConfig;
  readonly energy: number;
  readonly curiosity: number;
  readonly red60: number;
  readonly blue60: number;
  readonly black60: number;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const forms: Record<FormName, FormConfig> = {
  explorer: {
    name: 'Explorer Form',
    baseColor: '#E8DCC8',
    accentColor: '#4ECDC4',
    secondaryAccent: '#FFB347',
    eyeColor: '#4ECDC4',
    glowColor: 'rgba(78, 205, 196, 0.4)',
    description: 'Default active state - curious and agile',
  },
  sleep: {
    name: 'Sleep / Cocoon Form',
    baseColor: '#2C3E50',
    accentColor: '#B8A5D6',
    secondaryAccent: '#7DD3C0',
    eyeColor: '#B8A5D6',
    glowColor: 'rgba(184, 165, 214, 0.3)',
    description: 'Resting and regenerating',
  },
  study: {
    name: 'Study Buddy Form',
    baseColor: '#FFE5D0',
    accentColor: '#98D8C8',
    secondaryAccent: '#A8D5E2',
    eyeColor: '#98D8C8',
    glowColor: 'rgba(152, 216, 200, 0.4)',
    description: 'Learning mode - focused and attentive',
  },
  battle: {
    name: 'High-Energy / Battle Form',
    baseColor: '#2C3E77',
    accentColor: '#FF006E',
    secondaryAccent: '#00F5FF',
    eyeColor: '#FF006E',
    glowColor: 'rgba(255, 0, 110, 0.5)',
    description: 'Alert and powerful',
  },
};

const MetaPetVisualizer = () => {
  const [energy, setEnergy] = useState(50);
  const [curiosity, setCuriosity] = useState(50);
  const [bond, setBond] = useState(50);
  const [health, setHealth] = useState(80);

  const activeForm = useMemo<FormName>(() => {
    if (energy < 30 && health < 50) return 'sleep';
    if (energy > 70 && curiosity > 60) return 'battle';
    if (bond > 60 && curiosity > 50) return 'study';
    return 'explorer';
  }, [bond, curiosity, energy, health]);

  const red60 = useMemo(
    () => Math.min(100, energy + (100 - health) * 0.3),
    [energy, health],
  );
  const blue60 = useMemo(
    () => Math.min(100, curiosity + bond * 0.4),
    [bond, curiosity],
  );
  const black60 = useMemo(
    () => Math.min(100, energy * 0.4 + bond * 0.6),
    [bond, energy],
  );

  const currentForm = forms[activeForm];

  const eyeShape: EyeShape = useMemo(() => {
    if (activeForm === 'battle') return 'slit';
    if (energy > 70 || curiosity > 80) return 'star';
    return 'round';
  }, [activeForm, curiosity, energy]);

  const tailSplits = useMemo(() => {
    if (activeForm === 'battle') return 3;
    if (activeForm === 'explorer' && curiosity > 50) return 2;
    return 1;
  }, [activeForm, curiosity]);

  const conditionProgress = useMemo(() => {
    const sleepEnergy = clamp((30 - energy) / 30);
    const sleepHealth = clamp((50 - health) / 50);
    const sleep = Math.min(sleepEnergy, sleepHealth);

    const battleEnergy = clamp((energy - 70) / 30);
    const battleCuriosity = clamp((curiosity - 60) / 40);
    const battle = Math.min(battleEnergy, battleCuriosity);

    const studyBond = clamp((bond - 60) / 40);
    const studyCuriosity = clamp((curiosity - 50) / 50);
    const study = Math.min(studyBond, studyCuriosity);

    const explorer = clamp(1 - Math.max(sleep, battle, study));

    return { explorer, sleep, study, battle };
  }, [bond, curiosity, energy, health]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Meta-Pet Form Visualizer
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Living avatar system with genome-driven transformations
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
            <div className="aspect-square bg-gradient-to-br from-gray-700/30 to-gray-800/30 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 blur-3xl animate-pulse"
                style={{
                  background: `radial-gradient(circle at center, ${currentForm.glowColor}, transparent 70%)`,
                }}
              />

              <MetaPetSVG
                form={activeForm}
                colors={currentForm}
                red60={red60}
                blue60={blue60}
                black60={black60}
                eyeShape={eyeShape}
                tailSplits={tailSplits}
                energy={energy}
                curiosity={curiosity}
              />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold" style={{ color: currentForm.accentColor }}>
                {currentForm.name}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{currentForm.description}</p>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {[
                { label: 'Base', color: currentForm.baseColor },
                { label: 'Accent', color: currentForm.accentColor },
                { label: 'Secondary', color: currentForm.secondaryAccent },
                { label: 'Eyes', color: currentForm.eyeColor },
              ].map(({ label, color }) => (
                <div key={label} className="text-center">
                  <div
                    className="h-12 rounded border-2 border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs mt-1 text-gray-400">{label}</p>
                  <p className="text-xs font-mono text-gray-500">{color}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
              <h3 className="text-xl font-bold mb-4">Pet Statistics</h3>
              <div className="space-y-4">
                <StatSlider
                  label="Energy"
                  value={energy}
                  onChange={setEnergy}
                  color="#FF6B6B"
                  icon="⚡"
                />
                <StatSlider
                  label="Curiosity"
                  value={curiosity}
                  onChange={setCuriosity}
                  color="#4ECDC4"
                  icon="🔍"
                />
                <StatSlider
                  label="Bond Level"
                  value={bond}
                  onChange={setBond}
                  color="#FFB347"
                  icon="💝"
                />
                <StatSlider
                  label="Health"
                  value={health}
                  onChange={setHealth}
                  color="#95E1D3"
                  icon="❤️"
                />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
              <h3 className="text-xl font-bold mb-4">Genome Expression</h3>
              <p className="text-sm text-gray-400 mb-4">
                Marking patterns derived from genetic code
              </p>
              <div className="space-y-3">
                <GenomeBar label="Red-60" value={red60} color="#FF4757" hideValue />
                <GenomeBar label="Blue-60" value={blue60} color="#5F9FFF" />
                <GenomeBar label="Black-60" value={black60} color="#A29BFE" />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
              <h3 className="text-xl font-bold mb-4">Form Conditions</h3>
              <div className="space-y-2 text-sm">
                <FormCondition
                  active={activeForm === 'explorer'}
                  label="Explorer"
                  condition="Default active state"
                  progress={conditionProgress.explorer}
                  accentColor={forms.explorer.accentColor}
                />
                <FormCondition
                  active={activeForm === 'sleep'}
                  label="Sleep"
                  condition="Energy &lt; 30 AND Health &lt; 50"
                  progress={conditionProgress.sleep}
                  accentColor={forms.sleep.accentColor}
                />
                <FormCondition
                  active={activeForm === 'study'}
                  label="Study Buddy"
                  condition="Bond &gt; 60 AND Curiosity &gt; 50"
                  progress={conditionProgress.study}
                  accentColor={forms.study.accentColor}
                />
                <FormCondition
                  active={activeForm === 'battle'}
                  label="Battle"
                  condition="Energy &gt; 70 AND Curiosity &gt; 60"
                  progress={conditionProgress.battle}
                  accentColor={forms.battle.accentColor}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatSlider = ({ label, value, onChange, color, icon }: StatSliderProps) => (
  <div>
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium">
        {icon} {label}
      </span>
      <span className="text-sm font-mono" style={{ color }}>
        {value}
      </span>
    </div>
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #374151 ${value}%, #374151 100%)`,
      }}
    />
  </div>
);

const GenomeBar = ({ label, value, color, hideValue }: GenomeBarProps) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm">{label}</span>
      <span className="text-sm font-mono">{hideValue ? '••••' : `${value.toFixed(0)}%`}</span>
    </div>
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full transition-all duration-700 ease-out"
        style={{
          width: `${value}%`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  </div>
);

const FormCondition = ({ active, label, condition, progress, accentColor }: FormConditionProps) => {
  const progressPercent = Math.round(progress * 100);
  const isPrimed = progress >= 0.8 && !active;

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all ${
        active || isPrimed
          ? 'border-cyan-400/80 bg-cyan-400/10 shadow-lg shadow-cyan-500/10'
          : 'border-gray-700 bg-gray-700/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        {active && <span className="text-cyan-400 text-xs">● ACTIVE</span>}
        {!active && isPrimed && <span className="text-cyan-300 text-xs">⚡ READY</span>}
      </div>
      <p className="text-xs text-gray-400 mt-1">{condition}</p>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500">
          <span>Progress</span>
          <span className="font-mono text-gray-300">{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-700/60 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.max(progress * 100, active ? 100 : 4)}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${active ? '#ecfeff' : accentColor})`,
              boxShadow:
                active || isPrimed
                  ? `0 0 12px ${accentColor}55`
                  : `0 0 6px ${accentColor}22`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const FormEnvironment = ({
  form,
  colors,
  energy,
  curiosity,
  red60,
  blue60,
  black60,
}: FormEnvironmentProps) => {
  const baseOpacity = 0.35 + red60 / 400;
  const energyFactor = 0.6 + energy / 160;
  const curiosityFactor = 0.7 + curiosity / 150;
  const intensePulse = `${Math.max(2.5, 6 - energy / 20).toFixed(1)}s`;
  const gentleDrift = `${Math.max(4.5, 14 - curiosity / 8).toFixed(1)}s`;

  if (form === 'explorer') {
    return (
      <g opacity={baseOpacity}>
        <circle cx={150} cy={150} r={110} stroke={`${colors.accentColor}33`} strokeWidth={1} fill="none">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 150 150"
            to="360 150 150"
            dur={`${(18 / curiosityFactor).toFixed(1)}s`}
            repeatCount="indefinite"
          />
        </circle>
        <circle cx={150} cy={150} r={80} stroke={`${colors.secondaryAccent}33`} strokeWidth={1} fill="none">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 150 150"
            to="0 150 150"
            dur={`${(16 / curiosityFactor).toFixed(1)}s`}
            repeatCount="indefinite"
          />
        </circle>
        {[0, 120, 240].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 150 150)`}>
            <circle cx={150} cy={40} r={6} fill={`${colors.accentColor}55`}>
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur={gentleDrift} repeatCount="indefinite" />
            </circle>
            <path
              d="M 150 52 Q 152 70 150 88"
              stroke={`${colors.accentColor}66`}
              strokeWidth={1.5}
              strokeDasharray="3 4"
              fill="none"
            >
              <animate attributeName="stroke-dashoffset" values="0;10" dur={`${(9 / curiosityFactor).toFixed(1)}s`} repeatCount="indefinite" />
            </path>
          </g>
        ))}
      </g>
    );
  }

  if (form === 'sleep') {
    return (
      <g opacity={0.4 + black60 / 500}>
        <path
          d="M 40 210 Q 90 180 140 210 T 240 210"
          stroke="none"
          fill={`${colors.accentColor}26`}
        >
          <animate
            attributeName="d"
            values="M 40 210 Q 90 180 140 210 T 240 210;M 40 212 Q 92 186 142 208 T 242 212;M 40 210 Q 90 180 140 210 T 240 210"
            dur={gentleDrift}
            repeatCount="indefinite"
          />
        </path>
        <ellipse cx={210} cy={90} rx={38} ry={18} fill={`${colors.secondaryAccent}20`}>
          <animate attributeName="cx" values="210;200;210" dur={`${(10 / energyFactor).toFixed(1)}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.45;0.2" dur={intensePulse} repeatCount="indefinite" />
        </ellipse>
        <path
          d="M 70 80 Q 110 60 150 80"
          stroke={`${colors.secondaryAccent}40`}
          strokeWidth={2}
          fill="none"
        >
          <animate attributeName="stroke-dashoffset" values="0;30" dur={`${(20 / energyFactor).toFixed(1)}s`} repeatCount="indefinite" />
        </path>
      </g>
    );
  }

  if (form === 'study') {
    return (
      <g opacity={0.36 + blue60 / 300}>
        <rect x={60} y={60} width={180} height={180} rx={24} ry={24} fill="none" stroke={`${colors.accentColor}33`} strokeWidth={1}>
          <animate attributeName="stroke-dashoffset" values="0;24" dur={`${(12 / curiosityFactor).toFixed(1)}s`} repeatCount="indefinite" />
        </rect>
        {[0, 1, 2].map((index) => (
          <text
            key={index}
            x={150}
            y={90 + index * 36}
            textAnchor="middle"
            fontSize={14}
            fill={`${colors.secondaryAccent}88`}
            className="font-mono"
            opacity={0.4 + index * 0.1}
          >
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${(8 + index * 2 / curiosityFactor).toFixed(1)}s`} repeatCount="indefinite" />
            {['∑', 'ψ', 'λ'][index]}
          </text>
        ))}
        <g stroke={`${colors.accentColor}44`} strokeWidth={0.8}>
          {[0, 40, 80].map((offset) => (
            <line key={offset} x1={60} y1={120 + offset} x2={240} y2={120 + offset} strokeDasharray="2 6">
              <animate attributeName="stroke-dashoffset" values="0;30" dur={`${(15 / curiosityFactor).toFixed(1)}s`} repeatCount="indefinite" />
            </line>
          ))}
        </g>
      </g>
    );
  }

  if (form === 'battle') {
    return (
      <g opacity={0.45 + energy / 220}>
        <path
          d="M 40 150 Q 100 60 150 150 T 260 150"
          stroke={`${colors.accentColor}66`}
          strokeWidth={2}
          strokeDasharray="6 10"
          fill="none"
        >
          <animate attributeName="stroke-dashoffset" values="0;80" dur={`${(7 / energyFactor).toFixed(1)}s`} repeatCount="indefinite" />
        </path>
        {[120, 180].map((x, index) => (
          <polyline
            key={x}
            points={`${x - 35},210 ${x},120 ${x + 35},210`}
            stroke={index % 2 === 0 ? `${colors.secondaryAccent}AA` : `${colors.accentColor}AA`}
            strokeWidth={2.2}
            fill="none"
            filter="url(#glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;40"
              dur={`${(4.5 / energyFactor).toFixed(1)}s`}
              repeatCount="indefinite"
            />
            <animate attributeName="opacity" values="0.5;1;0.5" dur={`${(5 / energyFactor).toFixed(1)}s`} repeatCount="indefinite" />
          </polyline>
        ))}
        <circle cx={150} cy={150} r={46} stroke={`${colors.accentColor}55`} strokeWidth={1.5} fill="none">
          <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="-360 150 150" dur={`${(6 / energyFactor).toFixed(1)}s`} repeatCount="indefinite" />
        </circle>
      </g>
    );
  }

  return null;
};

const MetaPetSVG = ({
  form,
  colors,
  red60,
  blue60,
  black60,
  eyeShape,
  tailSplits,
  energy,
  curiosity,
}: MetaPetSvgProps) => {
  const isAsleep = form === 'sleep';
  const isBattle = form === 'battle';
  const isStudy = form === 'study';

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full max-w-md">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="red60Grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FF4757', stopOpacity: red60 / 100 }} />
          <stop offset="100%" style={{ stopColor: '#FF4757', stopOpacity: 0 }} />
        </linearGradient>

        <radialGradient id="blue60Grad">
          <stop offset="0%" style={{ stopColor: '#5F9FFF', stopOpacity: blue60 / 100 }} />
          <stop offset="100%" style={{ stopColor: '#5F9FFF', stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      <FormEnvironment
        form={form}
        colors={colors}
        energy={energy}
        curiosity={curiosity}
        red60={red60}
        blue60={blue60}
        black60={black60}
      />

      <g className={isAsleep ? 'animate-pulse' : ''}>
        <ellipse
          cx={150}
          cy={isAsleep ? 160 : 150}
          rx={isAsleep ? 50 : isBattle ? 45 : 55}
          ry={isAsleep ? 60 : isBattle ? 50 : 60}
          fill={colors.baseColor}
          className="transition-all duration-1000"
        />

        <ellipse
          cx={150}
          cy={isAsleep ? 160 : 150}
          rx={isAsleep ? 50 : isBattle ? 45 : 55}
          ry={isAsleep ? 60 : isBattle ? 50 : 60}
          fill={colors.glowColor}
          filter="url(#glow)"
          className="animate-pulse"
        />

        {!isAsleep && (
          <ellipse
            cx={150}
            cy={isStudy ? 110 : 105}
            rx={isStudy ? 42 : 40}
            ry={isStudy ? 45 : 42}
            fill={colors.baseColor}
            className="transition-all duration-1000"
          />
        )}

        <path
          d={
            isAsleep
              ? 'M 150 120 Q 150 140 150 160 Q 150 180 150 200'
              : 'M 150 80 Q 150 100 150 120 Q 150 140 150 160 Q 150 180 150 190'
          }
          stroke="url(#red60Grad)"
          strokeWidth={3}
          fill="none"
          strokeDasharray="5,5"
          className="transition-all duration-1000"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="10" dur="2s" repeatCount="indefinite" />
        </path>

        {!isAsleep && (
          <>
            <path
              d="M 110 150 Q 150 110 190 150 Q 150 200 110 150"
              fill="url(#red60Grad)"
              opacity={Math.min(0.55, red60 / 110)}
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                dur={`${Math.max(4, 12 - red60 / 15).toFixed(1)}s`}
                repeatCount="indefinite"
                additive="sum"
                values="-3 150 150;3 150 150;-3 150 150"
              />
            </path>
            <ellipse
              cx={150}
              cy={isStudy ? 118 : 122}
              rx={isBattle ? 38 : 45}
              ry={isBattle ? 24 : 28}
              fill="none"
              stroke="url(#blue60Grad)"
              strokeWidth={2}
              opacity={Math.min(0.7, blue60 / 90)}
            >
              <animate attributeName="stroke-dashoffset" values="0;30" dur={`${Math.max(3.8, 11 - blue60 / 12).toFixed(1)}s`} repeatCount="indefinite" />
            </ellipse>
            <circle
              cx={isBattle ? 150 : 140 + curiosity / 12}
              cy={isStudy ? 128 : 132}
              r={isStudy ? 10 : 8}
              fill="url(#blue60Grad)"
              opacity={Math.min(0.6, blue60 / 100)}
            >
              <animate attributeName="r" values={`${isStudy ? 9 : 7};${isStudy ? 12 : 9};${isStudy ? 9 : 7}`} dur={`${Math.max(3, 9 - blue60 / 18).toFixed(1)}s`} repeatCount="indefinite" />
            </circle>
          </>
        )}

        {!isAsleep && (
          <>
            <circle cx={130} cy={100} r={3} fill={colors.accentColor} opacity={blue60 / 150}>
              <animate
                attributeName="opacity"
                values={`${blue60 / 150};${blue60 / 100};${blue60 / 150}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={170} cy={100} r={3} fill={colors.accentColor} opacity={blue60 / 150}>
              <animate
                attributeName="opacity"
                values={`${blue60 / 150};${blue60 / 100};${blue60 / 150}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <path d="M 130 100 L 140 95" stroke={colors.accentColor} strokeWidth={1} opacity={blue60 / 150} />
            <path d="M 170 100 L 160 95" stroke={colors.accentColor} strokeWidth={1} opacity={blue60 / 150} />
          </>
        )}

        {!isAsleep && (
          <>
            <ellipse
              cx={isBattle ? 115 : 120}
              cy={isBattle ? 80 : 85}
              rx={15}
              ry={35}
              fill={colors.baseColor}
              opacity={0.8}
              transform={isBattle ? 'rotate(-30 115 80)' : 'rotate(-20 120 85)'}
              className="transition-all duration-1000"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={
                  isBattle ? '-30 115 80;-25 115 80;-30 115 80' : '-20 120 85;-15 120 85;-20 120 85'
                }
                dur="4s"
                repeatCount="indefinite"
              />
            </ellipse>
            <ellipse
              cx={isBattle ? 185 : 180}
              cy={isBattle ? 80 : 85}
              rx={15}
              ry={35}
              fill={colors.baseColor}
              opacity={0.8}
              transform={isBattle ? 'rotate(30 185 80)' : 'rotate(20 180 85)'}
              className="transition-all duration-1000"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={
                  isBattle ? '30 185 80;25 185 80;30 185 80' : '20 180 85;15 180 85;20 180 85'
                }
                dur="4s"
                repeatCount="indefinite"
              />
            </ellipse>
            <ellipse cx={120} cy={65} rx={8} ry={12} fill={colors.accentColor} opacity={0.6} filter="url(#glow)">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx={180} cy={65} rx={8} ry={12} fill={colors.accentColor} opacity={0.6} filter="url(#glow)">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
            </ellipse>
          </>
        )}

        {!isAsleep ? (
          <>
            <Eye cx={135} cy={110} shape={eyeShape} color={colors.eyeColor} size={isStudy ? 14 : 12} />
            <Eye cx={165} cy={110} shape={eyeShape} color={colors.eyeColor} size={isStudy ? 14 : 12} />
          </>
        ) : (
          <>
            <path d="M 130 160 Q 135 165 140 160" stroke={colors.accentColor} strokeWidth={2} fill="none" />
            <path d="M 160 160 Q 165 165 170 160" stroke={colors.accentColor} strokeWidth={2} fill="none" />
          </>
        )}

        {isStudy && (
          <g>
            <path d="M 150 135 L 145 145 L 150 148 L 155 145 Z" fill={colors.accentColor} opacity={0.7}>
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
            </path>
            <text x={150} y={125} fontSize={12} fill={colors.accentColor} textAnchor="middle" opacity={0.5}>
              <animate attributeName="opacity" values="0;0.7;0" dur="3s" repeatCount="indefinite" />
              ?
            </text>
          </g>
        )}

        {!isAsleep && (
          <>
            <ellipse cx={130} cy={190} rx={12} ry={15} fill={colors.baseColor} />
            <ellipse cx={170} cy={190} rx={12} ry={15} fill={colors.baseColor} />
            <circle cx={130} cy={195} r={4} fill={colors.secondaryAccent} opacity={0.6} />
            <circle cx={170} cy={195} r={4} fill={colors.secondaryAccent} opacity={0.6} />
          </>
        )}

        <Tail
          form={form}
          splits={tailSplits}
          color={colors.accentColor}
          secondaryColor={colors.secondaryAccent}
          energy={energy}
          curiosity={curiosity}
        />

        {black60 > 60 && !isAsleep && (
          <>
            <path d="M 135 150 Q 150 155 165 150" stroke="#A29BFE" strokeWidth={2} fill="none" opacity={black60 / 150}>
              <animate
                attributeName="opacity"
                values={`${black60 / 200};${black60 / 120};${black60 / 200}`}
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            <circle cx={150} cy={90} r={8} fill="#A29BFE" opacity={black60 / 200} filter="url(#glow)" />
          </>
        )}
      </g>
    </svg>
  );
};

const Eye = ({ cx, cy, shape, color, size = 12 }: EyeProps) => {
  if (shape === 'star') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={size} fill="white" />
        <path
          d={`M ${cx} ${cy - 6} L ${cx + 2} ${cy - 2} L ${cx + 6} ${cy} L ${cx + 2} ${cy + 2} L ${cx} ${cy + 6} L ${cx - 2} ${cy + 2} L ${cx - 6} ${cy} L ${cx - 2} ${cy - 2} Z`}
          fill={color}
          filter="url(#glow)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    );
  }

  if (shape === 'slit') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={size} fill={color} opacity={0.3} />
        <ellipse cx={cx} cy={cy} rx={2} ry={size - 2} fill={color} filter="url(#glow)" />
      </g>
    );
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={size} fill="white" />
      <circle cx={cx} cy={cy} r={size - 4} fill={color} filter="url(#glow)">
        <animate attributeName="r" values={`${size - 4};${size - 3};${size - 4}`} dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};

const Tail = ({ form, splits, color, secondaryColor, curiosity, energy }: TailProps) => {
  const isAsleep = form === 'sleep';
  const isBattle = form === 'battle';
  const energyFactor = Math.max(0.5, Math.min(1.5, energy / 50));
  const gentleDuration = `${(2.5 / energyFactor).toFixed(2)}s`;
  const livelyDuration = `${(1.8 / energyFactor).toFixed(2)}s`;
  const fierceDuration = `${(1.2 / energyFactor).toFixed(2)}s`;

  if (isAsleep) {
    return (
      <g>
        <path
          d="M 150 200 Q 200 200 210 160 Q 210 140 200 120 Q 180 110 150 120"
          stroke={color}
          strokeWidth={8}
          fill="none"
          opacity={0.6}
        />
        <text x={180} y={150} fontSize={10} fill={color} opacity={0.4}>
          <animate attributeName="opacity" values="0;0.6;0" dur="5s" repeatCount="indefinite" />
          ψ
        </text>
      </g>
    );
  }

  if (isBattle && splits === 3) {
    return (
      <g>
        <path d="M 150 190 Q 140 220 130 250" stroke={color} strokeWidth={4} fill="none" filter="url(#glow)">
          <animate
            attributeName="d"
            values="M 150 190 Q 140 220 130 250;M 150 190 Q 135 220 125 250;M 150 190 Q 140 220 130 250"
            dur={fierceDuration}
            repeatCount="indefinite"
          />
        </path>
        <path d="M 150 190 Q 150 230 150 260" stroke={secondaryColor} strokeWidth={4} fill="none" filter="url(#glow)">
          <animate
            attributeName="d"
            values="M 150 190 Q 150 230 150 260;M 150 190 Q 148 230 150 260;M 150 190 Q 150 230 150 260"
            dur={livelyDuration}
            repeatCount="indefinite"
          />
        </path>
        <path d="M 150 190 Q 160 220 170 250" stroke={color} strokeWidth={4} fill="none" filter="url(#glow)">
          <animate
            attributeName="d"
            values="M 150 190 Q 160 220 170 250;M 150 190 Q 165 220 175 250;M 150 190 Q 160 220 170 250"
            dur={fierceDuration}
            repeatCount="indefinite"
          />
        </path>
        <circle cx={130} cy={250} r={4} fill={color} opacity={0.8}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur={livelyDuration} repeatCount="indefinite" />
        </circle>
        <circle cx={150} cy={260} r={4} fill={secondaryColor} opacity={0.8}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur={livelyDuration} repeatCount="indefinite" />
        </circle>
        <circle cx={170} cy={250} r={4} fill={color} opacity={0.8}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur={livelyDuration} repeatCount="indefinite" />
        </circle>
      </g>
    );
  }

  if (splits === 2) {
    return (
      <g>
        <path d="M 150 190 Q 150 210 150 230" stroke={color} strokeWidth={6} fill="none" />
        <path d="M 150 230 Q 140 240 135 255" stroke={color} strokeWidth={4} fill="none" filter="url(#glow)">
          <animate
            attributeName="d"
            values="M 150 230 Q 140 240 135 255;M 150 230 Q 138 240 133 255;M 150 230 Q 140 240 135 255"
            dur={livelyDuration}
            repeatCount="indefinite"
          />
        </path>
        <path d="M 150 230 Q 160 240 165 255" stroke={color} strokeWidth={4} fill="none" filter="url(#glow)">
          <animate
            attributeName="d"
            values="M 150 230 Q 160 240 165 255;M 150 230 Q 162 240 167 255;M 150 230 Q 160 240 165 255"
            dur={livelyDuration}
            repeatCount="indefinite"
          />
        </path>
        <circle cx={135} cy={255} r={5} fill={secondaryColor} opacity={curiosity / 100} filter="url(#glow)">
          <animate
            attributeName="opacity"
            values={`${curiosity / 150};${curiosity / 80};${curiosity / 150}`}
            dur={livelyDuration}
            repeatCount="indefinite"
          />
        </circle>
        <circle cx={165} cy={255} r={5} fill={secondaryColor} opacity={curiosity / 100} filter="url(#glow)">
          <animate
            attributeName="opacity"
            values={`${curiosity / 150};${curiosity / 80};${curiosity / 150}`}
            dur={livelyDuration}
            repeatCount="indefinite"
          />
        </circle>
      </g>
    );
  }

  return (
    <g>
      <path
        d="M 150 190 Q 160 220 165 250"
        stroke={color}
        strokeWidth={6}
        fill="none"
        filter="url(#glow)"
      >
        <animate
          attributeName="d"
          values="M 150 190 Q 160 220 165 250;M 150 190 Q 155 220 160 250;M 150 190 Q 160 220 165 250"
          dur={gentleDuration}
          repeatCount="indefinite"
        />
      </path>
      <circle cx={165} cy={250} r={6} fill={secondaryColor} opacity={0.8} filter="url(#glow)">
        <animate attributeName="r" values="6;8;6" dur={livelyDuration} repeatCount="indefinite" />
      </circle>
    </g>
  );
};

export default MetaPetVisualizer;
