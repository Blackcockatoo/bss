# Project Forge — isolated first vertical slice (draft)

## Truth and constraints
- This is an offline-only prototype on a feature branch, not a production release.
- /project-forge is a core-only route. School and Field Mode have no allowlist entry, and the page uses the existing server guard.
- The SPARK loop is inspectable: Spot, Predict, Act, Reflect, Keep.
- Audio plays only on user gesture via Web Audio; the browser can mute it.
- A learner's experiment gets a deterministic motif based on the already-local DNA imprint seed (or local pet ID) and the selected pattern.
- The companion recalls the motif on /pet through a read-only badge. Genome, vitals, identity and evolution are not changed by the prototype.
- No Grok, child accounts, telemetry, network requests, countdowns or attendance penalties.

## Why a separate IndexedDB database?
Two existing modules open `MetaPetDB` with different schema versions:
- `src/lib/persistence/db.ts` expects version 1
- `src/lib/persistence/indexeddb.ts` expects version 2

Upgrading either without reconciling both risks legacy-browser `VersionError` and data loss. `MetaPetProjectForge` v1 isolates this first slice. Before production: unify migrations, build an atomic pet-delete cascade, and add Forge discoveries to explicit pet export/import. Do not present this as complete portable pet ownership.

## Privacy
- Records keyed by the local pet ID, capped to 50 reflections of 160 chars each.
- No teacher or parental data is loaded or transferred.
- Users can delete their Forge discoveries from the instrument.
- Deleting a *pet* elsewhere does **not yet** cascade to this separate database: this is a release blocker, not an acceptable final design.
- Review site-wide analytic loading and route boundaries independently before any school rollout.

## Acceptance gates before merge
1. Run `npm run lint`, `npm run check:child-safe-deployment`, `npx vitest run src/lib/tools`, and a production build.
2. Manual mobile and keyboard testing, reduced-motion and screen-reader pass.
3. Legacy pet-save import/export/delete regression, and add full roundtrip export + delete for Forge.
4. Verify direct school/field URL access returns the expected safe redirect.
5. Verify airplane-mode start, audio unavailable fallback, persistence denied fallback, and a saved-motif return visit.
6. Confirm production branch/domain ownership and Vercel privacy settings.
7. Review the existing memory's streak and emotional-dependency mechanics for child-safe profiles.

## Explicit non-goals
- No open chat or child-facing Grok.
- No server integration or external tools marketplace.
- No claimed emergent intelligence or AI-generated learning measurement.
- No automatic merging or deployment.
