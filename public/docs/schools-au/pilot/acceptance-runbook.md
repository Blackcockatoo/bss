# MetaPet Schools Acceptance Runbook

Use this runbook before any live pilot. Do not move into school outreach or classroom use until each step below is marked `Pass`.

## Step 1: Browser and network inspection

**Goal:** confirm that routine classroom use on the school profile only produces declared traffic and stays inside the school boundary.

**Do this:**

1. Open `/schools` and confirm the school overview loads first.
2. Open `/school-game` and run a normal lesson flow: onboarding, alias roster, lesson queue, local summary, and delete controls.
3. Inspect network activity during that routine flow.
4. Compare any requests against the third-party services register and security controls summary.
5. Try blocked routes such as `/pet`, `/app`, or other non-school paths and confirm they redirect back into the school surface.

**Pass if:**

- No undeclared outbound calls appear during routine classroom use.
- No auth, pricing, upgrade, chat, or broader product surfaces appear.
- Blocked routes return to the school entrypoint.

**Record:**

- Reviewer name
- Date
- Device and browser used
- Result: `Pass` or `Fail`
- Notes on any unexpected request or UI state

## Step 2: Teacher dry run

**Goal:** confirm that one teacher can set up and run the classroom flow without extra admin burden.

**Do this:**

1. Give the teacher the school overview and teacher guide.
2. Ask them to find the runtime without coaching.
3. Time how long it takes to add aliases, queue a lesson, and begin.
4. Ask them to run one full lesson card or a realistic rehearsal of it.
5. Ask them to review the local summary and use the delete controls.

**Pass if:**

- Setup stays within the promised low-friction flow.
- The teacher can explain the lesson purpose and product boundaries in plain language.
- The teacher can find deletion/reset controls without guesswork.

**Record:**

- Setup time
- Points of confusion
- Any step that felt too technical or too slow
- Result: `Pass` or `Fail`

## Step 3: ICT/privacy review

**Goal:** confirm that the school deployment and governance pack are understandable and defensible for a pilot.

**Do this:**

1. Review the privacy policy, data flow, data inventory, retention schedule, third-party register, controls summary, privacy impact assessment, and boundaries statement.
2. Walk through the route boundary and local-storage model.
3. Check that exported evidence remains adult-initiated and consistent with the privacy materials.
4. Confirm the school deployment is distinguishable from the broader product.

**Pass if:**

- Reviewers can explain what data is stored, where it lives, how long it remains, and how it is deleted.
- Reviewers see a clean separation between school and non-school product surfaces.
- No unresolved privacy or security question remains open.

**Record:**

- Reviewer names and roles
- Outstanding questions
- Required follow-up actions
- Result: `Pass` or `Fail`

## Step 4: Parent readability review

**Goal:** confirm that the family note, privacy notice, and participation explanation are readable and trustworthy.

**Do this:**

1. Ask a parent or carer reviewer to read the parent note, parent/carer privacy notice, and family participation protocol.
2. Ask them to explain back:
   - what the tool is
   - what data is stored
   - how participation works
   - who they contact with questions
3. Ask whether any wording sounds confusing, overly technical, or incomplete.

**Pass if:**

- The reviewer can explain the classroom use case in plain language.
- The participation process is clear.
- Alias use, local storage, and deletion expectations are understandable.

**Record:**

- Reviewer name or role
- Any unclear wording
- Any missing family concern
- Result: `Pass` or `Fail`

## Final Pre-Pilot Signoff

Fill this page before outreach or live classroom use.

| Check | Owner | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Browser and network inspection |  |  | Pass / Fail |  |
| Teacher dry run |  |  | Pass / Fail |  |
| ICT/privacy review |  |  | Pass / Fail |  |
| Parent readability review |  |  | Pass / Fail |  |
| Family participation process confirmed |  |  | Pass / Fail |  |
| Overall go/no-go |  |  | Go / No-go |  |

## Rule

If any line above is `Fail` or unresolved, do not proceed to outreach or live pilot use.
