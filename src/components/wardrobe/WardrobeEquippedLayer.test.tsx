import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  WARDROBE_INVENTORY_STORAGE_KEY,
  useWardrobeStore,
} from '@/lib/wardrobe';
import { WardrobeEquippedLayer } from './WardrobeEquippedLayer';

function resetWardrobeStore() {
  localStorage.removeItem(WARDROBE_INVENTORY_STORAGE_KEY);
  useWardrobeStore.setState({
    ownedItemIds: [],
    equippedBySlot: {},
    newlyUnlockedItemIds: [],
    unlockHistory: [],
  });
}

function renderLayer(layer: 'behind' | 'front') {
  return render(
    <svg>
      <WardrobeEquippedLayer layer={layer} />
    </svg>,
  );
}

describe('WardrobeEquippedLayer', () => {
  beforeEach(resetWardrobeStore);

  it('renders nothing when no wardrobe items are equipped', () => {
    renderLayer('front');
    expect(screen.queryByTestId('wardrobe-layer-front')).toBeNull();
  });

  it('renders equipped items in their correct layer', () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(['crown-gold', 'aura-fire'], 'test');
    store.equipWardrobeItem('crown-gold'); // head → front layer
    store.equipWardrobeItem('aura-fire'); // aura → behind layer

    renderLayer('front');
    expect(screen.getByTestId('wardrobe-equipped-crown-gold')).toBeTruthy();
    expect(screen.queryByTestId('wardrobe-equipped-aura-fire')).toBeNull();

    renderLayer('behind');
    expect(screen.getByTestId('wardrobe-equipped-aura-fire')).toBeTruthy();
  });

  it('reflects unequip immediately', () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(['crown-gold'], 'test');
    store.equipWardrobeItem('crown-gold');

    const { rerender } = renderLayer('front');
    expect(screen.getByTestId('wardrobe-equipped-crown-gold')).toBeTruthy();

    useWardrobeStore.getState().unequipWardrobeSlot('head');
    rerender(
      <svg>
        <WardrobeEquippedLayer layer="front" />
      </svg>,
    );
    expect(screen.queryByTestId('wardrobe-equipped-crown-gold')).toBeNull();
  });
});
