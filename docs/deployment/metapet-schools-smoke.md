# MetaPet Schools Smoke Runbook

## Pilot charter

MetaPet Schools is a **pilot candidate**, not a general consumer launch or school-wide rollout. Run one class with one teacher across seven 20-minute sessions over two weeks. Freeze major feature work until the pilot produces a decision record.

### Objective and scope

Test whether the child-safe experience supports systems-thinking and wellbeing learning without unacceptable teacher workload, privacy risk, or technical friction.

The pilot includes the dedicated schools deployment, core pet care, reflection, calm untimed Classroom Quest, alias-based device-local summaries, existing lesson and parent materials, and anonymous aggregate reporting.

It excludes consumer identity/DNA, breeding, battle, shop, pricing, add-ons, QR messaging, genome resonance, accounts, cloud sync, advertising, public sharing, new gameplay systems, school-wide rollout, and collection by Blue Snake Studios of names or sensitive student content.

### Decision thresholds

| Area | Threshold |
|---|---|
| Engagement | At least 80% of students are on task in at least 5 of 7 sessions |
| Learning | At least 70% can explain a state, likely cause, and suitable response by Session 7 |
| Teacher workload | Median preparation is at most 10 minutes per session; no session loses over 5 minutes to product issues |
| Reliability | At least 95% of attempted session starts complete the activity; no data-loss or route-escape incident |
| Privacy and safety | Zero unexpected transmissions, route escapes, account/pricing prompts, ads, or coercive mechanics |
| Sentiment | Majority-positive anonymous student pulse and teacher recommends continuing or continuing with changes |

These are pilot decision thresholds, not marketing claims. Continue only when privacy/safety and all other thresholds pass. Continue with bounded changes only when privacy/safety passes. Stop for any privacy/safety failure or when the teacher does not recommend continuation.

### Operating and rollback rule

Before Session 1, nominate a pilot owner, teacher, and technical contact; approve the schedule and parent communication; confirm devices, accessibility adjustments, and fallback activity; and complete this runbook on classroom devices.

During the pilot, record only aggregate participation, completion, technical interruptions, and safety incidents. Keep student reflections device-local unless the school separately approves collection.

Stop promotion or pause the pilot if a route boundary is bypassed, unexpected student data leaves a device, consumer/account/pricing/advertising content appears, local data cannot be deleted, a serious accessibility or reliability issue prevents the lesson, or the school withdraws approval. Remove access to the deployment or redeploy the last known-good commit; do not continue a session after a privacy or child-safety failure.

> Referenced by: `.github/workflows/production-smoke-gate.yml`
> Last updated: 2026-07-18

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
