import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Field } from "../../primitives/Field.jsx";
import { Radio } from "../../primitives/Radio.jsx";
import { Toggle } from "../../primitives/Toggle.jsx";

function WEdSimple() {
  // Matches the original 800px reference
  return (
    <WEdShell active="general">
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
        <div>
          <Field label="Expires"><input className="input" placeholder="120s" /></Field>
          <Field label="Animation"><select className="select"><option>Fade</option></select></Field>
          <Field label="Easing"><select className="select"><option>Ease</option></select></Field>
          <div style={{ height: 18 }} />
          <Field label="Language"><select className="select"><option>English</option></select></Field>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span className="purple-title" style={{ fontSize: 12.5 }}>Reset Interactions <span className="help-q">?</span></span>
            <Toggle on={false} />
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 6 }}>
            <div className="purple-title" style={{ fontSize: 12.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>Compliance <span className="help-q">?</span></div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12 }}>
              <Radio on={true} /> US State Laws
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12 }}>
              <Radio on={false} /> GDPR
            </label>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-secondary btn-sm">Export CSV</button>
            <span className="help-q">?</span>
          </div>
        </div>
        <div>
          <WEdPreview />
        </div>
      </div>
    </WEdShell>);

}

export { WEdSimple };
