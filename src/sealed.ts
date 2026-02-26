const SEALED_UNSUPPORTED_MESSAGE =
  'Sealed exports are unavailable in this environment. Use the cryptographic sealed export in src/lib/persistence/sealed.ts.';

/**
 * Sealed export is not supported in this environment.
 * Use the cryptographic sealed export utilities instead.
 */
export async function createSealedExport(): Promise<string> {
  throw new Error(SEALED_UNSUPPORTED_MESSAGE);
}

/**
 * Sealed import is not supported in this environment.
 * Use the cryptographic sealed export utilities instead.
 */
export async function importSealedExport(): Promise<never> {
  throw new Error(SEALED_UNSUPPORTED_MESSAGE);
}
