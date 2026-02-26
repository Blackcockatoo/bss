import { describe, expect, it } from 'vitest';
import {
  computeGlyphDeterministicHash,
  createGlyphMetadata,
  isGlyphMetadata,
  parseGlyphMetadata,
  serializeGlyphMetadata,
} from './glyphMetadata';

describe('glyph metadata', () => {
  it('serializes and deserializes metadata payloads', () => {
    const metadata = createGlyphMetadata({
      seed: 'alpha-seed',
      scheme: 'Spectral',
      timestamp: '2026-01-01T00:00:00.000Z',
      lineage: [
        {
          fromSeedHash: '1111aaaa',
          toSeedHash: '2222bbbb',
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const serialized = serializeGlyphMetadata(metadata);
    const parsed = parseGlyphMetadata(serialized);

    expect(parsed).toEqual(metadata);
    expect(parsed.seedHash.length).toBeGreaterThan(0);
  });

  it('does not include lineage when omitted or empty', () => {
    const withoutLineage = createGlyphMetadata({
      seed: 'alpha-seed',
      scheme: 'Spectral',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const withEmptyLineage = createGlyphMetadata({
      seed: 'beta-seed',
      scheme: 'Golden',
      timestamp: '2026-01-01T00:00:00.000Z',
      lineage: [],
    });

    expect(withoutLineage).not.toHaveProperty('lineage');
    expect(withEmptyLineage).not.toHaveProperty('lineage');
  });

  it('keeps deterministic render hash stable across re-renders', () => {
    const metadata = createGlyphMetadata({
      seed: 'stable-seed',
      scheme: 'Golden',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const hash1 = computeGlyphDeterministicHash(metadata);
    const parsed = parseGlyphMetadata(serializeGlyphMetadata(metadata));
    const hash2 = computeGlyphDeterministicHash(parsed);

    expect(hash1).toBe(hash2);
  });

  it('validates metadata shape strictly', () => {
    expect(isGlyphMetadata(null)).toBe(false);
    expect(
      isGlyphMetadata({
        version: '1.0.0',
        seedHash: 'abc12345',
        scheme: 'Spectral',
        timestamp: '2026-01-01T00:00:00.000Z',
        lineage: [{ fromSeedHash: 'a', toSeedHash: 42, timestamp: 'x' }],
      })
    ).toBe(false);
  });

  it('throws for invalid metadata payloads', () => {
    expect(() => parseGlyphMetadata('{"version":"1.0.0"}')).toThrow('Invalid GlyphMetadata payload');
  });
});
