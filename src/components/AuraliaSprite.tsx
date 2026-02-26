"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { generateSigilPoints, type GuardianSigilPoint } from '../../shared/auralia/guardianBehavior';

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

type AuraliaSpriteProps = {
  seed?: number;
  energy?: number;
  curiosity?: number;
  bond?: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  staticMode?: boolean;
  className?: string;
};

const AuraliaSprite: React.FC<AuraliaSpriteProps> = ({
  seed = 12345,
  energy = 60,
  curiosity = 50,
  bond = 50,
  size = 'medium',
  interactive = true,
  staticMode = false,
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    small: { container: 'w-24 h-24', viewBox: 100, eyeScale: 0.5 },
    medium: { container: 'w-40 h-40', viewBox: 160, eyeScale: 0.8 },
    large: { container: 'w-56 h-56', viewBox: 220, eyeScale: 1 },
  }[size];

  const center = sizeConfig.viewBox / 2;
  const sigilPoints = useMemo(() => generateSigilPoints(seed, 7, sizeConfig.viewBox, sizeConfig.viewBox), [seed, sizeConfig.viewBox]);

  // Animation states
  const [breathPhase, setBreathPhase] = useState(0);
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hovered, setHovered] = useState(false);
  const [aiMode, setAiMode] = useState<'idle' | 'curious' | 'happy'>('idle');
  const svgRef = useRef<SVGSVGElement>(null);

  // PRNG for consistent randomness
  const prng = useMemo(() => {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }, [seed]);

  // Color theme based on stats
  const colors = useMemo(() => {
    const baseHue = (seed % 60) * 6;
    const saturation = 60 + (bond / 100) * 30;
    const lightness = 40 + (energy / 100) * 20;

    return {
      primary: `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
      secondary: `hsl(${(baseHue + 30) % 360}, ${saturation}%, ${lightness + 10}%)`,
      accent: `hsl(${(baseHue + 180) % 360}, ${saturation - 10}%, ${lightness + 20}%)`,
      glow: `hsla(${baseHue}, ${saturation}%, ${lightness + 30}%, 0.4)`,
      eye: energy > 70 ? '#FFD700' : bond > 70 ? '#FF69B4' : '#4ECDC4',
    };
  }, [seed, energy, bond]);

  // Breathing animation
  useEffect(() => {
    if (staticMode) return;
    let animationFrame: number;
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setBreathPhase(prev => (prev + dt * (0.8 + energy / 200)) % (Math.PI * 2));
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [energy, staticMode]);

  // Eye movement - follows curiosity
  useEffect(() => {
    if (staticMode || !interactive || hovered) return;

    const moveEyes = () => {
      if (aiMode === 'curious') {
        // Look around curiously
        const angle = Date.now() / 1000 * 0.5;
        setEyePos({
          x: Math.cos(angle) * 2 * (curiosity / 50),
          y: Math.sin(angle) * 1.5 * (curiosity / 50),
        });
      } else if (aiMode === 'happy') {
        // Slight upward look when happy
        setEyePos({ x: 0, y: -1 });
      } else {
        // Gentle drift
        setEyePos({
          x: Math.sin(Date.now() / 2000) * 0.5,
          y: Math.cos(Date.now() / 3000) * 0.3,
        });
      }
    };

    const interval = setInterval(moveEyes, 50);
    return () => clearInterval(interval);
  }, [interactive, aiMode, curiosity, hovered, staticMode]);

  // Blinking
  useEffect(() => {
    if (staticMode) return;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    };

    const interval = setInterval(() => {
      if (Math.random() < 0.3) blink();
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [staticMode]);

  // AI mode cycling
  useEffect(() => {
    if (staticMode) return;
    const cycle = () => {
      const roll = Math.random();
      if (roll < 0.3 && curiosity > 50) {
        setAiMode('curious');
      } else if (roll < 0.5 && bond > 60) {
        setAiMode('happy');
      } else {
        setAiMode('idle');
      }
    };

    const interval = setInterval(cycle, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [curiosity, bond, staticMode]);

  // Particle system
  useEffect(() => {
    if (staticMode) return;
    let animationFrame: number;

    const updateParticles = () => {
      setParticles(prev => {
        // Update existing particles
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy - 0.02, // Float upward
            life: p.life - 0.015,
          }))
          .filter(p => p.life > 0);

        // Spawn new particles based on energy
        if (Math.random() < (energy / 500) && updated.length < 15) {
          const angle = prng() * Math.PI * 2;
          const radius = 15 + prng() * 10;
          updated.push({
            id: Date.now() + Math.random(),
            x: center + Math.cos(angle) * radius,
            y: center + Math.sin(angle) * radius,
            vx: (prng() - 0.5) * 0.3,
            vy: (prng() - 0.5) * 0.3 - 0.2,
            life: 0.8 + prng() * 0.4,
            color: prng() > 0.5 ? colors.accent : colors.secondary,
            size: 1 + prng() * 2,
          });
        }

        return updated;
      });

      animationFrame = requestAnimationFrame(updateParticles);
    };

    animationFrame = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animationFrame);
  }, [energy, center, colors, prng, staticMode]);

  // Mouse/Touch tracking for interactive mode
  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (staticMode || !interactive || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * sizeConfig.viewBox;
      const y = ((clientY - rect.top) / rect.height) * sizeConfig.viewBox;

      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 3;

      setEyePos({
        x: (dx / Math.max(dist, 1)) * Math.min(dist / 20, maxDist),
        y: (dy / Math.max(dist, 1)) * Math.min(dist / 20, maxDist),
      });
    },
    [interactive, staticMode, svgRef, sizeConfig.viewBox, center]
  );

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Breath scale
  const breathScale = 1 + Math.sin(breathPhase) * 0.03;
  const breathOffsetY = Math.sin(breathPhase) * 1.5;

  // Eye rendering
  const renderEye = (cx: number, cy: number, isLeft: boolean) => {
    const scale = sizeConfig.eyeScale;
    const eyeWidth = 8 * scale;
    const eyeHeight = isBlinking ? 1 : (6 + (aiMode === 'happy' ? -2 : 0)) * scale;
    const pupilSize = (3 + (aiMode === 'curious' ? 1 : 0)) * scale;

    return (
      <g key={isLeft ? 'left-eye' : 'right-eye'}>
        {/* Eye white/glow */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={eyeWidth}
          ry={eyeHeight}
          fill={colors.glow}
          filter="url(#eyeGlow)"
        />
        {/* Eye shape */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={eyeWidth}
          ry={eyeHeight}
          fill="rgba(0,0,0,0.8)"
          stroke={colors.eye}
          strokeWidth={0.5}
        />
        {/* Pupil */}
        {!isBlinking && (
          <>
            <circle
              cx={cx + eyePos.x}
              cy={cy + eyePos.y}
              r={pupilSize}
              fill={colors.eye}
              filter="url(#pupilGlow)"
            />
            {/* Highlight */}
            <circle
              cx={cx + eyePos.x - pupilSize * 0.3}
              cy={cy + eyePos.y - pupilSize * 0.3}
              r={pupilSize * 0.3}
              fill="white"
              opacity={0.8}
            />
          </>
        )}
      </g>
    );
  };

  return (
    <div
      className={`flex items-center justify-center p-2 ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setEyePos({ x: 0, y: 0 });
      }}
    >
      <div className={`${sizeConfig.container} rounded-xl bg-slate-900/40 border border-slate-700/50 flex items-center justify-center overflow-hidden relative`}>
        {/* Ambient glow */}
        <div
          className="absolute inset-0 opacity-30 blur-xl transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at center, ${colors.glow}, transparent 70%)`,
            opacity: hovered ? 0.5 : 0.3,
          }}
        />

        <svg
          ref={svgRef}
          viewBox={`0 0 ${sizeConfig.viewBox} ${sizeConfig.viewBox}`}
          className="w-full h-full relative z-10 touch-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="eyeGlow">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <filter id="pupilGlow">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.8" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.9" />
            </radialGradient>
          </defs>

          {/* Particles */}
          {particles.map(p => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={p.color}
              opacity={p.life * 0.6}
              filter="url(#glow)"
            />
          ))}

          {/* Sigil lines connecting points */}
          <g opacity={0.25 + (bond / 200)}>
            <path
              d={sigilPoints.reduce((d, p, i) => d + `${i ? ' L' : 'M'} ${p.x} ${p.y}`, '') + ' Z'}
              fill="none"
              stroke={colors.accent}
              strokeWidth={0.5}
              filter="url(#glow)"
            />
          </g>

          {/* Sigil points */}
          {sigilPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={1.5 + (p.intensity || 0.5) * 1}
              fill={colors.accent}
              opacity={0.4 + (p.intensity || 0.5) * 0.3}
            />
          ))}

          {/* Main body group with breathing */}
          <g
            transform={`translate(${center}, ${center + breathOffsetY}) scale(${breathScale})`}
            style={{ transformOrigin: `${center}px ${center}px` }}
          >
            {/* Outer aura ring */}
            <circle
              cx={0}
              cy={0}
              r={30 * sizeConfig.eyeScale}
              fill="none"
              stroke={colors.glow}
              strokeWidth={1}
              opacity={0.3 + Math.sin(breathPhase * 2) * 0.1}
            />

            {/* Body - larger ellipse */}
            <ellipse
              cx={0}
              cy={8 * sizeConfig.eyeScale}
              rx={20 * sizeConfig.eyeScale}
              ry={25 * sizeConfig.eyeScale}
              fill="url(#bodyGradient)"
              filter="url(#glow)"
            />

            {/* Head */}
            <ellipse
              cx={0}
              cy={-12 * sizeConfig.eyeScale}
              rx={15 * sizeConfig.eyeScale}
              ry={14 * sizeConfig.eyeScale}
              fill="url(#bodyGradient)"
              filter="url(#glow)"
            />

            {/* Eyes */}
            {renderEye(-6 * sizeConfig.eyeScale, -12 * sizeConfig.eyeScale, true)}
            {renderEye(6 * sizeConfig.eyeScale, -12 * sizeConfig.eyeScale, false)}

            {/* Mouth - changes based on mood */}
            {aiMode === 'happy' ? (
              <path
                d={`M ${-4 * sizeConfig.eyeScale} ${-4 * sizeConfig.eyeScale} Q 0 ${-1 * sizeConfig.eyeScale} ${4 * sizeConfig.eyeScale} ${-4 * sizeConfig.eyeScale}`}
                fill="none"
                stroke={colors.eye}
                strokeWidth={1}
                opacity={0.7}
              />
            ) : (
              <ellipse
                cx={0}
                cy={-5 * sizeConfig.eyeScale}
                rx={2 * sizeConfig.eyeScale}
                ry={1 * sizeConfig.eyeScale}
                fill={colors.primary}
                opacity={0.5}
              />
            )}

            {/* Curious indicator - antenna/sparkle */}
            {aiMode === 'curious' && (
              <g>
                <circle
                  cx={0}
                  cy={-28 * sizeConfig.eyeScale}
                  r={2 * sizeConfig.eyeScale}
                  fill={colors.accent}
                  filter="url(#strongGlow)"
                >
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
                </circle>
                <line
                  x1={0}
                  y1={-26 * sizeConfig.eyeScale}
                  x2={0}
                  y2={-22 * sizeConfig.eyeScale}
                  stroke={colors.accent}
                  strokeWidth={1}
                  opacity={0.5}
                />
              </g>
            )}
          </g>

          {/* Interactive hover effect */}
          {hovered && (
            <circle
              cx={center}
              cy={center}
              r={35 * sizeConfig.eyeScale}
              fill="none"
              stroke={colors.accent}
              strokeWidth={0.5}
              opacity={0.3}
              strokeDasharray="4 4"
            >
              <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
      </div>
    </div>
  );
};

export default AuraliaSprite;
