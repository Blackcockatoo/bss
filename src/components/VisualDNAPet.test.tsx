import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EvolutionData } from '@/evolution/types';
import type { DerivedTraits, Genome } from '@/genome/types';
import { DEFAULT_VITALS, type Vitals } from '@/vitals';

const traits: DerivedTraits = {
  physical: {
    bodyType: 'Crystalline',
    primaryColor: '#123456',
    secondaryColor: '#abcdef',
    pattern: 'Gradient',
    texture: 'Glowing',
    size: 0.92,
    proportions: { headRatio: 1, limbRatio: 0.8, tailRatio: 1.15 },
    features: ['Wings', 'Third Eye'],
  },
  personality: {
    temperament: 'Curious',
    energy: 76,
    social: 65,
    curiosity: 88,
    discipline: 52,
    affection: 72,
    independence: 48,
    playfulness: 81,
    loyalty: 79,
    quirks: [],
  },
  latent: {
    evolutionPath: 'Mystic Sage',
    rareAbilities: [],
    potential: { physical: 70, mental: 80, social: 75 },
    hiddenGenes: [3, 7, 11, 23],
  },
  elementWeb: {
    usedResidues: [1, 3, 7],
    pairSlots: [2, 8],
    frontierSlots: [5],
    voidSlotsHit: [0],
    coverage: 0.74,
    frontierAffinity: 0.22,
    bridgeCount: 6,
    voidDrift: 0.12,
  },
};

const genome: Genome = {
  red60: Array.from({ length: 60 }, (_, i) => (i * 7 + 3) % 10),
  blue60: Array.from({ length: 60 }, (_, i) => (i * 5 + 1) % 10),
  black60: Array.from({ length: 60 }, (_, i) => (i * 3 + 2) % 10),
};

const evolution: EvolutionData = {
  state: 'NEURO',
  birthTime: 0,
  lastEvolutionTime: 0,
  experience: 0,
  level: 5,
  currentLevelXp: 0,
  totalXp: 0,
  totalInteractions: 20,
  canEvolve: false,
};

interface MockStoreState {
  genome: Genome | null;
  traits: DerivedTraits | null;
  vitals: Vitals;
  evolution: EvolutionData;
  lastAction: null | 'feed' | 'clean' | 'play' | 'sleep';
  lastActionAt: number;
}

let storeState: MockStoreState;

async function loadVisualDNAPet() {
  vi.resetModules();
  vi.doMock('@/lib/store', () => ({
    useStore: (selector: (state: MockStoreState) => unknown) => selector(storeState),
  }));
  const mod = await import('./VisualDNAPet');
  return mod.VisualDNAPet;
}

beforeEach(() => {
  window.localStorage.clear();
  storeState = {
    genome,
    traits,
    vitals: { ...DEFAULT_VITALS },
    evolution,
    lastAction: null,
    lastActionAt: 0,
  };
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/lib/store');
  window.localStorage.clear();
});

describe('VisualDNAPet renderer', () => {
  it('mounts exactly one authoritative body renderer and no hidden legacy body', async () => {
    const VisualDNAPet = await loadVisualDNAPet();
    const { container } = render(<VisualDNAPet />);

    await waitFor(() => {
      expect(container.querySelectorAll('svg[aria-label$="body"]')).toHaveLength(1);
    });
    expect(container.querySelectorAll('.opacity-0')).toHaveLength(0);
  });

  it('shows the pure DNA body source until a forged body is saved, then reflects the forge', async () => {
    const VisualDNAPet = await loadVisualDNAPet();
    render(<VisualDNAPet />);

    await screen.findByText('180-digit DNA');

    const { saveForgedBody } = await import('@/visual-dna/bodyForgeAdapter');
    const { DEFAULT_BODY_SPEC } = await import('@/components/body-forge/PetBodyRenderer');

    act(() => {
      saveForgedBody({ ...DEFAULT_BODY_SPEC, name: 'Test Forge' }, genome, 1);
    });

    await screen.findByText('Forge + live DNA');
  });

  it('returns to the pure DNA body once the forged body is cleared', async () => {
    const { saveForgedBody } = await import('@/visual-dna/bodyForgeAdapter');
    const { DEFAULT_BODY_SPEC } = await import('@/components/body-forge/PetBodyRenderer');
    saveForgedBody({ ...DEFAULT_BODY_SPEC, name: 'Test Forge' }, genome, 1);

    const VisualDNAPet = await loadVisualDNAPet();
    render(<VisualDNAPet />);

    const clearButton = await screen.findByRole('button', { name: /use pure dna body/i });
    act(() => {
      clearButton.click();
    });

    await screen.findByText('180-digit DNA');
  });

  it('etches the reached stage onto the body and re-etches it when the pet evolves', async () => {
    const VisualDNAPet = await loadVisualDNAPet();
    const { container, rerender } = render(<VisualDNAPet />);

    // NEURO wears the synapse lattice.
    await waitFor(() => {
      expect(container.querySelector('[data-evolution-mark="lattice"]')).toBeTruthy();
    });
    expect(container.querySelector('[data-evolution-mark="crown"]')).toBeNull();

    act(() => {
      storeState.evolution = { ...evolution, state: 'SPECIATION' };
    });
    rerender(<VisualDNAPet />);

    // The apex swaps the sigil — the same creature, visibly further along.
    await waitFor(() => {
      expect(container.querySelector('[data-evolution-mark="crown"]')).toBeTruthy();
    });
    expect(container.querySelector('[data-evolution-mark="lattice"]')).toBeNull();
  });

  it('performs the evolution ceremony on the body when the stage actually changes', async () => {
    const clips: string[] = [];
    const listen = (event: Event) => {
      clips.push(String((event as CustomEvent).detail));
    };
    window.addEventListener('bss:moss60:active-clip', listen);

    try {
      const VisualDNAPet = await loadVisualDNAPet();
      const { rerender } = render(<VisualDNAPet />);

      // Mounting an already-evolved save must not replay a ceremony the
      // player already had.
      await waitFor(() => expect(clips.length).toBeGreaterThan(0));
      expect(clips).not.toContain('evolution_ceremony');

      await act(async () => {
        storeState.evolution = { ...evolution, state: 'QUANTUM' };
      });
      rerender(<VisualDNAPet />);

      await waitFor(() => {
        expect(clips).toContain('evolution_ceremony');
      });
    } finally {
      window.removeEventListener('bss:moss60:active-clip', listen);
    }
  });

  it('renders equipped wardrobe cosmetics on the live pet and removes them on unequip', async () => {
    const VisualDNAPet = await loadVisualDNAPet();
    const { useWardrobeProgressionStore } = await import('@/lib/wardrobe/store');
    const { createDefaultProgress } = await import('@/lib/wardrobe/progress');

    // Own + equip the crown through the real store APIs.
    act(() => {
      useWardrobeProgressionStore.setState({
        progress: createDefaultProgress(),
        inventory: {
          ownedItemIds: ['effect-sparkle', 'crown-gold'],
          equippedBySlot: {},
          newlyUnlockedItemIds: [],
          unlockHistory: [],
        },
      });
      const result = useWardrobeProgressionStore.getState().equipWardrobeItem('crown-gold');
      expect(result.ok).toBe(true);
    });

    const { container } = render(<VisualDNAPet />);
    await waitFor(() => {
      expect(container.querySelector('[data-cosmetic-id="crown-gold"]')).toBeTruthy();
    });

    act(() => {
      useWardrobeProgressionStore.getState().unequipWardrobeSlot('head');
    });
    await waitFor(() => {
      expect(container.querySelector('[data-cosmetic-id="crown-gold"]')).toBeNull();
    });
  });
});
