# MetaPet School vs. Blue Snake Studios — domain separation

MetaPet ships two public products from **one** codebase and **one** Vercel
project. Which product a visitor sees is decided at request time from the
hostname, not from a build-time flag.

| Domain | Product | Surface id |
| --- | --- | --- |
| `metapet.school` | The focused Australian classroom product | `school` |
| `bluesnakestudios.com` | The complete MetaPet + Blue Snake Studios ecosystem | `studio` |

## 1. Architecture summary

Everything hostname-aware funnels through a central config so hostname checks
never scatter across components:

- **`src/lib/domain/surface.ts`** — the single source of truth. Defines the
  `ProductSurface` type, per-surface `ProductSurfaceConfig` (name, home path,
  allowed routes, navigation, metadata, feature flags) and the pure resolver
  `resolveProductSurface(hostname, { override })`.
- **`src/lib/domain/routePolicy.ts`** — pure `evaluateRoute({ surface, pathname })`
  returning `next` / `rewrite` / `redirect` / `redirect-external`.
- **`middleware.ts`** — resolves the surface from the request hostname, applies
  the route policy, and stamps every request/response with an
  `x-metapet-surface` header.
- **`src/lib/domain/serverSurface.ts`** — reads that header inside server
  components / route handlers (falls back to the build profile when the header
  is absent, e.g. static generation).
- **`src/lib/domain/SurfaceProvider.tsx`** — carries the server-resolved surface
  to client components via React context, so navigation renders per-domain
  **without** reading `window.location` (no hydration mismatch).
- **`src/lib/domain/contact.ts`** — one central contact configuration.

## 2. Public route maps

### `metapet.school` (clean, school-native URLs)

| Public URL | Internal implementation |
| --- | --- |
| `/` | `/schools` (landing) |
| `/field` | `/schools/field` (Field Mode entry) |
| `/lessons` | `/schools/lessons` |
| `/classroom` | `/school-game` (classroom runtime) |
| `/start` | `/school-game` |
| `/teacher-guide` | `/schools/teacher-guide` |
| `/parents` | `/schools/parents` |
| `/safety` | `/schools/safeguarding` |
| `/privacy` | `/legal/privacy` |
| `/contact` | `/schools/contact` |

`/schools/*` remains internally supported (governance docs pack). Any other
path on the school domain (wallet, body-forge, breeding, shop, pricing,
identity, DNA labs, studio projects, consumer onboarding, …) **redirects to the
school home** — enforced in middleware, not just hidden in navigation.

### `bluesnakestudios.com` (full ecosystem, unchanged)

The complete consumer/creative experience is served as before. The only
additions:

- A clearly separated **“MetaPet for Schools”** link → `https://metapet.school`.
- Old public school URLs redirect out to the school domain, so the two domains
  never both index the same school page:
  - `/schools` → `https://metapet.school/`
  - `/schools/field` → `https://metapet.school/field` (and the other known
    public school pages → their clean school-domain URL)
  - any unmapped deep/internal `/schools/*` link → `https://metapet.school/`.

## 3. Route enforcement

`middleware.ts` runs on every request (matcher excludes `_next/static` and
`_next/image`):

1. **Which surface?** `resolveProductSurface(hostname, { override })`.
2. **Studio canonical host** consolidation (bare domain / prod aliases → `www`).
3. **Route decision** from `evaluateRoute`:
   - `rewrite` — clean URL → internal route (query preserved).
   - `redirect` — blocked school route → `/` (query dropped for safety).
   - `redirect-external` — studio `/schools*` → school domain (308).
   - `next` — serve as-is.
4. The resolved surface is written to the `x-metapet-surface` request header so
   the server layer renders the matching metadata, manifest, robots/sitemap and
   navigation.

There are **no redirect loops**: `/` rewrites (never redirects), and the
blocked-route target `/` is itself a rewrite, so the chain always terminates.

## 4. Shared vs. domain-specific code

- **Shared** (reused by both surfaces): the MetaPet engine, pet rendering &
  state, lesson runtime (`/school-game`), classroom storage, design tokens,
  child-safe utilities, and the school content data (`src/app/schools/content.ts`).
- **Domain-specific** (driven by surface): navigation, homepage, product naming
  & language, metadata / canonical URLs, feature flags, route permissions,
  footer, contact details, analytics context, and legal/privacy presentation.

School-native pages are thin compositions that reuse existing content — no copy
of the consumer app was made.

## 5. Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SCHOOL_DOMAIN` | School hostname (default `metapet.school`). |
| `NEXT_PUBLIC_STUDIO_DOMAIN` | Studio hostname (default `bluesnakestudios.com`). |
| `NEXT_PUBLIC_DEV_SURFACE` | Dev/preview only: force `school`/`studio`. Ignored in production. |
| `NEXT_PUBLIC_APP_PROFILE` | Legacy: `schools` forces the school surface on every host (standalone pilot). Leave unset for the combined deployment. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin fallback / studio canonical redirect target. |

### Local development

Test either surface without editing source:

- `?surface=school` / `?surface=studio` query override, or
- `NEXT_PUBLIC_DEV_SURFACE=school`, or
- a local hosts entry (`metapet.school` → `127.0.0.1`).

Query/env overrides are refused in production, so a public query parameter can
never bypass the school safety boundary.

## 6. Vercel domain setup

Point all four hostnames at the **same** Vercel project:

- `metapet.school`
- `www.metapet.school`
- `bluesnakestudios.com`
- `www.bluesnakestudios.com`

Recommended:

1. Add all four domains to the project (Settings → Domains).
2. Set `www.bluesnakestudios.com` (or the bare domain) as the studio production
   domain; the middleware consolidates the bare/alias studio hosts onto the
   canonical `www` origin.
3. Set project env vars `NEXT_PUBLIC_SCHOOL_DOMAIN`, `NEXT_PUBLIC_STUDIO_DOMAIN`
   and `NEXT_PUBLIC_SITE_URL` (studio canonical). Leave `NEXT_PUBLIC_APP_PROFILE`
   **unset** for the combined deployment.

Only a small adapter (`VERCEL_ENV`) is used for Vercel specifics; hostname
detection itself is generic.

## 7. DNS / external configuration still required

- DNS records for `metapet.school` + `www.metapet.school` → Vercel.
- Provision & approve the dedicated school mailboxes (`hello@metapet.school`,
  `schools@metapet.school`), then flip `active: true` in
  `src/lib/domain/contact.ts`. Until then the school surface falls back to the
  currently active studio inbox.

## 8. Risks / follow-up

- Storage keys already namespace school data (`metapet-schools-*`). A future
  pass could unify these under `metapet-school:` / `metapet-studio:` prefixes
  **with a migration** so no existing classroom progress is lost.
- The `x-metapet-surface` header makes rendering dynamic (per-request). This is
  intended for the combined deployment; a static-export build would need the
  build-profile path instead.
- Deep `/schools/docs/*` links on the studio domain redirect to
  `metapet.school/docs/*`; confirm those slugs resolve on the school domain or
  add explicit mappings if any 404.
