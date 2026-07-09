import React from "react";
import { useNav } from "../../nav.jsx";
import "./WMainTabs.css";

function WMainTabs({ active, right, left }) {
  const nav = useNav();
  // When inside the app (NavContext present) the active tab + click handling
  // come from nav; otherwise fall back to the static `active` prop (gallery,
  // WPublish, etc. render these tabs without navigation).
  const current = nav ? nav.mainTab : active;

  const tabs = [
  { id: "cookie", label: "Cookie Banner" },
  { id: "scan", label: "Scan" },
  { id: "logs", label: "Consent Logs" },
  { id: "upgrade", label: "Upgrade" }];

  return (
    <div className="cb-main-tabs" style={right ? { justifyContent: "space-between", alignItems: "center", padding: "18px 32px 10px" } : left ? { justifyContent: "flex-start", padding: "18px 32px 10px" } : undefined}>
      <div className="cb-main-tabs-inner">
        {tabs.map((t) =>
        <button key={t.id} onClick={nav ? () => nav.setMainTab(t.id) : undefined} className={"cb-tab " + (t.id === "upgrade" ? "cb-tab-glow " : "") + (current === t.id ? "active" : "") + " cb-main-tabs-btn"}>{t.label}</button>
        )}
      </div>
      {right && <div className="cb-main-tabs-actions">{right}</div>}
    </div>);

}

export { WMainTabs };
