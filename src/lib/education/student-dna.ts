/**
 * Student DNA Profile Derivation
 *
 * Computes a metaphorical "learning DNA" profile from a student's
 * exploration interactions. This is NOT real genetics -- it's a
 * privacy-safe, hash-based learning fingerprint.
 *
 * Two hashing approaches:
 * - SHA-256 (Web Crypto): for privacy-safe data storage
 * - Simple hash: for kid-friendly visual symbols
 */

import type { LessonProgress, StudentDNAProfile, DnaMode } from './types';
import { LEARNING_SYMBOLS } from './types';

// ---------- Crypto helpers (same pattern as identity/crest.ts) ----------

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash of exploration pattern data.
 * Privacy-safe: one-way hash, cannot be reversed.
 */
export async function hashExplorationPattern(points: number[]): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(points.join(','));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(hash);
}

// ---------- Simple hash for kid-friendly symbols ----------

/**
 * Simple deterministic hash that maps text to a learning symbol.
 * Same pattern as wellness store's hashToSymbol.
 * Returns a symbol name kids can recognize (star, moon, etc.)
 */
export function hashToLearningSymbol(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return LEARNING_SYMBOLS[Math.abs(hash) % LEARNING_SYMBOLS.length];
}

// ---------- Profile derivation ----------

type ModeKey = Exclude<DnaMode, null>;
const ALL_MODES: ModeKey[] = ['spiral', 'mandala', 'particles', 'sound', 'journey'];

/**
 * Derive a Student DNA profile from their lesson progress entries.
 * All data is aggregated -- no raw interaction logs exposed.
 */
export function deriveStudentDNA(
  alias: string,
  interactions: LessonProgress[],
  lessonDnaModes: Record<string, DnaMode>,
): StudentDNAProfile {
  const modeTime: Record<ModeKey, number> = {
    spiral: 0,
    mandala: 0,
    particles: 0,
    sound: 0,
    journey: 0,
  };

  let totalTime = 0;
  let totalDiscoveries = 0;
  let totalReflectionChars = 0;
  let reflectionCount = 0;
  const signaturePoints: number[] = [];

  for (const progress of interactions) {
    const mode = lessonDnaModes[progress.lessonId];
    if (mode && mode in modeTime) {
      modeTime[mode as ModeKey] += progress.timeSpentMs;
    }
    totalTime += progress.timeSpentMs;
    totalDiscoveries += progress.dnaInteractions;

    // Build signature from interaction counts
    signaturePoints.push(progress.dnaInteractions);

    // Measure reflection depth from post-responses
    if (progress.postResponse) {
      totalReflectionChars += progress.postResponse.length;
      reflectionCount++;
    }
  }

  // Normalize mode affinities to 0-1
  const modeAffinities: Record<ModeKey, number> = { spiral: 0, mandala: 0, particles: 0, sound: 0, journey: 0 };
  if (totalTime > 0) {
    for (const mode of ALL_MODES) {
      modeAffinities[mode] = modeTime[mode] / totalTime;
    }
  }

  // Determine sound preference from highest affinity mode
  let soundPreference: 'fire' | 'water' | 'earth' | null = null;
  const topMode = ALL_MODES.reduce((best, mode) =>
    modeAffinities[mode] > modeAffinities[best] ? mode : best
  );
  if (modeAffinities[topMode] > 0) {
    // Map modes to elements (kid-friendly metaphor)
    const modeToElement: Record<ModeKey, 'fire' | 'water' | 'earth'> = {
      spiral: 'fire',
      mandala: 'earth',
      particles: 'water',
      sound: 'fire',
      journey: 'earth',
    };
    soundPreference = modeToElement[topMode];
  }

  // Reflection depth: normalized 0-1 based on average response length
  // 200+ chars considered full depth
  const avgReflectionLen = reflectionCount > 0 ? totalReflectionChars / reflectionCount : 0;
  const reflectionDepth = Math.min(1, avgReflectionLen / 200);

  // Build exploration seed from alias + signature
  const seedInput = `${alias}:${signaturePoints.join(',')}`;
  const learningSymbol = hashToLearningSymbol(seedInput);

  // Exploration seed computed synchronously as a simple hash for the default
  // (async SHA-256 version can be used via hashExplorationPattern)
  let seedHash = 0;
  for (let i = 0; i < seedInput.length; i++) {
    seedHash = ((seedHash << 5) - seedHash) + seedInput.charCodeAt(i);
    seedHash = seedHash & seedHash;
  }
  const explorationSeed = Math.abs(seedHash).toString(16).padStart(8, '0');

  return {
    alias,
    explorationSeed,
    modeAffinities,
    patternSignature: signaturePoints.slice(0, 12), // cap at 12 for compact display
    soundPreference,
    discoveryCount: totalDiscoveries,
    reflectionDepth,
    learningSymbol,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Compare two Student DNA profiles for similarity.
 * Returns 0-1 where 1 is identical.
 * Used for group formation, NOT ranking.
 */
export function compareStudentDNA(a: StudentDNAProfile, b: StudentDNAProfile): number {
  let similarity = 0;
  let factors = 0;

  // Compare mode affinities (cosine-like)
  for (const mode of ALL_MODES) {
    const diff = Math.abs(a.modeAffinities[mode] - b.modeAffinities[mode]);
    similarity += 1 - diff;
    factors++;
  }

  // Compare sound preference
  if (a.soundPreference === b.soundPreference && a.soundPreference !== null) {
    similarity += 1;
  }
  factors++;

  // Compare reflection depth
  similarity += 1 - Math.abs(a.reflectionDepth - b.reflectionDepth);
  factors++;

  return factors > 0 ? similarity / factors : 0;
}
