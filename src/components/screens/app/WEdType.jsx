import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";

function WEdType() {
  const [align, setAlign] = React.useState(0); // 0 left, 1 center, 2 right
  const aligns = [
  { lines: [70, 50, 62] },
  { lines: [70, 50, 62] },
  { lines: [70, 50, 62] }];

  return (
    <WEdShell active="type">
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
        <div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>Choose Font <span className="help-q">?</span></div>
            <select className="select" style={{ marginBottom: 14 }}><option>Inter</option><option>DM Sans</option><option>Funnel Display</option><option>Montserrat</option></select>

            <div className="field-label" style={{ marginBottom: 6 }}>Weight</div>
            <select className="select" style={{ marginBottom: 14 }}><option>Bold</option><option>Medium</option><option>Regular</option></select>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="field-label" style={{ marginBottom: 0 }}>Alignment</div>
              <div style={{ display: "flex", gap: 6 }}>
                {aligns.map((a, i) => {
                  const on = align === i;
                  return (
                  <button key={i} onClick={() => setAlign(i)} style={{
                    width: 34, height: 30, borderRadius: 7,
                    border: "1px solid " + (on ? "var(--purple)" : "var(--border)"),
                    background: on ? "var(--purple)" : "var(--surface)",
                    display: "flex", flexDirection: "column", alignItems: i === 1 ? "center" : i === 2 ? "flex-end" : "flex-start",
                    justifyContent: "center", gap: 3, padding: "0 7px", cursor: "pointer"
                  }}>
                    {a.lines.map((w, j) =>
                  <div key={j} style={{ width: w + "%", height: 2, borderRadius: 2, background: on ? "#fff" : "var(--text-muted)" }} />
                  )}
                  </button>);

                })}
              </div>
            </div>
          </div>
        </div>
        <div>
          <WEdPreview />
        </div>
      </div>
    </WEdShell>);

}

export { WEdType };
