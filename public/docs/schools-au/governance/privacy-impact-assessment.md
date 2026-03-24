# MetaPet Schools Privacy Impact Assessment

## Scope

- Product surface reviewed: `MetaPet Schools`
- Delivery context: Years 3-6 classroom pilot
- Default runtime: teacher-led use on a shared classroom device
- Student identity model: alias only

## Personal information posture

- The school deployment is designed to avoid direct student account data.
- Routine classroom use stores aliases, lesson setup, progress states, and local class summaries on the current device.
- Teacher-controlled exports are optional and should remain alias-based or aggregated by default.

## Key privacy risks

1. A teacher enters a real name instead of an alias.
2. Local pilot data remains on a shared device longer than intended.
3. A pilot export includes more detail than needed for classroom evidence.
4. Families do not understand the difference between the school deployment and the broader MetaPet product.

## Current controls

- Alias-only roster guidance in the runtime
- No student account requirement
- Local storage only for routine use
- Teacher-visible delete controls
- Automatic expiry after 35 days without use
- Separate school routes from adult-only or experimental surfaces

## Residual actions before pilot approval

- Confirm teacher briefing includes alias-only setup
- Confirm family note explains local storage and deletion clearly
- Confirm any exported evidence template is aggregate or alias-based
- Confirm undeclared outbound calls are not present in the school runtime

## Review note

This assessment is written for pilot readiness. It should be refreshed after the first live school pilot and after any material change to storage, analytics, or export behaviour.
