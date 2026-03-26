# MetaPet Schools Smoke Runbook

> Referenced by: `.github/workflows/production-smoke-gate.yml`
> Last updated: 2026-03-26

This runbook must be completed **manually** before triggering the MetaPet Schools smoke gate workflow with `smoke_confirmation: confirmed`.

---

## Pre-requisites

- [ ] Dedicated schools deployment is live on the intended school-facing domain
- [ ] Deployment uses the schools contract: `NEXT_PUBLIC_APP_PROFILE=schools`, `NEXT_PUBLIC_CHILD_SAFE_BASELINE=true`, `STUDENT_DEPLOYMENT=true`, `NEXT_PUBLIC_SITE_URL=<schools-domain>`
- [ ] Browser DevTools console is open to catch JS errors and unexpected network calls

---

## Smoke Checklist

### 1. Entry route and first impression (`/`)

- [ ] Visiting `/` redirects to `/schools`
- [ ] The first meaningful screen presents `MetaPet Schools`, not `Blue Snake Studios` or consumer product language
- [ ] No install button or install marketing cue appears in the shared shell
- [ ] No school-visible loading state uses lore-heavy copy such as DNA, PrimeTail, HeptaCode, celestial, or astral phrasing

### 2. School overview and in-app review path (`/schools`)

- [ ] `/schools` loads without hydration or console errors
- [ ] The hero CTA starts with the in-app review path, not a file download
- [ ] Reviewer pathways link into `/schools/docs/...`
- [ ] The document pack still offers downloads, but `Read in app` remains the primary review action

### 3. Boundary enforcement

- [ ] Direct visits to `/pet`, `/identity`, `/digital-dna`, `/pricing`, `/shop`, `/app`, and `/app/moss60` redirect back to `/schools`
- [ ] School-safe routes remain reachable: `/schools`, `/school-game`, `/schools/docs/privacy-policy`, `/legal/privacy`
- [ ] Bottom navigation on school routes shows only school-safe destinations

### 4. Metadata, manifest, and install posture

- [ ] Browser tab title uses `MetaPet Schools`
- [ ] Open Graph / preview metadata uses `MetaPet Schools`
- [ ] Manifest loads from `/manifest.webmanifest`
- [ ] Manifest name, short name, description, and start URL are school-safe and start from `/schools`
- [ ] No school-visible affordance encourages app installation

### 5. Classroom runtime (`/school-game`)

- [ ] Runtime loads without white screen or console error
- [ ] Teacher-led framing, local-only posture, and alias-based setup are visible
- [ ] No pricing, upgrade, sign-in, or consumer identity/DNA language appears
- [ ] Classroom Manager exposes local deletion controls
- [ ] Deleting local school data succeeds without error

### 6. Privacy and governance pages

- [ ] `/legal/privacy`, `/legal/safety`, and `/legal/boundaries` load correctly
- [ ] Each page offers an in-app reading path first and download second
- [ ] Privacy and governance copy remains school-safe and locally scoped

---

## Pass Criteria

All checkboxes above are checked with no blocking console errors and no route escaping out of the schools surface.

## Fail Criteria

Any of the following mean smoke **fails** — do NOT set `smoke_confirmation: confirmed`:

- `/` does not resolve into the school overview
- Any blocked consumer route stays reachable in the schools deployment
- Any school-visible surface shows install prompts, consumer lore, or consumer identity/DNA terminology
- Manifest or metadata still identify the deployment as the consumer product
- Classroom deletion or local-only behavior fails

---

## After Completion

Trigger the workflow:

1. Go to Actions → `MetaPet Schools Smoke Gate`
2. Click `Run workflow`
3. Set `smoke_confirmation` to `confirmed`
4. Set `smoke_owner` to your name/handle
5. Click `Run workflow`
