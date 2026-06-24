import React from "react";

function WSteps({ step, labels }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 0, marginBottom: 22 }}>
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < step,active = num === step;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 90 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 999,
                display: "grid", placeItems: "center",
                background: done || active ? "var(--purple)" : "var(--surface-3)",
                color: "white", fontSize: 11, fontWeight: 600,
                outline: active ? "3px solid rgba(124,92,252,0.25)" : "none"
              }}>{done ? "✓" : num}</div>
              <div style={{ fontSize: 10.5, color: active || done ? "var(--text)" : "var(--text-muted)" }}>{label}</div>
            </div>
            {i < labels.length - 1 && <div style={{ flex: "0 0 50px", height: 2, background: done ? "var(--purple)" : "var(--surface-3)", marginTop: 11, marginLeft: -8, marginRight: -8 }} />}
          </React.Fragment>);

      })}
    </div>);

}

export { WSteps };
