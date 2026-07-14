import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PetRuntimeStage } from './PetRuntimeStage';

let petType: 'geometric' | 'auralia' = 'geometric';

vi.mock('@/lib/store', () => ({
  useStore: (selector: (state: { petType: typeof petType }) => unknown) =>
    selector({ petType }),
}));

vi.mock('@/components/AuraliaMetaPet', () => ({
  default: () => <div data-testid="auralia-renderer" />,
}));

vi.mock('@/components/VisualDNAPet', () => ({
  VisualDNAPet: () => <div data-testid="visual-dna-renderer" />,
}));

beforeEach(() => {
  petType = 'geometric';
});

describe('PetRuntimeStage', () => {
  it('uses the Visual DNA and Body Forge renderer for the geometric companion', () => {
    render(<PetRuntimeStage />);

    expect(screen.getByTestId('visual-dna-pet-runtime')).toBeInTheDocument();
    expect(screen.getByTestId('visual-dna-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('auralia-renderer')).not.toBeInTheDocument();
  });

  it('preserves the specialist Auralia renderer only when Auralia is selected', () => {
    petType = 'auralia';
    render(<PetRuntimeStage />);

    expect(screen.getByTestId('auralia-pet-runtime')).toBeInTheDocument();
    expect(screen.getByTestId('auralia-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('visual-dna-renderer')).not.toBeInTheDocument();
  });
});
