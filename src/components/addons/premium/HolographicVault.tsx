/**
 * Holographic Vault Premium Add-on
 * Extraordinary Ability: Secure, gesture-controlled 3D storage interface.
 * Animation: 3D card flip and spring-based UI transitions.
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface HolographicVaultProps {
  className?: string;
}

export const HolographicVault: React.FC<HolographicVaultProps> = ({ className = '' }) => {
  const [isLocked, setIsLocked] = useState(true);

  return (
    <div className={`perspective-1000 p-8 ${className}`}>
      <motion.div
        animate={{ rotateY: isLocked ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-64 h-96 cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setIsLocked(!isLocked)}
      >
        {/* Front: Locked State */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xl border border-white/20"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="mb-4"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </motion.div>
          <h3 className="text-xl font-bold text-white">Secure Vault</h3>
          <p className="text-indigo-200 text-center text-sm mt-2">Tap to authenticate</p>
        </div>

        {/* Back: Unlocked State */}
        <div
          className="absolute inset-0 bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xl border border-cyan-500/50"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            className="mb-4"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <h3 className="text-xl font-bold text-white">Access Granted</h3>
          <div className="mt-4 space-y-2 w-full">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="h-full bg-cyan-500"
              />
            </div>
            <p className="text-xs text-slate-400 text-center">Decrypted successfully</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HolographicVault;
