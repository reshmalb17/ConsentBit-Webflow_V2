import React from "react";
import "./WCollapse.css";

function WCollapse({ label, children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="cb-collapse-wrap">
      <button type="button" onClick={() => setOpen(!open)} className="cb-collapse-btn">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="cb-collapse-icon" style={{ transform: open ? "rotate(90deg)" : "none" }}><path d="M9 6l6 6-6 6" /></svg>
        {label}
      </button>
      {open && <div className="cb-collapse-body">{children}</div>}
    </div>);

}

export { WCollapse };
