# Phase 0 audit of PR #201

## What the branch already had

PR #201 (`feature/bss-expression-studio`) added the `/expressions` route on the consumer surface:

- A read-only creature snapshot (`src/lib/expressions/snapshot.ts`) built from the active registry record and local appearance (guardian state, Body Forge, add-ons, wardrobe).
- Three adapters in `ExpressionArt.tsx` for Auralia, Evolved and Geometry, sharing one sampler.
- 24 expressions in 8 packs, defined as numeric keyframe tuples in `studio.ts`, with eyes, mouth and props implied only by the keyframes.
- Sticker Factory, Animation Lab, Meme Machine, Comics, Director and Export Vault modes, with PNG, GIF (worker), animated WebP, ZIP and print exports.
- Creative saves in their own localStorage namespace keyed by pet id.
- Route policy: allowed on `core`, excluded from `field` and `schools`, and listed in the analytics exclusion list.
- Tests for catalogue size, deterministic sampling, recipe validation, storage isolation, route policy and WebP muxing, plus a Playwright workflow script.

## Gaps found

- The catalogue had 24 of the 120 targeted expressions, with no explicit face moods, props or layered movement.
- Personality only scaled one trait per expression.
- Catalogue thumbnails were cached by expression id only, so switching form could show another form's thumbnail. They were not persisted and there was no way to clear them.
- PNG exports were checked at 256 and 1024 px on Geometry only, and not for metadata chunks.
- No test exercised the proxy for `/expressions` on MetaPet.school or with the Field Mode cookie.

## Deployment facts from the repository

- Canonical consumer hostname: `https://www.bluesnakestudios.com` (`METAPET_ORIGIN` in `src/lib/productSurfaces.ts`); the proxy redirects core aliases there.
- Vercel project: the repository disagrees with itself. `docs/project-forge/architecture.md` records a read-only Vercel lookup confirming `www.bluesnakestudios.com` and `bluesnakestudios.com` on project `bss-l8cw`. The older `docs/release-evidence/domain-product-split.md` (dated 2026-07-22) says the domains resolve through project `bss`. The later, lookup-backed note points to `bss-l8cw`. This audit did not query Vercel and changed no Vercel settings.
