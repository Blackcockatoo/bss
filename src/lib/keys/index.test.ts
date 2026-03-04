import { beforeEach, describe, expect, it } from 'vitest';
import { getExportKeys, importExportKey } from './index';

const KEY_STORE_KEY = 'metapet-key-store';

describe('importExportKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rejects non-hex payloads even when length is 64', async () => {
    const invalid = 'z'.repeat(64);

    await expect(importExportKey('Broken', invalid)).rejects.toThrow(
      'Invalid key format - must be 64 hex characters'
    );
  });

  it('normalizes casing so same key is not imported twice', async () => {
    const lower = 'abcdef0123456789'.repeat(4);
    const upper = lower.toUpperCase();

    const first = await importExportKey('Primary', lower);
    const second = await importExportKey('Duplicate', upper);

    expect(second.id).toBe(first.id);
    expect(getExportKeys()).toHaveLength(1);

    const persistedHex = localStorage.getItem(`metapet-export-key-${first.id}`);
    expect(persistedHex).toBe(lower);

    const keyStoreRaw = localStorage.getItem(KEY_STORE_KEY);
    expect(keyStoreRaw).toBeTruthy();
  });
});
