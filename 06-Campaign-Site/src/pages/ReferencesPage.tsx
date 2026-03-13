const REFERENCES = [
  {
    claim: "94% of top children's apps share data with third parties.",
    slide: "Elevator · Floor 01",
    title: "How Many Apps on Children's Smartphones Are Privacy Label Compliant?",
    publication: "JMIR Pediatrics and Parenting",
    date: "2022-09-22",
    url: "https://pediatrics.jmir.org/2022/3/e37173",
  },
  {
    claim: "Australia's Children's Online Privacy Code consultation is open (COPC 2025 narrative).",
    slide: "Elevator · Floor 04",
    title: "Children's Online Privacy Code consultation",
    publication: "eSafety Commissioner (Australia)",
    date: "2025",
    url: "https://www.esafety.gov.au/industry/tech-trends-and-challenges/childrens-online-privacy-code",
  },
  {
    claim: "1,200+ independent and Catholic schools in Australia.",
    slide: "Elevator · Floor 05",
    title: "Non-Government Schools Census Collection",
    publication: "Australian Curriculum, Assessment and Reporting Authority (ACARA)",
    date: "2024",
    url: "https://www.acara.edu.au/reporting/national-report-on-schooling-in-australia/non-government-schools-census-collection",
  },
];

export default function ReferencesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#04071a",
        color: "#e6edf9",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        padding: "5rem 1.25rem 2rem",
      }}
    >
      <div style={{ maxWidth: "880px", margin: "0 auto", display: "grid", gap: "1rem" }}>
        <h1 style={{ margin: 0, color: "#f5c84c", letterSpacing: "0.02em" }}>Evidence & References</h1>
        <p style={{ margin: 0, color: "rgba(230,237,249,0.78)", lineHeight: 1.7 }}>
          Claim-to-source mappings for the elevator pitch. Every quantitative or regulatory assertion must be traceable to a public source.
        </p>

        {REFERENCES.map((item) => (
          <article
            key={item.claim}
            style={{
              border: "1px solid rgba(245,200,76,0.24)",
              borderRadius: "10px",
              padding: "0.95rem",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ fontSize: "0.73rem", color: "#7dd3fc", marginBottom: "0.35rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {item.slide}
            </div>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Claim: {item.claim}</p>
            <p style={{ margin: "0 0 0.25rem", color: "rgba(230,237,249,0.85)" }}>{item.title}</p>
            <p style={{ margin: "0 0 0.45rem", color: "rgba(230,237,249,0.65)", fontSize: "0.9rem" }}>
              {item.publication} · {item.date}
            </p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#f5c84c" }}>
              {item.url}
            </a>
          </article>
        ))}

        <section style={{ marginTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "1rem" }}>
          <h2 style={{ marginTop: 0, color: "#f5c84c", fontSize: "1.2rem" }}>Content governance</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.7, color: "rgba(230,237,249,0.85)" }}>
            <li>Any new quantitative, compliance, regulatory, or market-size claim must include an inline slide source (footnote or Sources panel).</li>
            <li>When claim wording changes, update both the slide-level source and this page in the same PR.</li>
            <li>Do not ship unverifiable superlatives (for example: “industry-leading”, “first”, “most trusted”) without a cited benchmark.</li>
            <li>Use publication title, date, and direct URL (no homepage-only links) for each source entry.</li>
          </ul>
        </section>

        <div style={{ marginTop: "0.6rem" }}>
          <a href="/elevator" style={{ color: "#7dd3fc", textDecoration: "none" }}>
            ← Back to Elevator Pitch
          </a>
        </div>
      </div>
    </main>
  );
}
