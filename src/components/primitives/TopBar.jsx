import React from "react";
import { Icon } from "../lib/icons.jsx";

function TopBar({domain = "acne.com", plan = "Free", showDomainPicker = true}) {
  return (
    <div className="cb-topbar">
      <div className="cb-logo">
        <span className="cb-logo-mark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        Consentbit
      </div>
      {showDomainPicker && <>
        <div className="cb-domain-select">
          <span>{domain}</span>
          <Icon.chevron />
        </div>
        <div className="cb-domain-add"><Icon.plus /></div>
        <div className="cb-view-all"><Icon.globe /> View all Domains</div>
      </>}
      <div className="cb-topbar-right">
        <div className="cb-plan-pill">Current Plan : <b>{plan}</b></div>
        <button className="btn btn-primary btn-sm">Update to Pro</button>
        <button className="cb-icon-btn"><Icon.moon /></button>
        <button className="cb-icon-btn"><Icon.bell /></button>
        <div className="cb-avatar">JD</div>
      </div>
    </div>
  );
}

// ----- Main tabs -----

export { TopBar };
