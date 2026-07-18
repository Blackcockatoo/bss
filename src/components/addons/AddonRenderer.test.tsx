import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Addon } from '@/lib/addons/types';
import { AddonRenderer } from './AddonRenderer';

const baseAddon: Addon = {
  id: 'test-addon-1',
  name: 'Test Hat',
  description: 'A hat for testing',
  category: 'headwear',
  rarity: 'common',
  attachment: {
    anchorPoint: 'head',
    offset: { x: 0, y: -10 },
    scale: 1,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    svgPath: 'M0,0 L10,10',
    colors: { primary: '#fff' },
  },
  ownership: {
    ownerPublicKey: 'owner',
    signature: 'sig',
    issuedAt: 0,
    issuerPublicKey: 'issuer',
    issuerSignature: 'sig',
    nonce: 'nonce',
  },
  metadata: { creator: 'test', createdAt: 0 },
};

describe('AddonRenderer', () => {
  it('uses the built-in Auralia anchor math by default', () => {
    const { container } = render(
      <svg>
        <AddonRenderer addon={baseAddon} petPosition={{ x: 200, y: 210 }} />
      </svg>,
    );
    const g = container.querySelector('g[transform]');
    // head anchor: baseY - 65 + offset.y => 210 - 65 - 10 = 135
    expect(g?.getAttribute('transform')).toContain('translate(200, 135)');
  });

  it('defers to resolveAnchor when provided, ignoring petPosition', () => {
    const { container } = render(
      <svg>
        <AddonRenderer
          addon={baseAddon}
          petPosition={{ x: 200, y: 210 }}
          resolveAnchor={() => ({ x: 42, y: 7 })}
        />
      </svg>,
    );
    const g = container.querySelector('g[transform]');
    expect(g?.getAttribute('transform')).toContain('translate(42, 7)');
  });

  it('applies scaleMultiplier on top of attachment.scale', () => {
    const { container } = render(
      <svg>
        <AddonRenderer
          addon={{ ...baseAddon, attachment: { ...baseAddon.attachment, scale: 2 } }}
          resolveAnchor={() => ({ x: 0, y: 0 })}
          scaleMultiplier={0.5}
        />
      </svg>,
    );
    const g = container.querySelector('g[transform]');
    // attachment.scale(2) * snapOn.scale(1.5 at the moment it mounts) * scaleMultiplier(0.5) = 1.5
    expect(g?.getAttribute('transform')).toContain('scale(1.5)');
  });
});
