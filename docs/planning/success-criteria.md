# Success Criteria (Define Up Front)

This page is a **pre-implementation planning gate** for work in this repo.
Complete it in the issue/PR description before coding so scope and quality are explicit.

## Quick Start (3 minutes)
1. Write the **Objective** and **Out of Scope** first.
2. Add 3–5 testable **Acceptance Criteria** (`Given / When / Then`).
3. Pick required **Validation Commands** from the command menu below.
4. Define **Rollback Trigger** in one sentence.

If any section is blank, the work is not ready to start.

---

## 1) Objective
- **Problem statement:** What user or business problem is being solved?
- **Target user/context:** Who is affected and in what flow/page?
- **Expected outcome:** What measurable change should be true after shipping?

## 2) Scope Controls
- **In Scope (max 5 bullets):**
- **Out of Scope (required):**
- **Constraints:** dependencies, timeline, privacy/compliance, platform limits.

## 3) Acceptance Criteria (testable)
Use this format:
- **Given** `<starting state>` **When** `<action>` **Then** `<observable result>`.

Minimum bar:
- At least 3 criteria.
- At least 1 negative/error-path criterion.
- At least 1 persistence/regression criterion if data is touched.

## 4) Quality Gates
Mark each gate as **Pass/Fail** before merge.

- **Functional:** happy path + known edge cases work.
- **Reliability:** no regressions in related flows.
- **Performance:** does not materially degrade startup/render/interaction time.
- **Security/Privacy:** no raw sensitive data exposure (e.g., raw DNA).
- **Accessibility:** keyboard navigation + clear labels for new controls.

## 5) Validation Plan
Choose commands based on scope (run from repo root).

### Validation command menu
- `npm run lint` — required for code changes.
- `npm test` — required when behavior/state logic changes.
- `npm run build` — required for routing/config/build pipeline changes.
- `npm run check:moss60-copy` — required when touching MOSS60 copy/content paths.

### Manual validation
List the exact user journeys to test manually (2–5 bullets).

### Evidence to attach
- Test command output summary.
- Screenshots/video for visible UI changes.
- Notes for anything intentionally deferred.

## 6) Release + Rollback
- **Release approach:** full release, staged, or behind a flag.
- **Monitor:** what signal indicates healthy release?
- **Rollback trigger:** explicit condition that forces rollback.
- **Rollback action:** exact first step (revert commit, disable flag, etc.).

## 7) Definition of Done
Work is complete only when all are true:
1. Acceptance criteria are satisfied.
2. Required validation commands passed.
3. Quality gates are all Pass.
4. Evidence is attached to PR.
5. Docs/changelog updated if behavior changed.

---

## Reusable One-Page Template

```md
### Objective
- Problem:
- User/context:
- Expected outcome:

### Scope Controls
- In Scope:
  -
- Out of Scope:
  -
- Constraints:
  -

### Acceptance Criteria
- Given ... When ... Then ...
- Given ... When ... Then ...
- Given ... When ... Then ...

### Quality Gates
- [ ] Functional
- [ ] Reliability
- [ ] Performance
- [ ] Security/Privacy
- [ ] Accessibility

### Validation Plan
- Required commands:
  - [ ] `npm run lint`
  - [ ] `npm test`
  - [ ] `npm run build`
  - [ ] `npm run check:moss60-copy`
- Manual journeys:
  -
- Evidence:
  -

### Release + Rollback
- Release approach:
- Monitor:
- Rollback trigger:
- Rollback action:
```
