import { SM } from "@/lib/tokens";

const SYSTEMS = ["MetaPet", "Teacher Veil", "Campaign", "Elevator", "SuiteMaster"];

export default function StatusRow() {
  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "0 24px 48px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px 24px",
          background: SM.liveDim,
          border: `1px solid ${SM.liveBorder}`,
          borderRadius: "8px",
          padding: "10px 18px",
        }}
      >
        <span
          className="label-mono"
          style={{ color: SM.live, letterSpacing: "2.5px" }}
        >
          ● ALL SYSTEMS OPERATIONAL
        </span>
        <div
          style={{
            width: "1px",
            height: "12px",
            background: SM.line,
          }}
        />
        {SYSTEMS.map((name) => (
          <span
            key={name}
            className="label-mono"
            style={{ color: SM.muted, fontSize: "9px" }}
          >
            ● {name}
          </span>
        ))}
      </div>
    </div>
  );
}
