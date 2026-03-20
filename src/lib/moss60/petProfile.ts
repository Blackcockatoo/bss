import type { Genome, GenomeHash } from '@/lib/genome';
import type { HeptaDigits, PrimeTailID } from '@/lib/identity/types';
import { moss60Hash } from '@/lib/qr-messaging/crypto';

export type Moss60PetStrandKey = 'red' | 'blue' | 'black' | 'combined' | 'security';

export interface Moss60PetSource {
  id?: string;
  name?: string;
  petType?: string;
  genome?: Genome | null;
  genomeHash?: GenomeHash | null;
  crest?: PrimeTailID | null;
  heptaDigits?: HeptaDigits | readonly number[] | null;
  source?: 'live' | 'archive' | 'fallback';
}

export interface Moss60PetProfile {
  idLabel: string;
  label: string;
  sourceLabel: string;
  petTypeLabel: string;
  glyphSeed: string;
  glyphHash: string;
  digest: string;
  crestLine: string;
  heptaLine: string;
  signaturePreview: string;
  securityLessonInput: string;
  strands: Record<Moss60PetStrandKey, string>;
}

function expandHashToDigits(seed: string, length = 60): string {
  let pool = '';
  let cursor = moss60Hash(seed || 'moss60-fallback');

  while (pool.length < length) {
    pool += Array.from(cursor, char => {
      const parsed = Number.parseInt(char, 16);
      return Number.isNaN(parsed) ? '0' : String(parsed % 10);
    }).join('');
    cursor = moss60Hash(`${seed}|${pool.length}|${cursor}`);
  }

  return pool.slice(0, length);
}

function normalizeStrand(
  values: readonly number[] | undefined,
  seed: string,
  length = 60,
): string {
  if (!values || values.length === 0) {
    return expandHashToDigits(seed, length);
  }

  const digits = values.map(value => {
    const safe = Number.isFinite(value) ? Math.abs(Math.trunc(value)) : 0;
    return String(safe % 10);
  });

  if (digits.length >= length) {
    return digits.slice(0, length).join('');
  }

  return `${digits.join('')}${expandHashToDigits(`${seed}|pad`, length)}`.slice(
    0,
    length,
  );
}

function groupDigits(value: string, groupSize = 5, maxGroups = 6): string {
  return (
    value.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.slice(0, maxGroups).join(' ') ??
    value
  );
}

export function matchMoss60Genome(
  left: Genome | null | undefined,
  right: Genome | null | undefined,
): boolean {
  if (!left || !right) return false;

  const same = (a: readonly number[], b: readonly number[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

  return (
    same(left.red60, right.red60) &&
    same(left.blue60, right.blue60) &&
    same(left.black60, right.black60)
  );
}

export function deriveMoss60PetProfile(
  source: Moss60PetSource,
): Moss60PetProfile {
  const label = source.name?.trim() || 'Active Companion';
  const idLabel = source.id?.trim() || 'live-companion';
  const petTypeLabel =
    source.petType === 'auralia' ? 'Auralia companion' : 'Geometric companion';
  const baseSeed = [
    label,
    idLabel,
    petTypeLabel,
    source.genomeHash?.redHash ?? '',
    source.crest?.signature ?? '',
    source.source ?? 'fallback',
  ]
    .filter(Boolean)
    .join('|');

  const red = normalizeStrand(source.genome?.red60, `${baseSeed}|red`);
  const blue = normalizeStrand(source.genome?.blue60, `${baseSeed}|blue`);
  const black = normalizeStrand(source.genome?.black60, `${baseSeed}|black`);

  const combined = Array.from({ length: 60 }, (_, index) => {
    const digit =
      Number(red[index]) +
      Number(blue[index]) +
      Number(black[index]) +
      (index % 10);
    return String(digit % 10);
  }).join('');

  const crestSeed = source.crest
    ? [
        source.crest.vault,
        source.crest.rotation,
        source.crest.tail.join('-'),
        source.crest.signature,
      ].join('|')
    : 'no-crest';
  const heptaSeed = source.heptaDigits ? Array.from(source.heptaDigits).join('') : 'no-hepta';

  const security = expandHashToDigits(
    `${combined}|${crestSeed}|${heptaSeed}|${source.genomeHash?.blackHash ?? ''}`,
    60,
  );

  const glyphSeed = [
    label,
    petTypeLabel,
    `R:${red}`,
    `B:${blue}`,
    `K:${black}`,
    source.crest ? `TAIL:${source.crest.tail.join('.')}` : '',
    source.heptaDigits
      ? `HEPTA:${Array.from(source.heptaDigits).slice(0, 14).join('')}`
      : '',
  ]
    .filter(Boolean)
    .join('|');

  const sourceLabel =
    source.source === 'archive'
      ? 'Latest archived companion'
      : source.source === 'fallback'
        ? 'Fallback teaching profile'
        : 'Live companion code';

  const crestLine = source.crest
    ? `${source.crest.vault.toUpperCase()} vault · ${source.crest.rotation} rotation · tail ${source.crest.tail.join('-')}`
    : 'Genome strands only. Save the pet archive to expose crest metadata here.';

  const heptaLine = source.heptaDigits
    ? groupDigits(Array.from(source.heptaDigits).join(''), 7, 6)
    : 'Hepta code unavailable. Archive the active pet to add the signed 42-digit layer.';

  const signaturePreview = source.crest?.signature.slice(0, 18) ?? moss60Hash(baseSeed).slice(0, 18);
  const digest = moss60Hash(`${glyphSeed}|${security}|${source.genomeHash?.blueHash ?? ''}`);

  return {
    idLabel,
    label,
    sourceLabel,
    petTypeLabel,
    glyphSeed,
    glyphHash: source.genomeHash?.redHash ?? moss60Hash(glyphSeed),
    digest,
    crestLine,
    heptaLine,
    signaturePreview,
    securityLessonInput: `${label}:${security.slice(0, 18)}`,
    strands: {
      red,
      blue,
      black,
      combined,
      security,
    },
  };
}

