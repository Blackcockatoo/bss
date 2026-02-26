import { describe, expect, it } from 'vitest';
import { createMoss60VerifiablePayload } from './share';
import { renderMoss60Widget, verifyMoss60WidgetPayload } from './widget';

describe('moss60 widget', () => {
  it('verifies through share verification bridge', () => {
    const payload = createMoss60VerifiablePayload({
      id: 'glyph-002',
      seed: 'seed-beta',
      scheme: 'Golden',
      variant: 'Delta',
      projection: 'Helix',
      timestamp: 1767225600000,
      source: 'moss60-studio',
    });

    expect(verifyMoss60WidgetPayload(payload)).toBe(true);
  });

  it('renders widget data and verified state', () => {
    const mount = document.createElement('div');
    const payload = createMoss60VerifiablePayload({
      id: 'glyph-003',
      seed: 'seed-gamma',
      scheme: 'Spectral',
      variant: 'Prism',
      projection: 'Orbital',
      timestamp: 1767225600000,
      source: 'moss60-studio',
    });

    const result = renderMoss60Widget(mount, payload);

    expect(result.verified).toBe(true);
    expect(result.mount).toBe(mount);
    expect(mount.textContent).toContain('MOSS60 Studio Share');
    expect(mount.textContent).toContain('Verified');
    expect(mount.textContent).toContain('glyph-003');
    expect(mount.querySelector('section[aria-label="MOSS60 share widget"]')).not.toBeNull();
  });

  it('renders unverified state when payload digest does not match', () => {
    const mount = document.createElement('div');
    const payload = createMoss60VerifiablePayload({
      id: 'glyph-004',
      seed: 'seed-delta',
      scheme: 'Monochrome',
      variant: 'Pulse',
      projection: 'Linear',
      timestamp: 1767225600000,
      source: 'moss60-studio',
    });

    payload.digest = 'deadbeef';

    const result = renderMoss60Widget(mount, payload);

    expect(result.verified).toBe(false);
    expect(mount.textContent).toContain('Unverified');
  });
});
