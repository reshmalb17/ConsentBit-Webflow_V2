import React from "react";
import { WAuthShell } from "./WAuthShell.jsx";

function WAddDomain() {
  const scripts = [
  { name: "Google Analytics", src: "gtag/js?id=G-XXXX", cat: "Analytics", color: "blue" },
  { name: "Meta Pixel", src: "connect.facebook.net/…/fbevents.js", cat: "Marketing", color: "yellow" },
  { name: "Hotjar", src: "static.hotjar.com/c/hotjar-…", cat: "Analytics", color: "blue" },
  { name: "Intercom", src: "widget.intercom.io/widget/…", cat: "Functional", color: "purple" }];

  return (
    <WAuthShell step={1} title="Authorize your Webflow project">
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", marginBottom: 18, lineHeight: 1.5 }}>
          Connect ConsentBit to your Webflow project. We'll scan it to auto-detect the cookies and third-party scripts it loads, then categorize them for consent.
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Detected scripts</div>
              <span className="badge badge-green"><span className="badge-dot" />{scripts.length} found</span>
            </div>
            <button className="btn btn-secondary btn-sm">Re-scan</button>
          </div>
          {scripts.map((s, i) =>
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < scripts.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.src}</div>
              </div>
              <span className={"badge badge-" + s.color}>{s.cat}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Last scanned just now</span>
          <button className="btn btn-primary">Next<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></button>
        </div>
      </div>
    </WAuthShell>);

}

export { WAddDomain };
