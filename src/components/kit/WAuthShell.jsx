import React from "react";
import { WPage } from "./WPage.jsx";
import { WSteps } from "./WSteps.jsx";
import { WTopBar } from "./WTopBar.jsx";

function WAuthShell({ step, title, subtitle, children, labels, hideSteps, topAlign }) {
  return (
    <WPage scroll={false} style={{ display: "flex", flexDirection: "column" }}>
      <WTopBar minimal />
      <div className="w-auth-center" style={{ padding: "24px 22px", alignItems: topAlign ? "flex-start" : "center" }}>
        <div style={{ width: "100%", maxWidth: 640, maxHeight: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Fixed header — stays put while the content below scrolls */}
          <div style={{ textAlign: "center", fontSize: 16, fontWeight: 600, marginBottom: subtitle ? 4 : 18 }}>{title}</div>
          {subtitle && <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>{subtitle}</div>}
          {!hideSteps && <WSteps step={step} labels={labels || ["Authorize", "Choose plan", "Install & verify"]} />}
          {/* Scrollable content area */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {children}
          </div>
        </div>
      </div>
    </WPage>);

}

// Numbered sub-step with a connecting left rail (matches the install reference)

export { WAuthShell };
