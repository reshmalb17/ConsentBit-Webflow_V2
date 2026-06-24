import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";

function WPublish() {
  return (
    <WPage scroll={false}>
      <WTopBar />
      <WMainTabs active="cookie" left />
      <div style={{ position: "relative", padding: 16, minHeight: 460 }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 360, background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 24, textAlign: "center"
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--green-soft)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "#5AE497" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Changes Published</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
            Your cookie banner is now live on <b style={{ color: "var(--text)" }}>acne.com</b>.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
           
            <button className="btn btn-primary btn-sm">Customize banner</button>
             <button className="btn btn-secondary btn-sm">View on site<svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "0px", marginLeft: 1, flexShrink: 0 }}><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>
        </div>
      </div>
    </WPage>);

}

// External / hosted page — distinct light "browser" treatment so it reads as off-app

export { WPublish };
