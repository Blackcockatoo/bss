import CampaignLayout from "../components/CampaignLayout";
import StatBlock from "../components/StatBlock";
import { TEACHER_HUB_URL, METAPET_APP_URL } from "../tokens";

const session7 = [
  { n: 1, title: "The Arrival", focus: "Onboarding + Values Framing" },
  { n: 2, title: "Vitals & Needs", focus: "First Full Care Loop" },
  { n: 3, title: "Emotional States", focus: "Reflection Practice" },
  { n: 4, title: "Feedback Loops", focus: "Responsibility + Repair" },
  { n: 5, title: "Data Literacy", focus: "STEM: Homeostasis" },
  { n: 6, title: "Collaborative Systems", focus: "STEM: Data + Patterns" },
  { n: 7, title: "The Showcase", focus: "Metacognition + Celebration" },
];

export default function SchoolsPage() {
  return (
    <CampaignLayout>
      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "92px 20px 60px" }}>
        <div style={{ maxWidth: "900px" }}>
          <div style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", display: "inline-block", padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(77,214,200,.25)", color: "#4dd6c8", marginBottom: "20px" }}>
            For School Leaders, Teachers & ICT Coordinators
          </div>
          <h1 style={{ fontSize: "clamp(38px,6vw,72px)", lineHeight: 0.96, letterSpacing: "-1.5px", fontWeight: 900, marginBottom: "16px" }}>
            Low friction.<br />
            <span style={{ background: "linear-gradient(135deg,#4dd6c8,#f5c84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Privacy-first. Learning-focused.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(15px,2.2vw,19px)", color: "#a7b6cb", lineHeight: 1.65, maxWidth: "680px", margin: "0 auto 32px" }}>
            A 7-session wellbeing and STEM pilot designed to drop into your existing program without disrupting it.
            No accounts, no logins, no IT headaches.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={TEACHER_HUB_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 24px", borderRadius: "14px", background: "#f5c84c", color: "#0a0a0a", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}>
              Visit the Teacher Hub →
            </a>
            <a href={METAPET_APP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 24px", borderRadius: "14px", border: "1px solid rgba(77,214,200,.3)", color: "#4dd6c8", background: "rgba(77,214,200,.06)", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}>
              Launch the App ↗
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px" }}>
          <StatBlock stat="7" label="structured sessions — fully scripted and ready to teach" color="teal" />
          <StatBlock stat="20min" label="per session — fits inside any existing wellbeing slot" color="gold" />
          <StatBlock stat="Zero" label="student accounts or passwords required" color="violet" />
          <StatBlock stat="COPC 2025" label="privacy-by-design reference aligned to emerging guidance" color="teal" />
        </div>
      </section>

      {/* The 7 sessions */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <p style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#4dd6c8", marginBottom: "10px" }}>
          The Curriculum
        </p>
        <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 850, letterSpacing: "-1px", marginBottom: "8px" }}>
          7 sessions. Ready to implement.
        </h2>
        <p style={{ color: "#a7b6cb", lineHeight: 1.7, fontSize: "16px", maxWidth: "680px", marginBottom: "28px" }}>
          Each session includes a learning intention, I Do / We Do / You Do structure, facilitation scripts,
          reflection prompts, and explicit KPPS values language. Click each session in the Teacher Hub for the full plan.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px" }}>
          {session7.map((s) => (
            <div key={s.n} style={{ background: "#111f3a", border: "1px solid rgba(77,214,200,.2)", borderRadius: "14px", padding: "16px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,#4dd6c8,transparent)" }} />
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(77,214,200,.15)", border: "1px solid rgba(77,214,200,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#4dd6c8", fontSize: "13px", marginBottom: "10px" }}>
                {s.n}
              </div>
              <p style={{ fontWeight: 700, fontSize: "14px", color: "#e8eef7", marginBottom: "4px" }}>{s.title}</p>
              <p style={{ color: "#a7b6cb", fontSize: "12px" }}>{s.focus}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "24px" }}>
          <a href={TEACHER_HUB_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "1px solid rgba(245,200,76,.3)", color: "#f5c84c", background: "rgba(245,200,76,.06)", fontWeight: 700, textDecoration: "none", fontSize: "13px" }}>
            Ready to pilot? Visit the Teacher Hub →
          </a>
        </div>
      </section>

      {/* Privacy / ZCEA */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <div style={{ background: "#111f3a", border: "1px solid rgba(77,214,200,.2)", borderRadius: "20px", padding: "32px" }}>
          <p style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#4dd6c8", marginBottom: "10px" }}>
            Zero-Collection Educational Architecture
          </p>
          <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 850, letterSpacing: "-0.5px", marginBottom: "16px" }}>
            No student accounts. No student data collection. By design.
          </h2>
          <p style={{ color: "#a7b6cb", lineHeight: 1.7, fontSize: "15px", maxWidth: "680px", marginBottom: "24px" }}>
            Unlike every other edtech tool, the privacy protection isn't a checkbox or a policy.
            It's structural. The app has no server. There's nothing to breach. No accounts to phish.
            No data to leak. Your ICT Coordinator will thank you.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "12px" }}>
            {[
              { t: "No accounts", d: "Zero credentials to manage" },
              { t: "No student-data transmission", d: "Student data remains on-device" },
              { t: "No behavioural tracking", d: "No third-party analytics SDKs" },
              { t: "Calm interaction design", d: "No streak pressure or urgency loops" },
            ].map((item) => (
              <div key={item.t} style={{ padding: "14px", borderRadius: "12px", background: "rgba(77,214,200,.06)", border: "1px solid rgba(77,214,200,.15)" }}>
                <p style={{ fontWeight: 700, color: "#4dd6c8", marginBottom: "4px", fontSize: "13px" }}>{item.t}</p>
                <p style={{ color: "#a7b6cb", fontSize: "12px" }}>{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: "700px", margin: "0 auto 100px", padding: "0 18px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 850, letterSpacing: "-1px", marginBottom: "12px" }}>
          Ready to pilot?
        </h2>
        <p style={{ color: "#a7b6cb", lineHeight: 1.7, marginBottom: "24px" }}>
          The full implementation package — 7 session guides, facilitation scripts, parent communication templates,
          values alignment maps, and ICT brief — is available now on the Teacher Hub.
        </p>
        <a href={TEACHER_HUB_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 28px", borderRadius: "14px", background: "#f5c84c", color: "#0a0a0a", fontWeight: 700, textDecoration: "none", fontSize: "15px" }}>
          Visit the Teacher Hub →
        </a>
      </section>
    </CampaignLayout>
  );
}
