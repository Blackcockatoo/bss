import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  MOSS_BLACK_STRAND,
  MOSS_BLUE_STRAND,
  MOSS_RED_STRAND,
} from '@/lib/moss60/strandSequences';
import { SriYantraPetEngine } from './SriYantraPetEngine';

/**
 * Golden render lock for the Sri Yantra sprite (Phase 0 of the MetaPet
 * pipeline plan). The engine source is checksum-locked in CI
 * (scripts/check-geometry-sprite-lock.mjs); these snapshots additionally lock
 * its rendered output for fixed DNA packets, so an approved source change
 * that accidentally alters existing pets' appearance still fails loudly.
 *
 * Regenerate ONLY as part of the deliberate re-approval flow described in
 * docs/protocol/geometry-sprite-lock.md.
 */

const ZERO = '0'.repeat(60);

// Arbitrary but frozen high-contrast packets; never edit these digits.
const CONTRAST = {
  red: '958270461385916274038561492750172984635204871396528374615092',
  blue: '304175869241750938612490385761849302571938460257183946027351',
  black: '672093481572630948217356089421765034918265203847196530874261',
};

function renderGolden(packets: { red: string; blue: string; black: string }) {
  const { container, unmount } = render(
    <SriYantraPetEngine
      red={packets.red}
      blue={packets.blue}
      black={packets.black}
      animated={false}
      movement="idle"
    />,
  );

  const markup = container.innerHTML;
  // The only render-to-render variance is the useId-derived SVG id prefix
  // (visible in defs ids like `<prefix>-bg`); normalize it out.
  const idPrefix = markup.match(/id="(.*?)-bg"/)?.[1];
  const normalized = idPrefix
    ? markup.replaceAll(idPrefix, 'GOLDEN')
    : markup;
  unmount();
  return normalized;
}

describe('SriYantraPetEngine golden renders', () => {
  it('renders the canonical MOSS species packets exactly as approved', () => {
    expect(
      renderGolden({
        red: MOSS_RED_STRAND,
        blue: MOSS_BLUE_STRAND,
        black: MOSS_BLACK_STRAND,
      }),
    ).toMatchSnapshot();
  });

  it('renders the all-zero baseline packets exactly as approved', () => {
    expect(
      renderGolden({ red: ZERO, blue: ZERO, black: ZERO }),
    ).toMatchSnapshot();
  });

  it('renders the frozen high-contrast packets exactly as approved', () => {
    expect(renderGolden(CONTRAST)).toMatchSnapshot();
  });

  it('still varies with DNA: changing one sampled digit changes the render', () => {
    const base = renderGolden(CONTRAST);
    const mutated = renderGolden({
      ...CONTRAST,
      red: `${CONTRAST.red[0] === '0' ? '1' : '0'}${CONTRAST.red.slice(1)}`,
    });
    expect(mutated).not.toEqual(base);
  });
});
