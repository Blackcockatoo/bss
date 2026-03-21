export const ONBOARDING_SCOPES = [
  "pet",
  "school",
  "identity",
  "dna",
] as const;

export type OnboardingScope = (typeof ONBOARDING_SCOPES)[number];

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const ONBOARDING_STORAGE_PREFIX = "metapet-onboarding";

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getOnboardingStorageKey(scope: OnboardingScope) {
  return `${ONBOARDING_STORAGE_PREFIX}-${scope}`;
}

export function hasCompletedOnboarding(
  scope: OnboardingScope,
  storage?: StorageLike,
) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return false;
  }

  return targetStorage.getItem(getOnboardingStorageKey(scope)) === "true";
}

export function completeOnboarding(
  scope: OnboardingScope,
  storage?: StorageLike,
) {
  const targetStorage = resolveStorage(storage);
  targetStorage?.setItem(getOnboardingStorageKey(scope), "true");
}

export function resetOnboarding(
  scope: OnboardingScope,
  storage?: StorageLike,
) {
  const targetStorage = resolveStorage(storage);
  targetStorage?.removeItem(getOnboardingStorageKey(scope));
}
