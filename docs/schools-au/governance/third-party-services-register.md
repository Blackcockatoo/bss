# MetaPet School Third-Party Services Register

## Current school deployment position

The school-facing deployment is designed to avoid third-party tracking, adtech and social features during routine classroom use.

| Service type | Current school deployment position | Notes |
| --- | --- | --- |
| Hosting platform | Depends on the school deployment environment | List the actual host before rollout. Hosting a page necessarily involves the host seeing the request. |
| Browser local storage | Used | Stores classroom records on the device. See the data inventory. |
| Analytics SDK | Not loaded on any school route | Enforced in code, not by policy alone — see below |
| Error-reporting SDK | Not loaded on any school route | Same enforcement |
| Ad network | Not used | Child-facing advertising is out of scope |
| Social login | Not used | Student accounts are not required |
| Fonts and media CDNs | Not used on classroom routes | Typography uses system fonts |

## How the analytics position is enforced

Product analytics for the Blue Snake Studios consumer product previously mounted
in the shared root layout, which meant the beacon also loaded on classroom
pages. That contradicted this register and has been fixed.

Analytics are now gated twice:

1. **Build profile.** The schools build never mounts the analytics component.
2. **Route.** On the combined production build — where Field Mode is reachable
   from the consumer host — the component is not mounted on any pathname under
   `/schools`, `/school-game`, `/teachers`, `/docs/schools-au`, or the
   school-specific `/legal/privacy`, `/legal/safety` and `/legal/boundaries`
   pages.

Both gates live in `src/lib/analyticsBoundary.ts` and
`src/components/ConsumerAnalytics.tsx`.

## Automated checks

Two tests fail the build if this position regresses:

- `src/lib/analyticsBoundary.test.ts` — asserts no route admitted by the Field
  policy is allowed to load analytics.
- `src/lib/fieldMode/outboundBoundary.test.ts` — scans every school and Field
  source file and fails on any analytics, tracking or error-reporting import, or
  any cross-origin request literal.

## Declared same-origin requests

Routine classroom use makes these requests, all to this application:

| Request | Purpose |
| --- | --- |
| `/schools/field/pack.json` | Offline pack manifest for the classroom service worker |
| `/sw.js` | Service worker registration |

## Review rule

Do not claim `no third parties` unless the actual deployment environment and
infrastructure logs have been checked end to end. The host of the site sees
requests by definition; this register describes what the *application* loads,
which is a narrower and checkable claim.

Reviewers should verify the position themselves with browser developer tools
during a routine lesson. The acceptance runbook covers that check.
