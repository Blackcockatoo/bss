import React, { useEffect, useRef, useState } from 'react';

interface TemporalEchoTrailProps {
  energy: number;
  curiosity: number;
  bond: number;
  size?: number;
  color?: string;
  reduceMotion?: boolean;
  isVisible?: boolean;
}

interface EchoPosition {
  x: number;
  y: number;
  createdAt: number;
}

const MAX_HISTORY = 8; // Reduced from 12 for performance (33% fewer circles)
const MAX_AGE_MS = 1400;

/**
 * Temporal Echo Trail (Upgrade 3)
 * Leaves a fading trail based on the pet's motion energy.
 */
export function TemporalEchoTrail({
  energy,
  curiosity,
  bond,
  size = 400,
  color = '#f4b942',
  reduceMotion = false,
  isVisible = true,
}: TemporalEchoTrailProps) {
  const [echoes, setEchoes] = useState<EchoPosition[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const rafRef = useRef<number>(0);
  const timestampRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    // Skip animation if reduce motion is enabled
    if (reduceMotion) {
      // Set a single static position — deferred to avoid synchronous setState
      const id = requestAnimationFrame(() => {
        setEchoes([{ x: size / 2, y: size / 2, createdAt: Date.now() }]);
      });
      return () => cancelAnimationFrame(id);
    }

    const animate = (timestamp: number) => {
      setCurrentTime(timestamp);

      // Skip updates if not visible
      if (!isVisible) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Frame skipping: only update every 3rd frame (~20fps instead of ~60fps)
      frameCountRef.current += 1;
      if (frameCountRef.current % 3 !== 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const wobble = Math.sin(timestamp / 620 + curiosity / 35) * (8 + bond / 40);
      const orbit = 18 + (energy / 100) * 26;
      const focusShift = Math.cos(timestamp / 880 + bond / 60) * 10;

      const x = size / 2 + Math.cos(timestamp / 920 + curiosity / 90) * (orbit + wobble * 0.35);
      const y = size / 2 + Math.sin(timestamp / 1050 + energy / 70) * (orbit * 0.65) + focusShift;

      setEchoes((prev) => {
        const updated = [...prev, { x, y, createdAt: timestamp }];
        const recent = updated.filter((echo) => timestamp - echo.createdAt < MAX_AGE_MS);
        return recent.slice(-MAX_HISTORY);
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [bond, curiosity, energy, size, reduceMotion, isVisible]);


  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${size} ${size}`}
      role="presentation"
    >
      {echoes.map((echo, index) => {
        const age = Math.min(1, Math.max(0, (currentTime - echo.createdAt) / MAX_AGE_MS));
        const trailOpacity = Math.max(0, 0.45 - age * 0.35) * ((index + 1) / MAX_HISTORY);
        const radius = Math.max(4, 18 - age * 10);

        return (
          <circle
            key={`${echo.createdAt}-${index}`}
            cx={echo.x}
            cy={echo.y}
            r={radius}
            fill={color}
            opacity={trailOpacity}
            style={{ filter: energy < 40 ? 'none' : 'blur(1.5px)' }}
          />
        );
      })}
    </svg>
  );
}

export default TemporalEchoTrail;
