# MetaPet Field Mode — Pass 3 boundary and evidence architecture

Date: 2026-07-22

## Outcome

Pass 3 connects the existing seven-lesson teacher system to the bounded Field Mode surface. It adds a Field-safe Learning Passport and teacher evidence review while keeping consumer MetaPet areas outside the active Field session.

The shared lesson engine is reused. Field Mode forces its deterministic demonstration pet, records alias-only lesson evidence locally, and suppresses every consumer real-pet apply, create-pet and view-pet affordance. Claude's validated real-pet update layer remains available to the normal `/teachers` experience and is not duplicated.

## Declarative policy

`src/lib/childSafeBaseline.ts` owns the `core`, `schools`, and `field` route contracts, Field fallback, Field cookie name, and Field navigation registry. `src/proxy.ts`, server route guards, navigation, landing actions and tests consume that contract.

Field entry sets an HTTP-only, same-site session cookie for eight hours. Explicit exit clears it. While active, blocked page requests redirect to `/schools/field`; blocked `/api` requests receive an opaque 404 response.

## Approved Field routes

- `/schools` and `/schools/field`
- `/schools/field/start`, `/schools/field/exit`, and the Field manifest
- `/schools/field/lessons` and `/schools/field/lessons/[slug]`
- `/schools/field/classroom`
- `/schools/field/passport` and `/schools/field/review`
- `/school-game` for existing school-runtime compatibility
- approved `/schools/docs/*` and `/docs/schools-au/*` materials
- parent, safeguarding, privacy, safety and boundaries pages
- the dedicated Field manifest, icon and framework assets

## Blocked categories

Consumer shop, wallet, marketplace, breeding, public identity, QR messaging, rituals, alchemist, advanced consumer laboratories, social/public-sharing routes, unrestricted `/app` navigation and the non-Field `/teachers` surface are not approved by the Field policy.

## Local data

The existing 35-day school retention marker and classroom deletion flow now include Field session choices and teacher lesson progress/profile/update/pilot keys. Expiry and teacher-triggered school deletion also reset the matching in-memory lesson stores. No student account or cloud profile was added.

## Deliberately deferred

- Offline caching changes, removable-media installation and backup/import
- A projector-specific presentation shell (the launchpad choice currently records classroom grouping only)
- New printable curriculum packs or lesson content
- International curricula, translations or language packs
- Student or parent cloud accounts
- Analytics, AI-generated lessons, marketplaces or revenue systems
- Pilot feedback tooling inside Field Mode (`/teachers/pilot` remains blocked)

## Known architectural note

Field Mode and the existing teacher lesson system reuse the same local lesson-progress source. This avoids a competing engine and preserves existing records and deletion behaviour. Field adapters deliberately ignore consumer pet-profile aliases and applied-pet summaries; a future storage migration should be considered only if schools require multiple isolated classes on one browser profile.

## Validation evidence

- `npm run lint` — passed (TypeScript and ESLint)
- `npm test -- --run` — passed: 153 files, 1,091 tests
- `npm run build` — passed: 110 generated routes/pages, active Next proxy
- Schools-profile production build with the child-safe environment — passed: 110 generated routes/pages
- `npm run check:child-safe-deployment` with the dedicated schools URL — passed
- Production HTTP smoke — Field entry, lesson, Passport and review returned 200; start returned 307 to the Field launchpad; active Field blocked `/shop` and `/teachers` with 307 to `/schools/field`; blocked API returned opaque 404; explicit exit cleared the cookie; core `/shop` and `/teachers` returned 200 before Field entry and `/shop` returned 200 again after exit
