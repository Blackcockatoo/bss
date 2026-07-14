import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PetRuntimeStage } from './PetRuntimeStage';

let petType: 'auralia' | 'evolved' | 'geometry' = 'evolved';

vi.mock('@/lib/store', () => ({
  useStore: (
    selector: (state: { petType: typeof petType; genome: null }) => unknown,
  ) => selector({ petType, genome: null }),
}));

vi.mock('@/components/AuraliaMetaPet', () => ({
  default: () => <div data-testid="auralia-renderer" />,
}));

vi.mock('@/components/AuraliaSprite', () => ({
  default: () => <div data-testid="auralia-sprite-renderer" />,
}));

vi.mock('@/components/VisualDNAPet', () => ({
  VisualDNAPet: () => <div data-testid="visual-dna-renderer" />,
}));

vi.mock('@/components/SriYantraPetDisplay', () => ({
  SriYantraPetDisplay: () => <div data-testid="sri-yantra-renderer" />,
}));

beforeEach(() => {
  petType = 'evolved';
});

describe('PetRuntimeStage', () => {
  it('uses the Visual DNA and Body Forge renderer for the Evolved form', () => {
    render(<PetRuntimeStage />);

    expect(screen.getByTestId('visual-dna-pet-runtime')).toBeInTheDocument();
    expect(screen.getByTestId('visual-dna-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('auralia-renderer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sri-yantra-renderer')).not.toBeInTheDocument();
  });

  it('preserves the specialist Auralia renderer only when Auralia is selected', () => {
    petType = 'auralia';
    render(<PetRuntimeStage />);

    expect(screen.getByTestId('auralia-pet-runtime')).toBeInTheDocument();
    expect(screen.getByTestId('auralia-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('visual-dna-renderer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sri-yantra-renderer')).not.toBeInTheDocument();
  });

  it('renders the Sri Yantra manifestation for the Geometry form', () => {
    petType = 'geometry';
    render(<PetRuntimeStage />);

    expect(screen.getByTestId('geometry-pet-runtime')).toBeInTheDocument();
    expect(screen.getByTestId('sri-yantra-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('visual-dna-renderer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auralia-renderer')).not.toBeInTheDocument();
  });
});
