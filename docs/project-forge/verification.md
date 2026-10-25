# Project Forge verification — 25 October 2026

For the subsequent quality upgrade and its latest checks, see [premium-upgrade-audit.md](premium-upgrade-audit.md). The results below describe the original implementation checkpoint.

Repository: `Blackcockatoo/bss`. Review branch: `feature/project-forge-first-slice-20261025`, PR #179. Production is unchanged. See `architecture.md` for code ownership, flows and limitations.

## Executed locally

| Check | Exact measured outcome |
|---|---|
| `npm ci` baseline | Successful, 545 packages installed |
| Original PR CI inspection | Lint: 2 errors. Unit: 2 failed, 1,314 passed. Build skipped. Vercel previews ready, not proof of tests |
| `npm run lint` after implementation | Passed: TypeScript and ESLint, no final errors or warnings |
| `npx vitest run` after dependency hardening | **184 files passed; 1,342 tests passed; 0 failed**, Vitest 4.1.12 |
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

## Real-browser CI evidence

[CI run 40162992814](https://github.com/Blackcockatoo/bss/actions/runs/40162992814) completed successfully for application/test commit `7ff62a5bc6a8de08bdecbe1a153bac6e88361463`. Lint, all 1,342 tests, geometry lock, production build and Playwright Chromium passed. The preceding browser runs found and corrected onboarding handling in the test harness and a real public-port-loss defect in Field redirects; the fix has a dedicated middleware regression test.

Exact browser output:

```json
{"instruments":6,"savedAfterRefresh":6,"revision":2,"offlineRequests":0,"pageErrors":[],"mobileOverflow":false}
```

The following logged assertion also passed: `Browser restart: six projects retained under the same registered identity.` Chromium used a persistent profile, a 390×844 viewport, touch capability emulation and reduced motion. It created work in all six instruments, refreshed, reopened/revised, exported a backup, deleted a project, restored the backup, ran an activity with the connection disabled, exercised the companion response and verified direct school-host/Field denials. After closing and relaunching Chromium, all six projects returned.

[Browser screenshot and server log](https://github.com/Blackcockatoo/bss/actions/runs/40162992814/artifacts/12587326798) were preserved as a CI artifact. The mobile screenshot was visually inspected. No horizontal overflow was measured. These are automated Chromium checks, not a manual touch/screen-reader or all-browser certification.

Local Chromium was absent and its download failed with an invalid/truncated ZIP; real-browser execution was completed in GitHub CI instead. `node scripts/project-forge/browser-smoke.cjs` is the reproducible check (serve the production build at 127.0.0.1:3001). The Field test asserts the rendered classroom heading rather than waiting for background traffic to stop.

## Release blockers

1. Complete manual screen-reader, full keyboard/touch, muted Web Audio and mobile/daylight checks. The passing Chromium smoke does not certify other browsers or assistive technology.
2. Offline cold start/reload is not implemented for Forge. Activities work after loading, but the existing offline pack remains Field-only. A safe consumer pack must preserve route/capability separation even after entering Field Mode.
3. Complete explicit canonical-pet erasure and orphan-recovery/cleanup controls. Existing archive deletion retains historical snapshots by design. Do not automatically destroy orphan work to make a cleanup counter green.
4. Educator review, validated curriculum mapping and school admission gates remain outstanding. Family instruments are excluded from Field Mode; the seven-session school programme is preserved.
5. Broader consumer dependency/engagement mechanics were not redesigned; review those before making platform-wide child-safety claims. No adult-authenticated AI authoring route exists; Grok stays disabled.

## Production release sequence

Resolve the blockers on the review branch, run the full commands above and real-browser/manual checks, have an adult educator review content, review legacy backups and deletion semantics, and get explicit merge/deploy approval. Only then merge into the verified `main` branch and use the existing Vercel production workflow for `bss-l8cw`; verify live identity, save/restore and school host boundaries after release. No merge, production push, domain reassignment or deployment promotion has been performed here.

## Review commits

- `85bc348`: six instruments, project ownership, acquired response, migrations and dependency hardening.
- `7f38479` / `664ce65`: onboarding, restart and isolated offline-request browser evidence.
- `bab377e`: public authority/port preservation in Field redirects, with a regression test.
- `7ff62a5`: rendered classroom boundary assertion; full CI/browser run above passed.

This final evidence-only documentation update does not change the tested application. Production remains untouched and the PR remains draft.
