# Child-Safe Baseline

This document defines the strict child-safe baseline for default student deployments of Meta-Pet.

For teacher-facing classification of classroom use, see `docs/compliance/digital-engagement-taxonomy.md`.

Set `NEXT_PUBLIC_CHILD_SAFE_BASELINE=true` to enforce the route guard for student deployments.
In CI, set `STUDENT_DEPLOYMENT=true` as well to make the deployment assertion fail fast if the baseline flag is missing.

## Core Rules

- Student use is local-first and zero-account by default.
- No default cloud transmission occurs during normal classroom use.
- No third-party tracking, adtech, or hidden profiling is enabled in child mode.
- No countdown pressure, streak pressure, public leaderboards, or missed-day penalties appear in child mode.
- Adult-only billing, admin, pricing, or experimental online tooling must stay clearly separate from the child-safe baseline.

## Included In Baseline

- Core pet care and reflection flows
- Classroom Quest in calm untimed mode
- Local classroom summaries stored on-device
- Offline-capable privacy and safety materials

## Outside Baseline

- Adult billing and pricing surfaces such as `/pricing` and `/shop`
- Experimental or online-assisted routes such as `/genome-resonance` and `/qr-messaging`
- Any future teacher/admin sync that transmits data off-device

## Verification Checklist

- Confirm the top-level shell shows child-safe local mode and does not show login or pricing prompts.
- Confirm child-facing routes do not display streak counters or countdown timers.
- Confirm Classroom Quest pattern play is untimed.
- Confirm routine student use does not require authentication.
- Confirm local summaries remain device-local and alias-based.
- Confirm any route outside this baseline is described separately in public copy.

## Public Claims Guidance

- Say `default student deployments` instead of implying every route in the repository is identical.
- Say `no default cloud transmission` instead of `nothing ever touches a server`.
- Say `no third-party tracking in child mode` instead of `no analytics anywhere`.
- Say `no countdown or streak pressure in child mode` instead of broader claims about every internal timer or animation.
