#!/usr/bin/env node

/**
 * Geometry sprite lock (Phase 0 of the MetaPet pipeline plan).
 *
 * 1. The Sri Yantra engine source must match its approved checksum — the
 *    sprite is a locked asset and never changes as a side effect of pipeline
 *    work. See docs/protocol/geometry-sprite-lock.md for the re-approval flow.
 * 2. Only the approved integration surface may import the engine or its
 *    display bridge at runtime. Everything else must go through
 *    GeometryAvatarRenderer, so registration/breeding/personality code can
 *    never reach into the sprite directly.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOCK_FILE = 'scripts/geometry-sprite.lock.json';

// Runtime (non-type) imports of the engine module are only allowed here.
// PetGeometryHub is the developer movement-parade surface; it is not mounted
// on any production route.
const ENGINE_IMPORT_ALLOWLIST = new Set([
  'src/components/SriYantraPetDisplay.tsx',
  'src/components/PetGeometryHub.tsx',
]);

// Runtime imports of the display bridge are only allowed from the one
// production wrapper.
const DISPLAY_IMPORT_ALLOWLIST = new Set([
  'src/components/GeometryAvatarRenderer.tsx',
]);

const violations = [];

const lock = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));

for (const [file, approved] of Object.entries(lock.files)) {
  let actual;
  try {
    actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  } catch {
    violations.push(`${file}: locked sprite file is missing`);
    continue;
  }
  if (actual !== approved) {
    violations.push(
      `${file}: checksum ${actual} does not match the approved sprite checksum ${approved}. ` +
        'The Sri Yantra sprite is a locked asset; if this change is intentional, ' +
        `follow the re-approval flow in docs/protocol/geometry-sprite-lock.md and update ${LOCK_FILE}.`,
    );
  }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

// Matches static and dynamic imports plus re-exports of a module specifier
// ending in the given name; `import type { ... }` is compile-time only and
// exempt (type-only named imports still count as runtime imports here, which
// is fine — allowlisted files cover them).
function findRuntimeImports(source, moduleName) {
  const pattern = new RegExp(
    String.raw`(?:import|export)\s+(?!type\s)[^;]*?from\s+['"][^'"]*${moduleName}['"]|import\(\s*['"][^'"]*${moduleName}['"]\s*\)`,
    'g',
  );
  return source.match(pattern) ?? [];
}

for (const file of walk('src')) {
  const self = file.replace(/\\/g, '/');
  if (self === 'src/components/SriYantraPetEngine.tsx') continue;

  const source = readFileSync(file, 'utf8');

  if (
    findRuntimeImports(source, 'SriYantraPetEngine').length > 0 &&
    !ENGINE_IMPORT_ALLOWLIST.has(self)
  ) {
    violations.push(
      `${self}: imports SriYantraPetEngine at runtime. Only ${[...ENGINE_IMPORT_ALLOWLIST].join(', ')} may.`,
    );
  }

  if (
    self !== 'src/components/SriYantraPetDisplay.tsx' &&
    findRuntimeImports(source, 'SriYantraPetDisplay').length > 0 &&
    !DISPLAY_IMPORT_ALLOWLIST.has(self)
  ) {
    violations.push(
      `${self}: imports SriYantraPetDisplay at runtime. Production code must render the pet through GeometryAvatarRenderer.`,
    );
  }
}

if (violations.length > 0) {
  console.error('Geometry sprite lock violations:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Geometry sprite lock check passed.');
