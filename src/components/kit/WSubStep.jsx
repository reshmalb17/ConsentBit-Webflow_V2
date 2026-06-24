import React from "react";

function WSubStep({ n, last, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 12 }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        <div style={{
          width: 26, height: 26, borderRadius: 999, flexShrink: 0, zIndex: 1,
          background: "var(--purple-soft)", border: "1.5px solid var(--purple-hi)",
          color: "var(--purple-hi)", display: "grid", placeItems: "center",
          fontSize: 12, fontWeight: 700
        }}>{n}</div>
        {!last && <div style={{ position: "absolute", top: 30, bottom: -14, width: 2, background: "var(--border)" }} />}
      </div>
      <div className="card" style={{ padding: 14, marginBottom: 14, width: "514px" }}>{children}</div>
    </div>);

}

// Stylized mock of the Webflow custom-code / head-code panel

export { WSubStep };
