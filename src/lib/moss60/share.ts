import { z } from 'zod';
import { moss60Hash } from '@/lib/qr-messaging/crypto';

/** Share tokens arrive in the URL, so anyone can craft one. */
const MAX_SHARE_TOKEN_LENGTH = 4096;
const shareField = z.string().max(200);

const moss60VerifiablePayloadSchema = z.object({
  metadata: z.object({
    id: shareField,
    seed: shareField,
    scheme: shareField,
    variant: shareField,
    projection: shareField,
    timestamp: z.number(),
    source: z.literal('moss60-studio'),
  }),
  digest: z.string().max(256),
});

export interface Moss60ShareMetadata {
  id: string;
  seed: string;
  scheme: string;
  variant: string;
  projection: string;
  timestamp: number;
  source: 'moss60-studio';
}

export interface Moss60VerifiablePayload {
  metadata: Moss60ShareMetadata;
  digest: string;
}

function toBase64Url(input: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(input, 'utf-8').toString('base64url');
  }

  return window.btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof window === 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf-8');
  }

  return window.atob(padded);
}

export function createMoss60VerifiablePayload(metadata: Moss60ShareMetadata): Moss60VerifiablePayload {
  const canonical = JSON.stringify(metadata);
  const digest = moss60Hash(`moss60-share:${canonical}`);
  return { metadata, digest };
}

export function verifyMoss60Payload(payload: Moss60VerifiablePayload): boolean {
  const expected = createMoss60VerifiablePayload(payload.metadata);
  return expected.digest === payload.digest;
}

export function encodeMoss60Payload(payload: Moss60VerifiablePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeMoss60Payload(token: string): Moss60VerifiablePayload | null {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_SHARE_TOKEN_LENGTH) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(token));
    // Validate shape and sizes, but return the original object so the digest
    // check still sees exactly what was signed (key order included).
    if (!moss60VerifiablePayloadSchema.safeParse(parsed).success) {
      return null;
    }
    return parsed as Moss60VerifiablePayload;
  } catch {
    return null;
  }
}

export function createShareUrl(payload: Moss60VerifiablePayload): string {
  return `/share/${encodeMoss60Payload(payload)}`;
}
