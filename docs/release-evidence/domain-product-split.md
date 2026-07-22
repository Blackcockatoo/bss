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
