import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Crypto API for tests
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = await import('node:crypto');
  globalThis.crypto = webcrypto as Crypto;
}
