export type Vault = 'red' | 'blue' | 'black';
export type Rotation = 'CW' | 'CCW';
export type PrivacyPreset = 'stealth' | 'standard' | 'radiant';

export interface PrimeTailID {
  vault: Vault;
  rotation: Rotation;
  tail: [number, number, number, number]; // base-60 digits (0..59)
  coronatedAt: number; // epoch ms
  dnaHash: string; // sha256(DNA)
  mirrorHash: string; // sha256(reverse(DNA))
  signature: string; // versioned HMAC
}

export interface HeptaPayload {
  version: 1;
  preset: PrivacyPreset;
  vault: Vault;
  rotation: Rotation;
  tail: [number, number, number, number];
  epoch13: number; // 13-bit epoch (minutes mod 8192)
  nonce14: number; // 14-bit nonce
  /** Indicates which fields are masked based on the preset (set during decode) */
  _masked?: {
    vault: boolean;
    rotation: boolean;
    tail: boolean;
  };
}

export type HeptaDigits = readonly number[]; // 42 base-7 digits (0..6)
