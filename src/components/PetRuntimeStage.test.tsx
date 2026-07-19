import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PetRuntimeStage } from './PetRuntimeStage';

type PetType = 'auralia' | 'evolved' | 'geometry';

let petType: PetType = 'auralia';
const genome = {
  red60: [1, 2, 3],
  blue60: [4, 5, 6],
  black60: [0, 6, 1],
};

vi.mock('@/lib/store', () => ({
  useStore: (
    selector: (state: { petType: PetType; genome: typeof genome }) => unknown,
  ) => selector({ petType, genome }),
}));

vi.mock('@/components/AuraliaMetaPet', () => ({
  default: () => <div data-testid="auralia-renderer" />,
}));

vi.mock('@/components/VisualDNAPet', () => ({
  VisualDNAPet: () => <div data-testid="visual-dna-renderer" />,
}));

vi.mock('@/components/SriYantraPetDisplay', () => ({
  SriYantraPetDisplay: ({
    red,
    blue,
    black,
  }: {
    red?: string;
    blue?: string;
    black?: string;
  }) => (
    <div
      data-testid="geometry-renderer"
      data-red={red}
      data-blue={blue}
      data-black={black}
    />
  ),
}));

beforeEach(() => {
  petType = 'auralia';
});

describe('PetRuntimeStage', () => {
  it('uses Auralia as the default companion form', () => {
    render(<PetRuntimeStage />);

    expect(screen.getByTestId('auralia-pet-runtime')).toBeInTheDocument();
    expect(screen.getByTestId('auralia-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('visual-dna-renderer')).not.toBeInTheDocument();
  });

  it('uses Visual DNA and the forged body for the Evolved form', () => {
    petType = 'evolved';
    render(<PetRuntimeStage />);

    expect(screen.getByTestId('visual-dna-pet-runtime')).toBeInTheDocument();
    expect(screen.getByTestId('visual-dna-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('auralia-renderer')).not.toBeInTheDocument();
  });

  it('projects the live Moss60 genome through the Geometry wrapper', () => {
    petType = 'geometry';
    render(<PetRuntimeStage />);

    // The stage must not talk to SriYantraPetDisplay directly: the strands it
    // receives are derived (and padded to 60 digits) by GeometryAvatarRenderer.
    const renderer = screen.getByTestId('geometry-renderer');
    expect(screen.getByTestId('geometry-pet-runtime')).toBeInTheDocument();
    expect(renderer.getAttribute('data-red')).toMatch(/^123\d{57}$/);
    expect(renderer.getAttribute('data-blue')).toMatch(/^456\d{57}$/);
    expect(renderer.getAttribute('data-black')).toMatch(/^061\d{57}$/);
  });
});
