import React from "react";
import "./WAuthShell.css";
import { WPage } from "./WPage.jsx";
import { WSteps } from "./WSteps.jsx";
import { WTopBar } from "./WTopBar.jsx";

function WAuthShell({ step, title, subtitle, children, labels, hideSteps, topAlign, noScroll }) {
  return (
    <WPage scroll={false} className="cb-auth-page">
      <WTopBar minimal />
      <div className="w-auth-center cb-auth-center" style={{ alignItems: topAlign ? "flex-start" : "center" }}>
        <div className="cb-auth-card">
          {/* Fixed header — stays put while the content below scrolls */}
          <div className="cb-auth-title" style={{ marginBottom: subtitle ? 4 : 14 }}>{title}</div>
          {subtitle && <div className="cb-auth-subtitle">{subtitle}</div>}
          {!hideSteps && <WSteps step={step} labels={labels || ["Authorize", "Choose plan", "Install & verify"]} />}
          {/* Content area — scrolls by default; noScroll lets a screen fit fully */}
          <div className="cb-auth-content" style={{ overflowY: noScroll ? "visible" : "auto" }}>
            {children}
          </div>
        </div>
      </div>
    </WPage>);

}

// Numbered sub-step with a connecting left rail (matches the install reference)

export { WAuthShell };
