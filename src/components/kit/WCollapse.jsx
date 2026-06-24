import React from "react";

function WCollapse({ label, children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
        background: "var(--bg-2)", border: "none", color: "var(--text)",
        fontSize: 11, fontWeight: 600, padding: "8px 10px", textAlign: "left"
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}><path d="M9 6l6 6-6 6" /></svg>
        {label}
      </button>
      {open && <div style={{ padding: 8, borderTop: "1px solid var(--border)" }}>{children}</div>}
    </div>);

}

export { WCollapse };
