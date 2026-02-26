'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

export type EffectType =
  | 'explosion'
  | 'sparkle'
  | 'heart'
  | 'star'
  | 'lightning'
  | 'heal'
  | 'victory'
  | 'ripple'
  | 'burst'
  | 'confetti'
  | 'glow'
  | 'pulse'
  | 'float';

export interface VisualEffect {
  id: string;
  type: EffectType;
  x: number;
  y: number;
  duration: number;
}

export function useVisualEffects() {
  const [effects, setEffects] = useState<VisualEffect[]>([]);

  const triggerEffect = useCallback((type: EffectType, x: number, y: number, duration = 1000) => {
    const id = `${Date.now()}-${Math.random()}`;
    const effect: VisualEffect = { id, type, x, y, duration };

    setEffects(prev => [...prev, effect]);

    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== id));
    }, duration);
  }, []);

  return { effects, triggerEffect };
}

interface VisualEffectsRendererProps {
  effects: VisualEffect[];
}

export function VisualEffectsRenderer({ effects }: VisualEffectsRendererProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {effects.map(effect => (
          <EffectElement key={effect.id} effect={effect} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface EffectElementProps {
  effect: VisualEffect;
}

function EffectElement({ effect }: EffectElementProps) {
  const { type, x, y, duration } = effect;

  const getEffectContent = () => {
    switch (type) {
      case 'explosion':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="text-4xl"
          >
            💥
          </motion.div>
        );

      case 'sparkle':
        return (
          <motion.div className="relative w-8 h-8">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 40,
                  y: Math.sin((i / 8) * Math.PI * 2) * 40,
                  opacity: 0,
                }}
                transition={{
                  duration: duration / 1000,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        );

      case 'heart':
        return (
          <motion.div
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{ scale: 1, y: -60, opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="text-3xl"
          >
            ❤️
          </motion.div>
        );

      case 'star':
        return (
          <motion.div
            initial={{ scale: 0, rotate: 0, opacity: 1 }}
            animate={{ scale: 1.2, rotate: 360, opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="text-3xl"
          >
            ⭐
          </motion.div>
        );

      case 'lightning':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="text-4xl"
          >
            ⚡
          </motion.div>
        );

      case 'heal':
        return (
          <motion.div
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{ scale: 1, y: -50, opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="text-3xl"
          >
            💚
          </motion.div>
        );

      case 'victory':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="text-4xl"
          >
            🏆
          </motion.div>
        );

      case 'ripple':
        return (
          <motion.div className="relative w-32 h-32">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 border-4 border-cyan-400 rounded-full"
                initial={{
                  scale: 0,
                  opacity: 0.8,
                }}
                animate={{
                  scale: 2 + i * 0.5,
                  opacity: 0,
                }}
                transition={{
                  duration: duration / 1000,
                  delay: i * 0.15,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        );

      case 'burst':
        return (
          <motion.div className="relative w-16 h-16">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos((i / 12) * Math.PI * 2) * 60,
                  y: Math.sin((i / 12) * Math.PI * 2) * 60,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: duration / 1000,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        );

      case 'confetti':
        return (
          <motion.div className="relative w-20 h-20">
            {[...Array(20)].map((_, i) => {
              const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
              const color = colors[i % colors.length];
              return (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 ${color}`}
                  style={{
                    clipPath: Math.random() > 0.5 ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'none',
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    rotate: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 100,
                    y: Math.random() * 100 + 50,
                    rotate: Math.random() * 720,
                    opacity: 0,
                  }}
                  transition={{
                    duration: duration / 1000,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </motion.div>
        );

      case 'glow':
        return (
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
            initial={{
              scale: 0.5,
              opacity: 0,
            }}
            animate={{
              scale: 2,
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: duration / 1000,
              ease: 'easeInOut',
            }}
            style={{
              filter: 'blur(20px)',
            }}
          />
        );

      case 'pulse':
        return (
          <motion.div
            className="w-20 h-20 rounded-full border-4 border-purple-500"
            initial={{
              scale: 0.8,
              opacity: 1,
            }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [1, 0.5, 0],
            }}
            transition={{
              duration: duration / 1000,
              times: [0, 0.5, 1],
              ease: 'easeInOut',
            }}
          />
        );

      case 'float':
        return (
          <motion.div className="relative">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 0,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 40,
                  y: -80 - Math.random() * 40,
                  opacity: 0,
                  scale: 1,
                }}
                transition={{
                  duration: duration / 1000,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {getEffectContent()}
    </motion.div>
  );
}
