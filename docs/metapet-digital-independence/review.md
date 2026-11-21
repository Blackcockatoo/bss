# Digital Independence review

## Privacy and safety evidence

| Question | Source evidence and scope |
| --- | --- |
| What does the lab keep? | `InvisibleTrailLab.tsx` keeps fictional choices in React state. No choice persistence, submission endpoint, device permission API or student identity inputs are used by the activity. Reset and reload clear its in-memory choices. |
| What can Field Mode keep? | The shared school storage module and local-data controls cover classroom records stored in the browser. Field Mode can cache resources in its service worker. The start route sets Field Mode cookies for route and interface state. A supervising adult can erase covered records with the local-data controls or clear site data. The 35-day inactivity cleanup runs when an applicable school route next opens. |
| What leaves the browser? | Hosting processes routine page and asset requests. An adult can deliberately export records to a file. Deleting local records does not delete a file already exported. Confirm provider access, retention and contractual terms directly with hosting before vendor approval. |
| What about tracking and fonts? | The shared root mounts a pathname- and profile-gated analytics component. School routes are excluded. The site-wide CSP allows certain external asset origins. An allowlist is distinct from an actual browser request. Check the deployed host and its effective configuration. |
| What protects the classroom boundary? | The proxy, server guards and policy tests constrain Field Mode. The common headers configure CSP, content-type protection, referrer policy and deny camera, microphone and geolocation. Production response verification is a separate check. |

Australian review sources include the [Privacy Act 1988](https://www.legislation.gov.au/C2004A03712/latest/text), [Online Safety Act 2021](https://www.legislation.gov.au/Latest/C2021A00076) and [Victorian Child Safe Standards guidance for schools](https://www.vic.gov.au/child-safe-standards-schools-guidance). The OAIC describes the [Children’s Online Privacy Code](https://www.oaic.gov.au/privacy/privacy-registers/privacy-codes/childrens-online-privacy-code) as under development, with registration due by 10 December 2026. Obtain qualified advice on whether federal privacy and online-safety obligations apply to the studio’s entity and service, school-sector procurement and privacy terms, and obligations for any in-person pilot. This review records product evidence and makes no finding of legal compliance.

## Internal differentiation brief

| Offering | What it offers | Classroom decision |
| --- | --- | --- |
| eSafety Privacy and security | Public animated teaching deck and transcript, lesson plan, printable worksheets and follow-up. Middle and upper primary. Teaching materials address personal information, account security and help-seeking. | Choose for a broader introduction with structured discussion and take-home material. The resource page and print downloads are publicly accessible. Playback uses an embedded video. |
| OAIC educator and facilitator resources | Public guides, workbooks and lesson plans for children to explore privacy and participate in discussion about the draft Children’s Online Privacy Code. | Choose when the purpose is participation and learning about privacy rules. Print resources support device-free discussion. |
| MetaPet School Invisible Trail | Account-free, teacher-led simulations with a paper equivalent and an exit task. Students change a fictional input, observe what happens, then explain a trade-off. | Choose when the outcome is a causal explanation: what created the record, who receives it and which choice alters the result. Use a single screen, paired screens or paper. Allow 30 minutes. |

Public access to reviewed resource pages was verified through published materials. Comparative accessibility conformance, vendor data handling and independent learning outcomes were outside the evidence available for this review. Pricing claims apply to MetaPet School's classroom access.

Sources: [eSafety Privacy and security](https://www.esafety.gov.au/educators/classroom-resources/privacy-and-security), [OAIC educator resources](https://www.oaic.gov.au/privacy/privacy-for-kids/educators-and-facilitators-resources).

## Release evidence and follow-up

This change adds Digital Independence framing, a direct lab entry, an expanded printable guide, combined-clue feedback, explicit design trade-offs and a full in-session reset. Reviewers can find current build and test evidence in the pull request. A supervised educator evaluation, independent accessibility review, and hosting and legal review remain separate milestones. Use school-approved evaluation processes and share aggregate feedback only.

## Curriculum fit for the five missions

| Mission | Years 3–4 · AC9TDI4P09 / VC2TDI4D05 | Years 5–6 · AC9TDI6P10 / VC2TDI6D06 |
| --- | --- | --- |
| Footprint Forest | Identify the stored record after a tap. | Explain how the action creates a footprint and when it may persist. |
| Permission Gates | Explain the risk of giving an app access it does not need. | Justify the minimum information needed to run a puzzle. |
| Mirror Market | Identify a shared record and who receives it. | Predict one consequence of sharing or withholding a copy. |
| Shadow Profile | Explain how two records can reveal a pattern about a fictional player. | Explain how a footprint can support an inference and how that inference might fail. |
| Data Defender | Explain one choice that reduces an unnecessary disclosure. | Compare retention and deletion choices and consider what happens to copies already shared. |

The Years/Levels 3–4 descriptors address identifying personal data stored and shared in online accounts and discussing risks. The Years/Levels 5–6 descriptors address creation and permanence of digital footprints and considering privacy when collecting data. These are lesson connections. No student account is needed to make a fictional example.

Sources: [ACARA Version 9 Digital Technologies sequence](https://v9.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/digital-technologies-in-focus/resources/planning/v9-f-10-sequence-of-content-digital-technologies.pdf) and [VCAA Victorian Curriculum 2.0 Digital Technologies](https://f10.vcaa.vic.edu.au/learning-areas/technologies/digital-technologies/curriculum?view=full).
