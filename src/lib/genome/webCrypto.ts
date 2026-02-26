import type { GenomeCryptoAdapter } from '@metapet/core/genome';

const encoder = new TextEncoder();

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return bufferToHex(digest);
}

async function hmacSHA256(data: string, key: string): Promise<string> {
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', keyData, encoder.encode(data));
  return bufferToHex(signature);
}

export const webGenomeCryptoAdapter: GenomeCryptoAdapter = {
  hmacSHA256,
  sha256,
};
