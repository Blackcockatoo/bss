import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BodyForge } from './BodyForge';
import {
  MAX_AVATAR_BYTES,
  defaultIdentityProfile,
  loadIdentityProfile,
  useIdentityProfileStore,
} from '@/lib/identity/profile';
import { svgElementToPngDataUrl } from '@/lib/media/svgToPngDataUrl';

const VALID_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const mocks = vi.hoisted(() => ({
  renderSvg: true,
  push: vi.fn(),
  setPetType: vi.fn(),
  store: {
    genome: null,
    traits: null,
    vitals: {
      hunger: 50,
      hygiene: 50,
      mood: 50,
      energy: 50,
      isSick: false,
      sicknessSeverity: 0,
      sicknessType: 'none',
      deathCount: 0,
    },
    evolution: {},
    lastAction: null,
    lastActionAt: null,
    setPetType: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/store', () => ({
  useStore: (selector: (state: typeof mocks.store) => unknown) =>
    selector(mocks.store),
}));

vi.mock('@/components/body-forge/PetBodyRenderer', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/components/body-forge/PetBodyRenderer')
  >();
  return {
    ...actual,
    PetBodyRenderer: () =>
      mocks.renderSvg ? <svg viewBox="0 0 280 250" aria-label="Body preview" /> : <div />,
  };
});

vi.mock('@/visual-dna/bodyForgeAdapter', () => ({
  applyEvolutionGrowth: (spec: unknown) => spec,
  applyLivePhenotype: (spec: unknown) => spec,
  clearForgedBody: vi.fn(),
  createDNAReadyBodyPacket: () => ({}),
  createGenomeBodySpec: () => null,
  getGenomeVisualFingerprint: () => 'forge-test',
  loadForgedBody: () => null,
  saveForgedBody: vi.fn(),
}));

vi.mock('@/lib/media/svgToPngDataUrl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/media/svgToPngDataUrl')>();
  return {
    ...actual,
    svgElementToPngDataUrl: vi.fn(),
  };
});

const exportAvatar = vi.mocked(svgElementToPngDataUrl);

describe('Body Forge identity avatar export', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.renderSvg = true;
    mocks.push.mockClear();
    mocks.store.setPetType.mockClear();
    exportAvatar.mockReset();
    exportAvatar.mockResolvedValue(VALID_PNG);
    useIdentityProfileStore.setState({
      profile: defaultIdentityProfile,
      lastSavedAt: null,
      status: 'idle',
    });
  });

  it('saves a valid identity avatar, shows its thumbnail, and links to Identity', async () => {
    render(<BodyForge />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as avatar' }));

    expect(await screen.findByText('Saved as your avatar')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Saved identity avatar' })).toHaveAttribute(
      'src',
      VALID_PNG,
    );
    expect(screen.getByRole('link', { name: 'View in Identity' })).toHaveAttribute(
      'href',
      '/identity',
    );
    expect(loadIdentityProfile().avatarDataUrl).toBe(VALID_PNG);
    expect(mocks.store.setPetType).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('requires confirmation before replacing an existing avatar', async () => {
    useIdentityProfileStore.setState({
      profile: { ...defaultIdentityProfile, avatarDataUrl: VALID_PNG },
    });
    render(<BodyForge />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as avatar' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Current identity avatar' })).toHaveAttribute(
      'src',
      VALID_PNG,
    );
    expect(exportAvatar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Replace avatar' }));
    expect(await screen.findByText('Saved as your avatar')).toBeInTheDocument();
    expect(exportAvatar).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid export without changing the identity profile', async () => {
    exportAvatar.mockResolvedValue('data:text/html;base64,PGgxPm5vPC9oMT4=');
    render(<BodyForge />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as avatar' }));

    expect(await screen.findByText(/valid PNG, JPEG, WebP, or GIF/i)).toBeInTheDocument();
    expect(loadIdentityProfile()).toEqual(defaultIdentityProfile);
  });

  it('rejects an oversized export without changing the identity profile', async () => {
    exportAvatar.mockResolvedValue(
      `data:image/png;base64,iVBORw0KGgo${'A'.repeat(
        Math.ceil((MAX_AVATAR_BYTES * 4) / 3) + 20,
      )}`,
    );
    render(<BodyForge />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as avatar' }));

    expect(await screen.findByText(/512 KB or smaller/i)).toBeInTheDocument();
    expect(loadIdentityProfile()).toEqual(defaultIdentityProfile);
  });

  it('handles canvas security failures with a safe message', async () => {
    exportAvatar.mockRejectedValue(new DOMException('Tainted canvas', 'SecurityError'));
    render(<BodyForge />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as avatar' }));

    expect(await screen.findByText(/browser may be blocking image/i)).toBeInTheDocument();
    expect(screen.queryByText(/tainted canvas/i)).not.toBeInTheDocument();
    expect(loadIdentityProfile()).toEqual(defaultIdentityProfile);
  });

  it('handles a missing SVG preview without attempting an export', async () => {
    mocks.renderSvg = false;
    render(<BodyForge />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as avatar' }));

    await waitFor(() => {
      expect(screen.getByText(/could not find the body preview/i)).toBeInTheDocument();
    });
    expect(exportAvatar).not.toHaveBeenCalled();
  });
});
