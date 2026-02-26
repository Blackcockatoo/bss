export class SeededRNG {
  private state: [number, number, number, number];

  constructor(seed: number) {
    this.state = [
      seed,
      seed * 0x9e3779b9,
      seed * 0x85ebca6b,
      seed * 0xc2b2ae35,
    ];

    for (let i = 0; i < 10; i++) {
      this.next();
    }
  }

  next(): number {
    let t = this.state[3];
    const s = this.state[0];
    this.state[3] = this.state[2];
    this.state[2] = this.state[1];
    this.state[1] = s;

    t ^= t << 11;
    t ^= t >>> 8;
    this.state[0] = t ^ s ^ (s >>> 19);

    return Math.abs(this.state[0]) / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

export function createGenomeRNG(genomeHash: string): SeededRNG {
  let seed = 0;
  for (let i = 0; i < Math.min(genomeHash.length, 8); i++) {
    seed = (seed << 8) | genomeHash.charCodeAt(i);
  }
  return new SeededRNG(seed);
}
