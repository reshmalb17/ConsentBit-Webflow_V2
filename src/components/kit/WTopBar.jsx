import React from "react";
import { Icon } from "../lib/icons.jsx";
import { WLogo } from "./WLogo.jsx";
import { useNav } from "../../nav.jsx";

function WTopBar({ minimal = false }) {
  const nav = useNav();
  return (
    <div className="cb-topbar">
      <WLogo />
      <div style={{ flex: 1 }} />
      <div className="cb-topbar-right">
        <span className="cb-plan-pill">Plan <b>Free</b></span>
        <button className="cb-icon-btn" onClick={nav ? () => nav.setNotifOpen(!nav.notifOpen) : undefined}><Icon.bell /></button>
        <div className="cb-avatar" onClick={nav ? () => nav.setProfileOpen(true) : undefined} style={nav ? { cursor: "pointer" } : undefined}>JD</div>
      </div>
    </div>);

}

export { WTopBar };
