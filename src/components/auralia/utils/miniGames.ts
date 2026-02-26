/**
 * Mini-Game Utilities
 *
 * Sigil pattern matching and Fibonacci trivia generators
 */

import type { Field, TriviaQuestion } from '../types';

// ===== TRIVIA QUESTIONS =====

interface QuestionTemplate {
  n: number;
  question: string;
  answer: (field: Field) => number;
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    n: 7,
    question: 'What is the 7th Fibonacci number?',
    answer: (field) => Number(field.fib(7)),
  },
  {
    n: 10,
    question: 'What is the 10th Fibonacci number?',
    answer: (field) => Number(field.fib(10)),
  },
  {
    n: 12,
    question: 'What is the 12th Fibonacci number?',
    answer: (field) => Number(field.fib(12)),
  },
  {
    n: 6,
    question: 'What is the 6th Lucas number?',
    answer: (field) => Number(field.lucas(6)),
  },
  {
    n: 8,
    question: 'What is the 8th Lucas number?',
    answer: (field) => Number(field.lucas(8)),
  },
];

/**
 * Generate a Fibonacci/Lucas trivia question
 */
export function generateFibonacciTrivia(field: Field): TriviaQuestion {
  // Pick random question template
  const template = QUESTION_TEMPLATES[Math.floor(field.prng() * QUESTION_TEMPLATES.length)];

  const answer = template.answer(field);

  // Generate wrong answers
  const wrong1 = answer + Math.floor(field.prng() * 20) - 10;
  const wrong2 = answer * 2;
  const wrong3 = Math.floor(answer / 2);

  // Shuffle options
  const options = [answer, wrong1, wrong2, wrong3].sort(() => field.prng() - 0.5);

  return {
    question: template.question,
    answer,
    options,
  };
}

/**
 * Generate a sigil pattern sequence
 */
export function generateSigilPattern(field: Field, minLength = 3, maxLength = 5): number[] {
  const length = minLength + Math.floor(field.prng() * (maxLength - minLength + 1));
  const sequence: number[] = [];

  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(field.prng() * 7)); // 0-6 for 7 sigil points
  }

  return sequence;
}

/**
 * Validate user's pattern attempt
 */
export function validatePattern(userSequence: number[], targetSequence: number[]): boolean {
  if (userSequence.length !== targetSequence.length) return false;
  return userSequence.every((val, idx) => val === targetSequence[idx]);
}

/**
 * Calculate game reward bonuses
 */
export const GAME_REWARDS = {
  patternMatch: {
    bond: 10,
    curiosity: 5,
  },
  triviaCorrect: {
    bond: 8,
    curiosity: 12,
  },
} as const;

/**
 * Generate celebratory audio sequence for correct answer
 */
export function getCelebrationNotes(): Array<{ note: number; delay: number }> {
  return [
    { note: 0, delay: 0 },
    { note: 2, delay: 150 },
    { note: 4, delay: 300 },
  ];
}
