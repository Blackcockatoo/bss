# /digital-dna Smoke Runbook

> Referenced by: `.github/workflows/production-smoke-gate.yml`
> Last updated: 2026-02-28

This runbook must be completed **manually** before triggering the Production Smoke Gate
workflow with `smoke_confirmation: confirmed`.

---

## Pre-requisites

- [ ] Production or staging URL is live (e.g. `https://bss-l8cw.vercel.app`)
- [ ] You are logged in (or testing as anonymous user where noted)
- [ ] Browser DevTools console is open to catch JS errors

---

## Smoke Checklist

### 1. Homepage loads (`/`)

- [ ] Page renders without white screen or hydration error
- [ ] Nav bar visible with "Meta-Pet" title
- [ ] "Login / Register" button visible (unauthenticated state)
- [ ] AmbientBackground and particle effects render (no THREE.js console errors)
- [ ] PetHero component shows a pet sprite

### 2. `/digital-dna` — Core Feature

- [ ] Page loads within 3 seconds
- [ ] DNA strand or genome visualization renders
- [ ] Genome hash is displayed (non-empty string)
- [ ] "Copy" or share action works without console error
- [ ] No `TypeError` or `ReferenceError` in console

### 3. `/genome-explorer`

- [ ] 3D scene initialises (Three.js canvas visible)
- [ ] No WebGL errors in console
- [ ] Genome nodes render with correct colours

### 4. `/qr-messaging`

- [ ] Page loads
- [ ] QR code generation works (enter text → QR appears)
- [ ] MOSS60 encoding prefix `MOSS60:` visible in generated code
- [ ] Camera permission prompt appears on "Scan" action (do not need to scan)

### 5. `/pricing`

- [ ] Free and Pro plans displayed
- [ ] Upgrade button present and visible

### 6. Auth Flow

- [ ] "Login / Register" modal opens
- [ ] Form fields render correctly
- [ ] Closing modal without submitting leaves page intact

### 7. PWA / Service Worker

- [ ] No service worker registration errors in DevTools → Application tab
- [ ] Manifest loaded (DevTools → Application → Manifest)

---

## Pass Criteria

All checkboxes above are checked with no blocking console errors.

## Fail Criteria

Any of the following mean smoke **fails** — do NOT set `smoke_confirmation: confirmed`:

- White screen on any critical route
- `Uncaught TypeError` related to core modules (genome, MOSS60, store)
- QR code generation produces empty output
- Build deployed but `/digital-dna` shows 404

---

## After Completion

Trigger the workflow:

1. Go to Actions → "Production Smoke Gate"
2. Click "Run workflow"
3. Set `smoke_confirmation` to `confirmed`
4. Set `smoke_owner` to your name/handle
5. Click "Run workflow"
