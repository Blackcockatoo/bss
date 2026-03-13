import CampaignLayout from "../components/CampaignLayout";
import StatBlock from "../components/StatBlock";
import { METAPET_APP_URL, TEACHER_HUB_URL } from "../tokens";

export default function AppPage() {
  return (
    <CampaignLayout>
      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "92px 20px 60px" }}>
        <div style={{ maxWidth: "900px" }}>
          <div style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", display: "inline-block", padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(245,200,76,.25)", color: "#f5c84c", marginBottom: "20px" }}>
            For Families & App Users
          </div>
          <h1 style={{ fontSize: "clamp(38px,6vw,72px)", lineHeight: 0.96, letterSpacing: "-1.5px", fontWeight: 900, marginBottom: "16px" }}>
            Your kid's digital pet<br />
            <span style={{ background: "linear-gradient(135deg,#f5c84c,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              knows nothing about them.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(15px,2.2vw,19px)", color: "#a7b6cb", lineHeight: 1.65, maxWidth: "660px", margin: "0 auto 32px" }}>
            No accounts. No data sent anywhere. No company watching. Just a digital companion that lives on the device
            — and teaches systems thinking in 20 minutes a week.
          </p>
          <a href={METAPET_APP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "13px 24px", borderRadius: "14px", background: "#f5c84c", color: "#0a0a0a", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}>
            See the app →
          </a>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px" }}>
          <StatBlock stat="94%" label="of children's apps share data with third parties. This one doesn't." color="gold" />
          <StatBlock stat="Zero" label="accounts, logins, or sign-ups required — ever" color="teal" />
          <StatBlock stat="180-digit" label="unique DNA per pet — more combinations than atoms in the observable universe" color="violet" />
          <StatBlock stat="0 bytes" label="sent to any server — offline-first by design" color="gold" />
        </div>
      </section>

      {/* Why different */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <p style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#f5c84c", marginBottom: "10px" }}>
          What makes it different
        </p>
        <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 850, letterSpacing: "-1px", marginBottom: "24px" }}>
          Built against the standard edtech playbook.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", alignItems: "center" }}>
          <div>
            {[
              { label: "Standard apps:", bad: "Create accounts, collect profiles, send data to servers", good: "Jewble: No account. No profile. Nothing leaves the device." },
              { label: "Standard apps:", bad: "Use timers, streaks, and notifications to create compulsion", good: "Jewble: No timers. No streaks. No notifications. No FOMO mechanics." },
              { label: "Standard apps:", bad: "Fund themselves through advertising, data licensing, or freemium upsells", good: "Jewble: No commercial model. Built as a school community contribution." },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "#ff6b6b", marginBottom: "4px" }}>✕ {row.bad}</p>
                <p style={{ fontSize: "13px", color: "#4dd6c8" }}>✓ {row.good}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#111f3a", borderRadius: "20px", border: "1px solid rgba(245,200,76,.2)", padding: "24px" }}>
            <p style={{ color: "#f5c84c", fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
              What your child is learning
            </p>
            {[
              "Cause and effect — how actions change systems",
              "Emotional regulation — connecting feelings to care strategies",
              "Homeostasis — why balance matters in living systems",
              "Data literacy — patterns, hypotheses, testing",
              "KPPS values — Respect, Resilience, Excellence, Cooperation, Community",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
                <span style={{ color: "#f5c84c", flexShrink: 0 }}>→</span>
                <span style={{ color: "#a7b6cb", fontSize: "14px", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <p style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#a78bfa", marginBottom: "10px" }}>
          Common questions
        </p>
        <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 850, letterSpacing: "-1px", marginBottom: "24px" }}>
          Honest answers.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "14px" }}>
          {[
            { q: "Who built this?", a: "A KPPS parent and software developer, in collaboration with their child (a KPPS student). It's a community contribution to the school, not a product." },
            { q: "Is my child's data safe?", a: "There is no data. The pet lives on the device only. Nothing is transmitted, stored externally, or accessible to anyone outside the device." },
            { q: "Does it create screen dependency?", a: "It's specifically designed not to. No timers, no streaks, no notifications. Students can close it without anxiety." },
            { q: "What will my child learn?", a: "Systems thinking, emotional awareness, STEM concepts (homeostasis, feedback loops, genetics), and school values language — all through caring for a digital companion." },
            { q: "How do I opt out?", a: "Ask your child's teacher. The pilot requires no personal information from you or your child, so there's nothing to 'opt out of' from a data perspective." },
            { q: "Will this continue after the pilot?", a: "That depends on what the school community decides together. The pilot is an experiment, not a commitment." },
          ].map((faq, i) => (
            <div key={i} style={{ background: "#111f3a", border: "1px solid rgba(167,139,250,.2)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ position: "absolute" as const, top: 0, left: 0, right: 0, height: "2px", borderRadius: "14px 14px 0 0", background: "linear-gradient(90deg,#a78bfa,transparent)" }} />
              <p style={{ fontWeight: 700, fontSize: "14px", color: "#e8eef7", marginBottom: "8px" }}>{faq.q}</p>
              <p style={{ color: "#a7b6cb", fontSize: "13px", lineHeight: 1.65 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ask your teacher */}
      <section style={{ maxWidth: "700px", margin: "0 auto 100px", padding: "0 18px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 850, letterSpacing: "-0.5px", marginBottom: "12px" }}>
          Still have questions?
        </h2>
        <p style={{ color: "#a7b6cb", lineHeight: 1.7, marginBottom: "24px" }}>
          See the school brief or talk to your child's teacher. They have a complete FAQ response template and the full privacy brief.
          Or browse the Teacher Hub directly — everything is public.
        </p>
        <a href={TEACHER_HUB_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "13px 24px", borderRadius: "14px", border: "1px solid rgba(245,200,76,.3)", color: "#f5c84c", background: "rgba(245,200,76,.06)", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}>
          Teacher Hub ↗
        </a>
      </section>
    </CampaignLayout>
  );
}
