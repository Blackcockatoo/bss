# Project Forge verification — 25 October 2026

Repository: `Blackcockatoo/bss`. Review branch: `feature/project-forge-first-slice-20261025`, PR #179. Production is unchanged. See `architecture.md` for code ownership, flows and limitations.

## Executed locally

| Check | Exact measured outcome |
|---|---|
| `npm ci` baseline | Successful, 545 packages installed |
| Original PR CI inspection | Lint: 2 errors. Unit: 2 failed, 1,314 passed. Build skipped. Vercel previews ready, not proof of tests |
| `npm run lint` after implementation | Passed: TypeScript and ESLint, no final errors or warnings |
| `npx vitest run` after dependency hardening | **184 files passed; 1,341 tests passed; 0 failed**, Vitest 4.1.12 |
| `npm run build` | Passed, Next.js 16.4.3 / webpack; production compilation, TypeScript, route generation |
| `npm run check:child-safe-deployment` (default) | Command succeeded but assertion **skipped** because STUDENT_DEPLOYMENT was unset |
| Same deployment command with student=true, child-safe=true, profile=schools, site=https://www.metapet.school | Passed: Schools deployment contract configured |
| `npm run check:geometry-sprite-lock` | Passed |
| `git diff --check` | Passed |
| `npm audit --json` after patches | **0 vulnerabilities** reported (baseline 22: 4 critical, 12 high, 5 moderate, 1 low) |

Dependency corrections updated the lockfile within declared ranges, including Next 16.4.3 and Vitest 4.1.12. Happy DOM moved to 21.0.4+ to resolve a high-severity test-environment issue. A `postcss-selector-parser` 7.1.6+ override resolves the transitive parser advisory without forcing a Tailwind 4 migration; the complete test suite and CSS production build passed with this override. No package-audit result is a security certification.

## Focused evidence

- Six instrument engines: sequence arithmetic, frequency doubling, beat duration, free-fall calculations, authored branches, robot goal navigation, planning sums, invalid inputs and context denial.
- IDB fixtures: MetaPetDB v1→v3 preserves legacy identity/history; compatible schema opener; old separate Forge migration; closing/reopening connections; deletion; rejected corrupt/future schemas; explicit recovery replacement.
- Ownership: wrong-pet import rejected; drafts reset on pet switch; stale A→B→A hydration ignored; concurrent read-modify-writes retain ten independent projects; aborted updates preserve previous data; quota/error states recover on retry.
- Portable ownership: a verified MP2 pet plus Forge bundle survives a fresh IndexedDB factory and retains genome, proof and authored artefacts; malformed bundles validate before writes.
- Child workspace DOM integration: all six instruments run/save with optional reflection empty and no audio; reopen/revise/remount/delete succeeds; no `fetch` calls made by those activities. This uses Testing Library + Happy DOM, **not a real browser**.
- School programme, pet renderer selection, registry identity, genome, progression and Field boundary regression tests are included in the full suite.

## Browser evidence and exact limitation

A Playwright Chromium launch was attempted. No browser executable was installed in the container. A browser download was then attempted and failed with an invalid/truncated ZIP, ending `Failed to install browsers`. Therefore no local real-browser pass, screenshot, touch, Web Audio playback, screen-reader or browser-restart result is claimed.

`node scripts/project-forge/browser-smoke.cjs` is a reproducible production-runtime check. It covers six saved projects, refresh, revision, backup export/delete/restore, no activity requests while offline, mobile overflow, keyboard focus, reduced-motion companion response and direct school/Field denial. CI now installs Chromium, builds, runs this script on a localhost production server and preserves browser evidence. Its result must be read from the new run; authoring a check is not a passing check.

## Release blockers

1. Obtain a passing actual-browser CI run; repair any failures. Complete manual screen-reader, keyboard/touch, muted Web Audio and mobile/daylight checks. Desktop/mobile Chromium smoke alone does not certify other browsers or assistive technology.
2. Offline cold start/reload is not implemented for Forge. Activities work after loading, but the existing offline pack remains Field-only. A safe consumer pack must preserve route/capability separation even after entering Field Mode.
3. Complete explicit canonical-pet erasure and orphan-recovery/cleanup controls. Existing archive deletion retains historical snapshots by design. Do not automatically destroy orphan work to make a cleanup counter green.
4. Educator review, validated curriculum mapping and school admission gates remain outstanding. Family instruments are excluded from Field Mode; the seven-session school programme is preserved.
5. Broader consumer dependency/engagement mechanics were not redesigned; review those before making platform-wide child-safety claims. No adult-authenticated AI authoring route exists; Grok stays disabled.

## Production release sequence

Resolve the blockers on the review branch, run the full commands above and real-browser/manual checks, have an adult educator review content, review legacy backups and deletion semantics, and get explicit merge/deploy approval. Only then merge into the verified `main` branch and use the existing Vercel production workflow for `bss-l8cw`; verify live identity, save/restore and school host boundaries after release. No merge, production push, domain reassignment or deployment promotion has been performed here.
