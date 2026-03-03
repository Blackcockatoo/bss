# Route Smoke Checklist

Use this quick checklist after landing/compass updates.

## Preconditions
- App boots successfully.
- Test on desktop and mobile widths.

## Route checks
- [ ] Open `/` and confirm the page renders without console/runtime errors.
- [ ] In landing nav, click `Compass` and confirm it scrolls to `#compass`.
- [ ] In the Compass section on `/`, click `Open Compass` and confirm navigation to `/compass`.
- [ ] In the Compass section on `/`, click `Play Space Jewbles` and confirm navigation to `/space-jewbles`.

## Compass page checks (`/compass`)
- [ ] Confirm helper copy references `twelve live sectors`.
- [ ] Drag the wheel and confirm momentum + smooth snap still work.
- [ ] Click a sector and confirm route activation works.
- [ ] Click `Launch Space Jewbles` and confirm navigation to `/space-jewbles`.
- [ ] Click `Open Classroom Quest` and confirm navigation to `/school-game`.

## Space Jewbles checks (`/space-jewbles`)
- [ ] Confirm header back action reads `Back to Compass`.
- [ ] Click `Back to Compass` and confirm navigation to `/compass`.
- [ ] Confirm start-screen copy loads with no overflow/broken layout.

## Pass criteria
- [ ] No 404s across `/`, `/compass`, `/space-jewbles`.
- [ ] No broken CTA links in tested paths.
