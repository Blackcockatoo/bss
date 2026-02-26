/**
 * Addon Minting System
 *
 * Creates cryptographically-signed addon instances from templates
 */

import type { Addon, AddonMintRequest } from './types';
import type { AddonTemplate } from './catalog';
import { getAddonTemplate } from './catalog';
import { signAddon, generateNonce } from './crypto';

/**
 * Mint a new addon instance with crypto signatures
 *
 * @param request Minting request parameters
 * @param issuerPrivateKey Private key of the issuer (addon creator/marketplace)
 * @param issuerPublicKey Public key of the issuer
 * @param ownerPrivateKey Private key of the recipient (for owner signature)
 * @returns Fully signed Addon instance
 */
export async function mintAddon(
  request: AddonMintRequest,
  issuerPrivateKey: string,
  issuerPublicKey: string,
  ownerPrivateKey: string
): Promise<Addon> {
  // Get the addon template
  const template = getAddonTemplate(request.addonTypeId);
  if (!template) {
    throw new Error(`Addon template not found: ${request.addonTypeId}`);
  }

  // Check edition limits
  if (template.metadata.maxEditions && request.edition) {
    if (request.edition > template.metadata.maxEditions) {
      throw new Error(
        `Edition ${request.edition} exceeds max editions (${template.metadata.maxEditions})`
      );
    }
  }

  const issuedAt = Date.now();
  const nonce = generateNonce();

  // Create the addon instance (without signatures yet)
  const partialAddon: Partial<Addon> = {
    id: `${template.id}-${request.edition || Date.now()}`,
    name: template.name,
    description: template.description,
    category: template.category,
    rarity: template.rarity,
    attachment: template.attachment,
    visual: template.visual,
    modifiers: template.modifiers,
    metadata: {
      ...template.metadata,
      createdAt: issuedAt,
      edition: request.edition,
      ...(request.metadata || {}),
    },
    ownership: {
      ownerPublicKey: request.recipientPublicKey,
      signature: '', // Will be filled
      issuedAt,
      issuerPublicKey,
      issuerSignature: '', // Will be filled
      nonce,
    },
  };

  // Sign with owner's key
  const ownerSignature = await signAddon(
    partialAddon,
    request.recipientPublicKey,
    ownerPrivateKey,
    nonce,
    issuedAt
  );

  // Sign with issuer's key
  const issuerSignature = await signAddon(
    partialAddon,
    request.recipientPublicKey,
    issuerPrivateKey,
    nonce,
    issuedAt
  );

  // Create the final addon with signatures
  const addon: Addon = {
    ...partialAddon,
    ownership: {
      ownerPublicKey: request.recipientPublicKey,
      signature: ownerSignature,
      issuedAt,
      issuerPublicKey,
      issuerSignature,
      nonce,
    },
  } as Addon;

  return addon;
}

/**
 * Mint a time-limited addon (expires after a certain period)
 *
 * @param request Minting request
 * @param issuerPrivateKey Issuer private key
 * @param issuerPublicKey Issuer public key
 * @param ownerPrivateKey Owner private key
 * @param expiresInMs Time until expiration in milliseconds
 * @returns Addon with expiration timestamp
 */
export async function mintTimeLimitedAddon(
  request: AddonMintRequest,
  issuerPrivateKey: string,
  issuerPublicKey: string,
  ownerPrivateKey: string,
  expiresInMs: number
): Promise<Addon> {
  const addon = await mintAddon(
    request,
    issuerPrivateKey,
    issuerPublicKey,
    ownerPrivateKey
  );

  // Add expiration
  addon.ownership.expiresAt = Date.now() + expiresInMs;

  return addon;
}

/**
 * Batch mint multiple addons (for airdrops, etc.)
 */
export async function batchMintAddons(
  requests: AddonMintRequest[],
  issuerPrivateKey: string,
  issuerPublicKey: string,
  ownerPrivateKeys: Record<string, string> // Map of publicKey -> privateKey
): Promise<Addon[]> {
  const addons: Addon[] = [];

  for (const request of requests) {
    const ownerPrivateKey = ownerPrivateKeys[request.recipientPublicKey];
    if (!ownerPrivateKey) {
      console.warn(
        `Skipping addon for ${request.recipientPublicKey} - no private key provided`
      );
      continue;
    }

    try {
      const addon = await mintAddon(
        request,
        issuerPrivateKey,
        issuerPublicKey,
        ownerPrivateKey
      );
      addons.push(addon);
    } catch (error) {
      console.error(`Failed to mint addon for ${request.recipientPublicKey}:`, error);
    }
  }

  return addons;
}

/**
 * Create a gift addon (for sending to another user)
 * This creates an addon that can be claimed by the recipient
 */
export async function createGiftAddon(
  addonTypeId: string,
  senderPublicKey: string,
  senderPrivateKey: string,
  recipientPublicKey: string,
  issuerPrivateKey: string,
  issuerPublicKey: string
): Promise<{
  addon: Addon;
  claimCode: string;
}> {
  const addon = await mintAddon(
    {
      addonTypeId,
      recipientPublicKey,
    },
    issuerPrivateKey,
    issuerPublicKey,
    senderPrivateKey
  );

  // Generate a claim code (simple base64 of addon ID + nonce)
  const claimData = {
    addonId: addon.id,
    nonce: addon.ownership.nonce,
    from: senderPublicKey,
    to: recipientPublicKey,
  };
  const claimCode = btoa(JSON.stringify(claimData));

  return { addon, claimCode };
}

/**
 * Validate a gift claim code
 */
export function validateClaimCode(claimCode: string): {
  valid: boolean;
  addonId?: string;
  recipientPublicKey?: string;
} {
  try {
    const claimData = JSON.parse(atob(claimCode));

    if (!claimData.addonId || !claimData.to || !claimData.nonce) {
      return { valid: false };
    }

    return {
      valid: true,
      addonId: claimData.addonId,
      recipientPublicKey: claimData.to,
    };
  } catch (error) {
    return { valid: false };
  }
}
