import { beforeEach, describe, expect, it } from 'vitest';
import { SACRED_HALO_BATTLE_WINS } from './catalog';
import {
  createDefaultMetaPetProgress,
  type MetaPetProgress,
} from './progress';
import {
  UNLOCK_SOURCES,
  WARDROBE_INVENTORY_STORAGE_KEY,
  sanitizeWardrobeInventory,
  useWardrobeStore,
} from './store';

function resetWardrobeStore() {
  localStorage.removeItem(WARDROBE_INVENTORY_STORAGE_KEY);
  useWardrobeStore.setState({
    ownedItemIds: [],
    equippedBySlot: {},
    newlyUnlockedItemIds: [],
    unlockHistory: [],
  });
}

function progressWith(
  mutate: (progress: MetaPetProgress) => void,
): MetaPetProgress {
  const progress = createDefaultMetaPetProgress();
  mutate(progress);
  return progress;
}

beforeEach(resetWardrobeStore);

describe('grantWardrobeItems', () => {
  it('grants exactly once and records history', () => {
    const store = useWardrobeStore.getState();
    const first = store.grantWardrobeItems(['halo-sacred'], 'test');
    const second = store.grantWardrobeItems(['halo-sacred'], 'test');

    expect(first).toEqual(['halo-sacred']);
    expect(second).toEqual([]);

    const state = useWardrobeStore.getState();
    expect(
      state.ownedItemIds.filter((id) => id === 'halo-sacred'),
    ).toHaveLength(1);
    expect(
      state.unlockHistory.filter((entry) => entry.itemId === 'halo-sacred'),
    ).toHaveLength(1);
    expect(state.newlyUnlockedItemIds).toEqual(['halo-sacred']);
  });

  it('ignores unknown item ids', () => {
    const granted = useWardrobeStore
      .getState()
      .grantWardrobeItems(['no-such-item'], 'test');
    expect(granted).toEqual([]);
    expect(useWardrobeStore.getState().ownedItemIds).toEqual([]);
  });

  it('silent grants skip the ceremony queue', () => {
    useWardrobeStore
      .getState()
      .grantWardrobeItems(['effect-sparkle'], 'default', { announce: false });
    expect(useWardrobeStore.getState().newlyUnlockedItemIds).toEqual([]);
  });
});

describe('reconcileWithProgress', () => {
  it('gives a fresh profile the default Sparkle Trail without a ceremony', () => {
    useWardrobeStore
      .getState()
      .reconcileWithProgress(createDefaultMetaPetProgress());
    const state = useWardrobeStore.getState();
    expect(state.ownedItemIds).toContain('effect-sparkle');
    expect(state.newlyUnlockedItemIds).not.toContain('effect-sparkle');
  });

  it('grants earned items once and queues one unlock event', () => {
    const progress = progressWith((p) => {
      p.battle.wins = SACRED_HALO_BATTLE_WINS;
    });
    useWardrobeStore
      .getState()
      .reconcileWithProgress(progress, UNLOCK_SOURCES.reconciliation);
    // Second pass (e.g. remount) must be a no-op.
    useWardrobeStore
      .getState()
      .reconcileWithProgress(progress, UNLOCK_SOURCES.reconciliation);

    const state = useWardrobeStore.getState();
    expect(
      state.ownedItemIds.filter((id) => id === 'halo-sacred'),
    ).toHaveLength(1);
    expect(
      state.newlyUnlockedItemIds.filter((id) => id === 'halo-sacred'),
    ).toHaveLength(1);
  });

  it('keeps earned items when the qualifying stat later falls', () => {
    const earned = progressWith((p) => {
      p.battle.wins = SACRED_HALO_BATTLE_WINS;
    });
    useWardrobeStore.getState().reconcileWithProgress(earned);
    // Progress record is monotonic in production, but even a lower value
    // must never revoke ownership.
    useWardrobeStore
      .getState()
      .reconcileWithProgress(createDefaultMetaPetProgress());
    expect(useWardrobeStore.getState().ownedItemIds).toContain('halo-sacred');
  });

  it('repairs equipment pointing at unowned items', () => {
    useWardrobeStore.setState({
      equippedBySlot: { head: 'halo-sacred' }, // not owned
    });
    useWardrobeStore
      .getState()
      .reconcileWithProgress(createDefaultMetaPetProgress());
    expect(useWardrobeStore.getState().equippedBySlot.head).toBeUndefined();
  });
});

describe('equip and unequip', () => {
  it('validates existence and ownership', () => {
    const store = useWardrobeStore.getState();
    expect(store.equipWardrobeItem('no-such-item')).toEqual({
      success: false,
      reason: 'unknown-item',
    });
    expect(store.equipWardrobeItem('crown-gold')).toEqual({
      success: false,
      reason: 'not-owned',
    });
  });

  it('equips owned items and replaces the slot occupant', () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(['crown-gold', 'halo-sacred'], 'test');

    const first = store.equipWardrobeItem('crown-gold');
    expect(first).toEqual({ success: true, slot: 'head' });
    expect(useWardrobeStore.getState().equippedBySlot.head).toBe('crown-gold');

    const replace = useWardrobeStore.getState().equipWardrobeItem('halo-sacred');
    expect(replace).toEqual({
      success: true,
      slot: 'head',
      replacedItemId: 'crown-gold',
    });
    expect(useWardrobeStore.getState().equippedBySlot.head).toBe('halo-sacred');
  });

  it('unequips a slot and reports equipped state', () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(['aura-fire'], 'test');
    store.equipWardrobeItem('aura-fire');
    expect(useWardrobeStore.getState().isWardrobeItemEquipped('aura-fire')).toBe(
      true,
    );

    useWardrobeStore.getState().unequipWardrobeSlot('aura');
    expect(useWardrobeStore.getState().equippedBySlot.aura).toBeUndefined();
    expect(
      useWardrobeStore.getState().isWardrobeItemEquipped('aura-fire'),
    ).toBe(false);
  });

  it('lists equipped items in wardrobe layer order', () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(
      ['crown-gold', 'aura-fire', 'effect-sparkle'],
      'test',
    );
    store.equipWardrobeItem('crown-gold');
    store.equipWardrobeItem('aura-fire');
    store.equipWardrobeItem('effect-sparkle');

    const equipped = useWardrobeStore
      .getState()
      .getEquippedWardrobeItems()
      .map((item) => item.id);
    expect(equipped).toEqual(['aura-fire', 'crown-gold', 'effect-sparkle']);
  });
});

describe('ceremony queue', () => {
  it('consumes unlock events exactly once', () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(['crown-gold'], 'test');
    expect(useWardrobeStore.getState().newlyUnlockedItemIds).toEqual([
      'crown-gold',
    ]);

    useWardrobeStore.getState().consumeNewlyUnlocked('crown-gold');
    expect(useWardrobeStore.getState().newlyUnlockedItemIds).toEqual([]);
    // Consuming again is harmless.
    useWardrobeStore.getState().consumeNewlyUnlocked('crown-gold');
    expect(useWardrobeStore.getState().newlyUnlockedItemIds).toEqual([]);
  });
});

describe('persistence and migration', () => {
  it('persists ownership and equipment immediately', () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(['crown-gold'], 'test');
    store.equipWardrobeItem('crown-gold');

    const raw = localStorage.getItem(WARDROBE_INVENTORY_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw as string).state;
    expect(persisted.ownedItemIds).toContain('crown-gold');
    expect(persisted.equippedBySlot.head).toBe('crown-gold');
  });

  it('restores state through rehydrate (refresh survival)', async () => {
    const store = useWardrobeStore.getState();
    store.grantWardrobeItems(['aura-fire'], 'test');
    store.equipWardrobeItem('aura-fire');

    // Simulate a reload: snapshot storage, wipe memory (which re-persists
    // the empty state, as a reload would not), restore the snapshot, and
    // rehydrate from it.
    const savedRaw = localStorage.getItem(WARDROBE_INVENTORY_STORAGE_KEY);
    useWardrobeStore.setState({
      ownedItemIds: [],
      equippedBySlot: {},
      newlyUnlockedItemIds: [],
      unlockHistory: [],
    });
    localStorage.setItem(WARDROBE_INVENTORY_STORAGE_KEY, savedRaw as string);
    await useWardrobeStore.persist.rehydrate();

    const state = useWardrobeStore.getState();
    expect(state.ownedItemIds).toContain('aura-fire');
    expect(state.equippedBySlot.aura).toBe('aura-fire');
  });

  it('sanitizes malformed persisted inventories', () => {
    const sanitized = sanitizeWardrobeInventory({
      ownedItemIds: ['crown-gold', 'crown-gold', 42, 'future-item'],
      equippedBySlot: {
        head: 'crown-gold',
        aura: 'aura-fire', // not owned → dropped
        bogusSlot: 'crown-gold', // invalid slot → dropped
        horns: 'crown-gold', // wrong slot for the item → dropped
      },
      newlyUnlockedItemIds: ['crown-gold', 'not-owned-item'],
      unlockHistory: [
        { itemId: 'crown-gold', unlockedAt: 1, source: 'test' },
        'garbage',
      ],
    });

    expect(sanitized.ownedItemIds).toEqual(['crown-gold', 'future-item']);
    expect(sanitized.equippedBySlot).toEqual({ head: 'crown-gold' });
    expect(sanitized.newlyUnlockedItemIds).toEqual(['crown-gold']);
    expect(sanitized.unlockHistory).toHaveLength(1);
  });

  it('keeps unknown owned ids for forward compatibility', () => {
    const sanitized = sanitizeWardrobeInventory({
      ownedItemIds: ['some-2027-item'],
    });
    expect(sanitized.ownedItemIds).toEqual(['some-2027-item']);
  });
});
