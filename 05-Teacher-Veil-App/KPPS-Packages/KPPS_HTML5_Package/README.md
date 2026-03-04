# KPPS HTML5 Pack

This folder is a **static HTML5** bundle (no build step).

## What’s inside

- `index.html` — one front door with links.
- `app/` — *wrappers* for the two live Vercel apps (kept separate).
  - `meta-pet-wrapper.html`
  - `teacher-hub-wrapper.html`
- `school/teacher-hub/` — an **offline-friendly** docs site built from the Teacher Hub markdown package.
  - `index.html` (SPA)
  - `docs.js` (embedded markdown)

## How to use (local)

Just open `index.html` in a browser.

## How to deploy

Host the folder on any static host (Vercel static, Netlify, GitHub Pages, S3, school intranet).
