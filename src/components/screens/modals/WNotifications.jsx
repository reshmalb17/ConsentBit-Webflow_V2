import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { WNotificationsPanel } from "../../kit/WNotificationsPanel.jsx";
import "./WNotifications.css";

function WNotifications() {
  return (
    <WPage scroll={false}>
      <WTopBar />
      <WMainTabs active="dashboard" left />
      <div className="cb-notif2-stage">
        <div className="card cb-notif2-skeleton">
          <div className="cb-notif2-skeleton-block" />
        </div>
        <div className="cb-notif2-panel">
          <WNotificationsPanel />
        </div>
      </div>
    </WPage>);

}

export { WNotifications };
