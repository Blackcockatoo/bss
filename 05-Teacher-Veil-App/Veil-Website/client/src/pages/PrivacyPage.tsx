import DocLayout from "@/components/layout/DocLayout";
import { getDoc } from "@/content/curriculum";
import { Shield, Clock, CheckCircle2 } from "lucide-react";

const doc = getDoc("privacy-brief")!;

interface TableRow {
  risk: string;
  mitigation: string;
}

function ComparisonTable({ rows }: { rows: TableRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left p-3 font-semibold text-foreground">Risk in Cloud-Based Apps</th>
            <th className="text-left p-3 font-semibold text-primary">How Offline-First Mitigates</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="p-3 text-muted-foreground">{row.risk}</td>
              <td className="p-3 text-foreground">{row.mitigation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <DocLayout sections={doc.sections} sidebarTitle="Sections">
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Doc 07</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{doc.readTime} min read</span>
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs">ICT</span>
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs">Leadership</span>
          </div>
          <h1 className="text-4xl font-bold text-primary">{doc.title}</h1>
          <p className="text-xl text-muted-foreground">{doc.subtitle}</p>
        </div>

        {/* Executive Summary */}
        <section id="executive-summary" className="p-5 rounded-xl bg-primary text-primary-foreground space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <h2 className="font-bold text-lg">Technical Summary — For Leadership Skim</h2>
          </div>
          <p className="opacity-80 text-sm leading-relaxed">
            The Jewble Meta-Pet is architected with privacy-by-design and offline-first principles.
            Unlike typical classroom apps, this tool operates without any server infrastructure.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "No accounts", desc: "Zero credentials to manage or leak" },
              { label: "No data transmission", desc: "Pet DNA and history stay on device" },
              { label: "No tracking", desc: "No analytics, no SDKs, no cookies" },
              { label: "No addictive mechanics", desc: "No timers, FOMO, streaks, or notifications" },
            ].map((item) => (
              <div key={item.label} className="flex gap-2 bg-primary-foreground/10 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs opacity-70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offline Architecture */}
        <section id="offline-architecture" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">1. Offline-First Architecture</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
              <p className="font-semibold text-red-700 text-sm">Standard classroom apps</p>
              <p className="text-sm text-red-600">Require continuous internet connection. Data syncs to cloud servers. Offline mode is degraded or non-functional.</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-2">
              <p className="font-semibold text-green-700 text-sm">Jewble Meta-Pet</p>
              <p className="text-sm text-green-600">Fully functional without internet. All core mechanics execute locally. Internet is optional for non-core features — none in pilot.</p>
            </div>
          </div>

          <ComparisonTable rows={[
            { risk: "Data breach (server hacked, credentials leaked)", mitigation: "No server = no breach vector. Data never leaves device." },
            { risk: "Third-party tracking (analytics SDKs, ad networks)", mitigation: "No network calls = no trackers can piggyback on connections." },
            { risk: "Downtime / service outages", mitigation: "App works regardless of network status. No server-down interruptions." },
            { risk: "Compliance overhead (GDPR, COPPA, Victorian privacy laws)", mitigation: "No data collection = minimal compliance burden." },
          ]} />

          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2 text-sm">
            <p className="font-semibold text-foreground">Technical implementation:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>→ Pet state (vitals, mood, DNA) stored in device-native database (IndexedDB for web)</li>
              <li>→ No API calls during care loops — all calculations happen client-side</li>
              <li>→ Future teacher dashboards (if added): opt-in and anonymised, no student names</li>
            </ul>
          </div>
        </section>

        {/* Zero Account */}
        <section id="zero-account" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">2. Zero Account Design</h2>

          <p className="text-muted-foreground">
            Standard edtech requires username/password or SSO (Google/Microsoft). Jewble has no login.
            Students open the app and start. Each device instance is self-contained.
          </p>

          <ComparisonTable rows={[
            { risk: "Credential theft (phishing, password reuse, weak passwords)", mitigation: "No credentials to steal. Nothing to phish." },
            { risk: "Identity verification complexity (age gates, parental consent forms)", mitigation: "No identity capture = no age verification needed." },
            { risk: "Password reset burden (IT tickets, teacher time)", mitigation: "No passwords = no resets." },
            { risk: "Cross-device tracking (profile follows student)", mitigation: "Each device is independent. No persistent identity." },
          ]} />

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5 text-sm">
            <p className="font-semibold text-primary">Implications for KPPS:</p>
            <p className="text-muted-foreground">→ No enrolment process — students just open the app</p>
            <p className="text-muted-foreground">→ No forgotten password tickets for ICT Coordinator</p>
            <p className="text-muted-foreground">→ No FERPA/GDPR/Victorian privacy law user records to manage</p>
          </div>
        </section>

        {/* DNA Privacy */}
        <section id="dna-privacy" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">3. DNA Never Transmitted (Genetic Privacy)</h2>

          <p className="text-muted-foreground leading-relaxed">
            Each Jewble Meta-Pet has a unique 180-digit "genetic genome" — a cryptographic representation
            of its personality traits, response patterns, and appearance. This genome is generated locally
            on first launch and never transmitted to any external system.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Generation", desc: "On first app launch, locally generated using device entropy" },
              { label: "Storage", desc: "Device-local only — no backup, no sync, no cloud copy" },
              { label: "Transmission", desc: "Never. No server endpoint to receive it even if attempted." },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="font-semibold text-foreground mb-1">{item.label}</p>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
            <strong className="text-foreground">Why this matters: </strong>
            The genome determines how the pet "feels" and responds — it's effectively a behavioural fingerprint.
            If transmitted, it could theoretically be correlated with student behaviour patterns.
            By keeping it local, this correlation is structurally impossible.
          </div>
        </section>

        {/* Compliance */}
        <section id="compliance" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">4. Regulatory Compliance</h2>

          <div className="space-y-3">
            {[
              {
                law: "Australian Privacy Act 1988",
                status: "Compliant",
                note: "No personal information collected, processed, or stored on any external system.",
              },
              {
                law: "Victorian Information Privacy Act 2000",
                status: "Compliant",
                note: "No student PII captured. Device-local storage only. No data sharing with third parties.",
              },
              {
                law: "Children's Online Privacy Protection Act (COPPA)",
                status: "Not applicable",
                note: "No online component in pilot. Offline-first design places this outside COPPA scope.",
              },
              {
                law: "GDPR (General Data Protection Regulation)",
                status: "Best practice",
                note: "No EU data subjects expected, but architecture meets GDPR data minimisation principles by default.",
              },
              {
                law: "COPC 2025 (Australia's Children's Online Privacy Code)",
                status: "Reference implementation",
                note: "Designed as a blueprint for COPC 2025 compliance — privacy by design, no behavioural advertising, age-appropriate by architecture.",
              },
            ].map((item) => (
              <div key={item.law} className="flex gap-4 p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{item.law}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                </div>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 h-fit flex-shrink-0 ${
                  item.status === "Compliant" ? "bg-green-100 text-green-700" :
                  item.status === "Reference implementation" ? "bg-primary/10 text-primary" :
                  item.status === "Best practice" ? "bg-blue-100 text-blue-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ICT Checklist */}
        <section id="ict-checklist" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">5. ICT Coordinator Checklist</h2>

          <p className="text-sm text-muted-foreground">
            For ICT sign-off before pilot deployment. All items should be confirmed before Session 1.
          </p>

          <div className="space-y-2">
            {[
              { item: "Devices can access the app URL (web-based) or app is installed (if native)", priority: "Required" },
              { item: "No school network firewall blocks the app domain", priority: "Required" },
              { item: "Student devices support local storage (IndexedDB or equivalent)", priority: "Required" },
              { item: "App confirmed to work offline after first load", priority: "Required" },
              { item: "No app store account or purchase required for students", priority: "Confirmed by design" },
              { item: "No privacy policy acceptance required for students", priority: "Confirmed by design" },
              { item: "Network traffic inspection confirms no unexpected outbound connections", priority: "Optional / Advanced" },
              { item: "Developer available for code review if required", priority: "Available on request" },
            ].map((row, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-border text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground flex-1">{row.item}</span>
                <span className={`text-xs font-medium flex-shrink-0 ${
                  row.priority === "Required" ? "text-red-600" :
                  row.priority === "Confirmed by design" ? "text-green-600" :
                  "text-muted-foreground"
                }`}>
                  {row.priority}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-2">
            <p className="font-semibold text-primary">Developer contact</p>
            <p className="text-muted-foreground">
              The developer (KPPS parent, Blue Snake Studios) is available for a technical walkthrough,
              code review, or Q&A session with the ICT Coordinator. This is an open offer — no sales agenda.
            </p>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}
