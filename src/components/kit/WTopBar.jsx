import React from "react";
import { Icon } from "../lib/icons.jsx";
import { useNav } from "../../nav.jsx";

const PLAN_LABELS = { free: "Free", basic: "Basic", essential: "Essential", growth: "Growth" };

function WTopBar({ minimal = false }) {
  const nav = useNav();
  // Blank until the plan is resolved (null); then "Free" or the paid tier.
  const planKey = String(nav?.plan || "").toLowerCase();
  const planLabel = planKey ? (PLAN_LABELS[planKey] || "Free") : "";
  // Avatar initials = first two characters of the account email, uppercased.
  const avatarInitials = (nav?.accountEmail || "").trim().slice(0, 2).toUpperCase() || "—";
  return (
    <div className="cb-topbar">
      <div style={{ flex: 1 }} />
      <div className="cb-topbar-right">
        {planLabel && <span className="cb-plan-pill">Plan <b>{planLabel}</b></span>}
        <button className="cb-icon-btn" onClick={nav ? () => nav.setNotifOpen(!nav.notifOpen) : undefined}><Icon.bell /></button>
        <div className="cb-avatar" onClick={nav ? () => nav.setProfileOpen(true) : undefined} style={nav ? { cursor: "pointer" } : undefined}>{avatarInitials}</div>
      </div>
    </div>);

}

export { WTopBar };
