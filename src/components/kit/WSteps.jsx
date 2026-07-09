import React from "react";
import "./WSteps.css";

function WSteps({ step, labels }) {
  return (
    <div className="cb-steps-row">
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < step,active = num === step;
        return (
          <React.Fragment key={i}>
            <div className="cb-steps-item">
              <div className="cb-steps-badge" style={{
                background: done || active ? "var(--purple)" : "var(--surface-3)",
                outline: active ? "3px solid rgba(124,92,252,0.25)" : "none"
              }}>{done ? "✓" : num}</div>
              <div className="cb-steps-label" style={{ color: active || done ? "var(--text)" : "var(--text-muted)" }}>{label}</div>
            </div>
            {i < labels.length - 1 && <div className="cb-steps-connector" style={{ background: done ? "var(--purple)" : "var(--surface-3)" }} />}
          </React.Fragment>);

      })}
    </div>);

}

export { WSteps };
