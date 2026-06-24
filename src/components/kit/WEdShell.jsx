import React from "react";
import { WMainTabs } from "./WMainTabs.jsx";
import { WPage } from "./WPage.jsx";
import { WTopBar } from "./WTopBar.jsx";
import { useNav } from "../../nav.jsx";

function WEdShell({ active = "general", children, showAdvanced = true, cta = "Create Component" }) {
  const nav = useNav();
  // Active section + click handling come from nav when inside the app; the
  // `active` prop is the fallback for standalone/gallery rendering.
  const current = nav ? nav.subTab : active;

  const items = [
  { id: "general", label: "General" },
  { id: "content", label: "Content" },
  { id: "layout", label: "Layout" },
  { id: "colors", label: "Colors" },
  { id: "type", label: "Type" }];

  return (
    <WPage scroll={false} className="cb-scroll-page" style={{ display: "flex", flexDirection: "column" }}>
      <WTopBar />
      <WMainTabs active="cookie" right={
      <>
          <button className="btn btn-primary btn-sm" style={{ height: "38px", width: "122px" }}>{cta}</button>
        </>
      } />
      <div className="cb-section-tabs" style={{ padding: "0 16px", margin: "14px 0 14px" }}>
        {items.map((it) => {
          // The Content tab is disabled while IAB TCF is enabled.
          const disabled = it.id === "content" && nav && nav.iab;
          return (
          <button
            key={it.id}
            disabled={disabled}
            title={disabled ? "Disabled while IAB TCF is enabled" : undefined}
            onClick={disabled || !nav ? undefined : () => nav.setSubTab(it.id)}
            className={"cb-section-tab " + (current === it.id ? "active" : "")}
            style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}>{it.label}</button>
          );
        })}
      </div>
      {/* Scrolls independently of the fixed header above. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 18px" }}>{children}</div>
    </WPage>);

}

export { WEdShell };
