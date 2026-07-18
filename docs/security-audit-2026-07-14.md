# Full Audit Report — 2026-07-14

Scope: the deployed Meta-Pet / Blue Snake Studios app at the repo root (`src/`,
`middleware.ts`, `backend/`, `shared/`), plus a lighter pass over the sibling
`07-SuiteMaster` dashboard and `05-Teacher-Veil-App`. Covers dependency
vulnerabilities, application security (XSS/injection, crypto, secrets,
child-safe routing), and build/test health. This is a source-code and
dependency audit; it does not include a live penetration test or infra/CDN
review.

## Summary

| Area | Before | After |
|---|---|---|
| `npm audit` vulnerabilities | 12 (3 critical, 5 high, 3 moderate, 1 low) | 3 (moderate, unfixable without a breaking Next.js downgrade — see below) |
| Lint (`tsc --noEmit` + `eslint`) | clean | clean |
| Tests | 628/628 passing | 628/628 passing |
| Production build | clean | clean |
| XSS-capable `dangerouslySetInnerHTML`/`innerHTML` sinks fed by attacker-shaped data | 2 unescaped | 0 |
| Runtime dependency missing from `package.json` | `zod` (phantom) | declared |

7 issues fixed, 5 documented for a follow-up decision. Details below.

---

## Fixed

### 1. Dependency vulnerabilities (`npm audit`)
**Before:** 12 vulnerabilities — 3 critical (`vitest`/`@vitest/ui` arbitrary file read+execution when the Vitest UI server is running), 5 high (`next` middleware/CSRF/cache-poisoning advisories, `vite` dev-server file read, `picomatch` ReDoS, `flatted` prototype pollution, `happy-dom` cookie/code-injection issues), 3 moderate, 1 low.
**Fix:** `npm audit fix` (no `--force`), which resolved everything except one moderate issue by moving within existing semver ranges already declared in `package.json` (notably `next` 16.1.6 → 16.2.10, still inside `^16.1.1`). `package.json` itself did not need to change; only the lockfile did.
**Remaining:** 3 moderate findings, all the *same* underlying issue — a `postcss@8.4.31` copy vendored **inside** `next`'s own `node_modules` (XSS via unescaped `</style>` in PostCSS's CSS stringifier). The only fix `npm` offers is `next@9.3.3`, a catastrophic downgrade of the framework itself. Real-world exposure is low here since the app doesn't run PostCSS over untrusted/user-supplied CSS at runtime. Recommendation: re-run `npm audit` after each Next.js bump and drop this once upstream ships a patched vendored copy.

### 2. Reflected script injection in `/share/[token]`
**File:** `src/app/share/[token]/page.tsx`
Anyone can construct a MOSS60 share token client-side (`encodeMoss60Payload`/`createShareUrl` — the "signature" is a public, keyless hash, not a server secret), so `metadata.id`/`scheme`/`variant`/`projection`/`seed` are attacker-chosen strings. The page embedded them via `dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}` inside a `<script type="application/json">` tag with no escaping — a token containing `</script><script>...</script>` in any field would close the tag early and inject arbitrary markup/script into the page.
**Why it didn't fire today:** the route is built with `dynamicParams = false` and `generateStaticParams` returning only `{ token: "demo" }`, so Next.js 404s any token that isn't `"demo"` before the component ever runs — the sink exists but isn't currently reachable with attacker data.
**Fix:** escape `<` → `<` in the serialized JSON before injection (the standard mitigation Next.js itself uses for `__NEXT_DATA__`; `<` round-trips through `JSON.parse` identically to a literal `<`, so no consumer is affected).
**Follow-up:** the entire point of a `/share/[token]` route is presumably to accept arbitrary tokens — if `dynamicParams` is ever flipped to allow that, this fix is what stands between that and a live stored-XSS. Worth a deliberate look before enabling dynamic tokens.

### 3. Same pattern in the MOSS60 embeddable widget
**File:** `src/lib/moss60/widget.ts`
`renderMoss60Widget()` builds a DOM node via raw `wrapper.innerHTML = \`...${id}...${seed}...\`` from the same forgeable payload shape, with no static-generation safety net at all (it's plain client-side DOM, not a Next.js page). Not currently called from any app code (only from its own test), but it exists specifically to be embedded elsewhere, which is exactly the scenario where this becomes live.
**Fix:** added an `escapeHtml()` helper and applied it to the five untrusted string fields before interpolation.

### 4. `zod` used in production code but not a declared dependency
**Files:** `src/schemas/genomeResonance.ts` (imported by all 3 live API routes), `package.json`
`zod` was never listed in `package.json` at all. `npm ls zod` showed it only reachable via `eslint-config-next → eslint-plugin-react-hooks`, i.e. a **devDependency's transitive dependency**. It happened to work because `npm ci` installs devDependencies too and Next.js's build-time file tracing picks up whatever's physically in `node_modules`, but that's incidental — any change to the eslint tooling's own dependency graph (a routine `npm update`) could silently remove `zod` from `node_modules` and break all three API routes with "Cannot find module 'zod'".
**Fix:** `npm install zod@^4.3.6` → added as an explicit direct dependency (resolved to `^4.4.3`, same version already in the tree, so no behavior change).

### 5. Unbounded input on public API routes
**File:** `src/schemas/genomeResonance.ts`
The Zod schemas backing `/api/genome-resonance/simulate`, `/api/genome-resonance/explain`, and `/api/genome/sonify/[petId]` had no upper bound on object/array size or string length — `deltas: z.record(z.string(), z.number())` would accept a request with millions of keys, and `simulation: z.array(...)` had no `.max()`. The real UI only ever sends one delta per visible trait node (a handful at most).
**Fix:** capped `deltas`/`simulation` at 64 entries, string fields (`petId`, `viewStateKey`, `traitId`, etc.) at 200 characters, and required all numbers to be finite (rejects `NaN`/`Infinity`). Low severity on its own (Vercel's platform-level body-size cap already limits worst-case payload size), but cheap, correct, and standard input-validation hygiene for unauthenticated POST routes.

### 6. Non-cryptographic nonce in the identity module
**File:** `src/lib/identity/hepta/index.ts`
`createHeptaPayload()` generated its 14-bit HeptaCode nonce with `Math.random()` while the rest of `src/lib/identity/*` consistently uses the Web Crypto API. Impact is low in practice — the nonce isn't a server-verified anti-replay token, just a freshness/variety value in a payload the device signs for itself — but there's no reason for a module in the identity/crypto path to use a non-CSPRNG source.
**Fix:** swapped to `crypto.getRandomValues(new Uint16Array(1))[0] % 16384`, same range, no behavior change.

### 7. Unauthenticated, unbounded, open-CORS proxy to a paid LLM API (`07-SuiteMaster`)
**File:** `07-SuiteMaster/src/app/api/guru/route.ts`
This sibling dashboard's `/api/guru` route streams from the Anthropic API using a server-side key (correctly never exposed to the client — that part was already right). But the route had no authentication, no rate limiting, no cap on how many messages a single request could send (only per-message length was truncated), and an `OPTIONS` handler advertising `Access-Control-Allow-Origin: "*"` — meaning **any third-party website could embed a script that drives a visitor's browser to call this endpoint**, spending this project's Anthropic budget on requests that never touched the actual dashboard.
**Fix (no new infra required):** capped the conversation array at 20 messages per request, and removed the wildcard CORS/`OPTIONS` handler entirely (the dashboard's only caller uses a same-origin relative fetch, `"/api/guru"`, which needs no CORS headers at all — this only closes off cross-site callers).
**Not fixed (needs a decision):** there's still no per-IP/per-session rate limiting or authentication, so the endpoint remains free to hammer from same-origin scripts or direct API calls. That needs either an auth story for the dashboard or an infra-level limiter (e.g. Vercel/Upstash rate limiting), which is a product decision, not a drive-by fix. **This is the single highest-priority open item from this audit.**
**Caveat:** this sub-app has its own `package.json`/lockfile outside the main repo's build; I verified the change by reading the (sole) caller rather than running its own install/build toolchain.

---

## Documented, not changed

These are real observations worth a deliberate decision, but I didn't change them — either because nothing is currently broken, or because the "right" fix requires a product call I can't make unilaterally.

- **`CORE_ALLOWED_EXACT`/`CORE_ALLOWED_PREFIXES` in `src/lib/childSafeBaseline.ts` are dead code.** All four call sites (`middleware.ts`, `ClientBody.tsx`, `childSafeRoute.server.ts`, `childSafeRoute.client.ts`) gate on `IS_SCHOOLS_PROFILE`/`ENABLE_CHILD_SAFE_BASELINE` *before* ever consulting `isChildSafeAllowedPathname()`, and both of those flags force the app into `"schools"` profile whenever they're true. So the "core" branch of the allowlist — a fully-built-out list of routes — can never actually be selected in production; only `childSafeBaseline.test.ts` exercises it, via direct mocking. This isn't a security hole (the core app is simply unrestricted by design outside schools mode, which is presumably intentional), but it reads as though someone intended a lighter-weight "child-safe core" mode that no configuration flag actually reaches. Worth either wiring it up or deleting it so it doesn't mislead the next person who edits it.
- **`RegistrationCertificate.tsx`'s `document.write()` template** interpolates `petName` and other fields unescaped into raw HTML for the print window. Not exploitable today — the only call site (`src/app/pet/page.tsx`) passes a hardcoded literal (`"Auralia"` or `"Meta-Pet"`), never a user-editable name. Flagging because the component's whole purpose (a certificate bearing "the pet's name") makes it likely someone eventually wires a real, user-editable pet name into this prop, at which point it becomes self-XSS.
- **`backend/src/routes/genome/{quest,whatIf,arProfile,constellation,futures}.ts` are unreachable from any actual Next.js route.** Only `sonify.ts` is wired up (via `src/app/api/genome/sonify/[petId]/route.ts`); the rest are only exercised by `backend/src/routes/genome/contracts.test.ts`. Related: `questRepository`/`resonanceRoomRepository`/`whatIfScenarioRepository` persist to `backend/data/*.json` on local disk via plain `fs.writeFileSync` — harmless today since nothing calls them in production, but that pattern **will not work on Vercel's read-only serverless filesystem** if any of these routes get wired up later. Worth knowing before someone connects them and ships a feature that silently no-ops (or throws) in production.
- **8-character truncated digest for MOSS60 share verification** (`moss60Hash`, used in `verifyMoss60Payload`). Trivially collidable, but it's a self-consistency/tamper-indicator for cosmetic metadata (color scheme, projection, seed), not an access-control boundary, so the low collision resistance isn't currently consequential.
- **`metadataBase` build warning** — cosmetic Next.js build-time warning seen in this sandbox because `NEXT_PUBLIC_SITE_URL` wasn't set for the build; the code already handles this conditionally (`src/app/layout.tsx`) and will resolve correctly wherever that env var is actually configured (it is, per `.env.example` and the Vercel project settings). No action needed.

## Not deeply reviewed

- **`05-Teacher-Veil-App/`** — a separate Vite/pnpm project (KPPS packages, `Veil-Website`) excluded from the main app's `tsconfig.json`. Covered by the repo-wide secret scan (clean) but not a full dependency/code audit — recommend a dedicated pass if it's actively deployed.
- No committed `.env` files, private keys, or hardcoded API keys/tokens/passwords were found anywhere in the repository (checked via pattern search across all directories, not just `src/`).

---

## Verification

After all fixes: `npm run lint` clean, `npm test` → 628/628 passing across 85 files, `npm run build` produces the same route manifest as before the changes (no new/missing routes, no new build errors or warnings). The `07-SuiteMaster` change was verified by reading its sole caller rather than a full build, per the caveat above.

## Files changed

- `package.json`, `package-lock.json` — dependency bumps (`npm audit fix`) + `zod` added as a direct dependency
- `src/app/share/[token]/page.tsx` — escape JSON before `dangerouslySetInnerHTML`
- `src/lib/moss60/widget.ts` — escape untrusted fields before `innerHTML`
- `src/schemas/genomeResonance.ts` — bound request sizes/lengths
- `src/lib/identity/hepta/index.ts` — CSPRNG nonce
- `07-SuiteMaster/src/app/api/guru/route.ts` — cap message count, remove wildcard CORS
