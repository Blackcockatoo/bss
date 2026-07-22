# MetaPet Field Mode — Pass 4 Offline and Emergency Mode

Date: 2026-07-22

## Outcome

Pass 4 adds a teacher-controlled offline and emergency foundation to the existing Australian Years 3–6 Field Mode. It does not broaden the Field route boundary and does not change normal MetaPet caching or consumer features.

The complete Field Pack contains all seven guided lessons, the Field classroom, Learning Passport and review, Field-owned teacher/safety references, seven static printable lesson fallbacks, and the same-origin code, images, fonts and audio discovered from those approved pages.

## Declarative cache contract

`src/lib/fieldMode/cachePolicy.ts` is the source of truth for:

- Field Pack schema and release version
- the approved page and asset manifest
- all seven guided and printable lesson routes
- cache names and asset discovery limits
- atomic candidate installation
- one previous complete pack for rollback
- the deployment emergency no-op switch

`/schools/field/pack.json`, the generated `/sw.js`, the Offline Pack UI, policy tests and the smoke script consume this contract.

Production pack versions use the deployment commit SHA. A candidate cache is populated and every required route is verified before its metadata pointer becomes active. If any fetch fails, the candidate is deleted and the current complete pack remains unchanged. A successful replacement preserves the prior complete cache for teacher-triggered rollback.

Once installed, Field navigations and their versioned assets are served from the active complete pack. This intentionally keeps the classroom on a known-good version until a teacher checks and installs a complete update.

The manifest contains only Field-owned navigations. The generated worker embeds that exact declarative allowlist and rejects a manifest that adds an otherwise approved support route. This prevents the offline bundle from growing through a second, broader route rule.

## Emergency recovery

Two recovery paths are present:

1. The Field UI can temporarily bypass an installed pack and use the live network version, or restore the previous complete pack.
2. Setting `FIELD_MODE_OFFLINE_EMERGENCY_NOOP=true` makes `/sw.js` return a no-op recovery worker. On activation it deletes MetaPet shell/Field caches, unregisters itself and reloads open clients. The worker and pack manifest use `Cache-Control: no-store`.

The release switch is server-only. It is not exposed in the client bundle.

## Static and printable fallbacks

Field lessons automatically treat offline state as reduced-motion mode. Every animated demonstration pet therefore renders through the existing static `PetBodyRenderer` path. The Learning Passport was already static.

Each lesson has `/schools/field/print/[slug]`, a static A4 teacher sheet with:

- learning intention and learning areas
- success criteria
- teacher opening script
- all five guided steps
- support and extension options
- discussion prompts
- alias-only teacher notes area

The browser action is labelled `Print / Save as PDF`; the route remains usable from the installed Field Pack without animation or an account.

## Local backup and restore

The backup is a versioned JSON file downloaded directly by the teacher. There is no upload or cloud transfer.

The allowlist contains only current Field-safe classroom roster, assignment, progress, queue/runtime, teacher onboarding, Field session and guided lesson progress/evidence keys. Consumer profile, pet update, wallet, identity and marketplace storage are excluded.

Restore rejects unknown keys, malformed JSON, unsafe object keys, files over 5 MB and unsupported schemas. Roster aliases, assignment limits, progress values, session choices and guided lesson state are sanitised. Writes are atomic: a failed restore returns the device to its prior local state. A successful restore starts the existing 35-day school retention window again.

## Approved new routes

- `/schools/field/guide`
- `/schools/field/safety`
- `/schools/field/offline`
- `/schools/field/pack.json`
- `/schools/field/print/[slug]`
- `/sw.js` as a required Field static route

All remain inside the existing declarative Field policy. Consumer pages still redirect to `/schools/field`, and consumer APIs still receive an opaque 404 while Field Mode is active.

## Deliberately deferred

- USB/SD-card or desktop installer packaging
- automatic background pack updates
- projector-specific screen controls and timers beyond the existing lesson controls
- newly authored curriculum content or international curricula
- cloud backups, student/parent accounts or analytics
- generated lesson content, marketplace or revenue work
- a multi-classroom storage namespace migration

## Validation commands

- `npm run lint`
- `npm test -- --run`
- `npm run build`
- schools-profile build with the child-safe deployment environment
- `npm run check:child-safe-deployment`
- `npm run smoke:field-pack -- http://127.0.0.1:3000`

The service-worker behaviour test executes the generated worker against a fake CacheStorage/fetch environment. It proves that an interrupted candidate does not replace the active pack, a complete update preserves the previous pack, and rollback swaps the two complete versions.
