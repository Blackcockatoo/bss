# MetaPet Schools ICT/Privacy Review Checklist

Use this checklist with the governance pack. Mark each row before approving a pilot.

| Artifact | Review question | Status | Notes |
| --- | --- | --- | --- |
| Privacy Policy | Does it explain what the school deployment stores, where it is stored, and who controls exports? | Pass / Fail |  |
| Child Privacy Notice | Is the child-facing explanation short and understandable? | Pass / Fail |  |
| Parent/Carer Privacy Notice | Does the family-facing notice explain aliases, local storage, and deletion clearly? | Pass / Fail |  |
| Data Flow Diagram | Does the diagram match observed classroom use? | Pass / Fail |  |
| Data Inventory | Are the stored items limited to what the pilot needs? | Pass / Fail |  |
| Retention and Deletion Schedule | Are retention expectations short and deletion steps clear? | Pass / Fail |  |
| Third-Party Services Register | Does observed traffic match the declared services? | Pass / Fail |  |
| Security Controls Summary | Are route restrictions, local storage, and deletion controls described accurately? | Pass / Fail |  |
| Privacy Impact Assessment | Are major risks and mitigations documented? | Pass / Fail |  |
| Boundaries Statement | Is the school deployment clearly distinct from broader product surfaces? | Pass / Fail |  |

## Boundary Checks

- Confirm `/` resolves into the school surface for the school profile
- Confirm blocked routes redirect back into the school deployment
- Confirm routine use does not expose auth, pricing, or social features
- Confirm exports remain adult-initiated

## Approval Note

Record any condition that must be met before the pilot starts.
