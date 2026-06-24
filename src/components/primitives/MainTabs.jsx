import React from "react";
import { Icon } from "../lib/icons.jsx";
import { Page } from "./Page.jsx";

function MainTabs({active}) {
  const tabs = [
    {id: "dashboard", label: "Dashboard", icon: <Icon.home />},
    {id: "cookie", label: "Cookie Banner", icon: <Icon.cookie />},
    {id: "scan", label: "Scan", icon: <Icon.scan />},
    {id: "logs", label: "Consent Logs", icon: <Icon.log />},
    {id: "upgrade", label: "Upgrade", icon: <Icon.upgrade />},
  ];
  return (
    <div className="cb-main-tabs">
      <div className="cb-main-tabs-inner">
        {tabs.map(t => (
          <button key={t.id} className={"cb-tab " + (active === t.id ? "active" : "")}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Page frame: takes width/height and renders an artboard with chrome

export { MainTabs };
