import { hashData } from './crypto';
import { encodeMoss60, decodeMoss60 } from './encoding';
import type {
  EncodingFormat,
  Moss60Capability,
  Moss60ProtocolEnvelope,
} from './types';
import { MOSS60_PREFIX, MOSS60_PROTOCOL_ID, MOSS60_PROTOCOL_VERSION } from './types';

export const REQUIRED_PROTOCOL_CAPABILITIES: Moss60Capability[] = [
  'envelope-v1',
  'qr-scan-v1',
  'qr-generate-v1',
];

function encodeByFormat(data: string, format: EncodingFormat): string {
  switch (format) {
    case 'base60':
      return encodeMoss60(data);
    case 'hex':
      return Array.from(new TextEncoder().encode(data))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    case 'json':
      try {
        return JSON.stringify(JSON.parse(data));
      } catch {
        return JSON.stringify({ data });
      }
    case 'text':
    default:
      return data;
  }
}

function decodeByFormat(payload: string, format: EncodingFormat): string {
  switch (format) {
    case 'base60':
      return decodeMoss60(payload);
    case 'hex': {
      const bytes = new Uint8Array(payload.length / 2);
      for (let i = 0; i < payload.length; i += 2) {
        bytes[i / 2] = parseInt(payload.substring(i, i + 2), 16);
      }
      return new TextDecoder().decode(bytes);
    }
    case 'json':
    case 'text':
    default:
      return payload;
  }
}

function capabilityForFormat(format: EncodingFormat): Moss60Capability {
  switch (format) {
    case 'base60':
      return 'encoding-base60';
    case 'hex':
      return 'encoding-hex';
    case 'json':
      return 'encoding-json';
    case 'text':
    default:
      return 'encoding-text';
  }
}

export function createProtocolEnvelope(
  data: string,
  format: EncodingFormat
): Moss60ProtocolEnvelope {
  const payload = encodeByFormat(data, format);

  return {
    protocol: MOSS60_PROTOCOL_ID,
    version: MOSS60_PROTOCOL_VERSION,
    capabilities: [...REQUIRED_PROTOCOL_CAPABILITIES, capabilityForFormat(format)],
    format,
    payload,
    hash: hashData(data),
    createdAt: Date.now(),
  };
}

export function serializeProtocolEnvelope(
  data: string,
  format: EncodingFormat
): string {
  return JSON.stringify(createProtocolEnvelope(data, format));
}

export function parseProtocolEnvelope(raw: string): Moss60ProtocolEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as Partial<Moss60ProtocolEnvelope>;

    if (parsed.protocol !== MOSS60_PROTOCOL_ID || !parsed.version || !Array.isArray(parsed.capabilities)) {
      return null;
    }

    return parsed as Moss60ProtocolEnvelope;
  } catch {
    return null;
  }
}

export function validateProtocolEnvelope(envelope: Moss60ProtocolEnvelope): void {
  if (envelope.version !== MOSS60_PROTOCOL_VERSION) {
    throw new Error(`Unsupported protocol version: ${envelope.version}`);
  }

  for (const capability of REQUIRED_PROTOCOL_CAPABILITIES) {
    if (!envelope.capabilities.includes(capability)) {
      throw new Error(`Missing required capability: ${capability}`);
    }
  }
}

export function decodeProtocolPayload(raw: string): {
  decoded: string;
  format: EncodingFormat;
  envelope: Moss60ProtocolEnvelope | null;
} {
  const envelope = parseProtocolEnvelope(raw);

  if (!envelope) {
    if (raw.startsWith(MOSS60_PREFIX)) {
      return {
        decoded: decodeMoss60(raw),
        format: 'base60',
        envelope: null,
      };
    }

    if (raw.startsWith('{') || raw.startsWith('[')) {
      return { decoded: raw, format: 'json', envelope: null };
    }

    if (/^[0-9a-fA-F]+$/.test(raw)) {
      return { decoded: decodeByFormat(raw, 'hex'), format: 'hex', envelope: null };
    }

    return { decoded: raw, format: 'text', envelope: null };
  }

  validateProtocolEnvelope(envelope);

  const decoded = decodeByFormat(envelope.payload, envelope.format);
  if (hashData(decoded) !== envelope.hash) {
    throw new Error('Envelope hash mismatch');
  }

  return {
    decoded,
    format: envelope.format,
    envelope,
  };
}
