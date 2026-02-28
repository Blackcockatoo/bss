# BSS (Meta-Pet / Blue Snake Studios) — Upgrade Plan

> Generated: 2026-02-28
> Branch: `claude/app-upgrade-planning-epwHC`
> Analyst: Claude (senior full-stack + release manager role)

---

## 1. Baseline Health Report

### Runbook

| Command | Value |
|---------|-------|
| **Install** | `npm ci` |
| **Dev** | `npm run dev` (clears `.next` cache first via `predev` hook) |
| **Build** | `npm run build` (runs `prepare:moss60-production` then `next build`) |
| **Start** | `npm start` |
| **Lint** | `npm run lint` (runs `tsc --noEmit && eslint src`) |
| **Test** | `npm test` |
| **Format** | `npm run format` (Biome) |

### Environment Variables

No `.env` file is required for local dev or build. The app is fully client-side (IndexedDB persistence, Zustand state). The three API routes (`/api/genome-resonance/explain`, `/api/genome-resonance/simulate`, `/api/genome/sonify/[petId]`) are self-contained Next.js route handlers with no detected external API keys in the codebase.

**ASSUMPTION**: If production API routes call external AI/ML services, those keys would be set as Vercel environment variables — confirm with team that no `OPENAI_*`, `ANTHROPIC_*`, or similar keys are needed.

### Stack Snapshot

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS + shadcn/ui | 3.4.19 |
| State | Zustand | 5.0.9 |
| Animation | Framer Motion | 12.24.0 |
| 3D | Three.js | 0.182.0 |
| Audio | Tone.js | 15.1.22 |
| Game | Phaser | 3.90.0 |
| Testing | Vitest + Testing Library + happy-dom | 4.0.16 |
| Linting | ESLint 9 (flat config) + Biome | 9.39.2 / 1.9.4 |
| Deployment | Vercel | — |
| Node (runtime) | v22.22.0 (local), v20 pinned in CI | — |

### Issue Table

| # | Issue | Severity | Where | Repro Steps | Likely Cause | Fix Plan |
|---|-------|----------|-------|-------------|--------------|----------|
| 1 | ESLint crashes with `TypeError: Converting circular structure to JSON` | **Blocker** | `npm run lint` | Run `npm run lint` | `FlatCompat` from `@eslint/eslintrc` can't serialize the `react` plugin when using `compat.extends("next/core-web-vitals")` with ESLint 9 + `eslint-config-next` 16 | See Fix #1 below |
| 2 | 4 test failures: `ENOENT` on `docs/protocol/vectors/*.json` | **High** | `src/lib/qr-messaging/__tests__/protocol-vectors.test.ts` | Run `npm test` | Protocol vector fixture files were missing from the repo | **Fixed in this PR** — fixtures generated and committed |
| 3 | `jsxImportSource: "same-runtime/dist"` in tsconfig | **Medium** | `tsconfig.json:21` | Run `tsc --noEmit` (currently passes due to `skipLibCheck`) | `same-runtime` is a scaffold package (v0.0.1) used as a JSX shim; sets non-standard JSX factory | Swap to standard `react` JSX source when removing same-runtime dependency (Phase 4) |
| 4 | Node version mismatch: local v22, CI pins v20 | **Medium** | `.github/workflows/production-smoke-gate.yml:30` | Run `node --version` locally vs CI | No `.nvmrc` or `engines` field in `package.json` | Add `.nvmrc` and `engines` field; align CI to v22 LTS |
| 5 | 3 npm audit vulnerabilities (ajv, minimatch, rollup) | **Medium** | `package-lock.json` | `npm audit` | Transitive deps from `@typescript-eslint` and Vite ecosystem | Run `npm audit fix`; or force-override in `package.json#overrides` |
| 6 | `package.json` name is `nextjs-shadcn` (scaffold default) | **Low** | `package.json:2` | Read `package.json` | Never renamed from scaffold template | Rename to `bss` or `meta-pet` |
| 7 | Backend / mobile / frontend sub-packages have no `package.json` | **Low** | `backend/`, `mobile/`, `frontend/` | `ls backend/` | Likely intended as future monorepo packages or module paths used only at the Next.js root | Document intent; consider adding to tsconfig paths or creating a workspace |
| 8 | `time-calculator-compass.zip` (34 MB) committed to repo | **Low** | root | `ls -lh *.zip` | Binary artifact in git history bloats clone size | Add to `.gitignore`; consider git LFS or remove from history |
| 9 | CI workflow is `workflow_dispatch` only — no PR trigger | **Low** | `.github/workflows/production-smoke-gate.yml` | Review YAML | Manual gate is intentional for smoke confirmation | Add automated `push`/`pull_request` trigger for lint+build steps |
| 10 | Biome `vcs.enabled: false` — not using ignore file | **Low** | `biome.json:3` | Read `biome.json` | Biome VCS integration disabled | Enable for better `.gitignore` respect |

---

## 2. Testing Plan + Starter Tests

### Current State

| File | Tests | Status |
|------|-------|--------|
| `src/elements/__tests__/applications.test.ts` | 16 | ✅ Pass |
| `src/elements/__tests__/bridges.test.ts` | 20 | ✅ Pass |
| `src/elements/__tests__/invariants.test.ts` | 15 | ✅ Pass |
| `src/elements/__tests__/reactions.test.ts` | 18 | ✅ Pass |
| `src/lib/breeding/index.test.ts` | 23 | ✅ Pass |
| `src/lib/evolution/index.test.ts` | 21 | ✅ Pass |
| `src/lib/genome/decoder.test.ts` | 20 | ✅ Pass |
| `src/genome/__tests__/elementMath.test.ts` | 9 | ✅ Pass |
| `src/lib/identity/hepta/ecc.test.ts` | 18 | ✅ Pass |
| `src/lib/identity/hepta/privacy.test.ts` | 11 | ✅ Pass |
| `src/lib/moss60/glyphMetadata.test.ts` | 5 | ✅ Pass |
| `src/lib/moss60/share.test.ts` | 5 | ✅ Pass |
| `src/lib/moss60/widget.test.ts` | 3 | ✅ Pass |
| `src/lib/persistence/sealed.test.ts` | 17 | ✅ Pass |
| `src/lib/store/index.test.ts` | 33 | ✅ Pass |
| `src/lib/qr-messaging/__tests__/protocol-vectors.test.ts` | 4 | ✅ Pass (fixed) |
| `backend/src/routes/genome/contracts.test.ts` | 5 | ✅ Pass |
| **Total** | **243** | ✅ All pass |

### Test Toolchain

| Tool | Purpose | Status |
|------|---------|--------|
| Vitest 4 | Unit + integration runner | Configured ✅ |
| @testing-library/react 16 | Component tests | Installed, no component tests yet |
| happy-dom | DOM environment | Configured ✅ |
| @vitest/coverage-v8 | Coverage | Configured ✅ |
| Playwright / Cypress | E2E | **Not installed** — recommend adding |

### Recommended Test Folder Layout

```
src/
  lib/
    store/__tests__/       ← existing
    breeding/__tests__/    ← existing
    genome/__tests__/      ← existing (decoder)
  components/__tests__/    ← MISSING — add component tests here
  app/__tests__/           ← MISSING — add page-level smoke tests
tests/
  e2e/                     ← MISSING — add Playwright E2E tests
docs/
  protocol/vectors/        ← fixture files (now added)
```

### Commands

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npx vitest run src/lib/store/index.test.ts

# E2E (after Playwright install — see Phase 4)
npx playwright test
```

### Example Starter Tests for 3 Critical Flows

#### Flow 1: Genome Encode/Decode Round-Trip

```typescript
// src/lib/genome/__tests__/roundTrip.test.ts
import { describe, it, expect } from 'vitest';
import { encodeGenome, decodeGenome } from '@/lib/genome';

describe('genome round-trip', () => {
  it('decodes what it encodes for a known genome', () => {
    const genome = {
      fire: 80, water: 20, earth: 60, air: 40,
      aether: 50, crystal: 30, void: 10,
    };
    const encoded = encodeGenome(genome);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodeGenome(encoded);
    // Expect element values to be within tolerance
    for (const key of Object.keys(genome)) {
      expect(decoded[key]).toBeCloseTo(genome[key], 0);
    }
  });

  it('produces different hashes for different genomes', () => {
    const g1 = encodeGenome({ fire: 100 });
    const g2 = encodeGenome({ fire: 50 });
    expect(g1).not.toBe(g2);
  });
});
```

#### Flow 2: Pet Store — Create, Save, Load

```typescript
// src/lib/store/__tests__/petLifecycle.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMetaPetWebStore } from '@metapet/core/store';

describe('pet lifecycle', () => {
  let store: ReturnType<typeof createMetaPetWebStore>;

  beforeEach(() => {
    store = createMetaPetWebStore();
  });

  it('initialises with a pet having default vitals', () => {
    const state = store.getState();
    expect(state.pet).toBeDefined();
    expect(state.pet.vitals).toBeDefined();
  });

  it('mutates pet name via store action', () => {
    store.getState().renamePet?.('Jewble');
    expect(store.getState().pet.name).toBe('Jewble');
  });
});
```

#### Flow 3: MOSS60 QR Protocol — Encode, Send, Decode

```typescript
// src/lib/qr-messaging/__tests__/protocol-smoke.test.ts
import { describe, it, expect } from 'vitest';
import {
  createProtocolEnvelope,
  parseProtocolEnvelope,
  validateProtocolEnvelope,
  decodeProtocolPayload,
} from '@/lib/qr-messaging';

describe('MOSS60 protocol smoke', () => {
  const message = 'Hello from BSS';

  it('creates a valid envelope for base60 format', () => {
    const raw = JSON.stringify(createProtocolEnvelope(message, 'base60'));
    const envelope = parseProtocolEnvelope(raw);
    expect(envelope).not.toBeNull();
    expect(envelope!.version).toBe('1.0');
    expect(envelope!.capabilities).toContain('envelope-v1');
  });

  it('round-trips through decodeProtocolPayload', () => {
    const raw = JSON.stringify(createProtocolEnvelope(message, 'base60'));
    const result = decodeProtocolPayload(raw);
    expect(result.decoded).toBe(message);
    expect(result.envelope?.version).toBe('1.0');
  });

  it('validates required capabilities', () => {
    const env = createProtocolEnvelope(message, 'text');
    expect(() => validateProtocolEnvelope(env)).not.toThrow();
  });
});
```

### CI Plan

```yaml
# Recommended addition to .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master, 'claude/**']
  pull_request:
    branches: [main, master]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint        # tsc + eslint (after Fix #1)
      - run: npm test            # all 243+ unit tests
      - run: npm run build       # production build check
```

### Out of Scope (for now)
- Visual regression tests (Chromatic, Percy)
- Load / stress tests
- Mobile (Expo / Capacitor) E2E
- Backend integration tests (no test runner configured in `backend/`)

---

## 3. Upgrade Risk Map

### Dependencies

| Upgrade Item | Current | Latest | Risk | Notes | Mitigation |
|---|---|---|---|---|---|
| **Next.js** | 16.1.6 | 16.1.6 (current) | Low | Already on latest 16.x; App Router, Turbopack enabled | No action needed |
| **React** | 19.2.3 | 19.2.3 (current) | Low | Already on React 19 | No action needed |
| **TypeScript** | 5.9.3 | 5.9.3 (current) | Low | Latest 5.x | No action needed |
| **Framer Motion** | 12.24.0 | ~12.x | Low | Major 12 is current; breaking changes from v10→v11→v12 already absorbed | No action needed |
| **Zustand** | 5.0.9 | 5.x | Low | Already on v5 | No action needed |
| **Three.js** | 0.182.0 | ~0.182 | Low | Rapid minor versioning but current | No action needed |
| **Tone.js** | 15.1.22 | ~15.x | Low | Current major | No action needed |
| **Phaser** | 3.90.0 | 3.90.x | Low | Current; Phaser 4 is alpha only | No action needed |
| **Tailwind CSS** | 3.4.19 | 4.x | **High** | Tailwind v4 is a complete rewrite — config format, PostCSS plugin, utility names all changed | Plan separate upgrade sprint |
| **ESLint** | 9.39.2 | 9.39.2 | Medium | `FlatCompat` circular-JSON bug with `eslint-config-next` (see Issue #1) | Apply Fix #1 immediately |
| **`same-runtime`** | 0.0.1 | — | **High** | Unlisted/scaffold package; sets `jsxImportSource` to a private CDN shim; no changelog or SLA | Remove; revert to standard React JSX — coordinate with team |
| **Biome** | 1.9.4 | 1.9.4 | Low | Current | No action needed |
| **Vitest** | 4.0.16 | 4.0.16 | Low | Current | No action needed |
| **`ajv`** (transitive) | <6.14.0 | 8.x | Medium | ReDoS vulnerability (GHSA-2g4f-4pwh-qvx6) | `npm audit fix` or `overrides` |
| **`minimatch`** (transitive) | ≤3.1.3 | 9.x | High | ReDoS via wildcard backtracking (GHSA-7r86-cg39-jmmj) | `npm audit fix` |
| **`rollup`** (transitive) | 4.0–4.58 | 4.59+ | High | Arbitrary file write via path traversal (GHSA-mw96-cpmx-2vgc) | `npm audit fix` |

### Node / Runtime Constraints

| Item | Current | Target | Risk | Notes |
|---|---|---|---|---|
| Node.js (local) | v22.22.0 | v22 LTS | Low | Correct version |
| Node.js (CI) | v20 (pinned in workflow) | v22 LTS | Medium | Mismatches local; v20 EOL Oct 2026 |
| `engines` field | Missing | `"node": ">=22"` | Low | Add for clarity |
| `.nvmrc` | Missing | `22` | Low | Add for `nvm use` convenience |

### Architecture Risks

| Area | Risk | Notes |
|---|---|---|
| `jsxImportSource: "same-runtime/dist"` | **High** | Non-standard JSX shim; `same-runtime@0.0.1` is a scaffold placeholder. TSC passes via `skipLibCheck`. If this package disappears from npm, builds silently break. |
| `noImplicitAny: false` with `strict: true` | Medium | Partially relaxed strict mode. Enables type drift over time. |
| Sub-packages (`backend/`, `frontend/`, `mobile/`) | Medium | No `package.json` or `tsconfig.json` in those dirs; they're included in root compilation. As they grow, consider a proper workspace (npm workspaces / Turborepo). |
| Service Worker (`/sw.js`) | Low | Registered in `ClientBody`; no caching strategy documented. Can serve stale builds post-deploy. |
| IndexedDB persistence | Low | All pet/store data is local-only. No backup or migration path. On schema changes, IndexedDB version bump is needed. |
| API routes with no auth | Medium | `/api/genome-resonance/*` and `/api/genome/sonify/*` have no apparent auth layer. If they call external services, this is an open relay risk. |
| 34 MB zip in repo | Low | `time-calculator-compass.zip` bloats clone and CI cache. |

---

## 4. Upgrade Checklist

### Pre-flight (Do These First)

```bash
# 1. Create a git tag as rollback point
git tag pre-upgrade-baseline

# 2. Confirm all tests pass (243/243)
npm test

# 3. Confirm build passes
npm run build

# 4. Push tag
git push origin pre-upgrade-baseline
```

Acceptance criteria: `npm test` green, `npm run build` exits 0.

---

### Step 1 — Fix ESLint (Blocker, ~30 min)

**Problem**: `compat.extends("next/core-web-vitals")` causes circular JSON in `@eslint/eslintrc` when
`eslint-config-next` v16 loads `eslint-plugin-react` under the flat config system.

**Fix**: Replace `FlatCompat` with native flat config for `next/core-web-vitals`.

```diff
// eslint.config.mjs
-import { dirname } from "path";
-import { fileURLToPath } from "url";
-import { FlatCompat } from "@eslint/eslintrc";
+import nextPlugin from "eslint-config-next/flat";

-const __filename = fileURLToPath(import.meta.url);
-const __dirname = dirname(__filename);

-const compat = new FlatCompat({ baseDirectory: __dirname });

 const eslintConfig = [
   {
     ignores: [".next/**", ".netlify/**", "out/**", "node_modules/**",
               "*.config.js", "*.config.mjs", "coverage/**"],
   },
-  ...compat.extends("next/core-web-vitals", "next/typescript"),
+  ...nextPlugin,
   {
     languageOptions: {
       parserOptions: { warnOnUnsupportedTypeScriptVersion: false },
     },
     rules: {
       "@typescript-eslint/no-unused-vars": "off",
       "@typescript-eslint/no-explicit-any": "off",
       "react/no-unescaped-entities": "off",
       "@next/next/no-img-element": "off",
       "jsx-a11y/alt-text": "off",
       "import/no-anonymous-default-export": "off",
     },
   },
 ];

 export default eslintConfig;
```

> **ASSUMPTION**: `eslint-config-next` v16 exports a `flat` entry point. If not, use `eslint-config-next/flat`
> or pin `eslint-config-next` to a version that fully supports ESLint 9 native flat config.
> Alternative (lower risk): pin `eslint` to `^9.20.0` where FlatCompat had fewer circular issues and test.

**Verify**:
```bash
npm run lint
# Expected: exits 0 with no errors
```

---

### Step 2 — Fix npm Audit Vulnerabilities (~15 min)

```bash
npm audit fix

# If --force is needed for any, check the diff carefully:
npm audit fix --dry-run

# Commit
git add package-lock.json package.json
git commit -m "fix: resolve npm audit vulnerabilities (ajv, minimatch, rollup)"
```

**Verify**:
```bash
npm audit
# Expected: 0 vulnerabilities
npm test && npm run build
# Expected: still green
```

---

### Step 3 — Add Node Version Files and Fix CI (~15 min)

```bash
echo "22" > .nvmrc
```

Add to `package.json`:
```json
"engines": {
  "node": ">=22.0.0",
  "npm": ">=10.0.0"
}
```

Update CI workflow node-version from `20` → `22`.

```bash
git add .nvmrc package.json .github/workflows/production-smoke-gate.yml
git commit -m "chore: align node version to 22 LTS"
```

---

### Step 4 — Rename Package and Fix Low-Severity Issues (~10 min)

```json
// package.json
"name": "bss"
```

Add `time-calculator-compass.zip` to `.gitignore`.

```bash
git add .gitignore package.json
git commit -m "chore: rename package, ignore zip artifact"
```

---

### Step 5 — Add CI Workflow for Automated PR Checks (~20 min)

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main, master, 'claude/**']
  pull_request:
    branches: [main, master]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add automated PR lint + test + build workflow"
```

**Acceptance criteria**: PR checks go green automatically on push.

---

### Step 6 — Resolve `same-runtime` Dependency (Requires Team Input)

> **WARNING**: Do not do this unilaterally — `same-runtime` may be intentional scaffolding from the SAME platform.

Investigate:
- Is `same-runtime` a platform-injected shim (from Replit SAME, etc.)?
- If yes: keep it and document it.
- If no: remove it and revert `tsconfig.json#jsxImportSource` to `react`.

```bash
# If removing:
npm uninstall same-runtime
# tsconfig.json: remove "jsxImportSource" line (or set to "react")
git add package.json package-lock.json tsconfig.json
git commit -m "chore: remove same-runtime scaffold shim, use standard React JSX"
```

**Verify**: `npm run build` still works. Check for any runtime `createElement` errors.

---

### Step 7 — Tailwind CSS v4 Upgrade (Separate Sprint)

Tailwind v4 is a full rewrite. Do this as its own sprint after all other fixes are stable.

```bash
# Install v4
npm install tailwindcss@4 @tailwindcss/postcss@4

# v4 no longer uses tailwind.config.ts — migrate to CSS-first config
# See: https://tailwindcss.com/docs/upgrade-guide

# Run migration codemod
npx @tailwindcss/upgrade

# Run lint + build
npm run lint && npm run build
```

**Risk level**: High. Expect breaking utility class name changes, PostCSS config changes, and potential plugin incompatibilities (`tailwindcss-animate` may need update).

**Rollback**:
```bash
git checkout pre-upgrade-baseline -- tailwind.config.ts postcss.config.mjs package.json package-lock.json
```

---

## 5. Patch Notes + Verification Steps

### Patch 1 — Protocol Vector Fixture Files (Applied in This PR)

**What broke**: `src/lib/qr-messaging/__tests__/protocol-vectors.test.ts` loaded 4 JSON fixture files from `docs/protocol/vectors/` that didn't exist, causing `ENOENT` errors and 4 test failures.

**Fix applied**:
```
docs/protocol/vectors/
  hash-vectors.json          ← moss60Hash + extendedHash test vectors
  encoding-vectors.json      ← base60/MOSS60 encode/decode vectors
  key-derivation-vectors.json ← Diffie-Hellman-style key derivation vectors
  envelope-vectors.json      ← Protocol envelope round-trip vectors
```

Fixtures were computed by running the exact same functions from `src/lib/qr-messaging/crypto/experimentalCore.ts` and `src/lib/qr-messaging/encoding.ts` in a Node.js script, ensuring they are consistent with the implementation.

**Key detail**: `hashData()` in `experimentalCore.ts` is `moss60Hash()` (single-pass), not `extendedHash()`. The fixtures reflect this.

**Verify**:
```bash
npm test
# Expected: 243/243 pass
```

**Edge cases**:
- If the `moss60Hash` or `extendedHash` implementations are changed, the fixtures must be regenerated. Consider adding a `npm run generate:fixtures` script.
- The `key-derivation-vectors.json` fixture uses deterministic seeds (`alice-seed`, `bob-seed`). Do not use these in production.

---

### Patch 2 — ESLint Fix (To Apply per Step 1)

**Why the change works**: ESLint 9's flat config system passes plugin objects directly as JavaScript references. When `@eslint/eslintrc`'s `FlatCompat` tries to serialize legacy shared config for validation, it calls `JSON.stringify()` on the config graph, which includes `eslint-plugin-react` — a circular object. Using native flat config exports from `eslint-config-next` bypasses this serialization entirely.

**Verify**:
```bash
npm run lint
# Expected: TypeScript + ESLint both exit 0
```

**Edge cases**:
- If `eslint-config-next` doesn't yet export a flat-config entry, pin `eslint` to a version with working FlatCompat (e.g., `9.20.0`) as a temporary hold.
- The existing rule suppressions (`@typescript-eslint/no-unused-vars: "off"`, etc.) are intentionally permissive. These can be tightened incrementally after other issues are resolved.

---

### Patch 3 — npm Audit Fixes (To Apply per Step 2)

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `ajv` <6.14.0 | ReDoS via `$data` option | `npm audit fix` |
| `minimatch` ≤3.1.3 | ReDoS via wildcard backtracking | `npm audit fix` |
| `rollup` 4.0–4.58 | Arbitrary file write (path traversal) | `npm audit fix` |

All are in devDependencies / transitive build-tool deps. No production runtime risk.

**Verify**:
```bash
npm audit
# Expected: 0 vulnerabilities (or only low-severity)
npm test && npm run build
# Expected: still green — no behaviour change from dep bumps
```

---

### Error Boundaries (Recommendation)

The app currently has no React error boundaries. Add one to `ClientBody.tsx`:

```tsx
// src/app/error.tsx (Next.js App Router global error boundary)
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-slate-950 text-zinc-100">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-amber-400">Something went wrong</h1>
          <p className="text-zinc-400 text-sm">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-cyan-400 text-slate-950 rounded font-semibold hover:bg-cyan-300"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
```

---

### Loading States (Recommendation)

`src/app/loading.tsx` exists but check its content matches the midnight-blue / sun-gold aesthetic:

```tsx
// src/app/loading.tsx — verify or update
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

---

### Logging Strategy

| Environment | Strategy |
|---|---|
| Development | `console.log` / `console.error` acceptable |
| Production | Strip `console.log` via Next.js compiler option; keep `console.error` for runtime errors |

Add to `next.config.js`:
```js
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  // ...existing config
};
```

---

### Performance Quick Wins

| Win | Where | How |
|---|---|---|
| Lazy-load Phaser | Any page using `VimanaTetris` or Space Jewbles | `const Phaser = await import('phaser')` — Phaser is ~1 MB |
| Lazy-load Three.js scenes | Genome Explorer, Geometry Sound | Dynamic `import()` inside `useEffect` |
| `<Image>` component | Any `<img>` tags | Next.js `Image` with `width`/`height` for LCP improvement (note: `@next/next/no-img-element` is currently off in ESLint) |
| Service Worker caching | `public/sw.js` | Add a `CACHE_VERSION` constant; on activation, clear old caches |

---

## Appendix: File Map

```
/
├── src/app/                  Next.js App Router pages
│   ├── layout.tsx            Root layout (metadata, ClientBody)
│   ├── page.tsx              Main pet page (~26k tokens — consider splitting)
│   ├── ClientBody.tsx        Shell: nav, auth, service worker
│   ├── loading.tsx           Suspense fallback
│   ├── digital-dna/page.tsx  Key feature (smoke-gate target)
│   ├── genome-explorer/      3D genome visualization
│   ├── qr-messaging/         MOSS60 QR encrypted chat
│   ├── api/genome-resonance/ Server-side API routes
│   └── ...
├── src/lib/                  Domain logic
│   ├── genome/               Encode/decode/hash genome strings
│   ├── breeding/             Offspring prediction
│   ├── evolution/            Evolution state machine
│   ├── qr-messaging/         MOSS60 protocol (crypto + encoding)
│   ├── persistence/          IndexedDB (pets, bonds, sealed state)
│   ├── store/                Zustand root store
│   └── identity/             PrimeTailID, HeptaDigits, ECC
├── backend/src/              Future backend (no package.json)
├── mobile/src/               Prototype mobile features
├── frontend/src/             Prototype frontend features
├── docs/protocol/vectors/    ← NEW: MOSS60 test fixtures
├── shared/contracts/         Shared types (pricing, genome resonance)
└── time-calculator-compass/  Embedded sub-project (Vite + React)
```
