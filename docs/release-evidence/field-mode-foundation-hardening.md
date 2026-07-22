# Field-Mode Foundation Hardening — Report

> **Purpose:** Strengthen the foundation of the schools / student "field-mode"
> deployment (the child-safe route boundary) so that a follow-up review pass
> audits already-hardened code rather than the pre-existing baseline.
>
> **Branch:** `claude/field-mode-setup-audit-yqkrea`
> **Date:** 2026-07-22
> **Status:** Applied. Typecheck, targeted unit tests, and lint pass locally.

---

## What "field mode" is

"Field mode" is the schools / student **field deployment** — the configuration
the app runs under when it ships into classrooms. It is a contract across five
layers, all keyed off `STUDENT_DEPLOYMENT`, `NEXT_PUBLIC_CHILD_SAFE_BASELINE`,
`NEXT_PUBLIC_APP_PROFILE=schools`, and `NEXT_PUBLIC_SITE_URL`:

| Layer | File |
|---|---|
| Profile resolution | `src/lib/env/features.ts` |
| Request-time route boundary | `middleware.ts` + `src/lib/childSafeBaseline.ts` |
| PWA manifest / metadata | `src/app/manifest.ts` |
| Build gate | `scripts/assert-child-safe-deployment*.mjs`, `.github/workflows/ci.yml` |
| Manual promotion gate | `production-smoke-gate.yml` + `docs/deployment/metapet-schools-smoke.md` |

The pre-hardening audit found the foundation sound and well-tested. This pass
closes the three foundation-level refinements it identified. No behavioural
weakening: every existing boundary redirect still fires; the changes only make
the boundary **cleaner, single-sourced, and documented**.

---

## Changes applied

### 1. Clean deny for API/data routes on the schools surface

**Before:** the middleware matcher (`/((?!_next/static|_next/image).*)`) routes
`/api/*` through the boundary, but API paths are not on the schools allowlist, so
they were `307`-redirected to `/schools`. A `fetch()` that transparently follows
that redirect receives a **200 HTML document**, masking the block from callers
and error handling.

**After:** when the boundary is enforced and a non-allowlisted path begins with
`/api/`, middleware returns an **opaque `404` JSON** (`{ "error": "not_found" }`)
instead of a redirect. The route is denied, its existence is not disclosed, and
callers get a real error status rather than surprise HTML.

`middleware.ts`:

```ts
if (pathname.startsWith("/api/")) {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
```

This is a **strengthening** of the boundary: the three consumer API routes
(`/api/genome-resonance/simulate`, `/api/genome-resonance/explain`,
`/api/genome/sonify/[petId]`) remain blocked in schools mode, now cleanly.

### 2. Single source of truth for boundary enforcement

**Before:** `middleware.ts` re-implemented its own `isEnabled()` and read
`NEXT_PUBLIC_CHILD_SAFE_BASELINE` directly, duplicating truth already derived in
`features.ts`. The two never disagreed, but the boundary decision lived in two
places.

**After:** `features.ts` exports one flag and middleware consumes it:

```ts
// src/lib/env/features.ts
export const ENFORCE_CHILD_SAFE_BOUNDARY =
  IS_SCHOOLS_PROFILE || ENABLE_CHILD_SAFE_BASELINE;
```

```ts
// middleware.ts
if (!ENFORCE_CHILD_SAFE_BOUNDARY) {
  return NextResponse.next();
}
```

Behaviourally identical to the previous
`if (!CHILD_SAFE_BASELINE_ENABLED) { if (APP_PROFILE !== "schools") next(); }`,
but the enforcement condition now has exactly one definition. The redundant
`isEnabled` helper and `CHILD_SAFE_BASELINE_ENABLED` const were removed from
middleware.

### 3. Documented the fail-safe profile coupling

Enabling `NEXT_PUBLIC_CHILD_SAFE_BASELINE` deliberately forces the whole build
into the `schools` profile even when `NEXT_PUBLIC_APP_PROFILE` is unset/`core`.
This is intentional (turning on the child-safe baseline must never leave the app
on the consumer surface) but was previously undocumented in code. A comment at
the coupling point in `features.ts` now records the invariant and warns against
making it two-directional.

---

## Verification

| Check | Command | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | Pass (clean) |
| Middleware boundary | `vitest --run middleware.test.ts` | **8/8 pass** (was 7; +1 API-block test) |
| Deployment config gate | `vitest --run scripts/assert-child-safe-deployment.test.mjs` | 5/5 pass |
| Lint | `eslint src middleware.ts` | Pass (clean) |
| Live build gate | `node scripts/assert-child-safe-deployment.mjs` (schools env) | Pass (exit 0) |

New test added (`middleware.test.ts`) asserting non-allowlisted `/api/*` routes
return `404` with no `location` header in schools mode. The existing mock was
extended with `ENFORCE_CHILD_SAFE_BOUNDARY` so the test double mirrors the real
enforcement flag.

---

## Deliberately out of scope (for the second pass to decide)

- **Automated schools smoke suite.** The promotion gate still relies on a manual
  runbook checkbox (`production-smoke-gate.yml`). Adding a Playwright-style
  schools-host smoke as a *required* automated check remains the highest-value
  hardening left; it is a larger change and was not bundled here.
- No change to the allowlist, manifest, or the env-var contract itself — the
  foundation's shape is unchanged, only its enforcement was tightened.

---

## Files touched

| File | Change |
|---|---|
| `src/lib/env/features.ts` | Add `ENFORCE_CHILD_SAFE_BOUNDARY`; document baseline→schools coupling |
| `middleware.ts` | Consume the single flag; clean `404` for blocked `/api/*`; drop duplicated helper |
| `middleware.test.ts` | Extend mock with the flag; add API-block test |
