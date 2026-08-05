# Blue Snake Studios / MetaPet School domain split

Date: 2026-07-22

## Product contract

The two public domains share the same `Blackcockatoo/bss` codebase and Vercel deployment, but they no longer expose the same product surface.

### `www.bluesnakestudios.com`

- Canonical home of the full MetaPet product and wider Blue Snake Studios system.
- Keeps consumer MetaPet routes available, including the pet, identity, DNA, Body Forge, activities and wellness surfaces.
- Uses a distinct full-product homepage.
- Links outward to the dedicated classroom product.

### `www.metapet.school`

- Dedicated Australian Years 3–6 classroom surface.
- Redirects `/` permanently to `/schools/field` on the same host.
- Enforces the Field Mode route policy from the hostname itself; no activation cookie is required to establish the boundary.
- Allows only Field Mode, approved school support, classroom, legal and offline-pack routes.
- Redirects consumer pages to `/schools/field` and returns an opaque 404 for blocked APIs.
- Sets the Field presentation marker on approved routes so consumer navigation is suppressed.

## Standalone identity

Date: 2026-08-05

Sharing one deployment previously meant sharing one identity. The root layout resolves its branding from the build-time `NEXT_PUBLIC_APP_PROFILE`, which is `core` on the combined production build, so every classroom page inherited the Blue Snake Studios title, social card, canonical origin and near-black chrome. The classroom product now carries its own:

- `src/lib/fieldMode/identity.ts` is the single source of the MetaPet School name, tagline, description, colours and canonical origin.
- Field routes declare their own `metadataBase`, canonical, Open Graph and Twitter metadata, so a shared link presents as MetaPet School rather than Blue Snake Studios, and search authority consolidates onto `metapet.school` rather than splitting across two hostnames.
- Field routes declare a light `themeColor` and `colorScheme`, and the `field-surface` wrapper pins the light design tokens on regardless of the `dark` class the shared shell puts on `<html>`.
- The install manifest is named for the product, is `en-AU`, and exposes lesson/classroom/guide/offline shortcuts. Its `start_url` previously sat outside `scope`, which browsers reject as an install target; both are now `/schools/field`.
- Blue Snake Studios remains credited as the maker on the classroom home and keeps the IP notice in the shared `<head>`; it is no longer the headline brand.

### Per-host discovery

`robots.txt` and `sitemap.xml` are resolved per request host:

- On `metapet.school`, robots points at the classroom sitemap and disallows the consumer areas the route policy redirects away, so crawl budget is not spent on redirect chains.
- The classroom sitemap indexes only policy-allowed routes, including every lesson, all on the classroom origin. It previously advertised Blue Snake Studios consumer URLs that this host blocks, and listed no classroom pages at all.
- Blue Snake Studios keeps its existing full-product sitemap unchanged.

Both routes now render dynamically, which is required to read the request host.

### Host resolution

The product split keys entirely off the request hostname, so that value has to survive proxying. `nextUrl.hostname` reports the internal origin rather than the public domain when the app is served behind a proxy; if that happened in production, metapet.school visitors would be handed the full consumer product. The proxy now resolves the host from `x-forwarded-host`, then the `host` header, then the parsed URL, ignoring ports and proxy chains. Redirects reapply the public host and forwarded scheme so a redirect can never leak an internal hostname.

## Deployment shape

One production codebase is intentional. The split is hostname-driven so fixes to the shared MetaPet engine do not need to be copied between separate repositories or divergent application builds.

The older Vercel projects named `bluesnakestudios` and `bss-l8cw` are not required for the custom-domain product split. The active custom domains currently resolve through the `bss` project.

## Validation

The proxy test suite covers:

- MetaPet.school root redirect
- cookie-free Field enforcement from the school hostname
- approved school and Field routes
- consumer route redirects
- blocked API denial
- unrestricted full-product routes on Blue Snake Studios
- existing canonical Blue Snake Studios redirects
- existing school-profile and opt-in Field Mode behavior
- host resolution from forwarded headers, including ports and proxy chains
- redirects staying on the public host and forwarded scheme

Identity and discovery are covered by:

- `src/app/schools/field/layout.identity.test.ts` — canonical origin, social identity free of Blue Snake Studios, light chrome, `en_AU` locale
- `src/app/schoolsDiscovery.test.ts` — per-host robots and sitemap, full lesson coverage, no blocked routes advertised
- `src/app/schools/field/routeHandlers.test.ts` — manifest naming and `start_url` inside `scope`
