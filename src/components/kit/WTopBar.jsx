import React from "react";
import { Icon } from "../lib/icons.jsx";
import { WLogo } from "./WLogo.jsx";
import { useNav } from "../../nav.jsx";

const PLAN_LABELS = { free: "Free", basic: "Basic", essential: "Essential", growth: "Growth" };

function WTopBar({ minimal = false }) {
  const nav = useNav();
  const planLabel = PLAN_LABELS[String(nav?.plan || "free").toLowerCase()] || "Free";
  // Avatar initials = first two characters of the account email, uppercased.
  const avatarInitials = (nav?.accountEmail || "").trim().slice(0, 2).toUpperCase() || "—";
  return (
    <div className="cb-topbar">
      <WLogo />
      <div style={{ flex: 1 }} />
      <div className="cb-topbar-right">
        <span className="cb-plan-pill">Plan <b>{planLabel}</b></span>
        <button className="cb-icon-btn" onClick={nav ? () => nav.setNotifOpen(!nav.notifOpen) : undefined}><Icon.bell /></button>
        <div className="cb-avatar" onClick={nav ? () => nav.setProfileOpen(true) : undefined} style={nav ? { cursor: "pointer" } : undefined}>{avatarInitials}</div>
      </div>
    </div>);

}

export { WTopBar };
