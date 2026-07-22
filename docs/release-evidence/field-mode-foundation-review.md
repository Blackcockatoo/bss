# Field-Mode Foundation — Second-Pass Review Report

| | |
|---|---|
| **Document type** | Engineering review / verification report |
| **Subject** | Schools "field-mode" child-safe deployment boundary |
| **Repository** | `Blackcockatoo/bss` |
| **Branch under review** | `claude/field-mode-setup-audit-yqkrea` |
| **Companion change record** | `docs/release-evidence/field-mode-foundation-hardening.md` |
| **Date** | 2026-07-22 |
| **Status** | Complete — foundation verified, two residual items open |
| **Classification** | Internal engineering evidence |

---

## 1. Executive summary

The schools field-mode foundation — the request-time child-safe route boundary
and its supporting build gate — was hardened in three targeted, behaviour-
preserving changes and then independently re-verified against the full quality
suite. **All four continuous-integration gates pass locally with no
regressions** (963 unit tests, type check, lint, and production build). The
foundation is assessed as **sound and release-ready**.

Two residual observations remain. Neither was introduced by this work, and
neither blocks the current change; both are recorded in Section 6 for a
governance decision on whether to close them in a follow-up.

## 2. Scope and objectives

This review covers the foundation of the schools/student field deployment only:
the profile-resolution layer (`src/lib/env/features.ts`), the request-time route
boundary (`middleware.ts`, `src/lib/childSafeBaseline.ts`), and the child-safe
build gate (`scripts/assert-child-safe-deployment*.mjs`). Its objectives were
to confirm that the hardening changes are (a) correct, (b) free of behavioural
regression, and (c) verified to the same standard the CI pipeline enforces.

Out of scope: application feature behaviour, the consumer ("core") surface
beyond its interaction with the boundary, and the content of the school-facing
pages themselves.

## 3. Methodology

The review reproduced the exact checks of the `.github/workflows/ci.yml`
pipeline in a clean checkout, supplemented by a static reading of each changed
file against the schools/core behaviour matrix encoded in the existing test
suite. Enforcement logic was traced end to end from environment variable to
middleware decision to confirm the refactor preserved the prior truth table.

## 4. Changes under review

| # | Change | File(s) | Nature |
|---|---|---|---|
| 1 | Non-allowlisted `/api/*` routes now return an opaque `404` in schools mode instead of a `307` redirect to an HTML page | `middleware.ts` | Boundary strengthening |
| 2 | Boundary enforcement consolidated behind a single exported flag, `ENFORCE_CHILD_SAFE_BOUNDARY` | `src/lib/env/features.ts`, `middleware.ts` | De-duplication of truth |
| 3 | Fail-safe `baseline → schools` profile coupling documented in code | `src/lib/env/features.ts` | Documentation |

**Change 1** executes only after the allowlist check, so no school-safe route is
affected. It prevents a `fetch()` from silently receiving a `200` HTML document
when a consumer API is blocked, and it does not disclose the route's existence.

**Change 2** is logically equivalent to the previous two-branch condition,
confirmed against the schools and core cases in `middleware.test.ts`. Middleware
no longer re-parses `NEXT_PUBLIC_CHILD_SAFE_BASELINE`; the enforcement decision
now has exactly one definition.

**Change 3** is comment-only and records the intentional invariant that enabling
the child-safe baseline forces the schools profile, so the app can never be left
on the consumer surface while the baseline is active.

## 5. Verification evidence

All checks executed in a clean install of the branch under review.

| Gate | CI job | Command | Result |
|---|---|---|---|
| Type check | `lint` | `tsc --noEmit` | Pass — no errors |
| Lint | `lint` | `eslint src` | Pass — no findings |
| Unit tests | `unit` | `npm test -- --run` | Pass — 963 / 963 across 129 files |
| Production build | `build` | `npm run build` | Pass — exit 0, all routes prerendered |
| Deployment gate | `build` | `check:child-safe-deployment` (schools env) | Pass — contract configured |

Boundary-specific coverage: `middleware.test.ts` now carries **8 tests**
(previously 7), the addition asserting that `/api/genome-resonance/simulate`,
`/api/genome-resonance/explain`, and `/api/genome/sonify/[petId]` each return
`404` with no `Location` header under the schools profile. The deployment-gate
unit suite (`scripts/assert-child-safe-deployment.test.mjs`) remains at 5 tests,
all passing.

## 6. Findings

No defects were identified in the changes under review. Two pre-existing
residual items in the surrounding foundation are recorded below.

### 6.1 Build gate does not enforce domain distinctness — **Medium**

`evaluateChildSafeDeployment` accepts any syntactically valid absolute
`NEXT_PUBLIC_SITE_URL`. A student deployment configured with
`http://localhost:3000` (the value shipped in `.env.example`) or with the known
consumer host would still pass the gate, despite the runbook requiring a
dedicated schools domain. **Recommendation:** reject `localhost` and the known
core hosts when `STUDENT_DEPLOYMENT=true`, with accompanying unit tests. This is
the highest-value remaining hardening at the foundation layer and is
self-contained within the existing gate.

### 6.2 Promotion relies on a self-reported smoke confirmation — **Medium**

`production-smoke-gate.yml` gates promotion on a manually entered
`smoke_confirmation: confirmed`; no automated schools-host smoke test enforces
the runbook in `docs/deployment/metapet-schools-smoke.md`. **Recommendation:**
add a headless schools-host smoke suite as a required check ahead of the manual
sign-off. This is the principal remaining gap at the test/verification layer.

### 6.3 Observation — enforcement flag currently mirrors the profile — *Informational*

`ENFORCE_CHILD_SAFE_BOUNDARY` evaluates to the same value as
`IS_SCHOOLS_PROFILE` today, because the baseline flag already implies the schools
profile upstream. The dedicated, intention-named export is retained deliberately
for clarity and to remain correct if that coupling is ever relaxed. No action
required.

## 7. Recommendations and next steps

1. **Adopt as-is.** The change set is correct and CI-green; it is suitable to
   carry forward.
2. **Prioritise 6.1** as the next foundation increment — small, self-contained,
   and closes a real misconfiguration path in the build gate.
3. **Schedule 6.2** as a follow-up to remove the last manual link in the
   promotion chain.

## 8. Conclusion

The schools field-mode foundation has been strengthened without altering its
contract or weakening any existing control, and has been verified to full CI
parity. The foundation is assessed as release-ready. The two residual items are
improvements, not blockers, and are offered for a scheduling decision.

---

### Appendix A — Files changed in the hardening

| File | Change summary |
|---|---|
| `src/lib/env/features.ts` | Added `ENFORCE_CHILD_SAFE_BOUNDARY`; documented baseline→schools coupling |
| `middleware.ts` | Consumes the single flag; clean `404` for blocked `/api/*`; removed duplicated env parsing |
| `middleware.test.ts` | Extended the test double with the flag; added the API-block test |
| `docs/release-evidence/field-mode-foundation-hardening.md` | Change record (companion to this report) |
