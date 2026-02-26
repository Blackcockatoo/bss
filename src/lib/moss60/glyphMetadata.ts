import { moss60Hash } from '@/lib/qr-messaging/crypto';

export interface GlyphLineageEntry {
  fromSeedHash: string;
  toSeedHash: string;
  timestamp: string;
}

export interface GlyphMetadata {
  version: string;
  seedHash: string;
  scheme: string;
  timestamp: string;
  lineage?: GlyphLineageEntry[];
}

export function createGlyphMetadata(input: {
  seed: string;
  scheme: string;
  lineage?: GlyphLineageEntry[];
  version?: string;
  timestamp?: string;
}): GlyphMetadata {
  return {
    version: input.version ?? '1.0.0',
    seedHash: moss60Hash(input.seed || ''),
    scheme: input.scheme,
    timestamp: input.timestamp ?? new Date().toISOString(),
    ...(input.lineage && input.lineage.length > 0 ? { lineage: input.lineage } : {}),
  };
}

export function serializeGlyphMetadata(metadata: GlyphMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

export function parseGlyphMetadata(json: string): GlyphMetadata {
  const parsed: unknown = JSON.parse(json);

  if (!isGlyphMetadata(parsed)) {
    throw new Error('Invalid GlyphMetadata payload');
  }

  return parsed;
}

export function isGlyphMetadata(value: unknown): value is GlyphMetadata {
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  if (
    typeof record.version !== 'string' ||
    typeof record.seedHash !== 'string' ||
    typeof record.scheme !== 'string' ||
    typeof record.timestamp !== 'string'
  ) {
    return false;
  }

  if (record.lineage === undefined) return true;
  if (!Array.isArray(record.lineage)) return false;

  return record.lineage.every(item => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Record<string, unknown>;
    return (
      typeof entry.fromSeedHash === 'string' &&
      typeof entry.toSeedHash === 'string' &&
      typeof entry.timestamp === 'string'
    );
  });
}

export function computeGlyphDeterministicHash(metadata: GlyphMetadata): string {
  return moss60Hash(`${metadata.version}|${metadata.seedHash}|${metadata.scheme}`);
}
