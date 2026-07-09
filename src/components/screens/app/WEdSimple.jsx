import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Field } from "../../primitives/Field.jsx";
import { Radio } from "../../primitives/Radio.jsx";
import { Toggle } from "../../primitives/Toggle.jsx";
import "./WEdSimple.css";

function WEdSimple() {
  // Matches the original 800px reference
  return (
    <WEdShell active="general">
      <div className="cb-edsimple-grid">
        <div>
          <Field label="Expires"><input className="input" placeholder="120s" /></Field>
          <Field label="Animation"><select className="select"><option>Fade</option></select></Field>
          <Field label="Easing"><select className="select"><option>Ease</option></select></Field>
          <div className="cb-edsimple-spacer" />
          <Field label="Language"><select className="select"><option>English</option></select></Field>
          <div className="cb-edsimple-reset-row">
            <span className="purple-title cb-edsimple-reset-title">Reset Interactions <span className="help-q">?</span></span>
            <Toggle on={false} />
          </div>
          <div className="cb-edsimple-compliance-block">
            <div className="purple-title cb-edsimple-compliance-title">Compliance <span className="help-q">?</span></div>
            <label className="cb-edsimple-check">
              <Radio on={true} /> US State Laws
            </label>
            <label className="cb-edsimple-check">
              <Radio on={false} /> GDPR
            </label>
          </div>
          <div className="cb-edsimple-export-block">
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
