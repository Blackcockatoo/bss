'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { PetResponse } from '@/lib/realtime/responseSystem';

interface ResponseBubbleProps {
  response: PetResponse | null;
  isVisible: boolean;
}

const intensityVariants = {
  subtle: {
    scale: [1, 1.05, 1],
    opacity: [0, 1, 0],
    y: [0, -10, -20],
  },
  normal: {
    scale: [0.8, 1.1, 1],
    opacity: [0, 1, 0],
    y: [10, -5, -30],
  },
  intense: {
    scale: [0.6, 1.15, 1],
    opacity: [0, 1, 0],
    y: [20, 0, -40],
    rotate: [-5, 0, 5],
  },
};

const typeColors = {
  action: 'from-blue-400 to-cyan-400',
  mood: 'from-purple-400 to-pink-400',
  achievement: 'from-yellow-400 to-orange-400',
  interaction: 'from-green-400 to-emerald-400',
  warning: 'from-red-400 to-orange-400',
  celebration: 'from-pink-400 to-purple-400',
};

const typeGlows = {
  action: 'shadow-blue-500/50',
  mood: 'shadow-purple-500/50',
  achievement: 'shadow-yellow-500/50',
  interaction: 'shadow-green-500/50',
  warning: 'shadow-red-500/50',
  celebration: 'shadow-pink-500/50',
};

export function ResponseBubble({ response, isVisible }: ResponseBubbleProps) {
  if (!response) return null;

  const colorClass = typeColors[response.type] || typeColors.action;
  const glowClass = typeGlows[response.type] || typeGlows.action;
  const variants = intensityVariants[response.intensity] || intensityVariants.normal;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 20 },
          }}
          exit={{
            opacity: 0,
            scale: 0.5,
            y: -40,
            transition: { duration: 0.3 },
          }}
          className="fixed top-[20%] left-1/2 -translate-x-1/2 pointer-events-none z-[100]"
        >
          <motion.div
            animate={variants}
            transition={{
              duration: response.duration / 1000,
              ease: 'easeOut',
            }}
            className={`
              relative px-8 py-4 rounded-full
              bg-gradient-to-r ${colorClass}
              shadow-2xl ${glowClass}
              backdrop-blur-md border-2 border-white/30
              font-bold text-white text-center
              max-w-md
            `}
          >
            {/* Animated background glow */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorClass} opacity-20 blur-lg`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-3 flex-wrap justify-center">
              <span className="text-3xl">{response.emoji}</span>
              <span className="text-lg drop-shadow-md">{response.text}</span>
            </div>

            {/* Particle effects for intense responses */}
            {response.intensity === 'intense' && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-white/60"
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: Math.cos((i / 6) * Math.PI * 2) * 40,
                      y: Math.sin((i / 6) * Math.PI * 2) * 40,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeOut',
                    }}
                    style={{
                      left: '50%',
                      top: '50%',
                      marginLeft: '-4px',
                      marginTop: '-4px',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
