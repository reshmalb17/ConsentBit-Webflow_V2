import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { WNotificationsPanel } from "../../kit/WNotificationsPanel.jsx";

function WNotifications() {
  return (
    <WPage scroll={false}>
      <WTopBar />
      <WMainTabs active="dashboard" left />
      <div style={{ position: "relative", padding: 16, minHeight: 460 }}>
        <div className="card" style={{ padding: 14, opacity: 0.3, pointerEvents: "none" }}>
          <div style={{ height: 360, background: "var(--surface-2)", borderRadius: 8 }} />
        </div>
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <WNotificationsPanel />
        </div>
      </div>
    </WPage>);

}

export { WNotifications };
