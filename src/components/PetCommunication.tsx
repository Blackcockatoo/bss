/**
 * PetCommunication - Advanced communication UI for MetaPet
 * Displays pet messages, mood indicators, and interactive dialogue
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LexiconMessage, LexiconVocabulary, EmotionCategory, VocalizationType } from '@/lib/lexicon';
import { generateMessage, generateVocabulary } from '@/lib/lexicon';
import type { Vitals } from '@/vitals';
import type { Genome, DerivedTraits } from '@/lib/genome';

interface PetCommunicationProps {
  genome: Genome;
  traits: DerivedTraits;
  vitals: Vitals;
  petName?: string;
  onInteraction?: (type: 'respond' | 'pet' | 'dismiss') => void;
  recentInteraction?: string;
  className?: string;
}

export const PetCommunication: React.FC<PetCommunicationProps> = ({
  genome,
  traits,
  vitals,
  petName = 'Pet',
  onInteraction,
  recentInteraction,
  className = '',
}) => {
  const [vocabulary, setVocabulary] = useState<LexiconVocabulary | null>(null);
  const [currentMessage, setCurrentMessage] = useState<LexiconMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<LexiconMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  // Initialize vocabulary based on genome
  useEffect(() => {
    if (genome && traits) {
      const vocab = generateVocabulary(genome, traits);
      setVocabulary(vocab);
    }
  }, [genome, traits]);

  // Get time of day for context
  const getTimeOfDay = useCallback((): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }, []);

  // Generate new message periodically or on state change
  const generateNewMessage = useCallback(() => {
    if (!vocabulary) return;

    const context = {
      recentInteraction,
      timeOfDay: getTimeOfDay(),
    };

    const message = generateMessage(vocabulary, vitals, traits, context);

    // Typing animation
    setIsTyping(true);
    setDisplayedText('');

    let index = 0;
    const nativeText = message.native;
    const typingInterval = setInterval(() => {
      if (index <= nativeText.length) {
        setDisplayedText(nativeText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        setCurrentMessage(message);
        setMessageHistory((prev) => [message, ...prev].slice(0, 10));
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [vocabulary, vitals, traits, recentInteraction, getTimeOfDay]);

  // Generate message on significant state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      generateNewMessage();
    }, 500);

    return () => clearTimeout(timer);
  }, [recentInteraction, generateNewMessage]);

  // Periodic idle messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        generateNewMessage();
      }
    }, 30000); // Every 30 seconds, 30% chance

    return () => clearInterval(interval);
  }, [generateNewMessage]);

  // Get emotion emoji
  const getEmotionEmoji = (emotion: EmotionCategory): string => {
    const emojiMap: Record<EmotionCategory, string> = {
      joy: '😊',
      sadness: '😢',
      excitement: '🤩',
      curiosity: '🤔',
      affection: '💕',
      hunger: '😋',
      fatigue: '😴',
      playful: '😜',
      calm: '😌',
      anxious: '😰',
      proud: '😤',
      grateful: '🥰',
    };
    return emojiMap[emotion] || '😶';
  };

  // Get vocalization sound text
  const getVocalizationText = (vocalization: VocalizationType): string => {
    const soundMap: Record<VocalizationType, string> = {
      chirp: '♪',
      hum: '♫',
      trill: '🎵',
      purr: '~',
      whistle: '🎶',
      coo: '♡',
      chime: '✧',
      murmur: '...',
      giggle: 'hehe',
      sigh: '...',
      gasp: '!',
      squeak: '!!',
    };
    return soundMap[vocalization] || '';
  };

  // Get mood color
  const getMoodColor = (emotion: EmotionCategory): string => {
    const colorMap: Record<EmotionCategory, string> = {
      joy: '#fcd34d',
      sadness: '#94a3b8',
      excitement: '#f472b6',
      curiosity: '#a78bfa',
      affection: '#fb7185',
      hunger: '#fdba74',
      fatigue: '#64748b',
      playful: '#4ade80',
      calm: '#67e8f9',
      anxious: '#fbbf24',
      proud: '#c084fc',
      grateful: '#f9a8d4',
    };
    return colorMap[emotion] || '#94a3b8';
  };

  // Calculate mood meter
  const moodMeter = useMemo(() => {
    const wellbeing = (
      (100 - vitals.hunger) +
      vitals.hygiene +
      vitals.mood +
      vitals.energy
    ) / 4;
    return Math.round(wellbeing);
  }, [vitals]);

  if (!vocabulary) return null;

  return (
    <div className={`pet-communication ${className}`}>
      {/* Main Speech Bubble */}
      <AnimatePresence>
        {(currentMessage || isTyping) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Speech bubble */}
            <div
              className="relative bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/50 shadow-xl max-w-xs"
              style={{
                borderColor: currentMessage ? getMoodColor(currentMessage.emotion) + '40' : undefined,
              }}
            >
              {/* Emotion indicator */}
              <div className="absolute -top-3 -right-3 text-2xl">
                {currentMessage && getEmotionEmoji(currentMessage.emotion)}
              </div>

              {/* Vocalization indicator */}
              {currentMessage && (
                <div className="absolute -top-2 -left-2 text-lg text-yellow-400">
                  {getVocalizationText(currentMessage.vocalization)}
                </div>
              )}

              {/* Native language text */}
              <div className="font-mono text-lg text-white mb-2">
                {isTyping ? (
                  <span>
                    {displayedText}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  </span>
                ) : (
                  currentMessage?.native
                )}
              </div>

              {/* Translation (toggleable) */}
              <AnimatePresence>
                {showTranslation && currentMessage && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-slate-300 italic border-t border-slate-600/50 pt-2 mt-2"
                  >
                    "{currentMessage.translation}"
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Clarity indicator */}
              {currentMessage && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">Clarity:</span>
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getMoodColor(currentMessage.emotion) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${currentMessage.clarity * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  {showTranslation ? '🔇 Hide' : '🔊 Translate'}
                </button>
                <button
                  onClick={() => onInteraction?.('pet')}
                  className="text-xs px-2 py-1 rounded bg-pink-600/50 hover:bg-pink-600 text-white transition-colors"
                >
                  💕 Pet
                </button>
                <button
                  onClick={() => onInteraction?.('respond')}
                  className="text-xs px-2 py-1 rounded bg-blue-600/50 hover:bg-blue-600 text-white transition-colors"
                >
                  💬 Talk
                </button>
              </div>

              {/* Speech bubble tail */}
              <div
                className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800/90 transform rotate-45"
                style={{ borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'rgba(71, 85, 105, 0.5)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Summary Panel */}
      <motion.div
        className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50"
        layout
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-200">{petName}'s Mood</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? '▲ Less' : '▼ More'}
          </button>
        </div>

        {/* Mood meter */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-colors duration-500"
              style={{
                backgroundColor: moodMeter > 70 ? '#4ade80' : moodMeter > 40 ? '#fbbf24' : '#f87171',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${moodMeter}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm font-mono text-slate-300">{moodMeter}%</span>
        </div>

        {/* Current emotion display */}
        {currentMessage && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Feeling:</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: getMoodColor(currentMessage.emotion) + '30',
                color: getMoodColor(currentMessage.emotion),
              }}
            >
              {currentMessage.emotion}
            </span>
          </div>
        )}

        {/* Expanded info */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-slate-700/50"
            >
              {/* Dialect info */}
              <div className="text-xs text-slate-400 mb-2">
                Dialect: <span className="font-mono text-slate-300">{vocabulary.dialectId}</span>
              </div>

              {/* Phonetic profile */}
              <div className="text-xs text-slate-400 mb-2">
                Speech style:{' '}
                <span className="text-slate-300">
                  {vocabulary.phonetics.syllableStructure} ·
                  {vocabulary.phonetics.musicality > 0.6 ? ' melodic' : vocabulary.phonetics.hardness > 0.6 ? ' bold' : ' gentle'}
                </span>
              </div>

              {/* Message history */}
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-2">Recent messages:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {messageHistory.slice(0, 5).map((msg, i) => (
                    <div
                      key={msg.timestamp}
                      className="text-xs p-1.5 rounded bg-slate-700/50 flex items-center gap-2"
                      style={{ opacity: 1 - i * 0.15 }}
                    >
                      <span>{getEmotionEmoji(msg.emotion)}</span>
                      <span className="font-mono text-slate-300 truncate">{msg.native}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vocabulary sample */}
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-2">Known words:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(vocabulary.words).slice(0, 8).map(([key, word]) => (
                    <span
                      key={key}
                      className="text-xs px-1.5 py-0.5 rounded bg-slate-700/70 text-slate-300 font-mono"
                      title={word.meanings.join(', ')}
                    >
                      {word.native}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Response Buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        <QuickResponseButton
          label="Feed"
          emoji="🍖"
          onClick={() => onInteraction?.('respond')}
        />
        <QuickResponseButton
          label="Play"
          emoji="🎾"
          onClick={() => onInteraction?.('respond')}
        />
        <QuickResponseButton
          label="Rest"
          emoji="💤"
          onClick={() => onInteraction?.('respond')}
        />
        <QuickResponseButton
          label="Love"
          emoji="💖"
          onClick={() => onInteraction?.('pet')}
        />
      </div>
    </div>
  );
};

interface QuickResponseButtonProps {
  label: string;
  emoji: string;
  onClick: () => void;
}

const QuickResponseButton: React.FC<QuickResponseButtonProps> = ({ label, emoji, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 text-sm text-slate-200 transition-colors"
  >
    <span>{emoji}</span>
    <span>{label}</span>
  </motion.button>
);

// ============================================================================
// Expression Animation Component
// ============================================================================

interface ExpressionBubbleProps {
  emotion: EmotionCategory;
  vocalization: VocalizationType;
  position?: { x: number; y: number };
}

export const ExpressionBubble: React.FC<ExpressionBubbleProps> = ({
  emotion,
  vocalization,
  position = { x: 0, y: -80 },
}) => {
  const getEmotionSymbols = (emotion: EmotionCategory): string[] => {
    const symbolMap: Record<EmotionCategory, string[]> = {
      joy: ['♪', '♫', '★', '✧'],
      sadness: ['...', '💧', '~'],
      excitement: ['!!', '★', '✨', '!'],
      curiosity: ['?', '??', '❓'],
      affection: ['♡', '♥', '💕', '~'],
      hunger: ['...', '💭', '🍖'],
      fatigue: ['💤', 'zzz', '...'],
      playful: ['♪', '!', '~', '✧'],
      calm: ['~', '...', '○'],
      anxious: ['!?', '!!', '💦'],
      proud: ['★', '✧', '!'],
      grateful: ['♡', '✧', '~'],
    };
    return symbolMap[emotion] || ['...'];
  };

  const symbols = getEmotionSymbols(emotion);

  return (
    <motion.g transform={`translate(${position.x}, ${position.y})`}>
      {/* Background bubble */}
      <motion.ellipse
        cx="0"
        cy="0"
        rx="25"
        ry="18"
        fill="white"
        fillOpacity="0.9"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      />

      {/* Floating symbols */}
      {symbols.slice(0, 3).map((symbol, i) => (
        <motion.text
          key={i}
          x={(i - 1) * 12}
          y="5"
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          initial={{ y: 10, opacity: 0 }}
          animate={{
            y: [5, 0, 5],
            opacity: 1,
          }}
          transition={{
            y: { duration: 1, repeat: Infinity, delay: i * 0.2 },
            opacity: { duration: 0.3, delay: i * 0.1 },
          }}
        >
          {symbol}
        </motion.text>
      ))}

      {/* Bubble tail */}
      <path
        d="M -5 16 L 0 24 L 5 16"
        fill="white"
        fillOpacity="0.9"
      />
    </motion.g>
  );
};

export default PetCommunication;
