import type { Genome } from './types';

export function generateRandomGenome(random: () => number = Math.random): Genome {
  const randomArray = () => Array.from({ length: 60 }, () => Math.floor(random() * 7));
  return {
    red60: randomArray(),
    blue60: randomArray(),
    black60: randomArray(),
  };
}
