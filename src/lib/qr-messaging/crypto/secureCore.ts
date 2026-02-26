const ENVELOPE_VERSION = 1;
const HANDSHAKE_PREFIX = 'SECURE1';

type VersionedCipherEnvelope = {
  v: number;
  alg: 'AES-GCM-256';
  iv: string;
  ciphertext: string;
};

type SecureHandshakePayload = {
  v: number;
  alg: 'ECDH-P256';
  pub: string;
};

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(base64: string): ArrayBuffer {
  const decoded = atob(base64);
  const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function ensureWebCrypto(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API is unavailable. Secure mode is not supported in this runtime.');
  }
  return crypto.subtle;
}

export function isSecureCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle;
}

export async function createSecureHandshakeIdentity(): Promise<{
  privateKey: string;
  publicEnvelope: string;
}> {
  const subtle = ensureWebCrypto();
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  const privatePkcs8 = await subtle.exportKey('pkcs8', keyPair.privateKey);
  const publicSpki = await subtle.exportKey('spki', keyPair.publicKey);

  const payload: SecureHandshakePayload = {
    v: ENVELOPE_VERSION,
    alg: 'ECDH-P256',
    pub: toBase64(new Uint8Array(publicSpki)),
  };

  return {
    privateKey: toBase64(new Uint8Array(privatePkcs8)),
    publicEnvelope: `${HANDSHAKE_PREFIX}:${btoa(JSON.stringify(payload))}`,
  };
}

export function parseSecureHandshakeEnvelope(envelope: string): SecureHandshakePayload {
  if (!envelope.startsWith(`${HANDSHAKE_PREFIX}:`)) {
    throw new Error('Remote secure handshake payload is invalid.');
  }
  const encoded = envelope.substring(HANDSHAKE_PREFIX.length + 1);
  const payload = JSON.parse(atob(encoded)) as SecureHandshakePayload;

  if (payload.v !== ENVELOPE_VERSION || payload.alg !== 'ECDH-P256' || !payload.pub) {
    throw new Error('Unsupported secure handshake payload version or algorithm.');
  }

  return payload;
}

export async function deriveSecureSharedKey(privateKey: string, remotePublicKey: string): Promise<string> {
  const subtle = ensureWebCrypto();
  const privateCryptoKey = await subtle.importKey(
    'pkcs8',
    fromBase64(privateKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  const remotePublicCryptoKey = await subtle.importKey(
    'spki',
    fromBase64(remotePublicKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const aesKey = await subtle.deriveKey(
    { name: 'ECDH', public: remotePublicCryptoKey },
    privateCryptoKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const rawAes = await subtle.exportKey('raw', aesKey);
  return toBase64(new Uint8Array(rawAes));
}

async function importAesKey(sharedKey: string): Promise<CryptoKey> {
  const subtle = ensureWebCrypto();
  return subtle.importKey('raw', fromBase64(sharedKey), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function secureEncrypt(plaintext: string, sharedKey: string): Promise<string> {
  const subtle = ensureWebCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(sharedKey);
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const envelope: VersionedCipherEnvelope = {
    v: ENVELOPE_VERSION,
    alg: 'AES-GCM-256',
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };

  return `${HANDSHAKE_PREFIX}:${btoa(JSON.stringify(envelope))}`;
}

export async function secureDecrypt(ciphertext: string, sharedKey: string): Promise<string> {
  if (!ciphertext.startsWith(`${HANDSHAKE_PREFIX}:`)) {
    throw new Error('Ciphertext does not contain a secure envelope prefix.');
  }

  const subtle = ensureWebCrypto();
  const payload = JSON.parse(atob(ciphertext.substring(HANDSHAKE_PREFIX.length + 1))) as VersionedCipherEnvelope;

  if (payload.v !== ENVELOPE_VERSION || payload.alg !== 'AES-GCM-256') {
    throw new Error('Unsupported secure envelope version or algorithm.');
  }

  const key = await importAesKey(sharedKey);
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

export async function generateSigningKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
  const subtle = ensureWebCrypto();
  const keyPair = await subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const privatePkcs8 = await subtle.exportKey('pkcs8', keyPair.privateKey);
  const publicSpki = await subtle.exportKey('spki', keyPair.publicKey);

  return {
    privateKey: toBase64(new Uint8Array(privatePkcs8)),
    publicKey: toBase64(new Uint8Array(publicSpki)),
  };
}

export async function signPayload(payload: string, privateKey: string): Promise<string> {
  const subtle = ensureWebCrypto();
  const signingKey = await subtle.importKey(
    'pkcs8',
    fromBase64(privateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(payload)
  );

  return toBase64(new Uint8Array(signature));
}

export async function verifySignature(payload: string, signature: string, publicKey: string): Promise<boolean> {
  const subtle = ensureWebCrypto();
  const verifyKey = await subtle.importKey(
    'spki',
    fromBase64(publicKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );

  return subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    verifyKey,
    fromBase64(signature),
    new TextEncoder().encode(payload)
  );
}
