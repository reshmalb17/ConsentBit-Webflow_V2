import React from "react";
import { Icon } from "../lib/icons.jsx";
import { useNav } from "../../nav.jsx";
import "./WTopBar.css";

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
      <div className="cb-topbar-spacer" />
      <div className="cb-topbar-right">
        {/* Once the paid period has lapsed there is no plan to name — `nav.plan` still
            reports the old tier (oauth/status falls back to a cancelled row, or to a
            sibling site's active subscription), so the pill would read "Plan Essential"
            on a site with no subscription. Offer the action instead.
            Nothing renders until `subEndedKnown` — otherwise a lapsed site paints
            "Plan Essential" and swaps it for Subscribe a moment later. */}
        {nav && !nav.subEndedKnown ? null :
          nav?.subEnded ?
            <button className="cb-plan-pill cb-plan-pill-cta" onClick={nav ? () => { nav.setProfileOpen(false); nav.setMainTab("upgrade"); } : undefined}>Subscribe</button> :
            planLabel && <span className="cb-plan-pill">Plan <b>{planLabel}</b></span>
        }
        <button className="cb-icon-btn" onClick={nav ? () => nav.setNotifOpen(!nav.notifOpen) : undefined}><Icon.bell /></button>
        <div className="cb-avatar" onClick={nav ? () => nav.setProfileOpen(true) : undefined} style={nav ? { cursor: "pointer" } : undefined}>{avatarInitials}</div>
      </div>
    </div>);

}

export { WTopBar };
