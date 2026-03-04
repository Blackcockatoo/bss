# Privacy & Safety Technical Brief
## Meta-Pet Architecture for KPPS ICT & Leadership Review

**For:** ICT Coordinator, Principal, Assistant Principal, School Council (technical subcommittee)  
**Purpose:** Technical transparency on privacy, security, and safety design  
**Developer:** Available for walkthrough, code review, or Q&A

---

## Executive Summary

The Jewble Meta-Pet is architected with **privacy-by-design** and **offline-first** principles. Unlike typical classroom apps:

- **No accounts** (zero credentials to manage or leak)
- **No data transmission** (pet DNA and interaction history stay on device)
- **No tracking** (no analytics, no third-party SDKs, no cookies)
- **No addictive mechanics** (no timers, no FOMO, no streaks, no notifications)

This brief explains **how** these protections work at a technical level.

---

## 1. Offline-First Architecture

### What "Offline-First" Means

**Standard classroom apps:** Require continuous internet connection; data syncs to cloud servers; offline mode is degraded or non-functional.

**Jewble Meta-Pet:** Fully functional **without internet**. All core mechanics (vitals, mood, genetics, care actions) execute locally on the device. Internet is optional for non-core features (future: community challenges, teacher dashboards — but not implemented in pilot).

### How This Protects Privacy

| Risk in Cloud-Based Apps | How Offline-First Mitigates |
|---|---|
| **Data breach** (server hacked, credentials leaked) | No server = no breach vector. Data never leaves device. |
| **Third-party tracking** (analytics SDKs, ad networks) | No network calls = no trackers can piggyback on connections. |
| **Downtime / service outages** | App works regardless of network status. No "server down" interruptions. |
| **Compliance overhead** (GDPR, COPPA, Victorian privacy laws) | No data collection = minimal compliance burden. |

### Technical Implementation

- **Local storage:** Pet state (vitals, mood, DNA) stored in device-native database (e.g., IndexedDB for web, Core Data for iOS)
- **No API calls during care loops:** All vitals calculations, mood transitions, and genetic expression happen client-side
- **Optional sync** (not in pilot): If future versions include teacher dashboards, sync is **opt-in** and **anonymized** (no student names, only aggregate class patterns)

---

## 2. Zero Account Design

### Why No Accounts?

**Standard edtech:** Requires username/password or SSO (Google/Microsoft) to track progress, enforce permissions, and personalise experience.

**Jewble Meta-Pet:** No login. Students open the app and start. Each device instance is self-contained.

### How This Reduces Risk

| Account-Based Risk | Zero-Account Solution |
|---|---|
| **Credential theft** (phishing, password reuse, weak passwords) | No credentials to steal. Nothing to phish. |
| **Identity verification complexity** (age gates, parental consent) | No identity capture = no age verification needed (app is age-appropriate by design). |
| **Password reset burden** (IT tickets, teacher time) | No passwords = no resets. |
| **Cross-device tracking** (user profile follows student across devices) | Each device is independent. No persistent identity. |

### Technical Implementation

- **Device-local identity:** Pet "belongs" to the device, not to a student account
- **No persistent tokens:** No JWT, no session cookies, no auth headers
- **No central user database:** Developer has no record of who uses the app

### Implications for KPPS

- **No enrolment process:** Students don't "sign up" — they just open the app
- **No forgotten password tickets:** ICT Coordinator doesn't field login issues
- **No FERPA/GDPR user records:** No student PII to manage or protect

---

## 3. DNA Never Transmitted (Genetic Privacy)

### What Is the "DNA"?

Each Meta-Pet has a **180-digit base-7 genome** that encodes behaviour traits:
- Response curves (how much each vital affects each mood)
- Metabolism rates (how quickly vitals deplete)
- Baseline temperament (starting mood tendencies)

This DNA is **generated once** when the pet is created, then stored locally. It never changes. It never leaves the device.

### Why This Matters

The DNA is the **only unique identifier** for the pet. If transmitted, it could become a pseudonymous profile ("Student A has DNA signature X"). By keeping it local, we eliminate profiling risk.

### Cryptographic Note (Optional: For Advanced Review)

If future versions include **optional** community features (e.g., "compare your pet's DNA to class averages"), we use **zero-knowledge proofs**:
- Student proves "my pet has trait X" without revealing the full DNA sequence
- Server sees aggregate patterns, not individual genomes
- Uses **ECDSA P-256 signatures** (same crypto standard as TLS/SSL)

**This is not implemented in the pilot.** Pilot is fully offline. But the architecture is designed to add privacy-preserving features later if desired.

### Technical Implementation

- **Local-only DNA storage:** Genome stored in device database, encrypted at rest (OS-level encryption)
- **No network transmission:** DNA never included in API payloads (because there are no API calls)
- **No "cloud backup" of DNA:** Even if student backs up their device to iCloud/Google Drive, DNA is flagged as non-syncing sensitive data (optional: can be implemented with platform-specific exclusion flags)

---

## 4. Anti-Addiction Safeguards

### Typical Edtech Manipulation Tactics (What We're NOT Doing)

| Addictive Mechanic | Purpose (from app dev perspective) | Jewble Meta-Pet Approach |
|---|---|---|
| **Countdown timers** | Create urgency, force check-ins | Vitals pause when app is closed. No countdowns. |
| **Streak systems** | Punish missed days, enforce daily habits | No streaks. No penalties for not checking in. |
| **Push notifications** | Pull students back into app | No notifications. App is silent. |
| **Reward schedules** | Variable reinforcement (slot machine psychology) | No random rewards. Outcomes are deterministic (cause-effect). |
| **Leaderboards** | Social comparison, status anxiety | No leaderboards. No comparative metrics. |
| **Limited-time events** | FOMO (fear of missing out) | No time-gated content. Pet is always the same. |
| **In-app purchases** | Monetisation through impulse spending | No purchases. App is free, no upsells. |

### Positive Design: "Meditation Mechanics"

Instead of exploiting dopamine loops, Jewble uses **calm interaction patterns**:

- **Slow pacing:** Vitals change gradually. No instant gratification.
- **Observation before action:** Students must check state before deciding what to do.
- **Reversible consequences:** If mood drops, it can be restored. No permanent failure.
- **Reflection prompts:** After care actions, students write what they noticed (not "did I win?").

### Technical Implementation

- **No timer APIs:** Code does not use `setInterval()` for countdown mechanics
- **Paused state management:** When app is backgrounded, vitals freeze (no "pet suffers while you're away")
- **No notification permissions:** App never requests OS-level notification access
- **Deterministic outcomes:** Mood calculations use fixed formulas, not randomness (no gambling-like unpredictability)

---

## 5. Data Minimalism: What We Don't Collect

### Standard Edtech Data Collection

Typical classroom apps collect:
- Student names, email addresses, school IDs
- Interaction logs (clicks, time-on-task, answers)
- Device metadata (OS version, screen size, IP address)
- Location data (GPS, Wi-Fi SSID)
- Third-party analytics (Google Analytics, Mixpanel, etc.)

### Jewble Meta-Pet Data Collection

**Collected:**
- Nothing. Literally zero data leaves the device during normal use.

**Stored locally (never transmitted):**
- Pet DNA (180-digit genome)
- Vitals state (Nutrition, Hydration, Rest, Stimulation)
- Mood history (last N mood transitions for pattern recognition)
- Student reflections (if they type them in the app; can also use paper)

**NOT collected:**
- Student name
- Student email or ID
- Device ID or IP address
- Location
- Usage analytics
- Crash reports (optional: can be enabled with explicit consent for debugging, but off by default)

### Developer Transparency

**The developer (me) cannot see:**
- Who is using the app
- How many users exist
- What students are doing in the app
- What their pets' DNA is
- What their interaction patterns are

**The developer CAN provide (if requested):**
- Source code review (open for inspection)
- Architecture diagrams
- Walkthrough of local storage structure
- Confirmation that no network calls occur during pilot

---

## 6. Comparison to Common Classroom Apps

| App Type | Accounts? | Data Collection? | Offline-Capable? | Addictive Mechanics? |
|---|---|---|---|---|
| **Google Classroom** | Yes (Google account) | Yes (usage data, assignment metadata) | Partial | No (productivity tool, not engagement-optimised) |
| **Kahoot** | Yes (teacher account; students join via code) | Yes (quiz answers, leaderboards) | No | Yes (timers, leaderboards, music, FOMO) |
| **Seesaw** | Yes (student accounts) | Yes (portfolios synced to cloud) | Limited | No (portfolio tool, not game-like) |
| **Prodigy / ABCmouse** | Yes | Yes (progress tracking, adaptive algorithms) | No | Yes (rewards, avatars, in-app purchases) |
| **Jewble Meta-Pet** | **No** | **No** (local-only) | **Yes** (fully functional offline) | **No** (calm meditation mechanics) |

### Key Differentiator

Most edtech either:
1. Collects data to personalise learning (adaptive algorithms), OR
2. Uses addictive mechanics to boost engagement (gamification)

Jewble does **neither**. It teaches systems thinking through **intrinsic complexity** (emergent mood states from vitals interactions), not extrinsic rewards (points, badges).

---

## 7. Security Audit Readiness

### What ICT Can Review Before Pilot

**Code inspection:**
- Source code available for review (contact developer)
- Network traffic analysis: run app in sandbox, confirm zero outbound API calls
- Local storage inspection: view database structure, confirm no PII

**Platform permissions:**
- App requests **zero** OS permissions (no camera, no microphone, no location, no contacts, no notifications)
- If web-based: runs in standard browser sandbox (no special privileges)
- If native app: minimal entitlements (only local storage access)

**Third-party dependencies:**
- No analytics SDKs (no Google Analytics, no Firebase, no Mixpanel)
- No ad networks (no Google Ads, no Facebook Pixel)
- No social logins (no "Sign in with Google/Apple/Microsoft")
- Only core libraries for UI rendering and local database access (standard open-source tools)

### Developer Availability

- **Technical Q&A:** Available for meeting with ICT Coordinator
- **Code walkthrough:** Can demonstrate architecture live
- **Security questions:** Happy to answer any concerns about encryption, data flow, or privacy design

---

## 8. Risk Assessment: What Could Go Wrong?

### Realistic Risks & Mitigations

**Risk 1: Student loses device → loses pet**

- **Likelihood:** Moderate (device loss happens)
- **Impact:** Low (student can create new pet; no "progress" to lose, only familiarity with one pet's DNA)
- **Mitigation:** Optional: future version could allow **device-to-device transfer** via QR code (still no cloud sync)

**Risk 2: Student accidentally deletes app → loses pet**

- **Likelihood:** Low (requires deliberate uninstall)
- **Impact:** Low (same as above — pet is replaceable)
- **Mitigation:** If using web version, app lives in browser cache (harder to delete by accident)

**Risk 3: Bug in vitals calculation → confusing outcomes**

- **Likelihood:** Low (code is tested, but bugs happen)
- **Impact:** Moderate (student frustration if cause-effect feels random)
- **Mitigation:** Pilot includes feedback mechanism; developer fixes bugs based on teacher/student reports

**Risk 4: Future version adds cloud features → privacy model changes**

- **Likelihood:** Possible (if KPPS requests teacher dashboards, community challenges, etc.)
- **Impact:** Depends on implementation
- **Mitigation:** Any future cloud features will be **opt-in**, **anonymized**, and **transparent** (requires new parent consent, not grandfathered from pilot)

**Risk 5: Developer abandons project → app stops working**

- **Likelihood:** Low (developer is KPPS parent with vested interest)
- **Impact:** Moderate (if app breaks, no one can fix it)
- **Mitigation:** Source code can be escrowed with KPPS ICT if school wants continuity insurance

---

## 9. Regulatory Compliance

### Relevant Frameworks

**Victorian Privacy Principles:**
- **Minimal collection:** Jewble collects zero PII (exceeds standard)
- **Purpose limitation:** N/A (no data collected)
- **Access/correction rights:** N/A (no data to access or correct)

**COPPA (US Children's Online Privacy Protection Act):**
- Not applicable in Australia, but worth noting: Jewble would comply by default (no data collection from children under 13)

**GDPR (if international expansion considered):**
- **Right to access:** N/A (no data held by controller)
- **Right to deletion:** N/A (data already local-only)
- **Data minimisation:** Fully compliant (zero collection)

**Australian Student Privacy Principles:**
- KPPS retains control over student data (because there is none to control)
- Third-party risk eliminated (no third parties involved)

### What This Means for KPPS

- **No privacy impact assessment required** (no data collection = no impact)
- **No parent opt-in complexity** (pilot is structurally safe; no consent forms beyond standard "new classroom tool" notification)
- **No vendor data processing agreement** (developer is not a data processor because no data is processed)

---

## 10. Future-Proofing: If We Add Features

### Possible Extensions (Not in Pilot)

**Teacher Dashboard (Aggregate Data):**
- Shows class-level patterns: "65% of students noticed Calm → Rest correlation"
- **Privacy design:** No individual student data. Only aggregate anonymized trends.
- **Opt-in:** Students must explicitly consent to share anonymized patterns.

**Community Challenges:**
- Class goal: "Can we collectively keep our pets Calm for one week?"
- **Privacy design:** No individual pet visibility. Only class-wide averages.
- **Opt-in:** Separate consent required.

**Cross-Device Sync (for students with multiple devices):**
- Student transfers pet from iPad to Chromebook via QR code
- **Privacy design:** Transfer happens peer-to-peer (no cloud intermediary)
- **Security:** Transfer requires physical proximity (QR code scan)

**All extensions will:**
1. Be **opt-in** (never mandatory)
2. Maintain **data minimisation** (collect only what's necessary for feature)
3. Require **new parent notification** (no silent feature creep)
4. Be **auditable** by KPPS ICT before deployment

---

## 11. Developer Commitment

**Transparency:**
- Open to code review, architecture walkthroughs, security audits
- No hidden data collection (provable via network traffic analysis)

**Responsiveness:**
- Available for technical Q&A during pilot
- Bug fixes prioritised for KPPS (pilot school gets first-class support)

**No commercial pressure:**
- This is offered as partnership, not product sale
- If KPPS discontinues, no hard feelings — feedback is still valuable

**Community alignment:**
- Developer is KPPS parent; incentives align with student wellbeing, not vendor profit
- No exit strategy involving selling student data (because there is no data to sell)

---

## 12. Contact for Technical Review

**For ICT Coordinator or Leadership:**

If you want to:
- Inspect the source code
- Run a network traffic analysis
- Review local storage structure
- Ask specific security questions
- Schedule a technical walkthrough

**Contact:** [Developer email / phone]

I'm happy to meet, demo, or answer any questions before the pilot begins.

---

## Closing: Trust Through Transparency

This brief is long because **privacy-by-design requires detailed explanation**. The underlying principle is simple:

**If we don't collect data, we can't misuse it, lose it, or leak it.**

Jewble Meta-Pet is architected to eliminate risk **structurally**, not through policy promises. You can verify this through code review, traffic analysis, or storage inspection.

We're not asking KPPS to "trust us." We're showing you **how the system works** so you can decide for yourself.

Built with a KPPS kid.  
Designed for KPPS safety standards.  
Open for your inspection.

Ready when you are.

---

**End of Technical Brief**

---

**This concludes the KPPS Teacher Hub Package.**

**Package Contents:**
1. Welcome & Overview
2. 7-Session Implementation Guide
3. Teacher Facilitation Scripts
4. Student Reflection Prompts
5. KPPS Values Integration Map
6. Parent Communication Kit
7. Privacy & Safety Technical Brief

**All documents ready for presentation to KPPS leadership, teachers, and families.**
