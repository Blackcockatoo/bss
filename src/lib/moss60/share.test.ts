import { describe, expect, it } from 'vitest';
import {
  createMoss60VerifiablePayload,
  createShareUrl,
  decodeMoss60Payload,
  encodeMoss60Payload,
  verifyMoss60Payload,
  type Moss60ShareMetadata,
} from './share';

function buildMetadata(overrides: Partial<Moss60ShareMetadata> = {}): Moss60ShareMetadata {
  return {
    id: 'glyph-001',
    seed: 'seed-alpha',
    scheme: 'Spectral',
    variant: 'Aurora',
    projection: 'Polar',
    timestamp: 1767225600000,
    source: 'moss60-studio',
    ...overrides,
  };
}

describe('moss60 share payloads', () => {
  it('creates and verifies a valid payload', () => {
    const payload = createMoss60VerifiablePayload(buildMetadata());

    expect(verifyMoss60Payload(payload)).toBe(true);
    expect(payload.digest).toMatch(/^[0-9a-f]{8}$/);
  });

  it('fails verification when metadata is tampered', () => {
    const payload = createMoss60VerifiablePayload(buildMetadata());
    payload.metadata.variant = 'Tampered';

    expect(verifyMoss60Payload(payload)).toBe(false);
  });

  it('encodes and decodes payload as base64url token', () => {
    const payload = createMoss60VerifiablePayload(buildMetadata({ seed: '' }));

    const encoded = encodeMoss60Payload(payload);
    const decoded = decodeMoss60Payload(encoded);

    expect(decoded).toEqual(payload);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
  });

  it('returns null for invalid payload tokens', () => {
    expect(decodeMoss60Payload('not-json')).toBeNull();

    const incomplete = Buffer.from(JSON.stringify({ metadata: {} }), 'utf-8').toString('base64url');
    expect(decodeMoss60Payload(incomplete)).toBeNull();
  });

  it('creates share urls with encoded payload token', () => {
    const payload = createMoss60VerifiablePayload(buildMetadata());

    expect(createShareUrl(payload)).toBe(`/share/${encodeMoss60Payload(payload)}`);
  });
});
