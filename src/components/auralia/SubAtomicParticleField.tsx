import React, { useMemo } from 'react';

interface SubAtomicParticleFieldProps {
  // Accept both old API (vitals) and new API (consciousness params)
  energy?: number;
  curiosity?: number;
  bond?: number;
  // New consciousness-driven API
  particleCount?: number;
  particleSpeed?: number;
  particleSize?: number;
  colorIntensity?: number;
  flowPattern?: 'chaotic' | 'flowing' | 'pulsing' | 'spiral' | 'calm';
  // Common props
  size?: number;
  color?: string;
  reduceMotion?: boolean;
  isVisible?: boolean;
}

interface Particle {
  id: number;
  orbit: number;
  size: number;
  duration: number;
  delay: number;
  twinkle: number;
  twinkleDelay: number;
  opacity: number;
}

/**
 * Sub-Atomic Particle Field (Upgrade 4)
 * Web adaptation of the particle halo that responds to vitals.
 */
export function SubAtomicParticleField({
  energy,
  curiosity,
  bond,
  particleCount: consciousParticleCount,
  particleSpeed: consciousParticleSpeed,
  particleSize: consciousParticleSize,
  colorIntensity: consciousColorIntensity,
  flowPattern,
  size = 400,
  color = '#22d3ee',
  reduceMotion = false,
  isVisible = true,
}: SubAtomicParticleFieldProps) {
  // Detect device capability for performance scaling
  const isLowEndDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return (navigator.hardwareConcurrency || 4) < 4;
  }, []);

  const particles = useMemo<Particle[]>(() => {
    // Use consciousness params if provided, otherwise fall back to vitals-based calculation
    let baseCount = consciousParticleCount ?? Math.max(12, Math.round(10 + (energy ?? 50) / 3));

    // Reduce particle count by 40% on low-end devices
    if (isLowEndDevice) {
      baseCount = Math.floor(baseCount * 0.6);
    }

    const count = baseCount;
    const speedMod = consciousParticleSpeed ?? (1 - (energy ?? 50) / 350);
    const sizeBaseMod = consciousParticleSize ?? (1 + (energy ?? 50) / 120);
    const intensityMod = consciousColorIntensity ?? 0.7;

    const bondInfluence = 1 + (bond ?? 50) / 150;
    const curiosityVariance = Math.max(0.8, 1.4 - (curiosity ?? 50) / 120);

    return Array.from({ length: count }, (_, index) => {
      const orbitBase = 70 + (index * 6) % 80;
      const energyVal = energy ?? 50;
      const bondVal = bond ?? 50;

      // Flow pattern influences orbit behavior
      let orbitJitter = (Math.sin(index * 1.7 + energyVal / 15) + 1) * 12;
      if (flowPattern === 'chaotic') {
        orbitJitter *= 2.5;
      } else if (flowPattern === 'calm') {
        orbitJitter *= 0.3;
      } else if (flowPattern === 'spiral') {
        orbitJitter = index * 3; // Expanding spiral
      }

      const orbit = orbitBase + orbitJitter;

      const sizePulse = sizeBaseMod * (1 + Math.sin(index * 0.9));

      // Speed based on consciousness or vitals
      let baseDuration = Math.max(2.5, 6 - energyVal / 35 + (index % 5) * 0.2);
      if (flowPattern === 'pulsing') {
        baseDuration *= 0.7; // Faster pulsing
      } else if (flowPattern === 'calm') {
        baseDuration *= 1.5; // Slower, calmer
      }
      const duration = baseDuration * (1 / (speedMod + 0.1));

      const delay = (index * 0.35 + bondVal / 90) % duration;

      return {
        id: index,
        orbit,
        size: 1.4 + sizePulse,
        duration: duration * curiosityVariance,
        delay,
        twinkle: 1.2 + (index % 4) * 0.3,
        twinkleDelay: (index * 0.15) % 2,
        opacity: (0.35 + (bondInfluence * (index % 7)) / 25) * intensityMod,
      };
    });
  }, [bond, curiosity, energy, consciousParticleCount, consciousParticleSpeed, consciousParticleSize, consciousColorIntensity, flowPattern, isLowEndDevice]);

  // Skip rendering if not visible and reduce motion is on
  if (!isVisible && reduceMotion) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${size} ${size}`}
      role="presentation"
    >
      <style>{`
        @keyframes particle-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes particle-twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
      `}</style>

      {particles.map((particle) => (
        <g
          key={particle.id}
          className="particle-orbit"
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
            animationName: reduceMotion ? 'none' : 'particle-orbit',
            animationDuration: reduceMotion ? '0s' : `${particle.duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: reduceMotion ? '0s' : `-${particle.delay}s`,
            animationPlayState: isVisible ? 'running' : 'paused',
            willChange: reduceMotion ? 'auto' : 'transform',
          }}
        >
          <circle
            cx={size / 2 + particle.orbit}
            cy={size / 2}
            r={particle.size}
            fill={color}
            opacity={particle.opacity}
            className="particle-twinkle"
            style={{
              animationName: reduceMotion ? 'none' : 'particle-twinkle',
              animationDuration: reduceMotion ? '0s' : `${particle.twinkle}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: reduceMotion ? '0s' : `${particle.twinkleDelay}s`,
              animationPlayState: isVisible ? 'running' : 'paused',
              filter: reduceMotion ? 'none' : 'blur(0.4px)',
            }}
          />
        </g>
      ))}
    </svg>
  );
}

export default SubAtomicParticleField;
