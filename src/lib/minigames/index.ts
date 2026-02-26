/**
 * Mini-Games System - Pattern recognition, rhythm, and meditation games
 * Boosts specific vitals and provides engagement
 */

export interface MiniGamesState {
  memoryHighScore: number;
  rhythmHighScore: number;
  vimanaHighScore: number;
  totalPlays: number;
  lastPlayedAt: number;
}

export interface GameResult {
  gameType: 'memory' | 'rhythm' | 'vimana';
  score: number;
  isHighScore: boolean;
  reward: {
    mood?: number;
    energy?: number;
    message: string;
  };
}

/**
 * Memory Pattern Game - Tests pattern recall
 */
export function playMemoryGame(
  vitals: { mood: number; energy: number },
  difficulty: number = 1
): GameResult {
  const base = Math.round((vitals.mood + vitals.energy) / 20);
  const difficultyBonus = difficulty * 2;
  const randomFactor = Math.floor(Math.random() * 6);
  const score = Math.max(0, base + difficultyBonus + randomFactor);
  
  return {
    gameType: 'memory',
    score,
    isHighScore: false, // Set by store
    reward: {
      mood: Math.min(10, score),
      message: `Pattern recall complete! Score: ${score}`,
    },
  };
}

/**
 * Rhythm Sync Game - Tests timing and coordination
 */
export function playRhythmGame(
  vitals: { energy: number; mood: number },
  difficulty: number = 1
): GameResult {
  const base = Math.round((vitals.energy * 1.2 + vitals.mood * 0.8) / 20);
  const difficultyBonus = difficulty * 3;
  const randomFactor = Math.floor(Math.random() * 8);
  const score = Math.max(0, base + difficultyBonus + randomFactor);
  
  return {
    gameType: 'rhythm',
    score,
    isHighScore: false,
    reward: {
      energy: Math.min(12, score),
      message: `Cosmic beats synced! Score: ${score}`,
    },
  };
}

/**
 * Vimana Meditation - Tests focus and calm
 */
export function playVimanaGame(
  vitals: { mood: number; hygiene: number },
  linesCleared: number
): GameResult {
  const base = Math.round((vitals.mood + vitals.hygiene) / 15);
  const lineBonus = linesCleared * 3;
  const score = Math.max(0, base + lineBonus);
  
  return {
    gameType: 'vimana',
    score,
    isHighScore: false,
    reward: {
      mood: Math.min(15, Math.floor(score * 0.8)),
      energy: Math.min(10, Math.floor(score * 0.5)),
      message: `Vimana navigation complete! ${linesCleared} paths cleared.`,
    },
  };
}

/**
 * Generate meditation pattern based on genome
 */
export function generateMeditationPattern(genomeSeed: number, length: number = 6): number[] {
  const pattern: number[] = [];
  let seed = genomeSeed;
  
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    pattern.push(seed % 4); // 0-3 for four directions
  }
  
  return pattern;
}

/**
 * Check if user input matches pattern
 */
export function validatePattern(pattern: number[], userInput: number[]): {
  correct: boolean;
  accuracy: number;
} {
  if (pattern.length !== userInput.length) {
    return { correct: false, accuracy: 0 };
  }
  
  const matches = pattern.filter((val, idx) => val === userInput[idx]).length;
  const accuracy = (matches / pattern.length) * 100;
  
  return {
    correct: accuracy === 100,
    accuracy,
  };
}

/**
 * Calculate daily game bonus
 */
export function getDailyBonus(lastPlayedAt: number): {
  hasBonus: boolean;
  multiplier: number;
  message: string;
} {
  const now = Date.now();
  const hoursSinceLastPlay = (now - lastPlayedAt) / (1000 * 60 * 60);
  
  if (hoursSinceLastPlay >= 24) {
    return {
      hasBonus: true,
      multiplier: 1.5,
      message: 'Daily bonus active! +50% rewards',
    };
  }
  
  return {
    hasBonus: false,
    multiplier: 1.0,
    message: '',
  };
}
