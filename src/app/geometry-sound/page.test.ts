import { describe, expect, it } from 'vitest';

import { buildGeometrySoundIframeSrc } from './iframe-src';

describe('buildGeometrySoundIframeSrc', () => {
  it('returns plain html path when no query params exist', () => {
    expect(buildGeometrySoundIframeSrc(new URLSearchParams())).toBe('/geometry-sound.html');
  });

  it('forwards encoded session payload to iframe url', () => {
    const params = new URLSearchParams();
    params.set('session', 'eyJtb2RlIjoiaGVsaXgifQ');

    expect(buildGeometrySoundIframeSrc(params)).toBe(
      '/geometry-sound.html?session=eyJtb2RlIjoiaGVsaXgifQ',
    );
  });

  it('forwards arbitrary query parameters to avoid dropping future flags', () => {
    const params = new URLSearchParams('petName=Meta%20Pet&mode=temple&foo=bar');

    expect(buildGeometrySoundIframeSrc(params)).toBe(
      '/geometry-sound.html?petName=Meta+Pet&mode=temple&foo=bar',
    );
  });
});
