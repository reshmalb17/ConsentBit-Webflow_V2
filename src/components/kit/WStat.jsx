import React from "react";

function WStat({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent || "var(--text)", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>{sub}</div>
    </div>);

}

export { WStat };
