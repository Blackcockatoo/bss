# MetaPet Schools Smoke Runbook

> Referenced by: `.github/workflows/production-smoke-gate.yml`
> Last updated: 2026-07-22

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

### 3A. Field Mode boundary and Pass 3 evidence (`/schools/field`)

- [ ] `/schools/field` identifies `MetaPet Field Mode — Australian Schools` and lists Years 3–6, teacher-led use, seven lessons, no student accounts, aliases, local records, and Australian Curriculum alignment
- [ ] `Start Field Mode` resolves through `/schools/field/start` to `/schools/field/lessons`
- [ ] All seven lesson cards open `/schools/field/lessons/[slug]`, never `/teachers/...`
- [ ] Field navigation contains only Field Home, Lessons, Classroom, Offline Pack, Teacher Guide, Safety & Privacy, and Exit Field Mode
- [ ] Teacher Guide resolves to `/schools/field/guide` and Safety & Privacy resolves to `/schools/field/safety`; neither page exposes consumer navigation
- [ ] `/schools/field/passport` derives an alias-only Learning Passport from local lesson evidence without consumer profile data or applied-pet summaries
- [ ] `/schools/field/review` opens lessons and Passport only through Field routes and can reset local lesson evidence
- [ ] With Field Mode active, direct visits to `/shop`, `/wallet`, `/marketplace`, `/breeding`, `/identity`, `/digital-dna`, `/alchemist`, `/social`, `/share`, and `/teachers` redirect to `/schools/field`
- [ ] With Field Mode active, a blocked `/api/...` request returns opaque `404 {"error":"not_found"}`
- [ ] Consumer pet-update buttons and `/pet` links do not appear inside Field lessons
- [ ] `Exit Field Mode` clears the Field boundary and returns to `/schools`; normal core routes remain available outside Field Mode

### 3B. Pass 4 Offline and Emergency Pack (`/schools/field/offline`)

- [ ] While online, `Download complete Field Pack` finishes successfully and reports a verified file count
- [ ] All seven lessons show a `Print / save PDF fallback` link
- [ ] Each `/schools/field/print/[slug]` route contains the teacher script, five guided steps, support/extension options and alias-only notes warning
- [ ] In browser DevTools, switch Network to Offline and hard-reload `/schools/field`, `/schools/field/lessons`, each lesson, Classroom, Passport, Review, Teacher Guide, Safety & Privacy and one printable route
- [ ] Close and reopen the browser while still offline; the last installed Field Pack remains usable
- [ ] Offline guided lessons show static demonstration-pet visuals and remain fully operable
- [ ] A deliberately interrupted `Check and repair pack` leaves the existing installed version active
- [ ] After two complete pack installs, `Use previous pack` restores the previous version without deleting classroom records
- [ ] `Emergency network-only` bypasses the pack while connected and `Reactivate installed pack` restores it
- [ ] `Remove offline pack` removes cached app material but keeps classroom aliases and progress
- [ ] `Download local backup` creates a JSON file without consumer profile/pet data
- [ ] `Restore backup` requires confirmation, rejects a file with an unknown storage key, and restores the valid alias/progress record
- [ ] Run `npm run smoke:field-pack -- https://<schools-domain>` and confirm it passes

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
- Any active Field session can reach a consumer page or blocked API directly
- Any Field lesson, Passport, review, navigation or fallback links to `/teachers`, `/pet`, or another consumer route
- Any school-visible surface shows install prompts, consumer lore, or consumer identity/DNA terminology
- Manifest or metadata still identify the deployment as the consumer product
- Classroom deletion or local-only behavior fails
- An incomplete Field Pack replaces the last complete installed version
- An offline lesson, printable fallback or required Field route fails after a successful complete-pack install
- A Field backup contains consumer pet/profile data, accepts an unknown storage key, or bypasses the 35-day retention marker

---

## After Completion

Trigger the workflow:

1. Go to Actions → `MetaPet Schools Smoke Gate`
2. Click `Run workflow`
3. Set `smoke_confirmation` to `confirmed`
4. Set `smoke_owner` to your name/handle
5. Click `Run workflow`
