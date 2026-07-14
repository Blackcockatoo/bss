import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PetHero } from './PetHero';

const state = vi.hoisted(() => ({
  petType: 'geometry' as 'auralia' | 'evolved' | 'geometry',
  systemState: 'active',
  feed: vi.fn(),
  play: vi.fn(),
  clean: vi.fn(),
  sleep: vi.fn(),
}));

vi.mock('@/lib/store', () => ({
  useStore: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock('@/lib/haptics', () => ({ triggerHaptic: vi.fn() }));
vi.mock('./GeometryAvatarRenderer', () => ({
  GeometryAvatarRenderer: () => <div data-testid="geometry-avatar-renderer" />,
}));
vi.mock('./AuraliaSprite', () => ({
  default: () => <div data-testid="auralia-sprite" />,
}));
vi.mock('./VisualDNAPet', () => ({
  VisualDNAPet: () => <div data-testid="visual-dna-pet" />,
}));

describe('PetHero', () => {
  beforeEach(() => {
    state.petType = 'geometry';
  });

  it('uses GeometryAvatarRenderer for the Geometry hero presentation', () => {
    render(<PetHero staticMode />);

    expect(screen.getByTestId('geometry-avatar-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('auralia-sprite')).not.toBeInTheDocument();
  });

  it('keeps the existing Auralia hero presentation', () => {
    state.petType = 'auralia';
    render(<PetHero staticMode />);

    expect(screen.getByTestId('auralia-sprite')).toBeInTheDocument();
    expect(screen.queryByTestId('geometry-avatar-renderer')).not.toBeInTheDocument();
  });

  it('uses the forged Visual DNA body for the Evolved hero presentation', () => {
    state.petType = 'evolved';
    render(<PetHero staticMode />);

    expect(screen.getByTestId('visual-dna-pet')).toBeInTheDocument();
    expect(screen.queryByTestId('auralia-sprite')).not.toBeInTheDocument();
    expect(screen.queryByTestId('geometry-avatar-renderer')).not.toBeInTheDocument();
  });
});
