# Geometry sprite lock

`src/components/SriYantraPetEngine.tsx` — the Sri Yantra geometry sprite — is
a **locked asset** (Phase 0 of `docs/planning/metapet-pipeline-audit.md`).
Its geometry paths, constants, movement profiles, SVG structure, and assets
are outside the normal edit surface: pipeline work (registration, Hepta,
projection, behavior, breeding) happens in the layers around it, never inside
it.

## Enforcement

Two CI gates protect the sprite:

1. **Source checksum** — `npm run check:geometry-sprite-lock`
   (`scripts/check-geometry-sprite-lock.mjs`) verifies the engine source
   against the approved sha256 in `scripts/geometry-sprite.lock.json`, and
   verifies the import surface:
   - `SriYantraPetEngine` may only be imported at runtime by
     `SriYantraPetDisplay.tsx` (the display bridge) and `PetGeometryHub.tsx`
     (the developer movement parade, not mounted on any production route).
   - `SriYantraPetDisplay` may only be imported at runtime by
     `GeometryAvatarRenderer.tsx` — the single production wrapper. All
     product code renders the geometry pet through `GeometryAvatarRenderer`.
   - `import type { ... }` is compile-time only and allowed anywhere.
2. **Golden renders** — `src/components/SriYantraPetEngine.golden.test.tsx`
   snapshots the sprite's full rendered SVG for fixed DNA packets, so even an
   approved source change that alters existing pets' appearance fails loudly.

## Intentionally changing the sprite

A sprite change must be its own deliberate PR, never a side effect:

1. Make the engine change.
2. Update the sha256 in `scripts/geometry-sprite.lock.json`
   (`sha256sum src/components/SriYantraPetEngine.tsx`).
3. Regenerate goldens: `npx vitest run src/components/SriYantraPetEngine.golden.test.tsx -u`
   and review the snapshot diff — it is the visual change record.
4. Explain in the PR what changed visually and why existing pets keep (or are
   allowed to change) their appearance.
